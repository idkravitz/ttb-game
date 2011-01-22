#!/usr/bin/env python3
from utils.path import join
from bottle import route, run, static_file, request
from main import parse_request
import sys
import json
import traceback
import optparse
import common

STATIC_FILES_ROOT = join("./client/")
PORT = 80
DEBUG = False
SESSION_FILE = None

@route('/')
def serve_main():
    return static_file('main.html', STATIC_FILES_ROOT)

@route('/:root#css.*|images.*|js.*#/:filename')
def serve_dirs(root,filename):
    return static_file(filename, join(STATIC_FILES_ROOT, root))

@route('/:filename#.*\.css#')
@route('/:filename#.*\.ico#')
def serve_root_statics(filename):
    return static_file(filename, STATIC_FILES_ROOT)

@route('/ajax')
def serve_ajax():
    try:
        if DEBUG:
            req = json.loads(request.GET['data'])
            res = json.dumps(req, **common.JSON_DUMPS_FORMAT)
            SESSION_FILE.write(res)
            SESSION_FILE.write("\n")
        response = parse_request(request.GET['data'])
    except Exception as e:
        traceback.print_exc()
        raise
    return response

def main():
    parser = optparse.OptionParser(usage='server.py [options]')
    parser.disable_interspersed_args()
    parser.add_option('-d', '--debug', action='store_true', dest='debug',
        default=False, help='store all requests as ajax in session.tst')
    try:
        (options, args) = parser.parse_args()
    except optparse.OptionError as e:
        print(e.msg)
        return 1
    global DEBUG, SESSION_FILE
    DEBUG = options.debug
    if DEBUG:
        SESSION_FILE = open('session.tst', 'w')
    run(reloader=True, host='127.0.0.1', port=PORT)
    if SESSION_FILE is not None:
        SESSION_FILE.close()
    return 0

if __name__ == '__main__':
    sys.exit(main())
