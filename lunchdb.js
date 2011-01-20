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

lunchdb.connected = function() {
    return db && db.state == 'connected';
}

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

lunchdb.usersCount = function(callback) {
    if (!lunchdb.connected()) {
        callback('Database not connected. Call connect()', null);
        return;
    }

   db.collection('users', function(err, collection) {
        collection.count(function(err, count) {
            callback(null, count);
        });
    }); 
};
