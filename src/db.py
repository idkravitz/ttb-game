#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from exceptions import BadSid
from sqlalchemy import create_engine, Column, Integer, String, MetaData, ForeignKey
from sqlalchemy.orm import sessionmaker, relationship, backref
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

class Game(Base):
    __tablename__ = 'games'

    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True)
    max_players = Column(Integer)
    user_id = Column(Integer, ForeignKey('users.id'))
    author = relationship(User, backref=backref('created_game', uselist=False))

    def __init__(self, name, max_players, author):
        self.name = name
        self.max_players = max_players
        self.author = author

    def __repr__(self):
        return "<Game({0},{1})>".format(self.name, self.author.__repr__())

class Database:
    instance = None
    engine = create_engine('sqlite:///:memory:', echo=False)

    def __init__(self):
        Session = sessionmaker(bind=self.engine)
        self.session = Session()
        Base.metadata.create_all(bind=self.engine)

    def add(self, *args, **kwargs):
        self.session.add(*args, **kwargs)
        self.session.commit()

    def delete(self, *args, **kwargs):
        self.session.delete(*args, **kwargs)
        self.session.commit()

    def query(self, *args, **kwargs):
        return self.session.query(*args, **kwargs)

    def clear(self):
        for table in Base.metadata.sorted_tables:
            self.engine.execute(table.delete())

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

#    def create_game(self, sid, gameName):
#        self.join_game(sid, gameName)
#        self.games[gameName] = sid  
        
#    def join_game(self, sid, gameName):
#        self.get_username(sid)
#        if sid in self.players:
#            raise AlreadyInGame('User is already playing the game')    
#        self.players[sid] = gameName 
        
#    def leave_game(self, sid, gameName):
#        self.get_username(sid)
#        if sid not in self.players:
#            raise NotInGame('User is not playing the game')    
#        self.players.pop(sid)                  

def db_instance():
    if Database.instance is None:
        Database.instance = Database()
    return Database.instance
