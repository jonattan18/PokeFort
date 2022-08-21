//Load models
const user_model = require('../models/user');

// Function to send an mail to a user
function sendmail(userid, from, subject, message, attachment, image_url, notification = false) {

    // Send mail to user
    var mail_object = {
        From: from,
        Subject: subject,
        Message: message,
        ImageURL: image_url || undefined,
        Attachment: attachment || undefined,
        Claimed: false,
        Read: false,
        Timestamp: Date.now()
    }

    user_model.findOneAndUpdate({ UserID: userid }, { $set: { MailNotice: notification }, $push: { Mails: mail_object } }, function (err, updated) {
        if (err) return console.log(err);
    });
}

module.exports = { sendmail };