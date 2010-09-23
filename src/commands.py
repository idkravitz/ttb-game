#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import re
import json
import sqlalchemy.orm.exc
from common import *
from exceptions import *
from db import db_instance as dbi, User, Game, Player, Message


def command(function):
    function.iscommand = True
    return function

def debug_only(function):
    if not DEBUG:
        raise BadCommand('Command allowed only in test mode')
    return function

def response_ok(**kwargs):
    kwargs.update({'status': 'ok'})
    return json.dumps(kwargs, **JSON_DUMPS_FORMAT)

def checkLen(obj, max_len, descr):
    if len(obj) > max_len:
        raise BadCommand(descr)

def checkEmptiness(obj, descr):
    if not len(obj):
        raise BadCommand(descr)

@command
def register(username, password):
    if not username.replace('_', '').isalnum():
        raise BadCommand('Incorrect username')
    checkLen(username, MAX_USERNAME_LENGTH, 'Too long username')
    checkEmptiness(password,'Empty password')
    try:
        user = dbi().query(User).filter(User.username==username).one()
        if user.password != password:
            raise BadPassword('User already exists, but passwords don\'t match')
    except sqlalchemy.orm.exc.NoResultFound:
        user = User(username, password)
        dbi().add(user)
    return response_ok(sid=user.sid)

@command
def unregister(sid):
    dbi().delete(dbi().get_user(sid))
    return response_ok()

@debug_only
@command
def clear():
    dbi().clear()
    return response_ok()

@command
def createGame(sid, gameName, maxPlayers): # check the validity of symbols
    user = dbi().get_user(sid)
    if maxPlayers < 2:
        raise BadCommand('Number of players must be 2 or higher')
    if maxPlayers > MAX_PLAYERS:
        raise BadCommand("Too many players")
    checkLen(gameName, MAX_GAMENAME_LENGTH, 'Too long game name')
    checkEmptiness(gameName,'Empty game name')
    if dbi().query(Player).filter(Player.user_id == user.id)\
        .filter(Player.is_creator == True)\
        .filter(Game.state != 'finished').count():
        raise AlreadyInGame('User already in game')
    if dbi().query(Game).filter(Game.name==gameName).filter(Game.state!='finished').count():
        raise AlreadyExists('Game with the same name already exists')
    game = Game(gameName, maxPlayers)
    dbi().add(game)
    player = Player(user.id, game.id)
    player.is_creator=True
    dbi().add(player)
    return response_ok()

@command
def joinGame(sid, gameName):
    user = dbi().get_user(sid)
    game = dbi().get_game(gameName)
    if dbi().query(Player).join(Game).filter(Game.id==game.id).count() == game.max_players:
        raise BadGame('Game is full')
    if game.state == 'started':
        raise BadGame('Game already started')
    if game.state == 'finished':
        raise BadGame('Game has been finished')
    player = Player(user.id, game.id)
    dbi().add(player)
    return response_ok()

@command
def leaveGame(sid, gameName):
    user = dbi().get_user(sid)
    game = dbi().get_game(gameName)
    try:
        player = dbi().query(Player)\
            .filter(Player.game_id==game.id)\
            .filter(Player.user_id==user.id)\
            .one()
    except NoResultFound:
        raise BadGame('User is not playing')
    dbi().delete(player)
    if not dbi().query(Player).filter(Player.game_id==game.id).count():
        game.state = 'finished'
    dbi().session.commit()
    return response_ok()

@command
def sendMessage(sid, text, gameName):
    user = dbi().get_user(sid)
    game = dbi().get_game(gameName)
    checkLen(text, MAX_MESSAGE_LENGTH, 'Too long message')
    if not dbi().query(Player)\
        .filter(Player.game_id==game.id)\
        .filter(Player.user_id==user.id)\
        .count():
        raise BadCommand('User is not in this game')
    message = Message(user.id, game.id, text)
    dbi().add(message)
    return response_ok()

@command
def getChatHistory(sid, gameName):
    user = dbi().get_user(sid)
    game = dbi().get_game(gameName)
    chat = [ {"username": msg.user.username, "message": msg.text, "time": str(msg.dateSent)}
        for msg in game.messages]
    return response_ok(chat=chat)

@command
def getGamesList(sid):
    user = dbi().get_user(sid)
    games = [ {"gameName": name} for name in dbi().query(Game.name).all()]
    return response_ok(games=games)

@command
def getPlayersList(sid):
    user = dbi().get_user(sid)
    players = [ {"username": name} for name in dbi().query(User.username).all()]
    return response_ok(players=players)

@command
def getPlayersListForGame(sid, gameName):
    user = dbi().get_user(sid)
    game = dbi().get_game(gameName)
    players = [{"username": player.user.username} for player in \
        dbi().query(Player).join(Game).filter(Game.id==game.id).all()]
    return response_ok(players=players)

@command
def setPlayerStatus(sid, status):
    user = dbi().get_user(sid)
    if status not in ('ready', 'not_ready'):
        raise BadCommand('The status can be only \'ready\'/\'not_ready\'')
    try:
        player = dbi().query(Player)\
            .filter(Player.user_id==user.id)\
            .filter(Player.playerState=='in_lobby')\
            .one()
    except NoResultFound:
        raise BadCommand('User is not in lobby')
    player.playerState = status
    return response_ok()

def process_request(request):
    if 'cmd' not in request:
        raise BadRequest('Field \'cmd\' required')
    command = globals().get(request.pop('cmd'))
    if not hasattr(command, 'iscommand'):
        raise BadCommand('Unknown command')
    try:
        return command(**request)
    except TypeError as ex:
        message = ex.args[0]
        pattern = '''
            \w+\(\)\stakes\sexactly\s(\d+)\s
            non-keyword\spositional\sarguments\s
            \((\d+)\sgiven\)
        '''
        match = re.match(pattern, message, re.VERBOSE)
        if match:
            expected, given = map(int, match.groups())
            if expected > given:
                raise BadCommand('Not enough fields')
            else:
                raise BadCommand('Too many fields')
        field = message.split()[-1]
        raise BadCommand('Unknown field {0}'.format(field))
