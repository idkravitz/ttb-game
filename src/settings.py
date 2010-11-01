# Set it to True, if you want to do some debug actions.
DEBUG = False

# The path to database (ignored if DEBUG = True)
# must be an absolute path. For instance you can use
# join function to attach relative path to a project
# root.
from utils.path import join
DB_PATH = join('game.db')
