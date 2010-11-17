function Cookie() {
    this.fields = this._read();
};
Cookie.prototype = {
    // internal functions
    _read: function ()
    {
        return JSON.parse($.cookie('session'));
    },
    _write: function (data)
    {
        $.cookie('session', JSON.stringify(data));
    },
    // Public
    get: function (field)
    {
        return this.fields[field];
    },
    store: function (data)
    {
        this.fields = $.extend(this._read(), data);
        this._write(this.fields);
    },
    remove: function (field)
    {
        delete this.fields[field];
        this._write(this.fields);
    },
    clear: function ()
    {
        this.fields = {};
        this._write(this.fields);
    },
    isEmpty: function ()
    {
        return this.fields != {};
    }
};
cookie = new Cookie();
