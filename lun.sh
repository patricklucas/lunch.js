#!/bin/bash

HOST="https://localhost:8000"

if [ $# = 0 ]
then
    curl -k $HOST/nominations.txt
elif [ $1 = "-a" -a -n "$2" ]
then
    shift
    curl -k $HOST/nominate.txt -d nomination="$*"
fi
