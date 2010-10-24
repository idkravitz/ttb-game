#!/usr/bin/env python3
import re
import os
import mimetypes
import json
from wsgiref.util import setup_testing_defaults
from wsgiref.simple_server import make_server
from urllib.parse import parse_qs
import main

port = 80
current_path = os.path.dirname(os.path.abspath(__file__))
STATIC_FILES_ROOT = os.path.normpath(os.path.join(current_path, "../client/"))

def get_static(url):
    index = r'^/$'
    htmls = r'^/(\w*)(|\.html)[/]?$'
    statics = [r'^/(js/[\w\d\.\-_]*\.js)$',
               r'^/([\w\d\.\-_]*\.css)$',
               r'^/(images/[\w\d\.\-_]*\.(jpg|png|jpeg|svg))$',
               r'^/(favicon.ico)']
    if re.match(index, url):
        return os.path.join(STATIC_FILES_ROOT, 'main.html')
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
        self.callback = start_response
        self.path = environ['PATH_INFO']
        if self.env['REQUEST_METHOD'] == 'POST':
            return self.post()
        else: # static serve
            return self.get()

    def get(self):
        path = get_static(self.path)
        if path is None:
            return self.respond_404()
        else:
            mtype = mimetypes.guess_type(path)[0]
            if mtype == 'text/html':
                mtype += '; charset=utf-8'
            headers = [(b'Content-type', mtype)]
            ret = open(path, 'rb')
            self.callback(self.status, headers)(ret.read())
            ret.close()
        return []

    def post(self):
        if self.is_ajax():
            self.raw = self.env['wsgi.input'].read(int(self.env['CONTENT_LENGTH']))
            self.body = self.raw.decode("utf-8")
            args = { name: value[0] if len(value) == 1 else value
                for name, value in parse_qs(self.body, keep_blank_values=True).items() }
            self.body = json.dumps(args)
            ret = [ main.parse_request(self.body) ]
            self.callback(self.status, self.html_headers)
        else:
            ret = self.respond_404()
        return ret

    def is_ajax(self):
        return self.path == '/'

    def respond_404(self):
        status = b'404 NOT FOUND'
        print(self.path)
        self.callback(status, self.html_headers)
        return ["Page not found"]


httpd = make_server('', port, Application())
print("Serving on port {0}...".format(port))
try:
    httpd.serve_forever()
except KeyboardInterrupt:
    print("Stopping server ...")
