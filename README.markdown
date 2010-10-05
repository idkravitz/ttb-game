Installation
------------
The main requirements for successfull installation are: _>=python 3.1.2_ and _>=sqlalchemy 0.6_

Python can be installed by simply downloading installer for your OS here <a href="http://www.python.org/download/">http://www.python.org/download/</a>
or, if you are on a linux-based OS -- by package manager. For instance Ubuntu users can do it by:
    $ sudo aptitude install python3

For a quick installation of sqlalchemy it's better to have pip or easy\_install utilities, if you have so, just use one 
of the following:
    $ sudo easy_install SQLAlchemy
    $ sudo pip install SQLAlchemy

Or if you can't or don't want to have none of this nice tools you can download SQLAlchemy directly from <a href="http://www.sqlalchemy.org/download.html">http://www.sqlalchemy.org/download.html</a>
and execute:
    $ sudo python setup.py install

Contribution requirement
------------------------
If you're contributor or you made a fork of this project you must follow 3 simple steps before start to pushing your changes (and also 
<a href="http://help.github.com/git-email-settings/">2 steps</a>, that are required anywhere at github). In order to keep consistency
while working at different OS's (like in our team, each person have OS, different from others - Windows, Linux, Mac) you should add
simple settings to your git config (global settings preferred for future use in other projects):
    core.whitespace=fix,-indent-with-non-tab,trailing-space,cr-at-eol
    core.eol=lf
    core.autocrlf=false
You could add them by _git config_, replacing the equal (=) signs with whitespace and optionally pass a _--global_ key if you want
to set this settings globally.
