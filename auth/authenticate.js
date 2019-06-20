const jwt = require('jsonwebtoken');
const config = require('../appConfig')
const Session = require('./sessionModel');

const ObjectId = require('mongoose').Types.ObjectId;
var helper = require('../app/helper');
var logger = helper.getLogger('authenticate');


module.exports = (req, res, next) => {

    let token = req.headers['x-auth-token'];
    let secretOrKey = config.jwtSecret;

    try {
        var decoded = jwt.verify(token, secretOrKey);

        if (!ObjectId.isValid(decoded.id)) {
            throw 'Invalid Id';
        }

    } catch (err) {
    
        return res.status(401).json({
            success: false,
            status: 401,
            message: 'Invalid or expired token'
        });
    }

    Session.findOne({
        userId: decoded.id,
        token: token
    }).populate('userId').exec(async (err, user) => {
        if (err) {
            logger.debug('Error while populating user object');
            logger.error(err);
            next(err);
        }
        if (user && user.userId) {
            req.user = user.userId;

            console.log("user",req.user)
            return next();
        } else {
            logger.debug('Session not found');
            return res.status(401).json({
                success: false,
                status: 401,
                message: 'Invalid or expired token'
            });
        }
    });
};