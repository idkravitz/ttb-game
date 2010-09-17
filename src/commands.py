#!/usr/bin/python3
# -*- coding: utf-8 -*-

import json

def command(f):
    f.command = True
    return f

def response_ok(fields):
    fields.update({'status': 'ok'})
    return json.dump(fields)

@command
def register(name, password):
    answer = { 'sid': name + password }
    return response_ok(answer)

def process_request(request):
    if 'cmd' not in request.keys():
        raise Exception
    cmd = request.pop('cmd')
    if not hasattr(globals()[cmd], 'command'):
        raise Exception
    return globals()[cmd](**request)
