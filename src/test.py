#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sys
import os
import glob
import json
from main import parse_request
from db import db_instance as dbi

def load_json(filename):
    find_next = lambda s, pos: json.decoder.WHITESPACE.match(s, pos).end()
    text = open(filename).read()
    pos, end = 0, len(text)
    result = []
    pos = find_next(text, 0)
    try:
        while pos != end:
            request, pos = json._default_decoder.raw_decode(text, idx=pos)
            result.append(json.dumps(request))
            pos = find_next(text, pos)
    except ValueError:
        return result + [text[pos:]]
    return result

def error(message):
    print(message)
    return 1

def compare(testname):
    if os.path.exists(testname + '.ans'):
        answer = load_json(testname + '.ans')
        output = load_json(testname + '.out')
        return 'OK' if answer == output else 'FAIL'
    else:
        return 'NO ANSWER'

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
            try:
                oldout = sys.stdout
                with open(testname + '.out', 'w') as sys.stdout:
                    for request in requests:
                        print(parse_request(request))
            finally:
                sys.stdout = oldout
                print('Test {0} {1}'.format(test.replace(testdir, ''), compare(testname)))
                dbi().clear()
    return 0

if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
