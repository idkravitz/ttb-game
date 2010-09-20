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

class BadRequest(JSONBasedException):
    status = 'badRequest'

class BadCommand(JSONBasedException):
    status = 'badCommand'

class InternalError(JSONBasedException):
    status = 'internalError'

class BadPassword(JSONBasedException):
    status = 'badPassword'

class BadSid(JSONBasedException):
    status = 'badSid'

class AlreadyInGame(JSONBasedException):
    status = 'alreadyInGame'