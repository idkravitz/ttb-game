#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sqlite3

class Database:
    db_name = 'sample.db3'
    instance = None
    def __init__(self):
        self.db = sqlite3.connect(self.db_name)
        self.db.text_factory = lambda text: unicode(text, 'utf-8', 'ignore')
        cur = self.db.cursor()
        cur.execute("""
        CREATE TABLE IF NOT EXISTS users
        (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT,
            password TEXT,
            sid TEXT
        ); """)

def DatabaseInstance():
    if Database.instance == None:
        Database.instance = Database()
    return Database.instance
