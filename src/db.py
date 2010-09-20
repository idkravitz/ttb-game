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
            sid = 0 # change it to a SHA-1 applied to a shuffled date+username+password-hash
        self.sids[sid] = username
        return sid
        
    def change_password(self, sid, newPassword):
        if sid not  in self.sids:
            raise BadSid('Incorrect Sid')
        username = self.sids[sid]    
        self.users[username] = newPassword             
        
    def unregister_user(self, sid):
        if sid not  in self.sids:
            raise BadSid('Incorrect Sid')
        username = self.sids.pop(sid)
        self.users.pop(username)
        
    def clear_database(self):
        self.users = {}           

def DatabaseInstance():
    if Database.instance is None:
        Database.instance = Database()
    return Database.instance
