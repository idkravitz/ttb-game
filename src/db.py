#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from exceptions import *

DEBUG = True # should be moved out

class Database:
    instance = None

    def __init__(self):
        self.users = {}
        self.sids = {}
        self.games = {} # nameGame: sid
        self.players = {} # sid: nameGame        

    def clear(self):
        self.instance = None
        DatabaseInstance()

    def generate_sid(self, username, password):
        if DEBUG:
            sid = username + password
        else:
            sid = 0 # change it to a SHA-1 applied to a shuffled date+username+password-hash
        self.sids[sid] = username
        return sid

    def get_username(self, sid):
        if sid not in self.sids:
            raise BadSid('Unknown sid')
        return self.sids[sid]

    def register_user(self, username, password):
        if username in self.users:
            if self.users[username][0] == password:
                return self.users[username][1]
            raise BadPassword('User already exists, but passwords don\'t match')
        sid = self.generate_sid(username, password)
        self.users[username] = (password, sid)
        return sid

    def unregister_user(self, sid):
        username = self.get_username(sid)
        self.users.pop(username)
        self.sids.pop(sid)

    def change_password(self, sid, password):
        username = self.get_username(sid)
        self.users[username][0] = password
        
    def create_game(self, sid, gameName):
        self.get_username(sid)
        if sid in self.players:
            raise alreadyInGame('User is already playing the game')   
        self.games[gameName] = sid 
        self.players[sid] = gameName 
        
    def join_game(self, sid, gameName):
        self.get_username(sid)
        if sid in self.players:
            raise alreadyInGame('User is already playing the game')    
        self.players[sid] = gameName 
        
    def leave_game(self, sid, gameName):
        self.get_username(sid)
        if sid not in self.players:
            raise notInGame('User is not playing the game')    
        self.players.pop(sid)                  

def DatabaseInstance():
    if Database.instance is None:
        Database.instance = Database()
    return Database.instance
