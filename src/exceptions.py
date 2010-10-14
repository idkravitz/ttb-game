#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import json

from common import copy_args, JSON_DUMPS_FORMAT
__all__ = ['RequestError']

class RequestError(Exception):
    status = None

    @copy_args
    def __init__(self, message): pass

    def struct(self):
        return { 'status': self.status, 'message': self.message }

    def __str__(self):
        return json.dumps(self.struct(), **JSON_DUMPS_FORMAT)

exceptions = (
    'badCommand',
    'badRequest',
    'internalError',
    'badPassword',
    'badUsername',
    'badPlayerStatus',
    'badUser',
    'badSid',
    'badGame',
    'badMap',
    'badFaction',
    'badArmy',
    'badUnit',
    'badMessage',
    'notInGame',
    'alreadyInGame',
    'alreadyExists',
    'playersNotReady',
    'badTurn',
    'badAbility',
    'breakRules',
)

def generate_exception(name, status):
    return type(name, (RequestError,), { 'status': status })

for status in exceptions:
    name = status[0].upper() + status[1:]
    __all__.append(name)
    globals()[name] = generate_exception(name, status)
