#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import re
import json
from common import JSON_DUMPS_FORMAT
from exceptions import BadCommand, BadRequest
from db import db_instance

MAX_USERNAME_LENGTH = 15

def command(function):
    function.iscommand = True
    return function

def response_ok(fields=None):
    if fields is None:
        fields = {}
    fields.update({'status': 'ok'})
    return json.dumps(fields, **JSON_DUMPS_FORMAT)

@command
def register(username, password):
    if not username.replace('_', '').isalnum():
        raise BadCommand('Incorrect username')
    if len(username) > MAX_USERNAME_LENGTH:
        raise BadCommand('Too long username')
    if not len(password):
        raise BadCommand('Empty password')
    sid = db_instance().register_user(username, password)
    answer = { 'sid': sid }
    return response_ok(answer)

@command
def unregister(sid):
    db_instance().unregister_user(sid)
    return response_ok()

@command
def clear():
    db_instance().clear()
    return response_ok()
    
@command
def createGame(sid, gameName): # check the validity of symbols
    if len(gameName) > MAX_GAMENAME_LENGTH:
        raise BadCommand('Too long game name')
    if not len(gameName):
        raise BadCommand('Empty game name')
    db_instance().create_game(sid, gameName)    
    return response_ok()  
    
@command
def joinGame(sid, gameName):
    db_instance().join_game(sid, gameName)    
    return response_ok()
    
@command
def leaveGame(sid, gameName):
    db_instance().leave_game(sid, gameName)    
    return response_ok()             

def process_request(request):
    if 'cmd' not in request:
        raise BadRequest('Field \'cmd\' required')
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
