#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from exceptions import BadSid
from sqlalchemy import create_engine, Column, Integer, String, MetaData
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm.exc import NoResultFound

DEBUG = True # should be moved out

Base = declarative_base()

class User(Base):
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True)
    username = Column(String, unique=True)
    password = Column(String)
    sid = Column(String, unique=True)

    def __init__(self, username, password):
        self.username = username
        self.password = password
        self.sid = db_instance().generate_sid(username, password)

    def __repr__(self):
        return "<User({0}, {1}, {2})>".format(self.username, self.password, self.sid)

class Database:
    instance = None

    def __init__(self):
        engine = create_engine('sqlite:///:memory:', echo=False)
        Session = sessionmaker(bind=engine)
        self.session = Session()
        Base.metadata.create_all(engine)

    def add(self, *args, **kwargs):
        self.session.add(*args, **kwargs)
        self.session.commit()

    def delete(self, *args, **kwargs):
        self.session.delete(*args, **kwargs)
        self.session.commit()

    def query(self, *args, **kwargs):
        return self.session.query(*args, **kwargs)

    def clear(self):
        self.instance = None
        db_instance()

    def generate_sid(self, username, password):
        if DEBUG:
            sid = username + password
        else:
            sid = 0 # change it to a SHA-1 applied to a shuffled date+username+password-hash
        return sid

    def get_user(self, sid):
        try:
            return self.session.query(User).filter_by(sid=sid).one()
        except NoResultFound:
            raise BadSid('Unknown sid')

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
