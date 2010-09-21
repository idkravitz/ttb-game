#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from exceptions import *
from sqlalchemy import create_engine, Column, Integer, String, MetaData
from sqlalchemy.arm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

DEBUG = True # should be moved out

engine = create_engine('sqlite:///:memory:', echo=True)
Session = sessionmaker(bind=engine)
Base = declarative_base()

class User(Base):
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True)
    username = Column(String)
    password = Column(String)
    sid = Column(String)

    def __init__(self, username, password):
        self.username = username
        self.password = password
        self.sid = db_instance().generate_sid(username, password)

    def __repr__(self):
        return "<User({0}, {1}, {2})>".format(self.username, self.password, self.sid)


class Database:
    instance = None

    def __init__(self):
        self.session = Session()

    def clear(self):
        self.instance = None
        db_instance()

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
        
    def create_game(self, sid, gameName):
        self.join_game(sid, gameName)
        self.games[gameName] = sid  
        
    def join_game(self, sid, gameName):
        self.get_username(sid)
        if sid in self.players:
            raise AlreadyInGame('User is already playing the game')    
        self.players[sid] = gameName 
        
    def leave_game(self, sid, gameName):
        self.get_username(sid)
        if sid not in self.players:
            raise NotInGame('User is not playing the game')    
        self.players.pop(sid)                  

def db_instance():
    if Database.instance is None:
        Database.instance = Database()
    return Database.instance
