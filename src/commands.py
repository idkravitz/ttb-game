#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import re
import json
import functools
import random
from functools import reduce

import sqlalchemy.orm.exc
from sqlalchemy import or_, desc
from sqlalchemy.orm import join

from common import *
from exceptions import *
from db import db_instance as dbi
from db import User, Map, Game, Player, Message, Faction, Unit, Army, UnitArmy, GameProcess, Turn
from db import UNIT_ATTRS, HUMAN_READABLE_TYPES
from logics import *

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

def check_len(obj, max_len, descr, cls):
    if len(obj) > max_len:
        raise cls(descr)

def check_emptiness(obj, descr, cls):
    if not len(obj):
        raise cls(descr)

def check_game_is_started(state):
    check_game_is_started_or_finished(state)
    if state == 'finished':
        raise BadGame('Game is finished')

def check_game_is_started_or_finished(state):
    if state == 'not_started':
        raise BadGame('Game is not started')

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

def split_str(text, width):
    return [list(text[i:i+width]) for i in range(0, len(text), width)]


@Command(str, str)
def register(username, password):
    if not username.replace('_', '').isalnum():
        raise BadUsername('Incorrect username')
    check_len(username, MAX_NAME_LENGTH, 'Too long username', BadUsername)
    check_emptiness(password, 'Empty password', BadPassword)
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
    if not dbi().query(Player).filter_by(game_id=game.id).count():
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
    players = [{"username": player.user.username} for player in\
        dbi().query(Player).join(Game).filter(Game.id==game.id).all()]
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
        dbi().add(GameProcess(player.game.id, 0)) # Zero turn is when players place their units on terrain
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

@Command(str, str, str, list)
def uploadArmy(sid, armyName, factionName, armyUnits):
    user = dbi().get_user(sid)
    dbi().check_faction(factionName)
    check_len(armyName, MAX_NAME_LENGTH, 'Too long army name', BadArmy)
    check_emptiness(armyName, 'Empty army name', BadArmy)
    if dbi().query(Army).filter_by(user_id=user.id, name=armyName).count():
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
        else:
            squads[unit] = count
    army = Army(armyName, user.id)
    dbi().add(army)
    dbi().add_all(UnitArmy(unit.id, army.id, count) for unit, count in squads.items())
    return response_ok()

@Command(str, str)
def getArmy(sid, armyName):
    dbi().check_sid(sid)
    army = dbi().get_army(armyName)
    return response_ok(units=[dict(name=squad.unit.name, count=squad.count) for squad in army.unitArmy])

@Command(str, str)
def deleteArmy(sid, armyName):
    user = dbi().get_user(sid)
    try:
        army = dbi().query(Army).filter_by(name=armyName, user_id=user.id).one()
    except sqlalchemy.orm.exc.NoResultFound:
       raise BadArmy('No army with that name')
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
    game = player.game
    check_game_is_started(game.state)
    land = split_str(game.map.terrain, game.map.width)
    if get_current_turn_number(game):
        raise BadTurn("Unit placing allowed only on zero turn")
    process = dbi().query(GameProcess).filter_by(game_id=game.id).one()
    store = { squad.unit.name: [squad.count, squad] for squad in player.army.unitArmy }
    placements = []
    placements = placements_from_units(units, land, store, placements, player, process)
    dbi().add_all(placements)
    if is_turn_completed(game, process):
        dbi().add(GameProcess(game.id, 1))
    return response_ok()

@Command(str, int, list)
def move(sid, turn, units):
    user = dbi().get_user(sid)
    game = dbi().get_player(user.id).game
    check_game_is_started(game.state)
    land = split_str(game.map.terrain, game.map.width)
    processes = dbi().query(GameProcess).filter_by(game_id=game.id)\
        .order_by(desc(GameProcess.turnNumber)).limit(2).all()
    latest_process = processes[0]
    if turn != latest_process.turnNumber or not turn:
        raise BadTurn("Not actual turn number")
    prev_process = processes[1]

    moves = turns_from_units(units, land, prev_process, latest_process)
    moved = set(turn.pos for turn in moves)
    skips = [ construct_turn_from_previous(t, latest_process, *(t.dest + t.dest + NO_TARGET))
        for t in prev_process.alive_units(user.id) if t.dest not in moved ]
    dbi().add_all(moves + skips)

    if is_turn_completed(game, latest_process):
        attack_phase(movement_phase(latest_process, land))

        dbi().add(GameProcess(game.id, latest_process.turnNumber + 1))
        if len(latest_process.alive_players()) <= 1:
            game.state = 'finished'
            dbi().commit()
    return response_ok()

@Command(str)
def getGameState(name):
    game = dbi().get_game(name, False)
    check_game_is_started_or_finished(game.state)
    turn_number = get_current_turn_number(game)
    if not turn_number:
        raise BadTurn("You can't request game status before everyone place their units")
    process = dbi().query(GameProcess).filter_by(turnNumber=(turn_number - 1), game_id=game.id).one()
    result = gameState_result(process)
    return response_ok(players=result, turnNumber=turn_number)

def placements_from_units(units, land, store, placements, player, process):
    for u in units:
        fields = ["name", "posX", "posY"]
        check_fields(fields, u)
        height, width = len(land), len(land[0])
        if not (0 <= u["posX"] < width and 0 <= u["posY"] < height):
            raise BadCommand("Outside the map limits")
        x, y, name = u["posX"], u["posY"], u["name"]
        if not(name in store and store[name][0]):
            raise BadUnit("No such units in army")
        cell = land[y][x]
        if cell != str(player.player_number):
            raise BreakRules("Wrong cell")
        land[y][x] = "0"
        store[name][0] -= 1
        ua = store[name][1]
        placements.append(Turn(ua.id, process.id, x, y, x, y, 0, 0, ua.unit.HP))
    return placements

def turns_from_units(units, land, prev_process, latest_process):
    fields = ["posX", "posY", "destX", "destY", "attackX", "attackY"]
    moves = []
    for u in units:
        check_fields(fields, u)
        try:
            prevTurn = dbi().query(Turn)\
                .filter_by(gameProcess_id=prev_process.id, destX=u["posX"], destY=u["posY"])\
                .filter(Turn.HP!=0)\
                .one()
        except sqlalchemy.orm.exc.NoResultFound:
            raise BreakRules('No unit in that cell')
        if ((u["attackX"], u["attackY"]) != NO_TARGET and
            not dbi().query(Turn).filter_by(gameProcess_id=prev_process.id, destX=u["attackX"], destY=u["attackY"])
            .filter(Turn.HP!=0).count()
        ):
            raise BreakRules("Can't attack dummy target")
        path = find_shortest_path(land, (u["posX"], u["posY"]), (u["destX"], u["destY"]))
        if path is None:
            raise BreakRules("Target cell is unreachable")
        if len(list(path)) > prevTurn.unitArmy.unit.MP:
            raise BreakRules("Not enough MP")
        moves.append(construct_turn_from_previous(prevTurn, latest_process, *[u[f] for f in fields]))
    return moves

def gameState_result(process):
    result = {
        name: {
                "units": [
                            {
                                "name": turn.unitArmy.unit.name,
                                "HP": turn.HP,
                                "X": turn.destX,
                                "Y": turn.destY
                            }
                            for turn in process.alive_units(id)
                         ]
              }
        for id, name in process.alive_players()
    }
    return result
