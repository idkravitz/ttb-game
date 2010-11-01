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

@route('/js/:filename#.*\.js#')
def serve_javascript(filename):
    return static_file(filename, join(STATIC_FILES_ROOT, './js/'))

@route('/images/:filename')
def serve_images(filename):
    return static_file(filename, join(STATIC_FILES_ROOT, './images/'))

@route('/:filename#.*\.css#')
@route('/:filename#.*\.ico#')
def serve_root_statics(filename):
    return static_file(filename, STATIC_FILES_ROOT)

@route('/ajax')
def serve_ajax():
    return main.parse_request(request.GET['data'])

run(host='localhost', port=PORT)
