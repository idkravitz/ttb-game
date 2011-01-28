// Visual part -- handlers for buttons:
//  * Start AI
//  * Stop AI

function startAI()
{
  if(!$('#start-ai').button('option', 'disabled'))
  {
    AIs = {
      'RandomAI': RandomAI,
      'NearestAI': RunToNearestAI,
      'SmartChoose': IntelligentEnemyChooseAI,
      'SmartOnArea': SmartWithRandomAreaAI
    };
    $('#start-ai').hide();
    $('#stop-ai').show().button('enable');
    AIclass = AIs[$('#choose-ai').val()];
    AI = new AIclass(player);
    AI.start();
  }
  return false;
}

function stopAI()
{
  if(!$('#stop-ai').button('option', 'disabled'))
  {
    $('#stop-ai').hide();
    $('#start-ai').show().button('enable');
    AI.stop();
  }
  return false;
}

// AI classes:

function continueAI(AI)
{
  return function() { AI.start(); }
}

RandomAI = $.inherit(
{
  __constructor: function(player)
  {
    this.player = player;
    this.grid = this.player.grid;
    this.break_cycle = false;
  },

  start: function()
  {
    if(this.player.status != PLAYER_STATUS_NORMAL || this.break_cycle)
    {
        stopAI();
        return;
    }
    var json = this.player.json;
    var our_units = json.players[sessionStorage.username].units;
    $(our_units).each(function(i, unit)
    {
      if(!AI.break_cycle)
      {
        var move = AI.move(unit);
        AI.attack(unit, move);
      }
    });
    if(this.break_cycle)
      return;
    if($('#auto-turn').is(':checked'))
    {
      this.player.endTurn(continueAI(this));
    }
    else
    {
        stopAI();
    }
  },

  stop: function()
  {
    this.break_cycle = true;
  },

  move: function(unit)
  {
    var possible = this._deikstra(unit.X, unit.Y, units_info[unit.name].MP);
    var L = this.grid.length;
    var l = this.grid[0].length;
    cells = [];
    $(possible).each(function(i, v)
    {
      if(v != Number.POSITIVE_INFINITY)
        cells.push(i);
    });
    var cell = cells[Math.floor(Math.random() * cells.length)]; // choose random cell to move to
    cell = this.from_linear(cell);
    this.player.move([unit.X, unit.Y], cell);
    return cell;
  },

  get_enemies_units: function()
  {
    var enemies_units = [];
    $.each(this.player.json.players, function(player, pval)
    {
      if(player != sessionStorage.username)
        $.each(pval.units, function(i, unit)
        {
          enemies_units.push(unit);
        });
    });
    return enemies_units
  },

  get_nearest_enemy: function(pos)
  {
    var enemies_units = this.get_enemies_units();
    var minDistance = Number.POSITIVE_INFINITY;
    var min_i = 0;
    for(var i = 0; i < enemies_units.length; ++i)
    {
      var enemy = enemies_units[i];
      var distance = squaredDistance(pos, [enemy.X, enemy.Y]);
      if(distance < minDistance)
      {
        minDistance = distance;
        min_i = i;
      }
    }
    return enemies_units[min_i];
  },

  attack: function(unit, pos)
  {
    var enemy = this.get_nearest_enemy(pos);
    this.player.attack([unit.X, unit.Y], [enemy.X, enemy.Y]);
  },

  to_linear: function(pos)
  {
    return pos[1] * this.grid[0].length + pos[0];
  },

  from_linear: function(i)
  {
    var l = this.grid[0].length;
    return [i % l, Math.floor(i / l)];
  },

  _deikstra: function(x, y, mp)
  {
    var l = this.grid[0].length;
    var L = this.grid.length;

    var linear_index = function(i)
    {
      var pos = AI.from_linear(i);
      return this.grid[pos[1]][pos[0]];
    };

    var a = this.to_linear([x, y]);
    var d = [], U = [];
    
    var n = L * l;
    var occupied_count = 0;
    for(var i = 0; i < n; ++i)
    {
      d.push(i == a ? 0: Number.POSITIVE_INFINITY);
      U.push(linear_index(i) == 'x');
      if(U[U.length - 1])
        occupied_count++;
    }
    while(occupied_count < n)
    {
      var minval = Number.POSITIVE_INFINITY;
      var v = 0;
      for(var i = 0; i < n; ++i)
      {
        if(d[i] < minval && !U[i])
        {
          minval = d[i];
          v = i;
        }
      }
      if(minval == mp || minval == Number.POSITIVE_INFINITY)
          break;
      U[v] = true;
      occupied_count++;
      var directions = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      $(directions).each(function(i, dir)
      {
        var pos = AI.from_linear(v);
        pos[0] += dir[0];
        pos[1] += dir[1];
        if((pos[0] >= 0) && (pos[0] < l) && (pos[1] >= 0) && (pos[1] < L) && (!AI.grid[pos[1]][pos[0]]))
        {
          var u = AI.to_linear(pos);
          if(d[u] > d[v] + 1)
            d[u] = d[v] + 1;
        }
      });
    }
    return d;
  }
});

function squaredDistance(from, to)
{
  return Math.pow(from[0] - to[0], 2) + Math.pow(from[1] - to[1], 2);
}

RunToNearestAI = $.inherit(RandomAI,
{
  move: function(unit)
  {
    var enemy = this.get_nearest_enemy([unit.X, unit.Y]);
    var path = AStar(this.grid, [unit.X, unit.Y], [enemy.X, enemy.Y]);
    var index = Math.min(path.length - 1, units_info[unit.name].MP);
    this.target_enemy = [enemy.X, enemy.Y];
    this.player.move([unit.X, unit.Y], path[index]);
    return path[index];
  },
  attack: function(unit, pos)
  {
    this.player.attack([unit.X, unit.Y], this.target_enemy);
  }
});

// Its a P(X - Y < x - y) discrete values
// where X is 3d6 generated addition to enemy defence
// and Y also is 3d6 generated addition to our attack,
// X and Y are independent
const DA_Probability = [4249/7776, 9905/15552, 11207/15552, 9263/11664, 9977/11664,
  42155/46656, 541/576, 833/864, 847/864, 7699/7776, 7741/7776, 3881/3888,
  11657/11664, 46649/46656, 46655/46656, 1, 1/46656, 7/46656, 7/11664, 7/3888,
  35/7776, 77/7776, 17/864, 31/864, 35/576, 4501/46656, 1687/11664, 2401/11664,
  4345/15552, 5647/15552, 3527/7776];
const MAX_VALUE_3d6 = 18;

IntelligentEnemyChooseAI = $.inherit(RunToNearestAI,
{
  get_strike_chance: function(unit, enemy)
  {
    var attack = units_info[unit.name].attack;
    var defence = units_info[enemy.name].defence;
    var x = defence - attack;
    if(x < -15)
      return 1;
    if(x > 15)
      return 0;
    var index = x < 0 ? DA_Probability.length + x: x;
    return 1 - DA_Probability[index];
  },
  get_maximum_damage: function(unit, enemy)
  {
    var damage = units_info[unit.name].damage + MAX_VALUE_3d6;
    var protection = units_info[enemy.name].protection;
    damage -= protection;
    return damage > 0 ? damage: 0;
  },
  get_enemy_value: function(unit, enemy)
  {
    var maximum_damage = this.get_maximum_damage(unit, enemy);
    var strike_chance = this.get_strike_chance(unit, enemy);
    var distance = squaredDistance([unit.X, unit.Y], [enemy.X, enemy.Y]);
    return maximum_damage * strike_chance * (1 / (1 + Math.sqrt(distance) / units_info[unit.name].MP));
  },
  choose_valuable_enemy: function(unit)
  {
    var enemies_units = this.get_enemies_units();
    var min_value = Number.POSITIVE_INFINITY;
    var min_i = 0;
    for(var i = 0; i < enemies_units.length; ++i)
    {
      var enemy = enemies_units[i];
      var value = this.get_enemy_value(unit, enemy);
      if(value < min_value)
      {
        min_value = value;
        min_i = i;
      }
    }
    var enemy = enemies_units[min_i];
    this.target_enemy = [enemy.X, enemy.Y];
  },
  move: function(unit)
  {
    this.choose_valuable_enemy(unit);
    var enemy = this.target_enemy
    var path = AStar(this.grid, [unit.X, unit.Y], enemy);
    var index = Math.min(path.length - 1, units_info[unit.name].MP);
    this.player.move([unit.X, unit.Y], path[index]);
    return path[index];
  }
});

SmartWithRandomAreaAI = $.inherit(IntelligentEnemyChooseAI,
{
  move: function(unit)
  {
    this.choose_valuable_enemy(unit);
    var enemy = this.target_enemy;
    var area = this._deikstra(enemy[0], enemy[1], units_info[unit.name].range);
    cells = [];
    $(area).each(function(i, v)
    {
      if(v != Number.POSITIVE_INFINITY)
        cells.push(i);
    });
    var blocked = true;
    var cell, path;
    while(blocked)
    {
      cell = cells[Math.floor(Math.random() * cells.length)]; // choose random cell to move to
      cell = this.from_linear(cell);
      path = AStar(this.grid, [unit.X, unit.Y], cell);
      blocked = !path.length && !(unit.X == cell[0] && unit.Y == cell[1]);
    }
    var index = Math.min(path.length - 1, units_info[unit.name].MP);
    this.player.move([unit.X, unit.Y], path[index]);
    return path[index];
  }
});
