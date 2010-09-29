{
    "cmd": "register",
    "username": "red",
    "password": "horse"
}

{
    "cmd": "uploadMap",
    "sid": "redhorse",
    "name": "de_dust",
    "terrain": ["1..", ".x.", "..2"]
}

{
    "cmd": "uploadFaction",
    "sid": "redhorse",
    "factionName": "People",
    "units": [
        {
            "name": "first", 
            "HP": 1,
            "MP": 1,
            "defence": 1,
            "attack": 1,
            "range": 1,
            "damage": 1,
            "cost": 1
        }
    ]
}

{
    "cmd": "createGame",
    "sid": "redhorse",
    "playersCount": 2,
    "mapName": "de_dust",
    "factionName": "People",
    "totalCost": 100,
    "gameName": "catdog"
}

{
    "cmd": "joinGame",
    "sid": "redhorse",
    "gameName": "catdog"
}
