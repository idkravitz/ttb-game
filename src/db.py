#!/usr/bin/env python3
# -*- coding: utf-8 -*-

DEBUG = True

class Database:
    instance = None

    def __init__(self):
        self.users = {}
        self.sids = {}

    def register_user(self, username, password):
        if username in self.users:
            if self.users[username] == password:
                return self.sids[username]
            raise BadPassword('User already exists, but passwords doesn\'t match')
        self.users[username] = password
        return self.generate_sid(username, password)

    def generate_sid(self, username, password):
        if DEBUG:
            sid = username + password 
        else:
            sid = 0
        self.sids[sid] = username
        return sid
        
    def unregister_user(self, sid):
        if not sid in self.sids:
            raise BadSid('Incorrect Sid')
        self.users.pop(self.sids[sid]) 
        self.sids.pop(self.sids[sid])
        return 1           

def DatabaseInstance():
    if Database.instance is None:
        Database.instance = Database()
    return Database.instance
