import random
import heapq
import itertools
from common import *

from db import db_instance as dbi, Turn

__all__ = ["gen3d6", "find_shortest_path", "attack_phase", "movement_phase"]

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
        return str(self.pos)

def gen_graph(land, start_pos, target_pos):
    walkable = {}
    for y, line in enumerate(land):
        for x, char in enumerate(line):
            pos = x, y
            if char == "x":
                walkable[pos] = False
    mapsize = len(land), len(land[0])
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
    mapsize = len(land), len(land[0])
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
    return reversed(path)


def movement_phase(latest_process, land):
    repeat = dbi().query(Turn).filter_by(gameProcess_id=latest_process.id).all()
    rand_state = random.getstate()
    random.shuffle(repeat)
    random.setstate(rand_state)
    repeat.sort()
    sorted_moves = repeat
    for turn in repeat:
        turn.path = list(find_shortest_path(land, turn.pos, turn.dest))
    occupied, que = set(), []
    while len(repeat) != len(que):
        que, repeat = repeat, []
        for turn in que:
            if turn.path and turn.path[-1] not in occupied:
                occupied.add(turn.path[-1])
            else:
                repeat.append(turn)
    for turn in repeat:
        for node in reversed(turn.path):
            if node not in occupied:
                occupied.add(node)
                turn.dest = node
                break
        else:
            turn.dest = turn.pos
    return sorted_moves

def attack(our_unit, their_unit, their_trgt):
    attack_chance = our_unit.attack + gen3d6()
    defence_chance = their_unit.defence + gen3d6()
    if attack_chance > defence_chance:
        their_trgt.HP -= our_unit.damage - their_unit.protection + gen3d6()
        their_trgt.HP = 0 if their_trgt.HP < 0 else their_trgt.HP

def attack_phase(sorted_moves):
    attackable = { turn.pos: turn for turn in sorted_moves }
    for turn in sorted_moves:
        attack_pos = turn.attackX, turn.attackY
        if attack_pos == NO_TARGET:
            continue
        their_trgt = attackable[attack_pos]
        new_trgt = their_trgt.dest
        our_unit = turn.unitArmy.unit
        their_unit = their_trgt.unitArmy.unit
        if in_range(turn.dest, new_trgt, our_unit.range):
            attack(our_unit, their_unit, their_trgt)

def in_range(pos1, pos2, range):
    return sum(abs(x1 - x2) ** 2 for x1, x2 in zip(pos1, pos2)) <= range ** 2
