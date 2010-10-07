import random
import heapq
import itertools
from common import *

if DEBUG:
    random.seed(SEED)

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
