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
    not_connected: 'Database not connected. Call lunchdb.connect().',
    bad_restaurant_name: 'Restaurant name must begin with letter or number.',
    already_nominated: 'That place was already nominated.',
    too_many_nominations: 'You can only nominate 2 restaurants.',
    unknown_nomination: 'That restaurant hasn\'t been nominated.',
    unknown_user: 'Unknown user.',
    nan: 'Not a number.',
    negative: 'Must be non-negative.',
    did_not_nominate: 'You didn\'t nominate that restaurant.',
    nomination_has_votes: 'Can\'t remove a nomination with votes.',
    username_taken: 'That username is already in use.',
    not_an_admin: 'Only admins can perform that action.'
};

var connected = function() {
    return db && db.state == 'connected';
};

var getUserByName = function(name, callback) {
    db.collection('users', function(err, collection) {
        collection.findOne({ name: name }, function(err, user) {
            if (user == null)
                callback(errors.unknown_user, null);
            else {
                callback(null, user);
            }
        });
    });
}

var getNomination = function(restaurant, callback) {
    db.collection('nominations', function(err, collection) {
        collection.findOne({ where: restaurant }, function(err, nomination) {
            callback(nomination || null);
        });
    });
}

/* Escape special characters for dynamic regex creation */
RegExp.quote = function(str) {
    return str.replace(/([.?*+^$[\]\\(){}-])/g, "\\$1");
};

var getNominationByPrefix = function(prefix, callback) {
    db.collection('nominations', function(err, collection) {
        var search = { where: new RegExp('^' + RegExp.quote(prefix), 'i') };
        
        collection.findOne(search, function(err, nomination) {
            callback(nomination || null);
        });
    });
}

var getUserNominations = function(user, callback) {
    db.collection('nominations', function(err, collection) {
        collection.find({ user: user }, function(err, cursor) {
            var nominations = {};
            
            cursor.each(function(err, nomination) {
                if (nomination) {
                    nominations[nomination.where] = nomination.where;
                } else {
                    callback(null, nominations);
                }
            });
        });
    });
}

var addNomination = function(user, restaurant, callback) {
    if (!/^[a-zA-Z0-9]/.test(restaurant)) {
        callback(errors.bad_restaurant_name);
        return;
    }
    
    db.collection('nominations', function(err, collection) {
        collection.findOne({ where: restaurant }, function(err, nomination) {
            if (nomination) {
                callback(errors.already_nominated);
            } else {
                collection.insert({
                    user: user,
                    where: restaurant
                }, function(docs) {
                    callback(null);
                });
            }
        });
    });
}

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

var collectVotes = function(callback) {
    db.collection('users', function(err, collection) {
        collection.mapReduce(function() {
            if (this.vote)
                emit(this.vote, {users: [this]});
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

var collectVotesFor = function(nomination, callback) {
    db.collection('users', function(err, collection) {
        collection.find({ vote: nomination }, function(err, cursor) {
            var votes = [];
            
            cursor.each(function(err, user) {
                if (user) {
                    votes.push(user);
                } else {
                    callback(null, votes);
                }
            });
        });
    });
}

var numVotesFor = function(nomination, callback) {
    db.collection('users', function(err, collection) {
        collection.count({ vote: nomination }, function(err, count) {
            callback(err, count);
        });
    });
}

var stripComment = function(str) {
    return str
        .replace(/^\s+|\s+$/g, '')
        .replace(/[\r\n]+/g, ' ');
}

var setUserComment = function(name, comment, callback) {
    db.collection('users', function(err, collection) {
        collection.findOne({ name: name }, function(err, user) {
            if (user == null)
                callback(errors.unknown_user, null);
            else {
                var realComment = stripComment(comment);
                
                user.comment = realComment;
                
                collection.save(user, function(err) {
                    callback(null, realComment);
                });
            }
        });
    });
}

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

lunchdb.connected = connected;

lunchdb.connect = function(callback) {
    db.open(function(err, db) {
        if (err) {
            callback(err);
            return;
        }

        db.authenticate(user, pass, function(err, auth) {
            if (err) {
                callback(err);
                return;
            }

            callback(null);
        });
    });
};

var generateToken = function() {
	var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
	var len = 64;
    
	var s = "";
	for (var i = 0; i < len; i++) {
        s += chars.charAt(Math.floor(Math.random() * chars.length));
	}
    
    return s;
}

var setUserToken = function(username, token, callback) {
    db.collection('auth', function(err, collection) {
        collection.findOne({ user: username }, function(err, auth) {
            if (auth) {
                auth.token = token;
                
                collection.save(auth, function(err) {
                    callback(null);
                });
            } else {
                collection.insert({
                    user: username,
                    token: token
                }, function(docs) {
                    callback(null);
                });
            }
        });
    });
}

var addUser = function(username, callback) {
    db.collection('users', function(err, collection) {
        collection.insert({
            name: username,
            vote: null,
            comment: null,
            seats: 0
        }, function(docs) {
            callback(null);
        });
    });
}

lunchdb.register = function(username, callback) {
    if (!connected()) {
        callback(errors.not_connected, null);
        return;
    }
    
    getUserByName(username, function(err, user) {
        if (user) {
            callback(errors.username_taken, null);
        } else {
            var token = generateToken();
            callback(null, token);
            addUser(username, function() {});
            setUserToken(username, token, function() {});
        }
    });
}

lunchdb.auth = function(token, callback) {
    db.collection('auth', function(err, collection) {
        collection.findOne({ token: token }, function(err, auth) {
            if (auth) {
                callback(null, auth.user);
            } else {
                callback(errors.unknown_user, null);
            }
        });
    });
}

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

lunchdb.nominate = function(username, restaurant, callback) {
    if (!connected()) {
        callback(errors.not_connected);
        return;
    }

    db.collection('nominations', function(err, collection) {
        collection.count({ user: username }, function(err, count) {
            if (count >= 2) {
                callback(errors.too_many_nominations);
                return;
            }

            addNomination(username, restaurant, function(err) {
                callback(err);
            });
        });
    });
};

lunchdb.unnominate = function(username, restaurant, callback) {
    if (!connected()) {
        callback(errors.not_connected);
        return;
    }
    
    getNominationByPrefix(restaurant, function(nomination) {
        if (!nomination) {
            callback(errors.unknown_nomination, null);
        } else if (nomination.user != username) {
            callback(errors.did_not_nominate, null);
        } else {
            numVotesFor(nomination.where, function(err, count) {
                if (count > 0) {
                    callback(errors.nomination_has_votes, null);
                } else {
                    db.collection('nominations', function(err, collection) {
                        collection.remove({ _id: nomination._id }, function(err, collection) {
                            callback(null, nomination.where || null);
                        });
                    });
                }
            });
        }
    });
}

lunchdb.reset = function(username, callback) {
    if (!connected()) {
        callback(errors.not_connected);
        return;
    }
    
    getUserByName(username, function(err, user) {
        if (user.admin) {
            clearUserVotes(function() {
                clearNominations(function() {
                    callback(null);
                });
            });
        } else {
            callback(errors.not_an_admin);
        }
    });
}

lunchdb.drive = function(username, seatsStr, callback) {
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
        collection.find({ name: username }, function(err, cursor) {
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

lunchdb.vote = function(username, restaurant, callback) {
    if (!connected()) {
        callback(errors.not_connected, null);
        return;
    }

    getNominationByPrefix(restaurant, function(nomination) {
        if (nomination == null)
            callback(errors.unknown_nomination, null);
        else {
            var vote = nomination.where;

            setUserVote(username, vote, function(err, oldVote) {
                if (err) {
                    callback(err, null);
                } else {
                    callback(null, {old: oldVote, new: vote});
                }
            });
        }
    });
};

lunchdb.unvote = function(username, callback) {
    if (!connected()) {
        callback(errors.not_connected, null);
        return;
    }
    
    setUserVote(username, null, function(err, oldVote) {
        callback(null, oldVote);
    });
}

lunchdb.comment = function(username, comment, callback) {
    if (!connected()) {
        callback(errors.not_connected, null);
        return;
    }
    
    setUserComment(username, comment, function(err, realComment) {
        callback(err, realComment);
    });
}
