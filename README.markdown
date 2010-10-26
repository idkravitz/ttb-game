Installation
------------
The main requirements for successfull installation are: **>=python 3.1.2**, **>=sqlalchemy 0.6**
and **bottle**

Python can be installed by simply downloading installer for your OS [here][python download]
or, if you are on a linux-based OS -- by package manager. For instance Ubuntu users can do it by:
    $ sudo aptitude install python3

For a quick installation of sqlalchemy it's better to have pip or easy\_install utilities, if you have so, just use one 
of the following:
    $ sudo easy_install SQLAlchemy
    $ sudo pip install SQLAlchemy

_(If your OS have multiple python installations probably your easy\_install will
have some suffix like **-3.1**, for instance in gentoo it have a name **easy_install-3.1**)_

Or if you can't or don't want to have none of this nice tools you can download 
SQLAlchemy directly [here][sqlalchemy download] and execute:
    $ sudo python setup.py install

**Bottle** can be installed installed in a same way as SQLAlchemy, but with replacing in commands
above word 'SQLAlchemy' with 'bottle'. Also you can read more info about bottle [here][bottle site]

Contribution requirement
------------------------
If you're contributor or you made a fork of this project you must follow 3 simple steps before start to pushing your changes (and also 
[2 steps][github 2steps], that are required anywhere at github). In order to keep consistency
while working at different OS's (like in our team, each person have OS, different from others - Windows, Linux, Mac) you should add
simple settings to your git config (global settings preferred for future use in other projects):
    core.whitespace=fix,-indent-with-non-tab,trailing-space,cr-at-eol
    core.eol=lf
    core.autocrlf=false
You could add them by _git config_, replacing the equal (=) signs with whitespace and optionally pass a _--global_ key if you want
to set this settings globally.

Testing
-------
Comandline tests can be run, by tester test.py. It has some simple options, which you can read by
    $ src/test.py --help

To run all tests:
    $ src/test.py tests/

Run server
----------
Make sure that your port 80 isn't already occupied. Then you must run src/server.py with root privileges. For
instance you can do it with sudo:
    $ sudo src/server.py

After that you can view client at [http://localhost/](http://localhost/)

[python download]: http://www.python.org/download/
[sqlalchemy download]: http://www.sqlalchemy.org/download.html
[github 2steps]: http://help.github.com/git-email-settings/
[bottle site]: http://bottle.paws.de/
