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
        user = dbi().query(User).filter(User.username==username).one()
        if user.password != password:
            raise BadPassword('User already exists, but passwords don\'t match')
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
        leaveGame(sid, dbi().query(Game)\
            .filter(Game.id == player.game_id).one().name)
    return response_ok()

@debug_only
@Command()
def clear():
    dbi().clear()
    return response_ok()

@Command(str, str, int)
def createGame(sid, gameName, playersCount): # check the validity of symbols
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
        .filter(Game.name == gameName)\
        .filter(Game.state != 'finished')\
        .count():
        raise AlreadyExists('Game with the such name already exists')
    game = Game(gameName, playersCount)
    dbi().add(game)
    player = Player(user.id, game.id)
    player.is_creator = True
    dbi().add(player)
    return response_ok()

def get_player(user_id, game_id):
    try:
        return dbi().query(Player)\
            .filter(Player.user_id == user_id)\
            .filter(Player.game_id == game_id)\
            .one()
    except sqlalchemy.orm.exc.NoResultFound:
        return None

@Command(str, str)
def joinGame(sid, gameName):
    user_id = dbi().get_user(sid).id
    game = dbi().get_game(gameName)
    if dbi().query(Player).join(Game)\
        .filter(Game.id == game.id)\
        .count() == game.players_count:
        raise BadGame('Game is full')
    if game.state == 'started':
        raise BadGame('Game already started')
    if get_player(user_id, game.id):
        raise AlreadyInGame('User is already playing')
    dbi().add(Player(user_id, game.id))
    return response_ok()

@Command(str, str)
def leaveGame(sid, gameName):
    user_id = dbi().get_user(sid).id
    game = dbi().get_game(gameName)
    player = get_player(user_id, game.id)
    if not player:
        raise BadGame('User is not playing')
    if game.state == 'not_started':
        dbi().delete(player)
    else:
        player.state = 'left'
    if not dbi().query(Player).filter(Player.game_id==game.id).count():
        game.state = 'finished'
    dbi().commit()
    return response_ok()

@Command(str, str, str)
def sendMessage(sid, text, gameName):
    user_id = dbi().get_user(sid).id
    game_id = dbi().get_game(gameName).id
    check_len(text, MAX_MESSAGE_LENGTH, 'Too long message')
    if not get_player(user_id, game_id):
        raise BadCommand('User is not in this game')
    dbi().add(Message(user_id, game_id, text))
    return response_ok()

@Command(str, str)
def getChatHistory(sid, gameName):
    user = dbi().get_user(sid)
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
    games = [{"gameName": name} for name in dbi().query(Game.name).all()]
    return response_ok(games=games)

@Command(str)
def getPlayersList(sid):
    user = dbi().get_user(sid)
    players = [{"username": name} for name in dbi().query(User.username).all()]
    return response_ok(players=players)

@Command(str, str)
def getPlayersListForGame(sid, gameName):
    user = dbi().get_user(sid)
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
        player = dbi().query(Player)\
            .filter(Player.user_id==user.id)\
            .filter(or_(Player.state=='in_lobby',
                        Player.state=='ready'))\
            .one()
    except sqlalchemy.orm.exc.NoResultFound:
        raise BadCommand('User is not in lobby')
    player.state = status
    query = dbi().query(Player).join(Game).filter(Game.id==player.game_id)
    if player.game.players_count == query.filter(Player.state=='ready').count():
        for p in player.game.players:
            p.state = "in_game"
        player.game.status = "started"
    dbi().commit()
    return response_ok()

@Command(str, str, list)
def uploadMap(sid, name, terrain):
    user = dbi().get_user(sid)
    for line in terrain:
        if not isinstance(line, str):
            raise BadCommand("Field 'terrain' must consist of strings")
    if dbi().query(Map).filter_by(name=name).count():
        raise alreadyExists("Map with such name already exists")
    if len(set(map(len, terrain))) != 1:
        raise BadMap("Lines in map must have the same width")
    if not (0 < len(terrain[0]) < MAX_MAP_WIDTH):
        raise BadMap("Map width must be in range 1..{0}".format(MAX_MAP_WIDTH))
    if not (0 < len(terrain) < MAX_MAP_HEIGHT):
        raise BadMap("Map height must be in range 1..{0}".format(MAX_MAP_HEIGHT))
    terrain = ''.join(terrain)
    chars = set(char for char in terrain)
    if not chars < set(".x123456789"):
        raise BadMap("Bad character in map description")
    chars.discard(".")
    chars.discard("x")
    if len(chars) < 2:
        raise BadMap("There must be deploy spots at least for 2 players")
    if len(chars) != int(max(chars)):
        raise BadMap("The numbers must be consequetive")
    dbi().add(Map(name, terrain, len(terrain[0]), len(terrain)))
    return response_ok()

@Command(str, str, list)
def uploadFaction(sid, factionName, units):
    user = dbi().get_user(sid)
    check_len(factionName, MAX_NAME_LENGTH, 'Too long faction name')
    check_emptiness(factionName, 'Empty faction name')
    if dbi().query(Faction).filter(Faction.name==factionName).count():
        raise BadFactionName('Faction already exists')
    faction = Faction(factionName)
    dbi().add(faction)
    unit_objects = (Unit(**unit) for unit in units)
    for unit in unit_objects:
        unit.faction_id = faction.id
        dbi().add(unit)
    return response_ok()

@Command(str, str)
def deleteFaction(sid, factionName):
    user = dbi().get_user(sid)
    dbi().delete(dbi().get_faction(factionName))
    return response_ok()

@Command(str, str)
def getFaction(sid, factionName):
    user = dbi().get_user(sid)
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
    check_len(armyName, MAX_NAME_LENGTH, 'Too long army name')
    check_emptiness(armyName, 'Empty army name')
    if dbi().query(Army).filter_by(name=armyName).count():
        raise BadArmy('Army already exists')
    if not dbi().query(Faction).filter_by(name=factionName).count():
        raise BadFaction('No faction with that name')
    unit_packs = []
    for unit in armyUnits:
        if not isinstance(unit, dict) or len(unit) != 2 or\
            'name' not in unit or 'count' not in unit:
            raise BadArmy("Each element of armyUnits must have fields 'name' and 'count'")
        name, count = unit['name'], unit['count']
        unit_packs.append(dbi().get_unit(name, factionName))
        unit_packs[-1].count = count
    army = Army(armyName, user.id)
    dbi().add(army)
    dbi().add(*(UnitArmy(unit.id, army.id, unit.count) for unit in unit_packs))
    return response_ok()

@Command(str, str)
def getArmy(sid, armyName):
    user = dbi().get_user(sid)
    army = dbi().get_army(armyName)
    return response_ok(units=[dict(name=pack.unit.name, count=pack.count)
        for pack in army.unitArmy])

@Command(str, str)
def deleteArmy(sid, armyName):
    user = dbi().get_user(sid)
    dbi().delete(dbi().get_army(armyName))
    return response_ok()

@Command(str,str)
def chooseArmy(sid, armyName):
    user = dbi().get_user(sid)
    try:
        player = dbi().query(Player).filter(Player.user_id==user.id).\
            filter(Player.state=='in_lobby').one()
    except sqlalchemy.orm.exc.NoResultFound:
        raise NotInGame("Can't choose army, because you're not in game")
    army = dbi().get_army(armyName)
    total_cost = sum(squad.count * squad.unit.cost for squad in army.unitArmy)
    if total_cost > player.game.total_cost:
        raise BadArmy("Your army is too expensive")
    player.army = army
    dbi().commit()
    return response_ok()
