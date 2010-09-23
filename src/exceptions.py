#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import json
from common import JSON_DUMPS_FORMAT

class JSONBasedException(Exception):
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
)

exception_generator = lambda message: \
'''
class {0}(JSONBasedException):
    status = "{1}"'''.format(message[0].upper() + message[1:], message)

for message in exceptions:
    exec(exception_generator(message))
