#!/bin/bash

HOST="https://localhost:8000"

CURL="curl -k -s"

if [ $# = 0 ]
then
    $CURL $HOST/nominations.txt
elif [ $1 = "-a" -a -n "$2" ]
then
    shift
    $CURL $HOST/nominate.txt -d nomination="$*"
elif [ $1 = "-r" -a -n "$2" ]
then
    shift
    $CURL $HOST/unnominate.txt -d nomination="$*"
elif [ $1 = "-u" ]
then
    $CURL -X POST $HOST/unvote.txt
elif [ $1 = "-c" -a -n "$2" ]
then
    shift
    $CURL $HOST/comment.txt -d comment="$*"
elif [ $1 = "-d" -a -n "$2" ]
then
    $CURL $HOST/drive.txt -d seats="$2"
elif [ $1 = "--reset" ]
then
    $CURL -X POST $HOST/reset.txt
elif [ -n "$1" ]
then
    $CURL $HOST/vote.txt -d restaurant="$*"
fi
