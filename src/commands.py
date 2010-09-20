#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import re
import json
from common import JSON_DUMPS_FORMAT
from exceptions import BadCommand, BadRequest
from db import DatabaseInstance

def command(function):
    function.iscommand = True
    return function

def response_ok(fields):
    fields.update({'status': 'ok'})
    return json.dumps(fields, **JSON_DUMPS_FORMAT)

@command
def register(username, password):
    if not username.replace('_', '').isalnum():
        raise BadCommand('Incorrect username')
    if not len(password):
        raise BadCommand('Empty password')
    sid = DatabaseInstance().register_user(username, password)    
    answer = { 'sid': sid }
    return response_ok(answer)
    
@command
def changePassword(sid, newPassword):
    if not len(newPassword):
        raise BadCommand('Empty password') 
    DatabaseInstance().change_password(sid, newPassword)  
    return response_ok(answer)              
    
@command
def unregister(sid):
    DatabaseInstance().unregister_user(sid)  
    return response_ok(answer)   

@command
def clear():
    DatabaseInstance().clear_database()   
    return response_ok(answer)  

def process_request(request):
    if 'cmd' not in request:
        raise BadRequest("Field 'cmd' required")
    command = globals().get(request.pop('cmd'))
    if not hasattr(command, 'iscommand'):
        raise BadCommand('Unknown command')
    try:
        return command(**request)
    except TypeError as ex:
        message = ex.args[0]
        pattern = '''
            \w+\(\)\stakes\sexactly\s(\d+)\s
            non-keyword\spositional\sarguments\s
            \((\d+)\sgiven\)
        '''
        match = re.match(pattern, message, re.VERBOSE)
        if match:
            expected, given = map(int, match.groups())
            if expected > given:
                raise BadCommand('Not enough fields')
            else:
                raise BadCommand('Too many fields')
        field = message.split()[-1]
        raise BadCommand('Unknown field {0}'.format(field))
