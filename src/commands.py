#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import re
import json
import functools

import sqlalchemy.orm.exc
from sqlalchemy import or_

from common import *
from exceptions import *
from db import db_instance as dbi, User, Map, Game, Player, Message, Faction, Unit, Army, UnitArmy

class Command(object):
    def __init__(self, *args):
        self.types = args

    def __call__(self, function):
        function.iscommand = True
        argspec = inspect.getargspec(function)
        @functools.wraps(function)
        def wraps(*args, **kwargs):
            kwargs.update(zip(argspec.args, args))
            if len(kwargs) < len(argspec.args):
                raise BadCommand('Not enough fields')
            if len(kwargs) > len(argspec.args):
                raise BadCommand('Too many fields')
            for name in argspec.args:
                if name not in kwargs:
                    raise BadCommand('Unknown field {0}'.format(name))
            if self.types:
                for type_, name in zip(self.types, argspec.args):
                    if not isinstance(kwargs[name], type_):
                        raise BadCommand(
                            "Field '{0}' must have type '{1}'".format(
                                name, type_.__name__))
            return function(**kwargs)
        return wraps

def debug_only(function):
    @functools.wraps(function)
    def wraps(**kwargs):
        if not DEBUG:
            raise BadCommand('Command allowed only in test mode')
        return function(**kwargs)
    return wraps

def process_request(request):
    if 'cmd' not in request:
        raise BadRequest('Field \'cmd\' required')
    command = globals().get(request.pop('cmd'))
    if not hasattr(command, 'iscommand'):
        raise BadCommand('Unknown command')
    return command(**request)

def response_ok(**kwargs):
    kwargs.update({'status': 'ok'})
    return json.dumps(kwargs, **JSON_DUMPS_FORMAT)

def check_len(obj, max_len, descr):
    if len(obj) > max_len:
        raise BadCommand(descr)

def check_emptiness(obj, descr):
    if not len(obj):
        raise BadCommand(descr)

@Command(str, str)
def register(username, password):
    if not username.replace('_', '').isalnum():
        raise BadCommand('Incorrect username')
    check_len(username, MAX_NAME_LENGTH, 'Too long username')
    check_emptiness(password, 'Empty password')
    try:
        user = dbi().query(User).filter_by(username=username).one()
        if user.password != password:
            raise BadPassword(
                'User already exists, but passwords don\'t match')
    except sqlalchemy.orm.exc.NoResultFound:
        user = User(username, password)
        dbi().add(user)
    return response_ok(sid=user.sid)

@Command(str)
def unregister(sid):
    user = dbi().get_user(sid)
    try:
        player = dbi().query(Player).join(Game)\
            .filter(Player.user_id == user.id)\
            .filter(Game.state != 'finished')\
            .one()
    except sqlalchemy.orm.exc.NoResultFound:
        player = None
    if player:
        leaveGame(sid,
            dbi().query(Game).filter_by(id=player.game_id).one().name)
    return response_ok()

@debug_only
@Command()
def clear():
    dbi().clear()
    return response_ok()

@Command(str, str, int, str, str, int)
def createGame(sid, gameName, playersCount, mapName, factionName, totalCost):
    user = dbi().get_user(sid)
    if playersCount < 2:
        raise BadCommand('Number of players must be 2 or more')
    if playersCount > MAX_PLAYERS:
        raise BadCommand('Too many players')
    check_len(gameName, MAX_NAME_LENGTH, 'Too long game name')
    check_emptiness(gameName, 'Empty game name')
    if dbi().query(Player)\
        .join(Game)\
        .filter(Player.user_id == user.id)\
        .filter(Player.is_creator == True)\
        .filter(Game.state != 'finished')\
        .count():
        raise AlreadyInGame('User is already playing')
    if dbi().query(Game)\
        .filter_by(name=gameName)\
        .filter(Game.state != 'finished')\
        .count():
        raise AlreadyExists('Game with the such name already exists')
    if totalCost < MIN_TOTAL_COST:
        raise BadGame(
            'totalCost must be greater than or equal to {0}'.format(
                MIN_TOTAL_COST))
    map_id = dbi().get_map(mapName).id
    faction_id = dbi().get_faction(factionName).id
    game = Game(gameName, playersCount, map_id, faction_id, totalCost)
    dbi().add(game)
    player = Player(user.id, game.id)
    player.is_creator = True
    dbi().add(player)
    return response_ok()

@Command(str, str)
def joinGame(sid, gameName):
    user = dbi().get_user(sid)
    game = dbi().get_game(gameName)
    if dbi().query(Player).join(Game)\
        .filter(Game.id == game.id)\
        .count() == game.players_count:
        raise BadGame('Game is full')
    if game.state == 'started':
        raise BadGame('Game already started')
    if dbi().get_player(user.id, game.id):
        raise AlreadyInGame('User is already playing')
    dbi().add(Player(user.id, game.id))
    return response_ok()

@Command(str, str)
def leaveGame(sid, gameName):
    user = dbi().get_user(sid)
    game = dbi().get_game(gameName)
    player = dbi().get_player(user.id, game.id)
    if not player:
        raise BadGame('User is not playing')
    if game.state == 'not_started':
        dbi().delete(player)
    else:
        player.state = 'left'
    if not dbi().query(Player).filter_by(game_id=game.id).count():
        game.state = 'finished'
    dbi().commit()
    return response_ok()

@Command(str, str, str)
def sendMessage(sid, text, gameName):
    user = dbi().get_user(sid)
    game = dbi().get_game(gameName)
    check_len(text, MAX_MESSAGE_LENGTH, 'Too long message')
    if not dbi().get_player(user.id, game.id):
        raise BadCommand('User is not in this game')
    dbi().add(Message(user.id, game.id, text))
    return response_ok()

@Command(str, str)
def getChatHistory(sid, gameName):
    dbi().check_sid(sid)
    game = dbi().get_game(gameName)
    chat = [{
                "username": msg.user.username,
                "message": msg.text,
                "time": str(msg.dateSent),
            }
        for msg in game.messages]
    return response_ok(chat=chat)

@Command(str)
def getGamesList(sid):
    user = dbi().get_user(sid)
    games = [{
                  "gameName": game.name,
                  "mapName": game.map.name,
                  "factionName": game.faction.name,
                  "gameStatus": game.state,
                  "playersCount": game.players_count,
                  "connectedPlayersCount":
                    dbi().query(Player).filter_by(game_id=game.id).count(),
                  "totalCost": game.total_cost,
             }
        for game in dbi().query(Game).all()]
    return response_ok(games=games)

@Command(str)
def getPlayersList(sid):
    dbi().check_sid(sid)
    players = [{"username": name} for name in dbi().query(User.username).all()]
    return response_ok(players=players)

@Command(str, str)
def getPlayersListForGame(sid, gameName):
    dbi().check_sid(sid)
    game = dbi().get_game(gameName)
    players = [{"username": player.user.username} for player in \
        dbi().query(Player).join(Game).filter(Game.id==game.id).all()]
    return response_ok(players=players)

@Command(str, str)
def setPlayerStatus(sid, status):
    user = dbi().get_user(sid)
    if status not in ('ready', 'not_ready'):
        raise BadCommand('Unknown player status')
    try:
        player = dbi().query(Player).filter_by(user_id=user.id)\
            .filter(or_(Player.state=='in_lobby', Player.state=='ready'))\
            .one()
    except sqlalchemy.orm.exc.NoResultFound:
        raise BadCommand('User is not in lobby')
    player.state = status
    query = dbi().query(Player).join(Game).filter(Game.id==player.game_id)
    if player.game.players_count == query.filter(Player.state=='ready').count():
        for p in player.game.players:
            p.state = 'in_game'
        player.game.status = 'started'
    dbi().commit()
    return response_ok()

@Command(str, str, list)
def uploadMap(sid, name, terrain):
    dbi().check_sid(sid)
    for line in terrain:
        if not isinstance(line, str):
            raise BadMap("Field 'terrain' must consist of strings")
    if dbi().query(Map).filter_by(name=name).count():
        raise BadMap('Map with such name already exists')
    if not (0 < len(terrain) < MAX_MAP_HEIGHT):
        raise BadMap('Map height must be in range 1..{0}'.format(MAX_MAP_HEIGHT))
    if len(set(map(len, terrain))) != 1:
        raise BadMap('Lines in map must have the same width')
    width = len(terrain[0])
    if not (0 < width < MAX_MAP_WIDTH):
        raise BadMap('Map width must be in range 1..{0}'.format(MAX_MAP_WIDTH))
    terrain = ''.join(terrain)
    chars = set(char for char in terrain)
    if not chars < set('.x123456789'):
        raise BadMap('Bad character in map description')
    chars -= set('.x')
    if len(chars) < 2:
        raise BadMap('There must be deploy spots at least for 2 players')
    if len(chars) != int(max(chars)):
        raise BadMap('Player numbers must be consequetive')
    dbi().add(Map(name, terrain, width))
    return response_ok()

@Command(str, str)
def getMap(sid, name):
    dbi().check_sid(sid)
    map_ = dbi().get_map(name)
    width, terrain = map_.width, map_.terrain
    return response_ok(
        map=[terrain[i:i+width] for i in range(0, len(terrain), width)])

@Command(str, str)
def deleteMap(sid, name):
    dbi().check_sid(sid)
    dbi().delete(dbi().get_map(name))
    return response_ok()

@Command(str, str, list)
def uploadFaction(sid, factionName, units):
    dbi().check_sid(sid)
    check_len(factionName, MAX_NAME_LENGTH, 'Too long faction name')
    check_emptiness(factionName, 'Empty faction name')
    if dbi().query(Faction).filter_by(name=factionName).count():
        raise BadFaction('Faction already exists')
    faction = Faction(factionName)
    dbi().add(faction)
    unit_objects = (Unit(**unit) for unit in units)
    for unit in unit_objects:
        unit.faction_id = faction.id
        dbi().add(unit)
    return response_ok()

@Command(str, str)
def deleteFaction(sid, factionName):
    dbi().check_sid(sid)
    dbi().delete(dbi().get_faction(factionName))
    return response_ok()

@Command(str, str)
def getFaction(sid, factionName):
    dbi().check_sid(sid)
    faction = dbi().get_faction(factionName)
    unitList = [{
                    "name": u.name,
                    "HP": u.HP,
                    "MP": u.MP,
                    "defence": u.defence,
                    "attack": u.attack,
                    "range": u.range,
                    "damage": u.damage,
                    "cost": u.cost,
                }
        for u in faction.units]
    return response_ok(unitList=unitList)

@Command(str, str, str, list)
def uploadArmy(sid, armyName, factionName, armyUnits):
    user = dbi().get_user(sid)
    dbi().check_faction(factionName)
    check_len(armyName, MAX_NAME_LENGTH, 'Too long army name')
    check_emptiness(armyName, 'Empty army name')
    if dbi().query(Army).filter_by(user_id=user.id, name=armyName).count():
        raise BadArmy('You have army with such name')
    unit_packs = []
    for unit in armyUnits:
        if not isinstance(unit, dict) or len(unit) != 2 or \
            'name' not in unit or 'count' not in unit:
            raise BadArmy(
                "Each element of armyUnits must have fields 'name' and 'count'")
        name, count = unit['name'], unit['count']
        unit_packs.append(dbi().get_unit(name, factionName))
        unit_packs[-1].count = count
    army = Army(armyName, user.id)
    dbi().add(army)
    for unit in unit_packs:
        dbi().add(UnitArmy(unit.id, army.id, unit.count))
    return response_ok()

@Command(str, str)
def getArmy(sid, armyName):
    dbi().check_sid(sid)
    army = dbi().get_army(armyName)
    return response_ok(units=[dict(name=pack.unit.name, count=pack.count)
        for pack in army.unitArmy])

@Command(str, str)
def deleteArmy(sid, armyName):
    user = dbi().get_user(sid)
    army = dbi().get_army(armyName)
    if army.user_id != user.id:
       raise BadArmy('It isn\'t your army')
    dbi().delete(army)
    return response_ok()

@Command(str, str)
def chooseArmy(sid, armyName):
    user = dbi().get_user(sid)
    try:
        player = dbi().query(Player).filter_by(
            user_id=user.id, state='in_lobby').one()
    except sqlalchemy.orm.exc.NoResultFound:
        raise NotInGame('Can\'t choose army, because you\'re not in game')
    army = dbi().get_army(armyName)
    total_cost = sum(squad.count * squad.unit.cost for squad in army.unitArmy)
    if total_cost > player.game.total_cost:
        raise BadArmy('Your army is too expensive')
    player.army = army
    dbi().commit()
    return response_ok()
