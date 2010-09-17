#!/usr/bin/python3
# -*- coding: utf-8 -*-

import sys
import json
import commands

def parse_request(request):
    result = lambda status: json.dumps({'result': status})
    try:
        print(request)
        request = json.loads(request)
        if not isinstance(request, dict) or not len(request):
            return result('badRequest')
        return process_request(request)
    except ValueError:
        return result('badRequest')

def main(argv):
    print(parse_request(input()))
    return 0

if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
