
var log4js = require('log4js');
var logger = log4js.getLogger('appController');
var express = require('express');


var app = express();
var jwt = require('jsonwebtoken');

var hfc = require('fabric-client');

var helper = require('../app/helper.js');
var createChannel = require('../app/create-channel.js');
var join = require('../app/join-channel.js');
var updateAnchorPeers = require('../app/update-anchor-peers.js');
var install = require('../app/install-chaincode.js');
var instantiate = require('../app/instantiate-chaincode.js');
var invoke = require('../app/invoke-transaction.js');
var query = require('../app/query.js');

require('./createAdmin');

const dao = {};

dao.userSignup = async (req,res,next)=>{
    try {
        let user = req.user;
        if (user.isError) {
            logger.debug(user.message);
            return res.status(200).json({
                'success': false,
                'status': 200,
                'message': user.message
            });
        }  

        var username = user.username;
        var orgName = user.orgName;
        logger.debug('End point : /users');
        logger.debug('User name : ' + username);
        logger.debug('Org name  : ' + orgName);
        if (!username) {
            res.json(getErrorMessage('\'username\''));
            return;
        }
        if (!orgName) {
            res.json(getErrorMessage('\'orgName\''));
            return;
        }
       
        let response = await helper.getRegisteredUser(username, orgName, true);
        logger.debug('-- returned from registering the username %s for organization %s',username,orgName);
        if (response && typeof response !== 'string') {
            logger.debug('Successfully registered the username %s for organization %s',username,orgName);
            
            res.status(200).json({
               success:true,
               message:"User registered successfully"
            });
        } else {
            logger.debug('Failed to register the username %s for organization %s with::%s',username,orgName,response);
            res.status(200).json({success: false, message: response});
        }
    } catch (error) {
        res.status(200).json({
            success:true,
            message:error
         });
    }
}



dao.userLogin = async (req,res,next)=>{
    try {
        const user = req.user;
        logger.debug(user);
        if (user.isError) {
             res.status(401).json({
                success: false,
                status: 401,
                message: user.message
            });
        } else {
           res.status(200).json({
                success: true,
                status: 200,
                authToken: req.token
            });
        }
    } catch (error) {
        res.status(200).json({
            success:true,
            message:error
         });
    }
}



dao.adminLogin = async (req,res,next)=>{
    try {
        const user = req.user;
        logger.debug(user);
        if (user.isError) {
             res.status(401).json({
                success: false,
                status: 401,
                message: user.message
            });
        } else {
           if(user.loginType === 'admin') {
            res.status(200).json({
                success: true,
                status: 200,
                authToken: req.token
            });
           } else {
            
                res.status(200).json({
                    success: false,
                    status: 200,
                    message:"Email and password doesnot match"
                }); 
           
        }
    }
    } catch (error) {
        res.status(200).json({
            success:true,
            message:error
         });
    }
}

module.exports = dao;