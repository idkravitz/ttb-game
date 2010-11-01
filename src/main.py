#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sys
import json

import commands
from common import JSON_DUMPS_FORMAT
from exceptions import RequestError, BadRequest

def parse_request(request):
    try:
        try:
            request = json.loads(request)
        except ValueError:
            raise BadRequest('Error in JSON syntax')
        if not isinstance(request, dict) or not request:
            raise BadRequest('The request must be an object')
        return json.dumps(commands.process_request(request), **JSON_DUMPS_FORMAT)
    except RequestError as e:
        return str(e)

def main(argv):
    print(parse_request(''.join(sys.stdin.readlines())))
    return 0

if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
