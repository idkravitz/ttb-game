#!/usr/bin/env python3
from utils.path import join
from bottle import route, run, static_file, request
import main
import json

STATIC_FILES_ROOT = join("./client/")
PORT = 80

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
    return main.parse_request(request.GET['data'])

run(reloader=True, host='127.0.0.1', port=PORT)
