#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import json

class JSONBasedException(Exception):
    status=None
    def __init__(self, message):
        self.message = message
    def struct(self):
        return { 'status': self.status, 'message': self.message }
    def __str__(self):
        return json.dumps(self.struct())

class BadRequest(JSONBasedException):
    status='badRequest'

class BadCommand(JSONBasedException):
    status='badCommand'

class InternalError(JSONBasedException):
    status='internalError'
