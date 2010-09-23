#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from sqlalchemy import create_engine, Table, Boolean, Enum, Column, Integer, String, MetaData, Date, ForeignKey, DateTime
from sqlalchemy.orm import sessionmaker, relationship, backref
from sqlalchemy.orm.exc import NoResultFound
from sqlalchemy.ext.declarative import declarative_base
from common import copy_args, DEBUG, utcnow
from exceptions import BadSid, BadCommand

Base = declarative_base()

class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True)
    username = Column(String, unique=True)
    password = Column(String)
    sid = Column(String, unique=True)

    @copy_args
    def __init__(self, username, password):
        self.sid = db_instance().generate_sid(username, password)

    def __repr__(self):
        return '<User({0}, {1}, {2})>'.format(self.username, self.password, self.sid)

class Game(Base):
    __tablename__ = 'games'

    id = Column(Integer, primary_key=True)
    name = Column(String)
    max_players = Column(Integer)
    state = Column(Enum('not_started', 'started', 'finished'), default='not_started')
    start_time = Column(DateTime, default=utcnow)

    @copy_args
    def __init__(self, name, max_players): pass

    def __repr__(self):
        return '<Game({0},{1})>'.format(self.name, self.gameState)

class Player(Base):
    __tablename__ = 'players'

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id', onupdate='CASCADE', ondelete='CASCADE'))
    game_id = Column(Integer, ForeignKey('games.id', onupdate='CASCADE', ondelete='CASCADE'))
    is_creator = Column(Boolean, default=False)
    state = Column(Enum('in_game', 'in_lobby', 'ready', 'not_ready'), default='in_lobby')
    user = relationship(User, backref=backref('players'))
    game = relationship(Game, backref=backref('players'))

    @copy_args
    def __init__(self, user_id, game_id): pass

class Message(Base):
    __tablename__ = 'messages'

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id', onupdate='CASCADE', ondelete='CASCADE'))
    game_id = Column(Integer, ForeignKey('games.id', onupdate='CASCADE', ondelete='CASCADE'))
    text = Column(String)
    dateSent = Column(DateTime, default=utcnow)
    user = relationship(User, backref=backref('messages'))
    game = relationship(Game, backref=backref('messages'))

    @copy_args
    def __init__(self, user_id, game_id, text): pass

class Database:
    instance = None
    engine = create_engine('sqlite:///:memory:', echo=False)

    def __init__(self):
        Session = sessionmaker(bind=self.engine)
        self.session = Session()
        Base.metadata.create_all(bind=self.engine)

    def add(self, *objs):
        for obj in objs:
            self.session.add(obj)
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

    def get_game(self, name):
        try:
            return self.session.query(Game).filter_by(name=name).filter(Game.state!='finished').one()
        except NoResultFound:
            raise BadCommand('No unfinished game with that name')

def db_instance():
    if Database.instance is None:
        Database.instance = Database()
    return Database.instance
