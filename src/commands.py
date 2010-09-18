#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import json
from exceptions import BadCommand, BadRequest

def command(function):
    function.iscommand = True
    return function

def response_ok(fields):
    fields.update({'status': 'ok'})
    return json.dumps(fields)

@command
def register(username, password):
    answer = { 'sid': username + password }
    return response_ok(answer)

def process_request(request):
    if 'cmd' not in request:
        raise BadRequest('Field cmd required')
    cmd = request.pop('cmd')
    if not hasattr(globals()[cmd], 'iscommand'):
        raise BadCommand('Unknown command')
    try:
        return globals()[cmd](**request)
    except TypeError:
        raise BadCommand('Command expects different fields')
