#!/bin/bash
if [ $# -ne 1 ]; then
    echo 'Usage: ./test.sh <test-file>'
else
    cat $1 | src/main.py
fi
