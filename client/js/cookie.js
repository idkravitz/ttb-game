Cookie = function () {
    var session = read();

    function get(field)
    {
        return session[field];
    }
    
    function store(data)
    {
        session = $.extend(read(), data);
        write(session);
    }

    function remove(field)
    {
        delete session[field];
        write(session);
    }

    function clear()
    {
        session = {};
        write(session);
    }

    function isEmpty()
    {
        return session != {};
    }

    // internal functions

    function read()
    {
        return JSON.parse($.cookie('session'));
    }

    function write(data)
    {
        $.cookie('session', JSON.stringify(data));
    }

    return { 
        fields: session,
        get: get,
        store: store,
        remove: remove,
        clear: clear,
        isEmpty: isEmpty
     };
}();
