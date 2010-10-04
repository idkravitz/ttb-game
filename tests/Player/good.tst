{
    "cmd": "register",
    "username": "Gordon",
    "password": "Freeman"
}

{
    "cmd": "register",
    "username": "headcrab",
    "password": "arrgh"
}

{
    "cmd": "uploadMap",
    "sid": "GordonFreeman",
    "name": "de_dust",
    "terrain": ["1..", ".x.", "..2"]
}

{
    "cmd": "uploadFaction",
    "sid": "GordonFreeman",
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
            "protection": 1,
            "initiative": 1,
            "cost": 1
        }
    ]
}

{
    "cmd": "createGame",
    "sid": "GordonFreeman",
    "gameName": "Half-life",
    "mapName": "de_dust",
    "factionName": "People",
    "totalCost": 100,
    "playersCount": 10
}

{
    "cmd": "joinGame",
    "sid": "headcrabarrgh",
    "gameName": "Half-life"
}

{
    "cmd": "getPlayersList",
    "sid": "GordonFreeman"
}

{
    "cmd": "getPlayersListForGame",
    "sid": "GordonFreeman",
    "gameName": "Half-life"
}
