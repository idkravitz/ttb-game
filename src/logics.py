import random
from common import *

if DEBUG:
    random.seed(SEED)

def gen3d6():
    return sum([random.randint(1,6) for i in range(3)])

