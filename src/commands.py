#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import re
import json
import functools
import random
import hashlib
from functools import reduce
from collections import namedtuple

import sqlalchemy.orm.exc
from sqlalchemy import or_, desc
from sqlalchemy.orm import join

from common import *
from exceptions import *
from db import db_instance as dbi
from db import User, Map, Game, Player, Message, Faction, Unit, Army, UnitArmy
from db import UNIT_ATTRS, HUMAN_READABLE_TYPES
from logics import *

class Command(object):
    def __init__(self, *args):
        self.types = args

    def __call__(self, function):
        function.iscommand = True
        argspec = inspect.getfullargspec(function)
        @functools.wraps(function)
        def wraps(*args, **kwargs):
            kwargs.update(zip(argspec.args, args))
            if len(kwargs) < len(argspec.args):
                raise BadCommand('Not enough fields')
            if (argspec.varkw is None) and len(kwargs) > len(argspec.args):
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

def commandline_only(function):
    @functools.wraps(function)
    def wraps(*args, **kwargs):
        if not COMMANDLINE:
            raise BadCommand('Command allowed only in commandline mode')
        return function(*args, **kwargs)
    return wraps

def debug_only(function):
    @commandline_only
    @functools.wraps(function)
    def wraps(*args, **kwargs):
        if not (DEBUG or COMMANDLINE):
            raise BadCommand('Command allowed only in test mode')
        return function(*args, **kwargs)
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
    return kwargs

def check_len(obj, max_len, descr, cls):
    if len(obj) > max_len:
        raise cls(descr)

def check_emptiness(obj, descr, cls):
    if not len(obj):
        raise cls(descr)

def ready_players_query(process):
    return (dbi().query(User.id).select_from(reduce(join, [Turn, UnitArmy, Army, User]))
        .filter(Turn.gameProcess_id==process.id).distinct())

def last_game_process_query(game, obj):
    return dbi().query(obj).filter_by(game_id=game.id).order_by(desc(GameProcess.turnNumber)).first()

def get_last_game_process(game):
    return last_game_process_query(game, GameProcess)

def get_current_turn_number(game):
    return last_game_process_query(game, GameProcess.turnNumber)[0]

def construct_turn_from_previous(turn, newProcess, posX, posY, destX, destY, attackX, attackY):
    return Turn(turn.unitArmy_id, newProcess.id, posX, posY, destX, destY, attackX, attackY, turn.HP)

def is_turn_completed(game, process):
    return game.players_count == ready_players_query(process).count()

def check_fields(fields, u):
    if not(isinstance(u, dict) and all(f in u for f in fields)):
        raise BadCommand("Bad objects in units")

@Command(str, str)
def register(username, password):
    if not username.replace('_', '').isalnum():
        raise BadUsername('Incorrect username')
    check_len(username, MAX_NAME_LENGTH, 'Too long username', BadUsername)
    check_emptiness(password, 'Empty password', BadPassword)
    if not DEBUG:
        password = hashlib.md5(password.encode("utf-8")).hexdigest()
    try:
        user = dbi().query(User).filter_by(username=username).one()
        if user.password != password:
            raise BadPassword(
                "User already exists, but passwords don't match")
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
        pass
    else:
        leaveGame(sid, player.game.name)
    dbi().delete(user)
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
        raise BadGame('Number of players must be 2 or more')
    if playersCount > MAX_PLAYERS:
        raise BadGame('Too many players')
    check_len(gameName, MAX_NAME_LENGTH, 'Too long game name', BadGame)
    check_emptiness(gameName, 'Empty game name', BadGame)
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
    if dbi().get_player(user.id, game.id, silent=True):
        raise AlreadyInGame('User is already playing')
    dbi().add(Player(user.id, game.id))
    return response_ok()

@Command(str, str)
def leaveGame(sid, gameName):
    user = dbi().get_user(sid)
    game = dbi().get_game(gameName)
    player = dbi().get_player(user.id, game.id)
    if game.state == 'not_started':
        dbi().delete(player)
    else:
        player.state = 'left'
    if not dbi().query(Player).filter_by(game_id=game.id).filter(Player.state!='left').count():
        game.state = 'finished'
    dbi().commit()
    return response_ok()

@Command(str, str, str)
def sendMessage(sid, text, gameName):
    user = dbi().get_user(sid)
    game = dbi().get_game(gameName)
    check_len(text, MAX_MESSAGE_LENGTH, 'Too long message', BadMessage)
    dbi().get_player(user.id, game.id)
    dbi().add(Message(user.id, game.id, text))
    return response_ok()

@Command(str, str)
def getChatHistory(sid, gameName, **opt):
    dbi().check_sid(sid)
    game = dbi().get_game(gameName)
    if "since" in opt:
        messages = dbi().query(Message).filter_by(game_id=game.id).filter(Message.id > int(opt["since"])).all()
    else:
        messages = game.messages
    chat = [{
                "id": msg.id,
                "username": msg.user.username,
                "message": msg.text,
                "time": str(msg.dateSent),
            }
        for msg in messages]
    return response_ok(chat=chat)

def get_winner(game):
    try:
        return dbi().query(User.username).join(Player).filter(Player.game_id==game.id).filter(Player.is_winner==True).one()[0]
    except sqlalchemy.orm.exc.NoResultFound:
        return "[DRAW]"

@Command(str)
def getGamesList(sid):
    user = dbi().get_user(sid)
    games = []
    for game in dbi().query(Game).filter(Game.state != 'finished'):
        rec = {
            "gameName": game.name,
            "mapName": game.map.name,
            "factionName": game.faction.name,
            "gameStatus": game.state,
            "playersCount": game.players_count,
            "connectedPlayersCount":
              dbi().query(Player).filter_by(game_id=game.id).count(),
            "totalCost": game.total_cost,
        }
        games.append(rec)
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
    players = [{"username": player.user.username, "status": player.state}
        for player in game.players]
    return response_ok(players=players)

@Command(str, str)
def setPlayerStatus(sid, status):
    user = dbi().get_user(sid)
    if status not in ('ready', 'in_lobby'):
        raise BadPlayerStatus('Unknown player status')
    try:
        player = dbi().query(Player).filter_by(user_id=user.id)\
            .filter(or_(Player.state=='in_lobby', Player.state=='ready'))\
            .one()
    except sqlalchemy.orm.exc.NoResultFound:
        raise BadUser('User is not in lobby')
    player.state = status
    query = dbi().query(Player).join(Game).filter(Game.id==player.game_id)
    if player.game.players_count == query.filter(Player.state=='ready').count():
        for index, p in enumerate(player.game.players, start=1):
            p.state = 'in_game'
            p.player_number = index
        player.game.state = 'started'
        GameProcess(player.game)
    dbi().commit()
    return response_ok()

@Command(str, str)
def getPlayerNumber(sid, gameName):
    user = dbi().get_user(sid)
    game = dbi().get_game(gameName)
    if game.state != 'started':
        raise BadGame("Cann't obtain players numbers for not started game")
    player = dbi().query(Player).join(Game).filter(Player.game_id==game.id).filter(Player.user_id==user.id).one()
    return response_ok(player_number=player.player_number)

@commandline_only
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
    return response_ok(map=map_.to_list(keep_strings=True))

@Command(str)
def getMapList(sid):
    dbi().check_sid(sid)
    maps = [{"map": name} for name in dbi().query(Map.name).all()]
    return response_ok(maps=maps)

@commandline_only
@Command(str, str)
def deleteMap(sid, name):
    dbi().check_sid(sid)
    dbi().delete(dbi().get_map(name))
    return response_ok()

@commandline_only
@Command(str, str, list)
def uploadFaction(sid, factionName, units):
    dbi().check_sid(sid)
    check_len(factionName, MAX_NAME_LENGTH, 'Too long faction name', BadFaction)
    check_emptiness(factionName, 'Empty faction name', BadFaction)
    if dbi().query(Faction).filter_by(name=factionName).count():
        raise BadFaction('Faction already exists')
    faction = Faction(factionName)
    dbi().add(faction)
    if not units:
        raise BadFaction('Empty faction')
    for unit in units:
        if len(unit) > len(UNIT_ATTRS):
            raise BadUnit('Too many unit attributes')
        for attr in UNIT_ATTRS:
            if attr not in unit:
                raise BadUnit(
                    "Unit description must contain field '{0}'".format(attr))
            attr_type = UNIT_ATTRS[attr]
            if not isinstance(unit[attr], attr_type):
                raise BadUnit("Field '{0}' must be {1}".format(
                    attr, HUMAN_READABLE_TYPES[attr_type]))
    dbi().add_all(Unit(faction_id=faction.id, **unit) for unit in units)
    return response_ok()

@commandline_only
@Command(str, str)
def deleteFaction(sid, factionName):
    dbi().check_sid(sid)
    dbi().delete(dbi().get_faction(factionName))
    return response_ok()

@Command(str, str)
def getFaction(sid, factionName):
    dbi().check_sid(sid)
    faction = dbi().get_faction(factionName)
    units = [dict((attr, getattr(unit, attr)) for attr in UNIT_ATTRS)
        for unit in faction.units]
    return response_ok(unitList=units)

@Command(str)
def getFactionList(sid):
    dbi().check_sid(sid)
    factions = [{"faction": name} for name in dbi().query(Faction.name).all()]
    return response_ok(factions=factions)

def prepareArmy(user, armyName, factionName, armyUnits, new=True):
    dbi().check_faction(factionName)
    check_len(armyName, MAX_NAME_LENGTH, 'Too long army name', BadArmy)
    check_emptiness(armyName, 'Empty army name', BadArmy)
    if new and dbi().query(Army).filter_by(user_id=user.id, name=armyName).count():
        raise BadArmy('You have army with such name')
    squads = {}
    for unit in armyUnits:
        if not(isinstance(unit, dict) and len(unit) == 2 and
            'name' in unit and 'count'  in unit
        ):
            raise BadArmy(
                "Each element of armyUnits must have fields 'name' and 'count'")
        name, count = unit['name'], unit['count']
        unit = dbi().get_unit(name, factionName)
        if unit in squads:
            squads[unit] += count
        elif count:
            squads[unit] = count
    check_emptiness(squads, 'Empty army', BadArmy)
    return squads

@Command(str, str, str, list)
def uploadArmy(sid, armyName, factionName, armyUnits):
    user = dbi().get_user(sid)
    squads = prepareArmy(user, armyName, factionName, armyUnits)
    army = Army(armyName, user.id)
    dbi().add(army)
    dbi().add_all(UnitArmy(unit.id, army.id, count) for unit, count in squads.items())
    return response_ok()

@Command(str, str)
def getArmy(sid, armyName):
    user = dbi().get_user(sid)
    try:
        army = dbi().query(Army).filter_by(name=armyName, user_id=user.id).one()
    except sqlalchemy.orm.exc.NoResultFound:
        raise BadArmy('No army with that name')
    return response_ok(units=[dict(name=squad.unit.name, count=squad.count) for squad in army.unitArmy],
        factionName=army.unitArmy[0].unit.faction.name)

@Command(str)
def getArmiesList(sid):
    user = dbi().get_user(sid)
    result = [ {
            'name': army.name,
            'cost': sum(squad.unit.cost * squad.count for squad in army.unitArmy),
            'faction': army.unitArmy[0].unit.faction.name,
        }
    for army in user.armies ]
    return response_ok(armies=result)

@Command(str, str)
def deleteArmy(sid, armyName):
    user = dbi().get_user(sid)
    try:
        army = dbi().query(Army).filter_by(name=armyName, user_id=user.id).one()
    except sqlalchemy.orm.exc.NoResultFound:
        raise BadArmy('No army with that name')
    dbi().delete(army)
    return response_ok()

@Command(str, str, str, str, list)
def editArmy(sid, armyName, newArmyName, factionName, armyUnits):
    user = dbi().get_user(sid)
    try:
        army = dbi().query(Army).filter_by(name=armyName, user_id=user.id).one()
    except sqlalchemy.orm.exc.NoResultFound:
        raise BadArmy('No army with that name')
    if (armyName != newArmyName and
        dbi().query(Army).filter_by(name=newArmyName, user_id=user.id).count()
    ):
        raise BadArmy('Already have army with this name')
    squads = prepareArmy(user, newArmyName, factionName, armyUnits, False)
    dbi().delete(army)
    army = Army(newArmyName, user.id)
    dbi().add(army)
    dbi().add_all(UnitArmy(unit.id, army.id, count) for unit, count in squads.items())
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
    total_cost = sum(squad.unit.cost * squad.count for squad in army.unitArmy)
    if total_cost > player.game.total_cost:
        raise BadArmy('Your army is too expensive')
    player.army = army
    dbi().commit()
    return response_ok()

@Command(str, list)
def placeUnits(sid, units):
    user = dbi().get_user(sid)
    player = dbi().get_player(user.id)
    process = GameProcess.get(player.game)
    if process.turn:
        raise BadTurn("Unit placing allowed only on zero turn")
    store = { squad.unit.name: squad.count for squad in player.army.unitArmy }
    fields = ["name", "posX", "posY"]
    to_place = []
    for u in units:
        check_fields(fields, u)
        height, width = process.get_map_dimensions()
        if not (0 <= u["posX"] < width and 0 <= u["posY"] < height):
            raise BadCommand("Outside the map limits")
        x, y, name = u["posX"], u["posY"], u["name"]
        if not(name in store and store[name]):
            raise BadUnit("No such units in army")
        to_place += [(name, x, y, player.player_number)]
        store[name] -= 1
    for placement in to_place:
        process.place_unit(*placement)
    process.placement_finished()
    return response_ok()

@Command(str, int, list)
def move(sid, turn, units):
    user = dbi().get_user(sid)
    player = dbi().get_player(user.id)
    process = GameProcess.get(player.game)
    if turn != process.turn or not turn:
        raise BadTurn("Not actual turn number")

    fields = ["posX", "posY", "destX", "destY", "attackX", "attackY"]
    actions = []
    for u in units:
        check_fields(fields, u)
        pos = u["posX"], u["posY"]
        attack = u["attackX"], u["attackY"]
        dest = u["destX"], u["destY"]
        if pos not in process.previous_placements or process.previous_placements[pos].player != player.player_number:
            raise BreakRules('No unit in that cell')
        if attack != NO_TARGET and attack not in process.previous_placements:
            raise BreakRules("Can't attack dummy target")
        path = find_shortest_path(process.map, pos, dest)
        if path is None:
            raise BreakRules("Target cell is unreachable")
        if len(path) > process.get_unit(pos).MP:
            raise BreakRules("Not enough MP")
        actions += [Action(pos, dest, attack)]
        #moves.append(construct_turn_from_previous(prevTurn, latest_process, *[u[f] for f in fields]))
    moved = set(a.pos for a in actions)
    actions += [Action(pos, pos, NO_TARGET)
        for pos in process.player_previous_placements[player.player_number]
        if pos not in moved]
    #dbi().add_all(moves + skips)
    process.current_actions += actions
    process.turn_finished()
    return response_ok()

@Command(str)
def getGameState(name):
    game = dbi().get_game(name)
    process = GameProcess.get(game)
    if not process.turn:
        raise BadTurn("You can't request game status before everyone place their units")
    result = {
        process.get_username(player_number): {
                "units": [
                            {
                                "name": process.previous_placements[pos].unit,
                                "HP": process.previous_placements[pos].HP,
                                "X": pos[0],
                                "Y": pos[1]
                            }
                            for pos in placements
                         ]
              }
        for player_number, placements in process.player_previous_placements.items()
    }
    return response_ok(players=result, turnNumber=process.turn)

