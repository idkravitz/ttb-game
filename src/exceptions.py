#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import json
from common import JSON_DUMPS_FORMAT

class RequestError(Exception):
    status = None
    def __init__(self, message):
        self.message = message
    def struct(self):
        return { 'status': self.status, 'message': self.message }
    def __str__(self):
        return json.dumps(self.struct(), **JSON_DUMPS_FORMAT)

exceptions = (
    'badCommand',
    'badRequest',
    'internalError',
    'badPassword',
    'badSid',
    'badGame',
    'notInGame',
    'alreadyInGame',
    'alreadyExists',
    'playersNotReady',
)

def generate_exception(name, status):
    return type(name, (RequestError,), { 'status': status })

for status in exceptions:
    name = status[0].upper() + status[1:]
    globals()[name] = generate_exception(name, status)
