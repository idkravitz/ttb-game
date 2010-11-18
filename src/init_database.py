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
        """,
    'big': """
        1111.....xx.........
        1111......x.........
        1111...x............
        1111.xx...x...x.....
        ............x.......
        xxxx...xxxxxxxx.....
        ...x.......x...33333
        ...x...........33333
        ...............33333
        ..x............33333
        ......x.x..x...33333
        ....................
        ...x................
        ....xxx....xxx......
        ....................
        .........x..x...xx..
        2222.........xx.....
        2222.........xx.....
        2222.........xx.....
        2222................
        """
}
for name, terrain in maps.items():
    terrain = [y for y in (x.strip() for x in terrain.splitlines()) if len(y)]
    print("Add map: " + name)
    com.uploadMap(sid, name, terrain)
factions = [{
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
},
{
    "factionName": "Zombies",
    "units": [
        {
            "name": "raaarghh",
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
            "name": "yabaaaa",
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
            "name": "myicing!!",
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
}]
for faction in factions:
    com.uploadFaction(sid, **faction)
    print("Add faction:" + faction['factionName'])

print("Log out, sid {0}".format(sid))
com.unregister(sid)

