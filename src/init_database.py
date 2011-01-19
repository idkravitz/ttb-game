#!/usr/bin/env python3
import os
import glob
import json

import settings
import common
from utils.path import join

common.COMMANDLINE = True

import commands as com

if __name__ == '__main__':
    com.clear()

    sid = com.register('admin', 'maintance')['sid']
    print('Log in as administrator, sid: {0}'. format(sid))

    maps_dir = join('data/maps')
    units_dir = join('data/units')

    factions = {}
    for dirpath, dirnames, filenames in os.walk(units_dir):
        faction = os.path.basename(dirpath)
        if faction not in factions:
            factions[faction] = []
        filenames = [os.path.join(dirpath, f)
                     for f in filenames if os.path.splitext(f)[1] == '.cfg']
        for unit_file in filenames:
            with open(unit_file, "r") as file:
                unit = json.loads(file.read())
                unit_name = os.path.splitext(os.path.basename(unit_file))[0]
                print(unit_name)
                unit['name'] = unit_name
                factions[faction].append(unit)

    for faction, units in factions.items():
        if len(units):
            print('Adding faction {0}, with {1} units'.format(faction, len(units)))
            com.uploadFaction(sid, factionName=faction, units=units)

    for dirpath, dirnames, filenames in os.walk(maps_dir):
        filenames = [os.path.join(dirpath, f)
                     for f in filenames if os.path.splitext(f)[1] == '.map']
        for map_file in filenames:
            with open(map_file, "r") as file:
                lines = [line.replace(" ","").rstrip() for line in file.readlines()]
                name = os.path.splitext(os.path.basename(map_file))[0]
                print('Adding map {0}[{1}x{2}]'.format(name, len(lines), len(lines[0])))
                com.uploadMap(sid, name=name, terrain=lines)                     
        
    print('Log out, sid: {0}'.format(sid))
    com.unregister(sid)
