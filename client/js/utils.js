function enable(selector)
{
    $(selector).removeAttr('disabled');
}

function disable(selector)
{
    $(selector).attr('disabled', 'disabled');
}

function inGame()
{
    return 'gameName' in sessionStorage;
}

function addGame(data)
{
    return $.extend(data, { gameName: sessionStorage.gameName });
}
