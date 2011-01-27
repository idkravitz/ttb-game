// Visual part -- handlers for buttons:
//  * Start AI
//  * Stop AI

function startAI()
{
  if(!$(this).button('option', 'disabled'))
  {
    AIs = {
      'RandomAI': RandomAI,
      'NearestAI': RunToNearestAI
    };
    $(this).hide();
    $('#stop-ai').show().button('enable');
    AIclass = AIs[$('#choose-ai').val()];
    AI = new AIclass(player);
    AI.start();
  }
  return false;
}

function stopAI()
{
  if(!$(this).button('option', 'disabled'))
  {
    $(this).hide();
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
      return;
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
