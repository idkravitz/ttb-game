var sections; // descriptions of toplevel sections (which behave like pages)
window.onhashchange = innerShowSection;

function sendNonAuthorizedRequest(data, handler, error_handler)
{
  $.getJSON('/ajax', { data: JSON.stringify(data) }, function (json)
  {
    json.status == 'ok' ? handler(json) : (error_handler || alert)(json.message, json.status);
  });
}

function sendRequest(data, handler, error_handler)
{
  sendNonAuthorizedRequest($.extend(data, { sid: sessionStorage.sid }),
    handler, error_handler);
}

function showCurrentUser(prefix)
{
  $("#current-user").html(prefix + sessionStorage.username);
}

function showSection(name)
{
  if(getCurrentSectionName() == name)
  {
    innerShowSection();
    return;
  }
  window.location.hash = name;
}

function getCurrentSectionName()
{
  return window.location.hash.substr(1); // remove # symbol
}

function innerShowSection()
{
  var section = getCurrentSectionName();
  if (!section || !(section in sections))
  {
    window.location.hash = "registration";
    return;
  }
  sections[section].show();
}

function Section(name)
{
  this.name = name;
}

function inherit(child, super)
{
  child.prototype = new super;
}

Section.prototype = {
  show: function() {
    $('#content > *, #menu, #menu > li').hide();
    $('#' + this.name).show();
  }
}

function SectionWithNavigation(name)
{
  Section.call(this, name);
}

inherit(SectionWithNavigation, Section);
$.extend(SectionWithNavigation.prototype, {
  show: function() {
    Section.prototype.show.call(this);
    $('nav > p').removeClass('nav-current');
    $('#nav-' + this.name).addClass('nav-current');

    showCurrentUser('Welcome, ');

    $('#menu, #menu li[id!="leave-game"], nav, #nav-vertical-line').show();
  }
});

function ActiveGamesSection()
{
  SectionWithNavigation.call(this, 'active-games');
}

inherit(ActiveGamesSection, SectionWithNavigation);
$.extend(ActiveGamesSection.prototype, {
  show: function() {
    SectionWithNavigation.prototype.show.call(this);
    $('#active-games > *').hide();
    getGamesList();
  }
});

function CreateGameSection()
{
  SectionWithNavigation.call(this, 'create-game');
}

inherit(CreateGameSection, SectionWithNavigation);
$.extend(CreateGameSection.prototype, {
  show: function() {
    SectionWithNavigation.prototype.show.call(this);
    initCreateGame();
  }
});

function ManageArmiesSection()
{
  SectionWithNavigation.call(this, 'manage-armies');
}

inherit(ManageArmiesSection, SectionWithNavigation);
$.extend(ManageArmiesSection.prototype, {
  show: function() {
    SectionWithNavigation.prototype.show.call(this);
    initManageArmies();
  }
});

function LobbySection()
{
  Section.call(this, 'lobby');
}

inherit(LobbySection, Section);
$.extend(LobbySection.prototype, {
  show: function() {
    Section.prototype.show.call(this);
    $('#menu, #leave-game, #current-user').show();
    showCurrentUser('');
    initLobby();
  }
});

function GameSection()
{
  Section.call(this, 'game');
}
inherit(GameSection, Section);
$.extend(GameSection.prototype, {
  show: function() {
    Section.prototype.show.call(this);
    $('#end-turn-btn').hide().button('enable');
    $('#end-placing-btn').show().button('disable');
    initGame();
  }
});

function describeSections()
{
  sections = {
    'registration': new Section('registration'),
    'about': new SectionWithNavigation('about'),
    'active-games': new ActiveGamesSection,
    'create-game': new CreateGameSection,
    'manage-armies': new ManageArmiesSection,
    'lobby': new LobbySection,
    'game': new GameSection
  }
}

function initGame()
{
  $('#menu, #current-game, #leave-game').show();
  sendRequest({ cmd: 'getGamesList' }, function (json) {
    $.each(json.games, function (i, game)
    {
      if (game.gameName == sessionStorage.gameName)
      {
        sendRequest({ cmd: 'getMap', name: game.mapName },
          function (json) {
            var map = json.map;
            sendRequest(addGame({ cmd: 'getPlayerNumber'}),
              function(json) {
                startGame(map, sessionStorage.armyName, json.player_number);
              });
          });
        return;
      }
    });
  });
}

function initLobby()
{
  if(!sessionStorage.length)
  {
    showSection('registration');
  }
  else if(!inGame())
  {
    showSection('active-games');
  }

  sendRequest({ cmd: 'getGamesList' }, function (json)
  {
    var currentGame;
    $.each(json.games, function (i, game) {
      if (game.gameName == sessionStorage.gameName)
      {
        currentGame = game;
        return;
      }
    });
    sessionStorage.factionName = currentGame.factionName;

    sessionStorage.max_players = currentGame.playersCount;

    sendRequest({ cmd: 'getArmiesList' }, function (json)
    {
      var select = $('#choose-army').empty();
      enable(select);
      select.append(new Option('', 0));
      disable('#set-status');
      $.each(json.armies, function (i, army) {
        if (army.cost <= currentGame.totalCost && army.faction == currentGame.factionName)
          select.append(new Option(army.name, i + 1));
      });
    });

    sendRequest({ cmd: 'getMap', name: currentGame.mapName }, function (json)
    {
      function getCellClass(cell)
      {
        cell_classes = {
          'x': 'occupied',
          '.': 'free'
        }
        return cell_classes[cell] || 'player-' + cell;
      }

      var table = $('#map-thumbnail').empty();
      $.each(json.map, function (i, map_row) {
        var table_row = $('<tr/>');
        $.each(map_row, function (i, map_cell) {
          var cell_class = getCellClass(map_cell);
          table_row.append($('<td/>', { class: cell_class }));
        });
        table.append(table_row);
      });
    });
  });
  getLobbyState();
}

function getLobbyState()
{
  if(getCurrentSectionName() != 'lobby')
  {
    return;
  }

  var calls = 2;
  function delayedSetTimeout()
  {
    if(!--calls)
    {
      setTimeout(getLobbyState, 3000);
    }
  }

  var command = addGame({ cmd: 'getChatHistory' });
  if (sections.lobby.last_id)
  {
    $.extend(command, { since: sections.lobby.last_id });
  }
  sendRequest(command, function (json)
  {
    if (json.chat.length)
    {
      sections.lobby.last_id = json.chat[json.chat.length-1].id;
      $.each(json.chat, function(i, entry)
      {
        // example: 2010-11-18 13:06:08.071000
        var match = entry.time.match(/^[\d-]+\s(\d\d):(\d\d).*$/);
        var hours = (parseInt(match[1]) - (new Date()).getTimezoneOffset() / 60) % 24;
        var minutes = match[2];
        var time = '[' + hours + ':' + minutes + ']';
        $('#chat-window').append($('<div/>')
          .append($('<p/>', { class: 'chat-header' })
            .append(time)
            .append($('<br/>'))
            .append($('<p/>', { class: 'chat-username', text: entry.username })))
          .append($('<p/>', { class: 'chat-message', text: entry.message }))
        );
      });
    }
    delayedSetTimeout();
  });

  sendRequest(addGame({ cmd: 'getPlayersListForGame' }), function (json)
  {
    var all_ready = json.players.length == sessionStorage.max_players;

    var players_counter = $('#players h3').empty();
    players_counter.text(json.players.length + ' / ' + sessionStorage.max_players);

    var players_list = $('#players-list').empty();
    $.each(json.players, function(i, player)
    {
      var status = player.status.replace('_', '-');
      var ready = status == 'ready' || status == 'in-game';
      all_ready = all_ready && ready;
      players_list
        .append($('<tr/>')
          .append($('<td/>', { class: 'username' }).text(player.username))
          .append($('<td/>').addClass(status).addClass('status')))
    });
    if (all_ready)
    {
      sessionStorage.armyName = $('#choose-army :selected').text();
      showSection('game');
    }
    delayedSetTimeout();
  });
}

function getGamesList()
{
  if(getCurrentSectionName() != "active-games")
  {
    return;
  }
  sendRequest(
    { cmd: 'getGamesList' },
    function (json)
    {
      var table = $('#active-games table');
      var empty_message = $('#active-games #empty-server');
      if (!json.games.length)
      {
        table.hide();
        empty_message.show();
        return;
      }

      $('tr', table).not($('tr', table).first()).remove();
      $.each(json.games, function(i, game)
      {
        var row = $('<tr/>');

        var name = game.gameName;
        if (!inGame() &&
          (game.connectedPlayersCount != game.playersCount) &&
          (game.gameStatus == 'not_started'))
        {
          name = $('<a/>', {href: '#', text: name});
        }

        var players = game.connectedPlayersCount + ' / ' + game.playersCount;
        var order = [
          name,
          game.gameStatus.replace('_', ' '),
          players,
          game.mapName,
          game.factionName,
          game.totalCost
        ];
        $.each(order, function(j, value)
        {
          $(row).append(
            $('<td/>').append(value)
          );
        });
        table.append(row);
      });
      $('a', table).click(joinGame);
      empty_message.hide();
      table.show();
      setTimeout(getGamesList, 3000);
    }
  );
}

function joinGame()
{
  var gameName = $(this).text();
  sendRequest({ cmd: 'joinGame', gameName: gameName }, function (json)
  {
    sessionStorage.gameName = gameName;
    showSection('lobby');
  });
  return false;
}

function updateSelect(command, attr, id, extra_success)
{
  sendRequest({ cmd: command }, function (json) {
    var array = attr + 's';
    var select = $(id + attr);
    select.empty();
    $.each(json[array], function(i, option) {
      select.append(new Option(option[attr], i));
    });
    if(extra_success)
      extra_success(json);
  });
}

function convertToSlider(id, vmin, vmax, step)
{
  var input = $('#' + id);
  var label = input.prev();
  var prefix = label.text().split(':')[0] + ': ';
  var slider_id = id + '-slider';

  input.hide();
  input.val(vmin);
  label.text(prefix + vmin);

  $('#' + slider_id).remove();
  input.after(
    $('<div/>', { id: slider_id }).slider({
      range: 'min',
      value: vmin,
      min: vmin,
      max: vmax,
      step: step || 1,
      slide: function (event, ui) {
        input.val(parseInt(ui.value));
        label.text(prefix + ui.value);
      }
    })
  );
}

function initCreateGame()
{
  updateSelect('getMapList', 'map', '#creation-');
  updateSelect('getFactionList', 'faction', '#creation-');
  convertToSlider('creation-playerscount', 2, 9);
  convertToSlider('creation-moneylimit', 100, 1000, 50);
}

function editArmy(event)
{
  $('#army-view').hide();
  $('#army-edit, #del-army').show();
  var subsec = $('#army-edit');
  var armyname = event.currentTarget.text;
  sendRequest({ cmd: 'getArmy', armyName: armyname }, function (json) {
    $('input[name="armyName"]', subsec).val(armyname);
    sections['manage-armies'].afterSelectChange = function () {
      $.each(json.units, function(i, v) {
        var units = $('li', subsec);
        $('div.slider-count', units[i]).slider('value', v.count);
        unitCountSlide(units[i], v.count, $('label', units[i]).data().cost);
      });
    }
    var i = $('option', subsec).filter(function() { return this.text == json.factionName }).val();
    $('#upload-army-faction').val(i).trigger('change');
    var form = $('form[name="upload-army"]');
    sections['manage-armies'].storedSubmit = $.extend(true, {}, form.data());
    form.unbind('submit');
    form.submit(function() {
      return submitForm(form,function() {
        initManageArmies();
      }, function(form) {
        var res = uploadArmyGrabber(form);
        res.newArmyName = res.armyName;
        res.armyName = armyname;
        return res;
      }, {cmd: "editArmy"});
    });
    $('#del-army').unbind('click');
    $('#del-army').click(function() {
      sendRequest({ cmd: 'deleteArmy', armyName: armyname }, function (json) {
        initManageArmies();
      });
      return false;
    });
  });
  return false;
}

function initManageArmies()
{
  $('#manage-armies > *').hide();
  if(sections['manage-armies'].storedSubmit)
  {
    $('form[name="upload-army"]').data(sections['manage-armies'].storedSubmit);
    delete sections['manage-armies'].storedSubmit;
    $('#army-edit input[name="armyName"]').val('');
  }
  sendRequest({ cmd: 'getArmiesList' }, function (json) {
    $('#army-view > *').hide();
    $('#army-view').show();
    if(json.armies.length) {
      var table = $('#army-view table');
      $('tr', table).not($('tr', table).first()).remove();
      $.each(json.armies, function (i, army) {
        table.append($('<tr/>')
          .append($('<td/>').append($('<a/>', { href: '#' }).text(army.name)))
          .append($('<td/>').text(army.faction))
          .append($('<td/>').text(army.cost)));
      });
      $('a', table).click(editArmy);
      table.show();
    }
    $('#army-view a.button').show();
  });
  updateSelect('getFactionList', 'faction', '#upload-army-', function() {
    $('#upload-army-faction').change();
  });
}

function initNavigation()
{
  var items = $("nav > p");

  $(".main-section").hide();
  items.click(function()
  {
    var item = $(this);

    if (item.hasClass("nav-current")) return;
    $.each(items, function() { $(this).removeClass("nav-current"); });
    item.addClass("nav-current");

    showSection(item.attr('id').substring(4)); // strip 'nav-' prefix
  });

  // add animation
  var pad_out = 25;
  var pad_in = 15;
  items.each(function()
  {
    $(this).hover(function()
    {
      $(this).animate({ paddingLeft: pad_out }, 150);
    },
    function()
    {
      $(this).animate({ paddingLeft: pad_in }, 150);
    });
  });
}

function initHorzMenu()
{
  $("#sign-out").click(function()
  {
    sendRequest({ cmd: 'unregister' }, function (json)
    {
      sessionStorage.clear();
      showSection('registration');
    });
  });
  $("#leave-game").click(function()
  {
    sendRequest(addGame({ cmd: 'leaveGame' }), function (json)
    {
      delete sessionStorage.gameName;
      delete sessionStorage.turn;
      delete sessionStorage.player_number;
      $("#chat").html("");
      $("#players").html("");
      showSection('active-games');
    });
  });
}

function submitForm(form, handler, grabber, command)
{
  function formError(form, text)
  {
    $('.error', form).remove();
    form.prepend(
      $('<p/>', {class: 'error ui-corner-all'})
      .append($('<img/>', { src: '/images/error.png' }))
      .append(text)
    );
  }

  function grabForm(form)
  {
    var obj = {};
    $("input[type!='submit'], textarea", form).each(function(i, v)
    {
      obj[$(v).attr('name')] = $(v).hasClass('int-value') ? parseInt($(v).val()) : $(v).val();
    });
    $("select", form).each(function(i, v)
    {
      obj[$(v).attr('name')] = $(':selected', v).text();
    });
    return obj;
  }

  var data = grabber ? grabber(form): grabForm(form);
  var commands = {
    'registration': function() { return { cmd: 'register' }; },
    'creation': function() { return { cmd: 'createGame' }; },
    'upload-army': function() { return { cmd: 'uploadArmy' }; },
    'send-message': function() { return addGame({ cmd: 'sendMessage' }); }
  }
  command = command || commands[form.attr('name')]();
  if (command.cmd == 'register')
    requestFunc = sendNonAuthorizedRequest;
  else
    requestFunc = sendRequest;

  requestFunc(
    $.extend(data, command),
    function (json) { handler(json, data); clearForm(form); },
    function (message) { formError(form, message); }
  );

  return false; // ban POST requests
}

function clearForm(form)
{
  $('.error', form).remove();
  $('input[type!="submit"]', form).val('');
}

function unitCountSlide(unit, val, cost)
{
  $('input', unit).val(val);
  $('.cost', unit).text('$' + val * cost);
}

function uploadArmyGrabber(form) {
  return {
    'armyName': $('input[name="armyName"]', form).val(),
    'factionName': $('#upload-army-faction :selected').text(),
    'armyUnits': $.map($('li', form), function(v, i) {
      return {
        'name': $('label', v).text(),
        'count': parseInt($('input', v).val())
      };
    })
  };
}

function initBinds()
{
  // Registration
  $('form[name="registration"]').submit(function()
  {
    return submitForm($(this), function(json, data)
      {
        if(sessionStorage.length && sessionStorage.username == data.username &&
          inGame())
        {
          showSection('lobby');
          return;
        }
        sessionStorage.clear();
        sessionStorage.sid = json.sid;
        sessionStorage.username = data.username;
        showSection('active-games');
      }
    );
  });

  // Create Game
  $('form[name="creation"]').submit(function()
  {
    return submitForm($(this), function(json, data)
    {
      sessionStorage.gameName = data.gameName;
      showSection('lobby');
    });
  });

  // Lobby
  $('form[name="send-message"]').submit(function()
  {
    var form = $(this);
    var message = $('#send-message-text', form);
    if (message.val() != '')
    {
      return submitForm(form,
        function() { message.val(''); });
    }
    return false;
  });

  // Upload Army
  $('form[name="upload-army"]').submit(function()
  {
    var form = $(this);
    return submitForm(form, initManageArmies, uploadArmyGrabber);
  });

  $('#choose-army').change(function () {
    var army = $('#choose-army :selected').text();
    if (army != '')
    {
      enable('#set-status');
      sendRequest({ cmd: 'chooseArmy', armyName: army }, $.noop);
    }
    else
    {
      disable('#set-status');
    }
  });

  $('#set-status').click(function(){
    var status;
    if ($('#set-status').is(':checked'))
    {
      status = 'ready';
      disable('#choose-army');
    }
    else
    {
      status = 'in_lobby';
      enable('#choose-army');
    }
    sendRequest({ cmd: 'setPlayerStatus', status: status }, $.noop);
  });

  $('#upload-army-faction').change(function () {
    var fName = $('#upload-army-faction :selected').text();
    $('#unit-info').empty();
    sendRequest({ cmd: 'getFaction', factionName: fName }, function (json) {
      var uList = $("#upload-army-units").empty();
      $.each(json.unitList, function(i, v) {
        var unit = $('<li/>');
        var unit_id = 'unit-army-' + v.name;
        unit.append($('<label/>', { 'for': unit_id }).text(v.name).data(v))
          .append($('<input/>', { type: 'text', id: unit_id, value: 0 }))
          .append($('<p/>', { class: 'cost' }).text('$0'))
          .append($('<div/>', { class: 'slider-count' }));
        $('.slider-count', unit).slider({
          range: 'min',
          value: 0,
          min: 0,
          max: 50,
          slide: function (event, ui) { unitCountSlide(unit, ui.value, v.cost); },
        });
        uList.append(unit);
      });
      $('label', uList).click(function() {
        $('#unit-info').empty();
        var info = $(this).data();
        const fields = {
          'name': 'Name',
          'HP': 'Health',
          'attack': 'Attack',
          'defence': 'Defence',
          'range': 'Range',
          'damage': 'Damage',
          'protection': 'Protection',
          'initiative': 'Initiative',
          'MP': 'Speed',
          'cost': 'Cost'
        };
        $.each(fields, function(i, v) {
          $('#unit-info').append(
            $('<tr/>').append($('<th/>').text(v))
                  .append($('<td/>').text(info[i])));
        });
      });
      if(sections['manage-armies'].afterSelectChange)
      {
        sections['manage-armies'].afterSelectChange();
        delete sections['manage-armies'].afterSelectChange;
      }
    });
  });

  $('#add-army').click(function() {
    $('#army-view, #del-army').hide();
    $('#army-edit').show();
    return false;
  });
  $('#end-placing-btn').click(endPlacing); // definition of endPlacing appears in game.js
  $('#end-turn-btn').click(endTurn); // definition of endTurn appears in game.js
}

$(document).ready(function()
{
  initNavigation();
  initHorzMenu();
  initBinds();

  $('input:submit, a.button').button();
  $('input:text').addClass('ui-widget');

  describeSections();
  showSection(getCurrentSectionName() || "registration");
});
