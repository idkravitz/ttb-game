#!/usr/bin/python3
# -*- coding: utf-8 -*-

import sys
import json
import commands

def parse_request(request):
    result = lambda status: json.dumps({'result': status})
    try:
        request = json.loads(request)
        if not isinstance(request, dict) or not len(request):
            return result('badRequest')
        return commands.process_request(request)
    except ValueError:
        return result('badRequest')

def main(argv):
    char = sys.stdin.readline()
    request = []
    while char:
        request.append(char)
        char = sys.stdin.readline()
    print(parse_request(''.join(request)))
    return 0

if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
