// Visual part -- handlers for buttons:
//  * Start AI
//  * Stop AI

function startAI()
{
  $(this).hide();
  $('#stop-ai').show().button('enable');
  AI = new RandomAI(player);
  AI.start();
  return false;
}

function stopAI()
{
  $(this).hide();
  $('#start-ai').show().button('enable');
  AI.stop();
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
    var AI = this;
    $(our_units).each(function(i, unit)
    {
      if(!AI.break_cycle)
      {
        var move = AI._random_move(unit);
        AI._nearest_attack(unit, move);
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

  _random_move: function(unit)
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

  _nearest_attack: function(unit, pos)
  {
    var players = this.player.json.players;
    var enemies_units = [];
    $.each(players, function(player, pval)
    {
      if(player != sessionStorage.username)
        $.each(pval.units, function(i, unit)
        {
          enemies_units.push(unit);
        });
    });
    var attackX = -1, attackY = -1;
    var minDistance = Number.POSITIVE_INFINITY;
    for(var i = 0; i < enemies_units.length; ++i)
    {
      var enemy = enemies_units[i];
      var distance = squaredDistance(pos, [enemy.X, enemy.Y]);
      if(distance < minDistance)
      {
        minDistance = distance;
        attackX = enemy.X;
        attackY = enemy.Y;
      }
    }
    this.player.attack([unit.X, unit.Y], [attackX, attackY]);
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
    var AI = this;
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
