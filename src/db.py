#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from sqlalchemy import create_engine, Table, Boolean, Enum, Column, Integer, String, MetaData, Date, ForeignKey, DateTime
from sqlalchemy.orm import sessionmaker, relationship, backref
from sqlalchemy.orm.exc import NoResultFound
from sqlalchemy.ext.declarative import declarative_base
from common import copy_args, DEBUG, utcnow
from exceptions import BadSid, BadCommand

Base = declarative_base()

uniqueString = lambda : Column(String, unique=True, nullable=False)
utcDT = lambda : Column(DateTime, default=utcnow)
pkey = lambda : Column(Integer, primary_key=True)
fkey = lambda name : Column(Integer, ForeignKey(name, onupdate='CASCADE', ondelete='CASCADE'))
requiredString = lambda : Column(String, nullable=False)

class User(Base):
    __tablename__ = 'users'

    id = pkey()
    username = uniqueString()
    password = requiredString()
    sid = uniqueString()

    @copy_args
    def __init__(self, username, password):
        self.sid = db_instance().generate_sid(username, password)

    def __repr__(self):
        return '<User({0}, {1}, {2})>'.format(self.username, self.password, self.sid)   
        
class Map(Base):
    __tablename__ = 'maps'  
    
    id = pkey()
    name = uniqueString()
    construction = requiredString()
    
    @copy_args
    def __init__(self, name, construction): pass
    
class Faction(Base):
    __tablename__ = 'factions'
    
    id = pkey()
    name = requiredString() 
    
    @copy_args
    def __init__(self, name): pass                

class Game(Base):
    __tablename__ = 'games'

    id = pkey()
    name = requiredString()
    players_count = Column(Integer, nullable=False)
    state = Column(Enum('not_started', 'started', 'finished'), default='not_started')
    start_time = utcDT()
    total_cost = Column(Integer, nullable=False, default=5000)
    map_id = fkey('maps.id')
    faction_id = fkey('factions.id')
    map = relationship(Map, backref=backref('games'))
    faction = relationship(Faction, backref=backref('games'))

    @copy_args
    def __init__(self, name, players_count): pass

    def __repr__(self):
        return '<Game({0},{1})>'.format(self.name, self.gameState)

class Player(Base):
    __tablename__ = 'players'

    id = pkey()
    user_id = fkey('users.id')
    game_id = fkey('games.id')
    is_creator = Column(Boolean, default=False)
    state = Column(Enum('in_game', 'in_lobby', 'ready', 'left'), default='in_lobby')
    user = relationship(User, backref=backref('players'))
    game = relationship(Game, backref=backref('players'))

    @copy_args
    def __init__(self, user_id, game_id): pass

class Message(Base):
    __tablename__ = 'messages'

    id = pkey()
    user_id = fkey('users.id')
    game_id = fkey('games.id')
    text = requiredString()
    dateSent = utcDT()
    user = relationship(User, backref=backref('messages'))
    game = relationship(Game, backref=backref('messages'))

    @copy_args
    def __init__(self, user_id, game_id, text): pass
    
class Unit(Base):
    __tablename__ = 'units'
    
    id = pkey()
    name = requiredString()
    HP = Column(Integer, nullable=False)
    MP = Column(Integer, nullable=False)
    defence = Column(Integer, nullable=False)
    attack = Column(Integer, nullable=False)
    range = Column(Integer, nullable=False)
    damage = Column(Integer, nullable=False)
    cost = Column(Integer, nullable=False)
    faction_id = fkey('factions.id')
    faction = relationship(Faction, backref=backref('units'))
    
    @copy_args
    def __init__(self, name): pass 
    
class Army(Base):
    __tablename__ = 'armies'
    
    id = pkey()
    name = requiredString()
    player_id = fkey('players.id')
    player = relationship(Player, backref=backref('armies')) 
    
    @copy_args
    def __init__(self, name): pass 
    
class Unit_Army(Base):
    __tablename__ = 'unitArmy'

    id = pkey()
    unit_id = fkey('units.id')
    army_id = fkey('armies.id')
    unit = relationship(Unit, backref=backref('unitArmy'))
    army = relationship(Army, backref=backref('unitArmy'))

    @copy_args
    def __init__(self, unit_id, army_id): pass             
                               

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
