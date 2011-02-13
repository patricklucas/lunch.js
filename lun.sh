#!/bin/bash

HOST="https://localhost:8000"

CURL="curl -k -s -X POST"

CONFIG_DIR="$HOME/.lunch"
TOKEN_FILE="$CONFIG_DIR/token"
RESTAURANTS_FILE="$CONFIG_DIR/restaurants.bash"

SCRIPT=$( basename "$0" )

if [ ! -d $CONFIG_DIR ]
then
    mkdir $CONFIG_DIR
    
    if [ $? -ne 0 ]
    then
        echo "Could not create config dir in $CONFIG_DIR\!"
        exit 1
    fi
fi

if [ "$(type -t _lunch)" = "function" ]
then
    if [ -f $CONFIG_DIR/completion ]
    then
        . $CONFIG_DIR/completion
    fi
fi

# Setup complete, check if user has a token
if [ -f $CONFIG_DIR/token ]
then
    TOKEN=$( tail -n 1 $TOKEN_FILE )
else
    if [ "$1" = "-n" -a -n "$2" ]
    then
        RESP=$( $CURL $HOST/register.txt -d username="$2" )
        
        if [ "$( echo $RESP | cut -c -6 )" = "Token:" ]
        then
            echo "$2" > "$TOKEN_FILE"
            echo "$( echo $RESP | cut -c 8- )" >> "$TOKEN_FILE"
            echo "You are now registered!"
            exit 0
        else
            echo $RESP
            exit 1
        fi
    else
        echo "You must register with '$SCRIPT -n <username>'"
        exit 1
    fi
fi

# Redefine $CURL to pass token
CURL="$CURL -d token=$TOKEN"

if [ $# = 0 ]
then
    $CURL $HOST/nominations.txt
elif [ "$1" = "-n" -a -n "$2" ]
then
    echo "You are already registered."
elif [ "$1" = "-a" -a -n "$2" ]
then
    shift
    $CURL $HOST/nominate.txt -d restaurant="$*"
elif [ "$1" = "-r" -a -n "$2" ]
then
    shift
    $CURL $HOST/unnominate.txt -d restaurant="$*"
elif [ "$1" = "-u" -a ! -n "$2" ]
then
    $CURL $HOST/unvote.txt
elif [ "$1" = "-c" -a -n "$2" ]
then
    shift
    $CURL $HOST/comment.txt -d comment="$*"
elif [ "$1" = "-C" -a ! -n "$2" ]
then
    $CURL $HOST/comment.txt -d comment=""
elif [ "$1" = "-d" -a -n "$2" ]
then
    $CURL $HOST/drive.txt -d seats="$2"
elif [ "$1" = "--reset" -a ! -n "$2" ]
then
    $CURL $HOST/reset.txt
else
    $CURL $HOST/vote.txt -d restaurant="$*"
fi

# Populate the completion file
$CURL $HOST/nominations.bash > "$RESTAURANTS_FILE" &
