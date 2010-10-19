Installation
------------
The main requirements for successfull installation are: **>=python 3.1.2** and **>=sqlalchemy 0.6**

Python can be installed by simply downloading installer for your OS [here][python download]
or, if you are on a linux-based OS -- by package manager. For instance Ubuntu users can do it by:
    $ sudo aptitude install python3

For a quick installation of sqlalchemy it's better to have pip or easy\_install utilities, if you have so, just use one 
of the following:
    $ sudo easy_install SQLAlchemy
    $ sudo pip install SQLAlchemy

Or if you can't or don't want to have none of this nice tools you can download 
SQLAlchemy directly [here][sqlalchemy download] and execute:
    $ sudo python setup.py install

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

[python download]: http://www.python.org/download/
[sqlalchemy download]: http://www.sqlalchemy.org/download.html
[github 2steps]: http://help.github.com/git-email-settings/
