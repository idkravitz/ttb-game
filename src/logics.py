import random
import heapq
import itertools
from common import *
from exceptions import *
from collections import namedtuple

from db import db_instance as dbi, User, Player, Game

__all__ = ["gen3d6", "find_shortest_path", "attack_phase", "movement_phase", "Placement", "Action", "GameProcess"]

def gen3d6():
    return sum([random.randint(1,6) for i in range(3)])

def manhattan(pos1, pos2):
    return sum(abs(a-b) for a, b in zip(pos1, pos2))

class RectNode(object):
    __slots__ = ('walkable', 'neighbor_gen', '_move_cost', 'pos',
        'default_walkable', '_heuristic',
        '_came_from', '_h', '_g', 'mapsize')
    move_cost=1 # Cost to move from one node to another

    def __init__(self, pos, walkable=None, mapsize=None, default_walkable=True, neighbor_gen=None, heuristic=manhattan):
        if walkable is None:
            walkable = {}
        self.walkable = walkable
        if neighbor_gen is None:
            neighbor_gen = type(self)
        self.mapsize = mapsize
        self.neighbor_gen = neighbor_gen
        self.pos = pos
        self.default_walkable = default_walkable
        self._heuristic = heuristic

    def __hash__(self):
        return hash(self.pos)

    def __eq__(self, o):
        return self.pos == o.pos

    def __lt__(self, o):
        return self.pos < o.pos

    def _get_x(self):
        return self.pos[0]

    def _get_y(self):
        return self.pos[1]

    def __iter__(self):
        yield self.x
        yield self.y

    x = property(fget=_get_x)
    y = property(fget=_get_y)

    def get_neighbors(self):
        for i in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            pos = self.x - i[0], self.y - i[1]
            if self.walkable.get(pos, self.default_walkable)\
                and 0 <= pos[0] < self.mapsize[0] and 0 <= pos[1] < self.mapsize[1]:
                yield self.neighbor_gen(pos, walkable=self.walkable,
                    default_walkable=self.default_walkable,
                    neighbor_gen=self.neighbor_gen,
                    heuristic=self._heuristic, mapsize=self.mapsize)

    def heuristic(self, node):
        return self._heuristic(self.pos, node.pos)

    def __repr__(self):
        return "<RectNode:str(self.pos)>"

def gen_graph(land, start_pos, target_pos):
    walkable = {}
    for y, line in enumerate(land):
        for x, char in enumerate(line):
            pos = x, y
            if char == "x":
                walkable[pos] = False
    mapsize = len(land[0]), len(land)
    start_node = RectNode(start_pos, walkable=walkable, mapsize=mapsize)
    if target_pos in walkable:
        target_node = None
    else:
        target_node = RectNode(target_pos, walkable=walkable, mapsize=mapsize)
    return start_node, target_node

def find_shortest_path(land, start_pos, target_pos):
    """ A* algorithm """
    start_node, target_node = gen_graph(land, start_pos, target_pos)
    if target_node is None:
        return None
    closed = set()
    open_set = set()
    open = []
    mapsize = len(land[0]), len(land)
    h = start_node._h = start_node.heuristic(target_node)
    g = start_node._g = 0
    f = start_node._h # + start_node._g

    start_triplet = [f, h, start_node]
    heapq.heappush(open, start_triplet)
    open_d = {start_node: start_triplet}
    while open:
        f, h, node = heapq.heappop(open)
        del open_d[node]
        if node == target_node:
            return reconstruct_path(node)
        closed.add(node)
        for neighbor in node.get_neighbors():
            if neighbor in closed:
                continue

            tentative_g = node._g + node.move_cost
            if neighbor not in open_d:
                neighbor._came_from = node
                neighbor._g = tentative_g
                h = neighbor._h = neighbor.heuristic(target_node)
                d = open_d[neighbor] = [tentative_g + h, h, neighbor]
                heapq.heappush(open, d)
            else:
                neighbor = open_d[neighbor][2]
                if tentative_g < neighbor._g:
                    neighbor._came_from = node
                    neighbor._g = tentative_g
                    open_d[neighbor][0] = tentative_g + neighbor._h
                    heapq.heapify(open)
    return None # No path

def reconstruct_path(target_node):
    path = []
    node = target_node
    while hasattr(node, '_came_from'):
        path.append(node)
        node = node._came_from
    return path

Movement = namedtuple('Movement', 'action, path')
Placement = namedtuple('Placement', 'player, unit, HP')
Action = namedtuple('Action', 'pos, dest, attack')

class Action(Action):
    @classmethod
    def set_process(cls, process):
        cls.process = process

    def __lt__(self, a):
        return self.process.get_unit(self.pos).initiative < self.process.get_unit(a.pos).initiative

class GameProcess(object):
    games = {}
    factions = {}

    def __init__(self, game):
        self.game = game
        self.map = game.map.to_list()
        self.games[game.name] = self
        self.faction = game.faction.name
        self.current_placements = {}
        self.player_current_placements = {}
        self.turn = 0
        self.ready_players = 0
        self.factions[self.faction] = {unit.name: unit for unit in game.faction.units}
        self.usernames = [rec[0] for rec in dbi().query(User.username).join(Player)
            .filter(Player.game_id==game.id).order_by(Player.player_number).all()]

    def get_map_dimensions(self):
        return len(self.map), len(self.map[0])

    def get_username(self, i):
        return self.usernames[i-1]

    def get_unit(self, unit):
        if type(unit) == str:
            name = unit
        else:
            name = self.previous_placements[unit].unit
        return self.factions[self.faction][name]

    def place_unit(self, unit, x, y, player):
        if self.map[y][x] != str(player) or (x, y) in self.current_placements:
            raise BreakRules("Wrong cell")
        self.current_placements[(x, y)] = Placement(player, unit, self.get_unit(unit).HP)
        if player in self.player_current_placements:
            self.player_current_placements[player].append((x, y))
        else:
            self.player_current_placements[player] = [(x, y)]

    def turn_finished(self):
        self.ready_players += 1
        if(self.turn and self.ready_players == self.game.players_count):
            attack_phase(movement_phase(self), self)
            self._next_turn()

    def _next_turn(self):
        self.turn += 1
        self.previous_placements = self.current_placements
        self.current_placements = {}
        self.player_previous_placements = self.player_current_placements
        self.player_current_placements = {}
        self.current_actions = []
        self.ready_players -= len(self.player_previous_placements) # defeated players are always ready

    @classmethod
    def game_finished(cls, name):
        if name in cls.games:
            del cls.games[name]

    def placement_finished(self):
        self.ready_players += 1
        if(not self.turn and self.ready_players == self.game.players_count):
            self._next_turn()

    @classmethod
    def get(cls, game):
        name = game.name if type(game) == Game else game
        if name not in cls.games:
            raise BadGame("No started game with that name")
        return cls.games[name]

def movement_phase(process):
    repeat = process.current_actions
    Action.set_process(process)
    rand_state = random.getstate()
    random.shuffle(repeat)
    random.setstate(rand_state)
    repeat.sort()
    sorted_moves = []
    repeat = [Movement(a, find_shortest_path(process.map, a.pos, a.dest)) for a in repeat]
    occupied, que = set(), []
    while len(repeat) != len(que):
        que, repeat = repeat, []
        for turn in que:
            if turn.path and turn.path[0] not in occupied:
                occupied.add(turn.path[0])
                sorted_moves.append(turn.action)
            else:
                repeat.append(turn)
    for turn in repeat:
        for node in turn.path:
            if node not in occupied:
                occupied.add(node)
                sorted_moves.append(Action(turn.action.pos, node.pos, turn.action.attack))
                break
        else:
            sorted_moves.append(Action(turn.action.pos, turn.action.pos, turn.action.attack))
    return sorted_moves

def attack(our_unit, their_unit, their_trgt):
    attack_chance = our_unit.attack + gen3d6()
    defence_chance = their_unit.defence + gen3d6()
    HP = their_trgt.HP
    if attack_chance > defence_chance:
        strike = our_unit.damage - their_unit.protection + gen3d6()
        if strike > 0:
            HP -= strike
        HP = 0 if HP < 0 else HP
    return Placement(their_trgt.player, their_trgt.unit, HP)

def attack_phase(sorted_moves, process):
    attackable = { m.pos: m for m in sorted_moves }
    for action in sorted_moves:
        if action.dest not in process.current_placements:
            p = process.previous_placements[action.pos]
            process.current_placements[action.dest] = p
            if p.player in process.player_current_placements:
                process.player_current_placements[p.player] += [action.dest]
            else:
                process.player_current_placements[p.player] = [action.dest]
        if action.attack == NO_TARGET:
            continue
        target = attackable[action.attack]
        unit = process.get_unit(action.pos)
        target_unit = process.get_unit(target.pos)
        if in_range(action.dest, target.dest, unit.range):
            if target.dest not in process.current_placements:
                p = process.previous_placements[target.pos]
                process.current_placements[target.dest] = p
                if p.player in process.player_current_placements:
                    process.player_current_placements[p.player] += [target.dest]
                else:
                    process.player_current_placements[p.player] = [target.dest]
            p = process.current_placements[target.dest]
            p = attack(unit, target_unit, p)
            if p.HP:
                process.current_placements[target.dest] = p
            else:
                del process.current_placements[target.dest]
                t = process.previous_placements[target.pos]
                if t.player in process.player_current_placements:
                    if target.dest in process.player_current_placements[t.player]:
                        process.player_current_placements[t.player].remove(target.dest)
                    if not len(process.player_current_placements[t.player]):
                        del process.player_current_placements[t.player]

def in_range(pos1, pos2, range):
    return sum(abs(x1 - x2) ** 2 for x1, x2 in zip(pos1, pos2)) <= range ** 2
