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
    unknown_nomination: 'That restaurant hasn\'t been nominated.',
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

var collectVotes = function(callback) {
    db.collection('users', function(err, collection) {
        collection.mapReduce(function() {
            if (this.vote)
                emit(this.vote, {users: [this.name]});
        }, function(key, values) {
            var users = [];
            
            values.forEach(function(doc) {
                users = users.concat(doc.users);
            });
            
            return {users: users};
        }, function(err, mrCollection) {
            mrCollection.find(function(err, cursor) {
                cursor.toArray(function(err, arr) {
                    var votes = {};
                    
                    arr.forEach(function(mrResult) {
                        votes[mrResult._id] = mrResult.value.users;
                    });
                    
                    callback(null, votes);
                });
            });
        });
    });
}

lunchdb.nominations = function(callback) {
    if (!connected()) {
        callback(errors.not_connected, null);
        return;
    }

    collectVotes(function(err, votes) {
        var nominations = {};
        
        for (var where in votes) {
            nominations[where] = {
                votes: votes[where]
            };
        }
        
        db.collection('nominations', function(err, collection) {
            collection.find(function(err, cursor) {
                cursor.each(function(err, nomination) {
                    if (nomination) {
                        var where = nomination.where;
                        var user = nomination.user;
                        
                        nominations[where] = nominations[where] || {
                            votes: []
                        };
                        
                        nominations[where].user = user;
                    } else {
                        var nominationsArr = [];
                        
                        for (var n in nominations) {
                            nominationsArr.push({
                                where: n,
                                user: nominations[n].user,
                                votes: nominations[n].votes
                            });
                        }

                        callback(null, nominationsArr);
                    }
                });
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

var clearUserVotes = function(callback) {
    db.collection('users', function(err, collection) {
        collection.find(function(err, cursor) {
            cursor.each(function(err, user) {
                if (user) {
                    user.vote = null;
                    collection.save(user, function() {});
                } else {
                    callback();
                }
            });
        });
    });
}

var clearNominations = function(callback) {
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

lunchdb.reset = function(callback) {
    if (!connected()) {
        callback(errors.not_connected);
        return;
    }
    
    clearUserVotes(function() {
        clearNominations(function() {
            callback(null);
        });
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

/* Escape special characters for dynamic regex creation */
RegExp.quote = function(str) {
    return str.replace(/([.?*+^$[\]\\(){}-])/g, "\\$1");
};

lunchdb.vote = function(restaurant, callback) {
    if (!connected()) {
        callback(errors.not_connected, null);
        return;
    }

    db.collection('nominations', function(err, collection) {
        var re 
        collection.find({ where: new RegExp('^' + RegExp.quote(restaurant), "i") }, function(err, cursor) {
            cursor.nextObject(function(err, nomination) {
                if (nomination == null)
                    callback(errors.unknown_nomination, null);
                else {
                    db.collection('users', function(err, collection) {
                        collection.find({ name: 'plucas' }, function(err, cursor) {
                            cursor.nextObject(function(err, user) {
                                if (user == null)
                                    callback(errors.unknown_user, null);
                                else {
                                    var oldVote = user.vote;
                                    var newVote = nomination.where;
                                    
                                    user.vote = newVote;
                                    
                                    collection.save(user, function(err) {
                                        callback(null, {old: oldVote, new: newVote});
                                    });
                                }
                            });
                        });
                    });
                }
            });
        });
    });
};

var setUserVote = function(name, vote, callback) {
    db.collection('users', function(err, collection) {
        collection.findOne({ name: name }, function(err, user) {
            if (user == null)
                callback(errors.unknown_user, null);
            else {
                var oldVote = user.vote || null;
                
                user.vote = vote;
                
                collection.save(user, function(err) {
                    callback(null, oldVote);
                });
            }
        });
    });
}

lunchdb.unvote = function(callback) {
    if (!connected()) {
        callback(errors.not_connected, null);
        return;
    }
    
    setUserVote('plucas', null, function(err, oldVote) {
        callback(null, oldVote);
    });
}
