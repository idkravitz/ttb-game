#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sys
import os
import glob
import json
import optparse
import random

import common

common.DEBUG = True

from main import parse_request
from db import db_instance as dbi

no_answer_count = failed_count = passed_count = 0

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

def passed():
    global passed_count
    passed_count += 1
    return 'OK'

def failed():
    global failed_count
    failed_count += 1
    return 'FAIL'

def no_answer():
    global no_answer_count
    no_answer_count += 1
    return 'NO ANSWER'

def compare(testname):
    if os.path.exists(testname + '.ans'):
        answer = load_json(testname + '.ans')
        output = load_json(testname + '.out')
        return passed() if answer == output else failed()
    else:
        return no_answer()

def launch(test, debug=False, verbose=False):
    random.seed(common.SEED)
    testname = os.path.splitext(os.path.normpath(test))[0]
    requests = load_json(test)
    try:
        oldout = sys.stdout
        with open(testname + '.out', 'w') as sys.stdout:
            for request in requests:
                print(parse_request(request))
    finally:
        sys.stdout = oldout
        dbi().clear()

    result = compare(testname)
    if result != 'OK' or verbose or debug:
        print('Test {0} {1}'.format(os.path.normpath(test), result))
    if debug:
        print(open(testname + '.out').read())

def main():
    parser = optparse.OptionParser(usage='test.py [options] <test(s)>')
    parser.disable_interspersed_args()
    parser.add_option('-v', '--verbose', action='store_true', dest='verbose',
        default=False, help='show successful tests')
    parser.add_option('-d', '--debug', action='store_true', dest='debug',
        default=False, help='show tests output (includes --verbose)')
    try:
        (options, args) = parser.parse_args()
    except optparse.OptionError as e:
        return error(e.msg)

    if not len(args):
        return error(parser.format_help())
    for arg in args:
        if not os.path.exists(arg):
            return error('Path not found: {0}'.format(arg))
        if os.path.isdir(arg):
            for dirpath, dirnames, filenames in os.walk(arg):
                for test in glob.iglob(os.path.join(dirpath, '*.tst')):
                    launch(test, debug=options.debug, verbose=options.verbose)
        else:
            launch(arg, debug=options.debug, verbose=options.verbose)
    print('Summary: {0} passed, {1} failed, {2} no answer'.format(passed_count, failed_count, no_answer_count))
    return 0

if __name__ == '__main__':
    sys.exit(main())
