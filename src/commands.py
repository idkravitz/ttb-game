#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import re
import json
import common
from common import JSON_DUMPS_FORMAT
from exceptions import *
from db import db_instance as dbi, User, Game, Player, Message
from sqlalchemy.orm.exc import NoResultFound 
from datetime import datetime

MAX_USERNAME_LENGTH = 15
MAX_GAMENAME_LENGTH = 20
MAX_MESSAGE_LENGTH = 140

def command(function):
    function.iscommand = True
    return function

def testmode_only(function):
    if not common.DEBUG:
        raise BadCommand("Command allowed only in test mode")
    return function
    
def response_ok(**kwargs):
    kwargs.update({'status': 'ok'})
    return json.dumps(kwargs, **JSON_DUMPS_FORMAT)
    
def checkLen(obj, lengthConst, descr):
    if len(obj) > lengthConst:
        raise BadCommand(descr)   

@command
def register(username, password):
    if not username.replace('_', '').isalnum():
        raise BadCommand('Incorrect username')
    checkLen(username, MAX_USERNAME_LENGTH, 'Too long username')  
    if not len(password):
        raise BadCommand('Empty password')
    try:
        user = dbi().query(User).filter_by(username=username).one()
        if user.password != password:
            raise BadPassword('User already exists, but passwords don\'t match')
    except NoResultFound:
        user = User(username, password)
        dbi().add(user)
    return response_ok(sid=user.sid)

@command
def unregister(sid):
    dbi().delete(dbi().get_user(sid))
    return response_ok()

@testmode_only
@command
def clear():
    dbi().clear()
    return response_ok()
    
@command
def createGame(sid, gameName, maxPlayers): # check the validity of symbols
    user = dbi().get_user(sid)
    checkLen(gameName, MAX_GAMENAME_LENGTH, 'Too long game name')    
    if not len(gameName):
        raise BadCommand('Empty game name')
    if dbi().query(Player).filter(Player.user_id == user.id)\
        .filter(Player.is_creator == True)\
        .filter(Game.gameState != 'finished').count():
        raise BadCommand('User already created game')
    if dbi().query(Game).filter(Game.name==gameName).filter(Game.gameState!='finished').count():
        raise AlreadyExists('Game with the same name already exists')
    game = Game(gameName, maxPlayers, datetime.utcnow())
    dbi().add(game)
    player = Player(user, game)
    player.is_creator=True
    dbi().add(player)
    return response_ok()  
    
@command
def joinGame(sid, gameName):
    user = dbi().get_user(sid)
    game = dbi().get_game(gameName)
    if dbi().query(Player).join(Game).filter(Game.id==game.id).count() == game.max_players:
        raise BadGame('Game is full')
    if game.gameState == 'in_process':
        raise BadGame('Game is in process')
    if game.gameState == 'finished':
        raise BadGame('Game have been finished')
    player = Player(user, game)
    dbi().add(player)
    return response_ok()
    
@command
def leaveGame(sid, gameName):
    user = dbi().get_user(sid)
    game = dbi().get_game(gameName) 
    try:
        player = dbi().query(Player).filter(Player.game_id==game.id).filter(Player.user_id==user.id).one()
    except NoResultFound:
        raise BadGame('Cannot leave the game')
    dbi().delete(player)
    return response_ok()             
    
@command
def sendMessage(sid, text, gameName):
    user = dbi().get_user(sid)
    game = dbi().get_game(gameName) 
    checkLen(text, MAX_MESSAGE_LENGTH, 'Too long message')    
    if not dbi().query(Player).filter(Player.game_id==game.id).filter(Player.user_id==user.id).count():
        raise BadCommand('User is not a player for this game')
    message = Message(user, game, text)    
    dbi().add(message)    
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
