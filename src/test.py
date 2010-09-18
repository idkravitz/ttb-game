#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sys
import os
import glob
import json
from main import parse_request

def load_json(filename):
    find_next = lambda s, pos: json.decoder.WHITESPACE.match(s, pos).end()
    text = open(filename).read()
    pos, end = 0, len(text)
    result = []
    pos = find_next(text, 0)
    while pos != end:
        request, pos = json._default_decoder.raw_decode(text, idx=pos)
        result.append(request)
        pos = find_next(text, pos)
    return result

def error(message):
    print(message)
    return 1

def compare(testname):
    answer = load_json(testname + '.ans')
    output = load_json(testname + '.out')
    return answer == output

def main(argv):
    if len(argv) != 1:
        return error('Usage: test.py <testdir>')
    testdir = argv[0]
    if not os.path.exists(testdir) or not os.path.isdir(testdir):
        return error('Directory not found')

    for dirpath, dirnames, filenames in os.walk(testdir):
        for test in glob.iglob(os.path.join(dirpath, '*.tst')):
            testname = os.path.splitext(os.path.normpath(test))[0]
            requests = load_json(test)
            for request in requests:
                oldout = sys.stdout
                with open(testname + '.out', 'w') as sys.stdout:
                    print(parse_request(json.dumps(request)))
                sys.stdout = oldout
                if compare(testname):
                    template = 'Test {0} OK'
                else:
                    template = 'Test {0} FAIL'
                print(template.format(test.replace(testdir, '')))
    return 0

if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
