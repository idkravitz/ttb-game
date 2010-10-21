#!/usr/bin/env python3
import re
import os
import mimetypes
import json
from wsgiref.util import setup_testing_defaults
from wsgiref.simple_server import make_server
from urllib.parse import parse_qs
import common

common.DEBUG = True

import main

port = 80
current_path = os.path.dirname(os.path.abspath(__file__))
STATIC_FILES_ROOT = os.path.normpath(os.path.join(current_path, "../client/"))

def get_static(url):
    index = r'^/$'
    htmls = r'^/(\w*)(|\.html)[/]?$'
    statics = [r'^/(js/[\w\d\.\-_]*\.js)$',
               r'^/([\w\d\.\-_]*\.css)$',
               r'^/(images/[\w\d\.\-_]*\.jpg)$',
               r'^/(favicon.ico)']
    if re.match(index, url):
        return os.path.join(STATIC_FILES_ROOT, 'index.html')
    m = re.match(htmls, url)
    if m:
        return os.path.join(STATIC_FILES_ROOT, m.group(1) + '.html')
    for s in statics:
        m = re.match(s, url)
        if m:
            return os.path.join(STATIC_FILES_ROOT, m.group(1))

class Application(object):
    status = b'200 OK'
    html_headers = [(b'Content-type', b'text/html; charset=utf-8')]

    def __init__(self):
        pass

    def __call__(self, environ, start_response):
        setup_testing_defaults(environ)
        self.env = environ
        if self.is_ajax() or self.env["REQUEST_METHOD"] == "POST":
            self.raw = environ['wsgi.input'].read(int(environ['CONTENT_LENGTH']))
            self.body = self.raw.decode("utf-8")
            args = { name: value[0] if len(value) == 1 else value
                for name, value in parse_qs(body, keep_blank_values=True).items() }
            body = json.dumps(args)
            ret = [ main.parse_request(body) ]
            start_response(self.status, self.html_headers)
            return ret
        else: # static serve
            path = environ['PATH_INFO']
            path = get_static(path)
            if path is None:
                status = b'404 NOT FOUND'
                start_response(status, self.html_headers)
                return ["Page not found"]
            else:
                mtype = mimetypes.guess_type(path)[0]
                if mtype == 'text/html':
                    mtype += '; charset=utf-8'
                headers = [(b'Content-type', mtype)]
                ret = open(path, 'rb')
                start_response(self.status, headers)(ret.read())
            return []

    def is_ajax(self):
        key, val = 'HTTP_X_REQUESTED_WITH', 'XMLHttpRequest'
        return key in self.env and self.env[key] == val

httpd = make_server('', port, Application())
print("Serving on port {0}...".format(port))
httpd.serve_forever()
