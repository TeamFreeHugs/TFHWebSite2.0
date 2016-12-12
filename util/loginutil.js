var crypto = require('crypto');
var EMailer = require('./mailutil.js');

var mailer = new EMailer();

function handleOAuthLogin(req, res, userData, service, serviceUsername) {
    mongo.users.findOne(userData, (err, user) => {
        if (user[service]) {
            req.session.user = user;
            res.redirect('/');
        } else {
            // Linking for first time
            var pendingCode = crypto.randomBytes(32).toString('hex');
            mongo.pendingItems.insertOne({
                type: 'account_link',
                user: userData,
                service: service,
                code: pendingCode,
                username: serviceUsername
            }, function() {
                mailer.send(user.email, 'Confirm the linking of your account', 'emails/linking-confirm', {
                    accountName: user.name,
                    service: service,
                    serviceUsername: serviceUsername,
                    id: pendingCode
                }, function() {
                    res.redirect('/users/linking-pending');
                });
            });
        }
    });
};

module.exports.handleOAuthLogin = handleOAuthLogin;
