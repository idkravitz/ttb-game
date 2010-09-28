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

class command(object):
    def __init__(self, *args):
        self.types = args

    def __call__(self, f):
        f.iscommand = True
        argspec = inspect.getargspec(f)
        @functools.wraps(f)
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
                for t, name in zip(self.types, argspec.args):
                    if not isinstance(kwargs[name], t):
                        raise BadCommand("Field '{0}' must have type '{1}'"\
                            .format(name, t.__name__))
            return f(**kwargs)
        return wraps

def debug_only(function):
    if not DEBUG:
        raise BadCommand('Command allowed only in test mode')
    return function

def response_ok(**kwargs):
    kwargs.update({'status': 'ok'})
    return json.dumps(kwargs, **JSON_DUMPS_FORMAT)

def check_len(obj, max_len, descr):
    if len(obj) > max_len:
        raise BadCommand(descr)

def check_emptiness(obj, descr):
    if not len(obj):
        raise BadCommand(descr)

@command(str, str)
def register(username, password):
    if not username.replace('_', '').isalnum():
        raise BadCommand('Incorrect username')
    check_len(username, MAX_USERNAME_LENGTH, 'Too long username')
    check_emptiness(password, 'Empty password')
    try:
        user = dbi().query(User).filter(User.username==username).one()
        if user.password != password:
            raise BadPassword('User already exists, but passwords don\'t match')
    except sqlalchemy.orm.exc.NoResultFound:
        user = User(username, password)
        dbi().add(user)
    return response_ok(sid=user.sid)

@command(str)
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
        leaveGame(sid, dbi().query(Game).filter(Game.id == player.game_id).one().name)
    return response_ok()

@debug_only
@command()
def clear():
    dbi().clear()
    return response_ok()

@command(str, str, int)
def createGame(sid, gameName, playersCount): # check the validity of symbols
    user = dbi().get_user(sid)
    if playersCount < 2:
        raise BadCommand('Number of players must be 2 or more')
    if playersCount > MAX_PLAYERS:
        raise BadCommand('Too many players')
    check_len(gameName, MAX_GAMENAME_LENGTH, 'Too long game name')
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

@command(str, str)
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
    player = Player(user_id, game.id)
    dbi().add(player)
    return response_ok()

@command(str, str)
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
    dbi().session.commit()
    return response_ok()

@command(str, str, str)
def sendMessage(sid, text, gameName):
    user_id = dbi().get_user(sid).id
    game_id = dbi().get_game(gameName).id
    check_len(text, MAX_MESSAGE_LENGTH, 'Too long message')
    if not get_player(user_id, game_id):
        raise BadCommand('User is not in this game')
    message = Message(user_id, game_id, text)
    dbi().add(message)
    return response_ok()

@command(str, str)
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

@command(str)
def getGamesList(sid):
    user = dbi().get_user(sid)
    games = [{"gameName": name} for name in dbi().query(Game.name).all()]
    return response_ok(games=games)

@command(str)
def getPlayersList(sid):
    user = dbi().get_user(sid)
    players = [{"username": name} for name in dbi().query(User.username).all()]
    return response_ok(players=players)

@command(str, str)
def getPlayersListForGame(sid, gameName):
    user = dbi().get_user(sid)
    game = dbi().get_game(gameName)
    players = [{"username": player.user.username} for player in \
        dbi().query(Player).join(Game).filter(Game.id==game.id).all()]
    return response_ok(players=players)

@command(str, str)
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
    dbi().session.commit()
    return response_ok()

def process_request(request):
    if 'cmd' not in request:
        raise BadRequest('Field \'cmd\' required')
    command = globals().get(request.pop('cmd'))
    if not hasattr(command, 'iscommand'):
        raise BadCommand('Unknown command')
    return command(**request)
