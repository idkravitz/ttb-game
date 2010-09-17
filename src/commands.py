#!/usr/bin/python3
# -*- coding: utf-8 -*-

def command(f):
    f.command = True
    return f

@command
def register(name):
    return ""

def printError():
    return "Error"

def ProcessRequest(request):
    if 'cmd' not in request.keys():
        raise Exception
    cmd = request.pop('cmd')
    if not hasattr(globals()[cmd], 'command'):
        raise Exception
    return globals()[cmd](**request)

