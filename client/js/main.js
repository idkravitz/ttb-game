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
        $.getJSON('/ajax', {
                cmd: "register",
                username: user,
                password: $("input[name='password']", this).val()
            },
            function(text){
                if (text.status == 'ok'){
                    window.location.hash = 'main';
                    sid = text.sid;
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
        returnUsername("nameInMain");
        clearForm("register");
        return false;       // don't allow form to send POST requests
    });

    $("#main-content a[href='/#registration']").click(function(){
        $.getJSON('/ajax', {
                cmd: "unregister",
                sid: sid
            },
            function(json){
                if(json.status == 'ok'){
                    window.location.hash = 'registration';
                }
                else{
                } // handle error situations
            }
        );
        return false;
    });

    $("form[name='lobby']").submit(function(obj){
        // do some ajax
        returnUsername("nameInLobby");
        window.location.hash = 'lobby';
        return false;
    });
});

function returnUsername(obj){
	document.getElementById(obj).innerHTML = user;
}

function clearForm(obj){
	temp = this.document.forms[obj].elements;
	for (i = 0; i < this.document.forms[obj].length - 1; i++) {
		temp[i].value = "";
	}
	$("#username_error").hide();
	$("#password_error").hide();
}
