#!/usr/bin/python3
# -*- coding: utf-8 -*-

import json

def load_json(filename):
    find_next = lambda s, pos: json.decoder.WHITESPACE.match(s, pos).end()
    text = open(filename).read()
    pos, end = 0, len(text)
    result = []
    pos = find_next(text, 0)
    while pos != end:
        request, pos = json._default_decoder.raw_decode(text, idx=pos)
        result.append(request)
        pos = find_next(text, pos)
    return result
