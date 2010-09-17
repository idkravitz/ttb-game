#!/usr/bin/python3
# -*- coding: utf-8 -*-

import sys
import json

def parse_request(request):
    result = lambda status: json.dumps({'result': status})
    try:
        request = json.loads(request)
        if not isinstance(request, dict) or not len(request):
            return result('badRequest')
        # call process_request
    except ValueError:
        return result('badRequest')

def main(argv):
    print(parse_request(input()))
    return 0

if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
