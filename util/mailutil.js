var sendmailTransport = require('nodemailer-sendmail-transport');
var nodemailer = require('nodemailer');
var transport = nodemailer.createTransport(sendmailTransport());
var pug = require('pug');
var path = require('path');

var EMailer = function EMailer() {
    
}

EMailer.prototype.send = function send(to, subject, file, variables={}, cb) {
    var html = pug.renderFile(path.join(__dirname, '..', 'views', file + '.pug'), variables);
    transport.sendMail({
        from: '"Admin" <admin@eyeball.online>',
        to: to,
        subject: subject,
        html: html
    }, (err, info) => {
        cb();
    });
}

module.exports = EMailer;
