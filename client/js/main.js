var descr;          // descriptions of toplevel sections (which behave like pages)
var sid;
var user;

function activate(descr){
    $("#content > section").hide();
    descr.section.show();
    $.each(descr.show, function(i, v) { v.show(); });
    $.each(descr.hide, function(i, v) { v.hide(); });
    descr.init();
}

function getJSON(data, handler){
    $.getJSON('/ajax', { data: JSON.stringify(data) }, handler);
}

$(document).ready(function(){
    window.onhashchange = function(){          // We have a new browser only
        hash = window.location.hash.substr(1); // remove # symbol
        if(hash && hash in descr){
            activate(descr[hash]);
        }
        else{
            window.location.hash = 'registration';
        }
    };
    $('.content-caller').click(function(){
        $(".section-nav-result").hide();
        $("div.section-nav-result[id^=content" + $(this).attr('id') + "]").show();
    });

    descr = {
        registration: {                         // key for anchor
            section: $('#registration'),        // what section to show (maybe move in 'show')
            hide: [$("#menu-wrapper")],         // elements to hide
            show: [],                           // elements to show
            init: function() {                  // actions to perform after showing
            }
        },
        main: {
            section: $('#main'),
            show: [$('#menu-wrapper')],
            hide: [],
            init: function() {
                $('#menu').html($('#main > .menu-content').html());
                $("#menu a[href='/#registration']").click(function(){
                    getJSON({
                        cmd: "unregister",
                        sid: sid
                    },
                    function(json){
                        if(json.status == 'ok'){
                            window.location.hash = 'registration';
                        }
                        else{
                            alert(json.message);
                        } // handle error situations
                    });
                    return false;
                });
            }
        },
        lobby: {
            section: $('#lobby'),
            show: [$('#menu-wrapper')],
            hide: [],
            init: function() {
                $('#menu').html($('#lobby > .menu-content').html());
            }
        }
    };

    window.onhashchange();        // adjust page by anchor

    $("#contentGames").show();
    $("form[name='register']").submit(function(obj){
        user = $("input[name='name']", this).val();
        var pass = $("input[name='password']", form).val()
        var form = $(this);
        getJSON({
                cmd: "register",
                username: user,
                password: pass
            },
            function(text){
                if (text.status == 'ok'){
                    window.location.hash = 'main';
                    sid = text.sid;
                    clearForm(form);
                    getJSON({
                        cmd: "getGamesList",
                        sid: sid
                    },
                    function(json){
                        if(json.status == 'ok'){
                            var form = $("form[name='active-games']");
                            gamename = "";
                            alert(json.games.length);
                            for (i = 0; i < json.games.length; i++) {
                                gamename += json.games[i].gameName + "\n";
                            }
                            $("textarea[name='games']", form).val(gamename);
                        }
                        else{
                            alert(json.message);
                        }
                    });
                }
                else{
                    var active_element, message = text.message;
                    $("#username_error, #password_error").fadeOut(500);
                    active_element = /.*username.*/i.test(message)
                        ? $("#username_error") : $("#password_error");
                    active_element.fadeIn(500);
                    $('span', active_element).text(message);
                }
            }
        );
        setUsername("#nameInMain");
        return false;       // don't allow form to send POST requests
    });

    $("#Create").click(function(){
        var form = $("form[name='lobby']");
        var a = $("select[name='chooseMap']",form).val();
        $("select[name='chooseMap']").click(function() {
            getJSON({
                cmd: "getMapList",
                sid: sid
            },
            function(json){
                if(json.status == 'ok'){
                    alert(json.maps);  //need to upload maps in bd
                }
                else{
                    alert(json.message);
                }
            });
            return false;
        });

        $("select[name='chooseFaction']").click(function(){
            getJSON({
                cmd: "getFactionList",
                sid: sid
            },
            function(json){
                if(json.status == 'ok'){
                    alert(json.factions);  //need to upload factions in bd
                }
                else{
                    alert(json.message);
                }
            });
            return false;
        });

    });

    $("form[name='lobby']").submit(function(obj){
        getJSON({
            cmd: "getPlayersList",
            sid: sid
        },
        function(json){
            if(json.status == 'ok'){
                var form = $("form[name='formlobby']");
                playername = "";
                for (i = 0; i < json.players.length; i++) {
                    playername += json.players[i].username + "\n";
                }
                $("textarea[name='players']", form).val(playername);
                window.location.hash = 'lobby';
            }
            else{
                alert(json.message);
            }
        });
        setUsername("#nameInLobby");
        return false;
    });

});

function setUsername(obj){
    $(obj).html(user);
}

function clearForm(obj){
    var form = typeof obj == "string" ? $("form[name='" + obj + "']"): $(obj);
    $("input[type!='submit']", form).val('');
    $(".error", form).hide();
}
