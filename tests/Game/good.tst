{
    "cmd": "register",
    "username": "test",
    "password": "test"
}
{
    "cmd": "register",
    "username": "first",
    "password": "second"
}
{
    "cmd": "uploadMap",
    "sid": "testtest",
    "name": "de_dust",
    "terrain": ["1..", ".x.", "..2"]
}

{
    "cmd": "uploadFaction",
    "sid": "testtest",
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
    "sid": "testtest",
    "gameName": "chess",
    "mapName": "de_dust",
    "factionName": "People",
    "totalCost": 300,
    "playersCount": 2
}
{
    "cmd": "getGamesList",
    "sid": "testtest"
}
{
    "cmd": "joinGame",
    "gameName": "chess",
    "sid": "firstsecond"
}
{
    "cmd": "leaveGame",
    "gameName": "chess",
    "sid": "testtest"
}
