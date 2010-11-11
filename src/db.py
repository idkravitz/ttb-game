#!/usr/bin/env python3
# -*- coding: utf-8 -*-
from functools import reduce

from sqlalchemy import create_engine, Table, Boolean, Enum, Column, Integer, String, MetaData, Date, ForeignKey, DateTime
from sqlalchemy.orm import sessionmaker, relationship, backref, join
from sqlalchemy.orm.exc import NoResultFound
from sqlalchemy.ext.declarative import declarative_base

from common import copy_args, DEBUG, utcnow, get_db_string
from exceptions import *

import hashlib
import datetime
import random

Base = declarative_base()

uniqueString = lambda: Column(String, unique=True, nullable=False)
utcDT = lambda: Column(DateTime, default=utcnow)
pkey = lambda: Column(Integer, primary_key=True)
fkey = lambda name: Column(Integer, ForeignKey(name, onupdate='CASCADE', ondelete='CASCADE'))
requiredString = lambda: Column(String, nullable=False)
requiredInteger = lambda: Column(Integer, nullable=False)

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
    terrain = requiredString()
    width = requiredInteger()

    @copy_args
    def __init__(self, name, terrain, width): pass

    def __repr__(self):
        return "<Map({0},{1})>".format(self.name, self.terrain)

    def to_list(self, keep_strings=False):
        line_processing = (lambda x: x) if keep_strings else list
        return [line_processing(self.terrain[i:i+self.width])
            for i in range(0, len(self.terrain), self.width)]


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
    players_count = requiredInteger()
    state = Column(Enum('not_started', 'started', 'finished'), default='not_started')
    start_time = utcDT()
    total_cost = Column(Integer, nullable=False, default=5000)
    map_id = fkey('maps.id')
    faction_id = fkey('factions.id')
    map = relationship(Map, backref=backref('games'))
    faction = relationship(Faction, backref=backref('games'))

    @copy_args
    def __init__(self, name, players_count, map_id, faction_id, total_cost): pass

    def __repr__(self):
        return '<Game({0},{1})>'.format(self.name, self.gameState)

    def is_started(self, quite=False):
        r = self.state != 'not_started'
        if not (r or quite):
            raise BadGame('Game is not started')
        return r

    def is_started_stricktly(self, quite=False):
        r = self.is_started(quite=False) and self.state != 'finished'
        if not (r or quite):
            raise BadGame('Game is finished')
        return r

class Army(Base):
    __tablename__ = 'armies'

    id = pkey()
    name = requiredString()
    user_id = fkey('users.id')
    user = relationship(User, backref=backref('armies'))

    @copy_args
    def __init__(self, name, user_id): pass

class Player(Base):
    __tablename__ = 'players'

    id = pkey()
    user_id = fkey('users.id')
    game_id = fkey('games.id')
    army_id = fkey('armies.id')
    player_number = Column(Integer)
    is_creator = Column(Boolean, default=False)
    is_winner = Column(Boolean, default=False)
    state = Column(Enum('in_game', 'in_lobby', 'ready', 'left'), default='in_lobby')
    user = relationship(User, backref=backref('players'))
    game = relationship(Game, backref=backref('players'))
    army = relationship(Army, backref=backref('players'))

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
    faction_id = fkey('factions.id')
    faction = relationship(Faction, backref=backref('units'))

    @copy_args
    def __init__(self, name, HP, MP, defence, attack, range, damage, protection, initiative, cost, faction_id):
        pass

    def __hash__(self):
        return hash(self.id)

TYPES = {
    int: requiredInteger,
    str: requiredString,
}

HUMAN_READABLE_TYPES = {
    int: 'an integer',
    str: 'a string',
}

UNIT_ATTRS = {
    'name': str,
    'HP': int,
    'attack': int,
    'defence': int,
    'range': int,
    'damage': int,
    'MP': int,
    'protection': int,
    'initiative': int,
    'cost': int,
}
for attr, type_ in UNIT_ATTRS.items():
    setattr(Unit, attr, TYPES[type_]())

class Ability(Base):
    __tablename__ = 'abilities'

    id = pkey()
    name = requiredString()

    @copy_args
    def __init__(self, name): pass

class UnitAbility(Base):
    __tablename__ = 'unitAbility'

    id = pkey()
    unit_id = fkey('units.id')
    ability_id = fkey('abilities.id')
    unit = relationship(Unit, backref=backref('unitAbility'))
    ability = relationship(Ability, backref=backref('unitAbility'))

    @copy_args
    def __init__(self, unit_id, ability_id): pass

class UnitArmy(Base):
    __tablename__ = 'unitArmy'

    id = pkey()
    unit_id = fkey('units.id')
    army_id = fkey('armies.id')
    count = Column(Integer)
    unit = relationship(Unit, backref=backref('unitArmy'))
    army = relationship(Army, backref=backref('unitArmy'))

    @copy_args
    def __init__(self, unit_id, army_id, count): pass

#class GameProcess(Base):
#    __tablename__ = 'gameProcess'

#    id = pkey()
#    game_id = fkey('games.id')
#    turnNumber = requiredInteger()
#    game = relationship(Game, backref=backref('gameProcess'))

#    @copy_args
#    def __init__(self, game_id, turnNumber): pass

#    def alive_players(self):
#        return (db_instance().query(User.id, User.username).select_from(reduce(join, [Turn, UnitArmy, Army, User]))
#            .filter(Turn.gameProcess_id==self.id).filter(Turn.HP!=0).distinct().all())

#    def alive_units(self, user_id):
#        return (db_instance().query(Turn).filter_by(gameProcess_id=self.id).join(UnitArmy).join(Army).join(User).filter(Turn.HP!=0)
#            .filter(User.id==user_id).all())

#class Turn(Base):
#    __tablename__ = 'turns'

#    id = pkey()
#    unitArmy_id = fkey('unitArmy.id')
#    gameProcess_id = fkey('gameProcess.id')
#    posX = requiredInteger()
#    posY = requiredInteger()
#    destX = requiredInteger()
#    destY = requiredInteger()
#    attackX = requiredInteger()
#    attackY = requiredInteger()
#    unitArmy = relationship(UnitArmy, backref=backref('turns'))
#    gameProcess = relationship(GameProcess, backref=backref('turns'))
#    HP = Column(Integer)

#    @copy_args
#    def __init__(self, unitArmy_id, gameProcess_id, posX, posY, destX, destY, attackX, attackY, HP): pass

#    def __lt__(self, turn):
#        return self.unitArmy.unit.initiative < turn.unitArmy.unit.initiative

#    def __repr__(self):
#        return "<Turn {0}>".format(self.id)

#    @property
#    def dest(self):
#        return self.destX, self.destY

#    @dest.setter
#    def dest(self, val):
#        self.destX, self.destY = val

#    @property
#    def pos(self):
#        return self.posX, self.posY

#    @pos.setter
#    def pos(self, val):
#        self.posX, self.posY = val

class Database:
    instance = None
    engine = create_engine(get_db_string(), echo=False)

    def __init__(self):
        Base.metadata.create_all(self.engine)
        Session = sessionmaker(bind=self.engine)
        self.session = Session()

    def commit(self):
        self.session.commit()

    def add(self, obj):
        self.session.add(obj)
        self.session.commit()

    def add_all(self, objs):
        self.session.add_all(objs)
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
            seq = str(datetime.datetime.utcnow()) + username + password
            sid = hashlib.sha1(seq.encode("utf-8")).hexdigest()
        return sid

    def check_sid(self, sid):
        self.get_user(sid)
    def check_faction(self, name):
        self.get_faction(name)

    def get_user(self, sid):
        try:
            return self.session.query(User).filter_by(sid=sid).one()
        except NoResultFound:
            raise BadSid('Unknown sid')

    def get_player(self, user_id, game_id=None, silent=False):
        q = self.session.query(Player).filter_by(user_id=user_id)
        try:
            if game_id is None:
                q = q.filter_by(state='in_game')
            else:
                q = q.filter_by(game_id=game_id)
            return q.one()
        except NoResultFound:
            if not silent:
                raise BadGame('User is not playing game')
            return None

    def get_game(self, name, ommit_finished=True):
        try:
            q = self.session.query(Game).filter_by(name=name)
            if ommit_finished:
                q = q.filter(Game.state!='finished')
            return q.one()
        except NoResultFound:
            raise BadGame('No unfinished game with that name')

    def get_faction(self, name):
        try:
            return self.session.query(Faction).filter_by(name=name).one()
        except NoResultFound:
            raise BadFaction('No faction with that name')

    def get_army(self, name):
        try:
            return self.session.query(Army).filter_by(name=name).one()
        except NoResultFound:
            raise BadArmy('No army with that name')

    def get_unit(self, name, factionName):
        try:
            return self.session.query(Unit).join(Faction)\
                .filter(Unit.name==name)\
                .filter(Faction.name==factionName).one()
        except NoResultFound:
            raise BadUnit('No unit with that name')

    def get_map(self, mapName):
        try:
            return self.session.query(Map).filter_by(name=mapName).one()
        except NoResultFound:
            raise BadMap("Map with such name doesn't exists")

def db_instance():
    if Database.instance is None:
        Database.instance = Database()
    return Database.instance
