#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sys
import json
import commands
from exceptions import BadRequest

def parse_request(request):
    try:
        try:
            request = json.loads(request)
        except ValueError:
            raise BadRequest('Error in JSON syntax')
        if not isinstance(request, dict) or not len(request):
            raise BadRequest('The request must be an object')
        return commands.process_request(request)
    except BadRequest as ex:
        return str(ex)

def main(argv):
    print(parse_request(''.join(sys.stdin.readlines())))
    return 0

if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
