#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import json
from common import JSON_DUMPS_FORMAT
from exceptions import BadCommand, BadRequest

def command(function):
    function.iscommand = True
    return function

def response_ok(fields):
    fields.update({'status': 'ok'})
    return json.dumps(fields, **JSON_DUMPS_FORMAT)

@command
def register(username, password):
    answer = { 'sid': username + password }
    return response_ok(answer)

def process_request(request):
    if 'cmd' not in request:
        raise BadRequest('Field cmd required')
    command = globals().get(request.pop('cmd'))
    if not hasattr(command, 'iscommand'):
        raise BadCommand('Unknown command')
    try:
        return command(**request)
    except TypeError:
        raise BadCommand('Command expects different fields')
