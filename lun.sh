#!/bin/bash

SCRIPT=$( basename "$0" )

CONFIG_DIR="$HOME/.lunch"
CONFIG_FILE="$CONFIG_DIR/config"
UPDATE_URL="https://github.com/patricklucas/lunch.js/raw/master/lun.sh"

if [ "$1" = "-h" -a ! -n "$2" ]
then
    cat << EOF
    $SCRIPT
        List nominations and votes

    $SCRIPT -n <username> -s <server:port>
        Register

    $SCRIPT -a <restaurant>
        Nominate a restaurant

    $SCRIPT -r <restaurant-prefix>
        Remove a nomination

    $SCRIPT <restaurant-prefix>
        Vote for restaurant

    $SCRIPT -u
        Unvote

    $SCRIPT -d <seats>
        Mark yourself as a driver

    $SCRIPT -c <comment>
        Set your user comment

    $SCRIPT -C
        Clear your user comment
EOF
    exit 0
fi

if [ "$1" = "-h" -a ! -n "$2" ]
then
    cat << EOF
    $SCRIPT
        List nominations and votes

    $SCRIPT -n <username> -s <server:port>
        Register

    $SCRIPT -a <restaurant>
        Nominate a restaurant

    $SCRIPT -r <restaurant-prefix>
        Remove a nomination

    $SCRIPT <restaurant-prefix>
        Vote for restaurant

    $SCRIPT -u
        Unvote

    $SCRIPT -d <seats>
        Mark yourself as a driver

    $SCRIPT -c <comment>
        Set your user comment

    $SCRIPT -C
        Clear your user comment
EOF
    exit 0
fi

if [ "$1" = "--update" -a ! -n "$2" ]
then
    curl -s "$UPDATE_URL" > "$0"
    echo "lun.sh updated successfully."
    exit 0
fi

if [ ! -d $CONFIG_DIR ]
then
    mkdir $CONFIG_DIR 2> /dev/null
    
    if [ $? -ne 0 ]
    then
        echo "Could not create config dir $CONFIG_DIR!"
        exit 1
    fi
fi

CURL="curl -k -s -X POST"

# Setup complete, check if user has a token
if [ -f "$CONFIG_FILE" ]
then
    HOST="https://$( head -n 1 $CONFIG_FILE )"
    TOKEN=$( tail -n 1 $CONFIG_FILE )

    if [ "x$HOST" = "x" -o "x$TOKEN" = "x" ]
    then
        echo "Config file $CONFIG_FILE malformed." 1>&2
        exit 1
    fi
else
    if [ "$1" = "-n" -a -n "$2" -a "$3" = "-s" -a -n "$4" ]
    then
        HOST="https://$4"
        RESP=$( $CURL $HOST/register.txt -d username="$2" )

        if [ $? -eq 7 ]
        then
            echo "Couldn't connect to server at $HOST" 1>&2
            exit 1
        fi
        
        if [ "$( echo $RESP | cut -c -6 )" = "Token:" ]
        then
            touch "$CONFIG_FILE"
            chmod 0600 "$CONFIG_FILE"

            echo "$4" >> "$CONFIG_FILE"
            echo "$2" >> "$CONFIG_FILE"
            echo "$( echo $RESP | cut -c 8- )" >> "$CONFIG_FILE"
            echo "You are now registered!"
            exit 0
        else
            echo $RESP
            exit 1
        fi
    else
        echo "You must register with '$SCRIPT -n <username> -s <server:port>'" 1>&2
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
    echo "You are already registered." 1>&2
    exit 1
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

if [ $? -ne 0 ]
then
    echo "Couldn't connect to server at $HOST" 1>&2
    exit 1
fi
