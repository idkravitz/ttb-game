# -*- coding: utf-8 -*-

import sys

def main(argv):
    if len(argv) != 1:
        print('Usage: main.py <testdir>')
        return 1
    return 0

if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
