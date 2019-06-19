const mongoose = require('mongoose');
var helper = require('../app/helper');
var logger = helper.getLogger('Session');

let sessionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    token: [String]
});

// hooks
sessionSchema.pre('save', async (next) => {
    next();
});

// add session for an user
sessionSchema.statics.addSession = ({ id, token = '' }) => {
    UserSession.update({ userId: id }, { $push: { token } }, { upsert: true }).
        then(result => {
            logger.debug('Created a session for user');
            logger.debug(JSON.stringify(result));
        }).
        catch(err => { throw err; });
};

// remove one or more sessions for the user
sessionSchema.statics.removeSession = ({ id, token = '', removeAll = false }) => {
    let params = {};
    if (removeAll) {
        params = { $set: { token: [] } };
    } else {
        params = { $pull: { token } };
    }

    UserSession.update({ userId: id }, params, { upsert: true })
        .then(result => result)
        .catch(err => { throw err; });
};

let UserSession = mongoose.model('UserSession', sessionSchema);
module.exports = UserSession;