const mongoose = require('mongoose');
const config = require('../appConfig');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Session = require('../auth/sessionModel');
const UserSchema = new mongoose.Schema(
    {
            'email': { type: String, required: true, lowercase: true, trim: true },
            'password': { type: String, required: true, trim: true },
            'orgName': { type: String, required: true,enum:['Org1','Org2']},
            'username': { type: String, required: true},
            'wallet': { type: String, default:false },
            'walletAddress': { type: String,default:false },
            'loginType':{type:String,default:'user',enum:['user','admin']}

    });



/**
 * Utility methods
 */


// hash the password
UserSchema.methods.generateHash = function generateHash(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// validate password
UserSchema.methods.validPassword = function validPassword(password) {
    return bcrypt.compareSync(password, this.password);
};

// generate a jwt token and save inside session
UserSchema.methods.genAuthtoken = async function genAuthtoken() {
    let expiresIn = config.tokenExpiryTime;
 
    try {
        const payload = { 'loginType': this.loginType, 'id': this._id, 'email': this.email };
        var token = jwt.sign(payload, config.jwtSecret, { expiresIn }); // eslint-disable-line
    } catch (error) {
       
        throw error;
    }
    await Session.addSession({ token, id: this._id });
    return token;
};



// create and export model
const User = mongoose.model('User', UserSchema, 'User');
module.exports = User;