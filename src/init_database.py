#!/usr/bin/env python3
import settings
import common
common.COMMANDLINE = True
import commands as com

com.clear()

sid = com.register('admin', 'maintance')['sid']
print("Log in as administrator, sid: {0}". format(sid))
maps = {
    'x_2': """
        11111
        .x1x.
        ..x..
        .x2x.
        22222
        """,
    'simple_2': """
        111
        ...
        222
        """
}
for name, terrain in maps.items():
    terrain = [y for y in (x.strip() for x in terrain.splitlines()) if len(y)]
    print("Add map: " + name)
    com.uploadMap(sid, name, terrain)
factions = {
    "factionName": "Headcrabs",
    "units": [
        {
            "name": "regular",
            "HP": 5,
            "MP": 2,
            "defence": 2,
            "attack": 3,
            "range": 2,
            "damage": 2,
            "protection": 1,
            "initiative": 1,
            "cost": 1
        },
        {
            "name": "speedy",
            "HP": 4,
            "MP": 4,
            "defence": 1,
            "attack": 2,
            "range": 2,
            "damage": 1,
            "protection": 1,
            "initiative": 1,
            "cost": 2
        },
        {
            "name": "poisoned",
            "HP": 6,
            "MP": 2,
            "defence": 1,
            "attack": 4,
            "range": 2,
            "damage": 3,
            "protection": 1,
            "initiative": 2,
            "cost": 3
        }
    ]
}
com.uploadFaction(sid, **factions)
print("Add faction:" + factions['factionName'])

print("Log out, sid {0}".format(sid))
com.unregister(sid)
