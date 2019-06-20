/**
 * @author Himanshu Chawla
 * 
 * Configure passport for signup and login for the user
 */

const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/user');
var helper = require('../app/helper');
var logger = helper.getLogger('passport');


module.exports = (passport) => {



    // for serialization and deserialization
    passport.serializeUser(function (user, done) {
        done(null, user);
    });



    passport.deserializeUser(function (user, done) {
        done(null, user);
    });



    // handle user local signup
    passport.use('user-local-signup', new LocalStrategy(
        {
            usernameField: 'email',
            passwordField: 'password',
            passReqToCallback: true
        }, (req, email, password, done) => {
            process.nextTick(async () => {
                try {
                    const exists = await User.findOne({
                        'email': email
                    });

                    if (exists) { // already existing
                        return done(null, {
                            'isError': true,
                            'message': "User with this mail already exists"
                        });
                    }

                    // create a new user
                    let newUser = new User();
                     newUser.email = email;
                     newUser.password =  newUser.generateHash(password);
                     newUser.orgName = req.body.orgName;
                     newUser.username = email;
                    
                  
                    
        

                    const saveRes = await newUser.save();

                    return done(null, newUser);
                } catch (err) {
                    logger.debug('Error occured in User local signup');
                    logger.error(err);
                    done(err);
                }
            });
        }
    ));



    // handle user login
    passport.use('user-local-login', new LocalStrategy(
        {
            usernameField: 'email',
            passwordField: 'password',
            passReqToCallback: true
        }, (req, email, password, done) => {

            process.nextTick(async () => { // prevent async calling of callback without data
                try {
                    console.log("user",email,password)
                    let user = await User.findOne({
                        'email': email
                    });
                    if (!user) {
                        return done(null, {
                            'isError': true,
                            'message': "Email and password doesn,t match"
                        });
                    }


            

                    // check password
                    if (user.validPassword(password)) {
                      
                        const token = await user.genAuthtoken();

                        req.token = token;
                        done(null, user);
                    } else {
                        return done(null, {
                            isError: true,
                            message: "Email and password doesn,t match"
                        });
                    }
                } catch (err) {
                    logger.debug('Error occured in User login');
                    logger.error(err);
                    done(err);
                }
            }); // process.nextTick

        })); // local login



};