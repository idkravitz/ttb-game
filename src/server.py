#!/bin/env python3
import re
import mimetypes
import json
from wsgiref.util import setup_testing_defaults
from wsgiref.simple_server import make_server
from urllib.parse import parse_qs
import common

common.DEBUG = True

import main

port = 80

[('/', './index.html'),
 ('/main/', './main.html')]

def is_ajax(environ):
    key, val = 'HTTP_X_REQUESTED_WITH', 'XMLHttpRequest'
    return key in environ and environ[key] == val

def simple_app(environ, start_response):
    setup_testing_defaults(environ)
    status = b'200 OK'
    if is_ajax(environ):
        headers = [(b'Content-type', b'text/html; charset=utf-8')]
        raw = environ['wsgi.input'].read(int(environ['CONTENT_LENGTH']))
        body = raw.decode("utf-8")
        args = { name: value[0] if len(value) == 1 else value
            for name, value in parse_qs(body, keep_blank_values=True).items() }
        body = json.dumps(args)
        ret = [ main.parse_request(body) ]
        start_response(status, headers)
        return ret
    else:
        path = environ['PATH_INFO']
        mtype = mimetypes.guess_type(path)[0]
        if mtype == 'text/html':
            mtype += '; charset=utf-8'
        headers = [(b'Content-type', mtype)]
        ret = open('../client' + path, 'rb')
        start_response(status, headers)(ret.read())
        return []

httpd = make_server('', port, simple_app)
print("Serving on port {0}...".format(port))
httpd.serve_forever()
