var Mongo = require('mongodb');
var Db = Mongo.Db
var Server = Mongo.Server

var host = "localhost";
var port = 27017;
var dbname = "lunch";
var user = "lunch";
var pass = null;

var lunchdb = exports;

var db = new Db(dbname, new Server(host, port, {}));

var errors = {
    not_connected: 'Database not connected. Call connect()'
};

var connected = function() {
    return db && db.state == 'connected';
};

lunchdb.connected = connected;

lunchdb.connect = function(callback) {
    db.open(function(err, db) {
        if (err) {
            callback(err, null);
            return;
        }

        db.authenticate(user, pass, function(err, auth) {
            if (err) {
                callback(err, null);
                return;
            }

            callback(null, lunchdb);
        });
    });
};

lunchdb.userNames = function(callback) {
    if (!connected()) {
        callback(errors.not_connected, null);
        return;
    }

    db.collection('users', function(err, collection) {
        collection.find(function(err, cursor) {
            var users = new Array();

            cursor.each(function(err, user) {
                if (user == null) {
                    callback(null, users);
                    return;
                }

                users.push(user.name);
            });
        });
    });
};

lunchdb.usersCount = function(callback) {
    if (!connected()) {
        callback(errors.not_connected, null);
        return;
    }

    db.collection('users', function(err, collection) {
        collection.count(function(err, count) {
            callback(null, count);
        });
    }); 
};

lunchdb.nominations = function(callback) {
    if (!connected()) {
        callback(errors.not_connected, null);
        return;
    }

    db.collection('nominations', function(err, collection) {
        collection.find(function(err, cursor) {
            cursor.toArray(function(err, nominations) {
                callback(null, nominations);
            });
        });
    });
};

lunchdb.nominate = function(nomination, callback) {
    if (!connected()) {
        callback(errors.not_connected, null);
        return;
    }

    callback(null);
};
