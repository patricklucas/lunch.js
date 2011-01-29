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
    not_connected: 'Database not connected. Call connect()',
    already_nominated: 'That place was already nominated.',
    too_many_nominations: 'You can only nominate 2 restaurants.',
    unknown_user: 'Unknown user.',
    nan: 'Not a number.',
    negative: 'Must be non-negative.'
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
        callback(errors.not_connected);
        return;
    }

    db.collection('nominations', function(err, collection) {
        collection.count({ user: 'plucas' }, function(err, count) {
            if (count >= 2) {
                callback(errors.too_many_nominations);
                return;
            }

            collection.find({ where: nomination }, function(err, cursor) {
                cursor.nextObject(function(err, doc) {
                    if (doc != null) {
                        callback(errors.already_nominated);
                    } else {
                        collection.insert({
                            user: 'plucas',
                            votes: [],
                            where: nomination
                        }, function(docs) {
                            callback(null);
                        });
                    }
                });
            });
        });
    });
};

lunchdb.reset = function(callback) {
    if (!connected()) {
        callback(errors.not_connected);
        return;
    }

    db.collection('nominations', function(err, collection) {
        if (!err) {
            collection.remove(function(err, collection) {
                if (!err)
                    callback(null);
                else
                    callback(err);
            });
        } else
            callback(err);
    });
}

lunchdb.drive = function(seatsStr, callback) {
    if (!connected()) {
        callback(errors.not_connected);
        return;
    }

    var seats = +seatsStr;

    if (isNaN(seats)) {
        callback(errors.nan);
        return;
    }

    if (seats < 0) {
        callback(errors.negative);
        return;
    }

    db.collection('users', function(err, collection) {
        collection.find({ name: 'plucas' }, function(err, cursor) {
            cursor.nextObject(function(err, doc) {
                if (doc == null)
                    callback(errors.unknown_user);
                else {
                    doc.seats = seats;
                    collection.save(doc, function(err) {
                        callback(null);
                    });
                }
            });
        });
    });
};
