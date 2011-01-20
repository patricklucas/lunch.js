var Mongo = require('mongodb');
var Db = Mongo.Db
var Server = Mongo.Server

var host = "";
var port = 0;
var dbname = "lunch";
var user = "";
var pass = "";

var db = new Db(dbname, new Server(host, port, {}));

db.open(function(err, db) {
    db.authenticate(user, pass, function(err, auth) {
        db.collection('users', function(err, collection) {
            collection.count(function(err, count) {
                console.log("There are " + count + " users.");
                db.close();
            });
        });
    });
});
