{
    "cmd": "register", 
    "password": "1", 
    "username": "user_1"
}
{
    "cmd": "register", 
    "password": "b", 
    "username": "user_2"
}
{
    "cmd": "uploadFaction",
    "sid": "user_2b",
    "factionName": "goblins",
    "units": [
        {
            "name": "direwolf_rider",
            "cost": 41,
            "HP":61,
            "MP":10,
            "damage":4,
            "range":1,
            "attack":4,
            "protection":3,
            "defence":3,
            "initiative":10
        },
        {
            "name": "impaler",
            "cost": 13,
            "HP": 26,
            "MP": 5,
            "range": 1,
            "damage": 8,
            "attack": 8,
            "protection": 2,
            "initiative": 4,
            "defence": 2
        }
   ]
}
{
    "armyName": "my", 
    "armyUnits": [
        {
            "count": 1, 
            "name": "direwolf_rider"
        }, 
        {
            "count": 1, 
            "name": "impaler"
        }
    ], 
    "cmd": "uploadArmy", 
    "factionName": "goblins", 
    "sid": "user_2b"
}
{
    "armyName": "my", 
    "armyUnits": [
        {
            "count": 1, 
            "name": "direwolf_rider"
        }, 
        {
            "count": 1, 
            "name": "impaler"
        }
    ], 
    "cmd": "uploadArmy", 
    "factionName": "goblins", 
    "sid": "user_11"
}
{
    "cmd": "uploadMap",
    "sid": "user_11",
    "name": "small",
    "terrain": [
"11111",
".x1x.",
"..x..",
".x2x.",
"22222"
    ]
}
{
    "cmd": "createGame", 
    "factionName": "goblins", 
    "gameName": "my", 
    "mapName": "small", 
    "playersCount": 2, 
    "sid": "user_11", 
    "totalCost": 100
}
{
    "armyName": "my", 
    "cmd": "chooseArmy", 
    "sid": "user_11"
}
{
    "cmd": "setPlayerStatus", 
    "sid": "user_11", 
    "status": "ready"
}
{
    "cmd": "joinGame", 
    "gameName": "my", 
    "sid": "user_2b"
}
{
    "armyName": "my", 
    "cmd": "chooseArmy", 
    "sid": "user_2b"
}
{
    "cmd": "setPlayerStatus", 
    "sid": "user_2b", 
    "status": "ready"
}
{
    "cmd": "placeUnits", 
    "sid": "user_2b", 
    "units": [
        {
            "name": "direwolf_rider", 
            "posX": 1, 
            "posY": 4
        }, 
        {
            "name": "impaler", 
            "posX": 3, 
            "posY": 4
        }
    ]
}
{
    "cmd": "getGameState", 
    "name": "my"
}
{
    "cmd": "placeUnits", 
    "sid": "user_11", 
    "units": [
        {
            "name": "impaler", 
            "posX": 1, 
            "posY": 0
        }, 
        {
            "name": "direwolf_rider", 
            "posX": 3, 
            "posY": 0
        }
    ]
}
{
    "cmd": "getGameState", 
    "name": "my"
}
{
    "cmd": "move", 
    "sid": "user_11", 
    "turn": 1, 
    "units": [
        {
            "attackX": -1, 
            "attackY": -1, 
            "destX": 2, 
            "destY": 1, 
            "posX": 1, 
            "posY": 0
        }, 
        {
            "attackX": -1, 
            "attackY": -1, 
            "destX": 2, 
            "destY": 1, 
            "posX": 3, 
            "posY": 0
        }
    ]
}
{
    "cmd": "getGameState", 
    "name": "my"
}
{
    "cmd": "move", 
    "sid": "user_2b", 
    "turn": 1, 
    "units": [
        {
            "attackX": -1, 
            "attackY": -1, 
            "destX": 2, 
            "destY": 3, 
            "posX": 1, 
            "posY": 4
        }, 
        {
            "attackX": -1, 
            "attackY": -1, 
            "destX": 2, 
            "destY": 3, 
            "posX": 3, 
            "posY": 4
        }
    ]
}
{
    "cmd": "getGameState", 
    "name": "my"
}
