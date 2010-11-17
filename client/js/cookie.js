cookie = new function Cookie() {

    this.get = function (field)
    {
        return this.fields[field];
    };
    
    this.store = function (data)
    {
        this.fields = $.extend(read(), data);
        write(this.fields);
    };

    this.remove = function (field)
    {
        delete this.fields[field];
        write(this.fields);
    };

    this.clear = function ()
    {
        this.fields = {};
        write(this.fields);
    };

    this.isEmpty = function ()
    {
        return this.fields != {};
    };

    // internal functions

    function read()
    {
        return JSON.parse($.cookie('session'));
    }

    function write(data)
    {
        $.cookie('session', JSON.stringify(data));
    }

    this.fields = read();
};
