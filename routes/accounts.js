var crypto = require('crypto'),
    md5 = require('md5');
util = require('../util/util');

function getSalt() {
    return crypto.randomBytes(32).toString('hex');
}

function saltHash(salt, password, cb) {
    crypto.pbkdf2(password, salt, 10000, 1024, 'RSA-SHA512', function(err, hash) {
        cb(md5(hash.toString('hex')));
    });
}

function signup(details, cb) {
    findUser(details, function(user, method) {
        if (user != null) {
            cb(1, method);
        } else {
            var salt = getSalt();
            saltHash(salt, details.password, function(hash) {
                hash = hash.toString('hex');
                mongo.users.insertOne({
                    name: details.username,
                    searchName: util.clearChars(details.username),
                    salt: salt,
                    hash: hash,
                    email: details.email
                }, function(err, user) {
                    cb(0);
                });
            });
        }
    });
}

function findUser(details, cb) {
    mongo.users.findOne({
        name: details.username
    }, function(err, user) {
        if (!!user) {
            cb(user, 'name');
            return;
        }
        mongo.users.findOne({
            email: details.email
        }, function(err, user) {
            if (!!user) {
                cb(user, 'email');
                return;
            }
            cb(null);
        });
    });
}

function login(details, cb) {
    mongo.users.findOne({
        $or: [{
            name: details.username
        }, {
            email: details.username
        }]
    }, function(err, user) {
        if (user == null) {
            cb(1, 'User Not Found');
            return;
        }
        if (!user.password && !!user.github) {
            cb(1, 'Please login using github instead.');
            return;
        }
        var salt = user.salt;
        saltHash(salt, details.password, function(hash) {
            if (hash !== user.hash)
                cb(1, 'Incorrect Password');
            else
                cb(0, null, user);
        })
    })
}

module.exports.signup = signup;
module.exports.findUser = findUser;
module.exports.login = login;
