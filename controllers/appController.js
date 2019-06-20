
var log4js = require('log4js');
var logger = log4js.getLogger('appController');
var express = require('express');
var configModel = require('../models/configuration');
var appConfig = require('../appConfig');
const User = require('../models/user');
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

var LocalStorage = require('node-localstorage').LocalStorage;
localStorage = new LocalStorage('./adminSteps');
require('./createAdmin');
const download = require('downloadjs');

const wallet = require('./wallet');

const dao = {};


function getErrorMessage(field) {
    var response = {
        success: false,
        message: field + ' field is missing or Invalid in the request'
    };
    return response;
}


dao.userSignup = async (req, res, next) => {
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
        logger.debug('-- returned from registering the username %s for organization %s', username, orgName);
        if (response && typeof response !== 'string') {
            logger.debug('Successfully registered the username %s for organization %s', username, orgName);

            res.status(200).json({
                success: true,
                message: "User registered successfully"
            });
        } else {
            logger.debug('Failed to register the username %s for organization %s with::%s', username, orgName, response);
            res.status(200).json({ success: false, message: response });
        }
    } catch (error) {
        res.status(200).json({
            success: false,
            message: error
        });
    }
}



dao.userLogin = async (req, res, next) => {
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
            success: false,
            message: error
        });
    }
}



dao.adminLogin = async (req, res, next) => {
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
            if (user.loginType === 'admin') {
                res.status(200).json({
                    success: true,
                    status: 200,
                    authToken: req.token
                });
            } else {

                res.status(200).json({
                    success: false,
                    status: 200,
                    message: "Email and password doesnot match"
                });

            }
        }
    } catch (error) {
        res.status(200).json({
            success: false,
            message: error
        });
    }
}


dao.addOrgUser = async (req, res, next) => {
    try {


        var orgName = req.body.orgName;


        logger.debug('End point : /admin/addOrgUser');

        logger.debug('Org name  : ' + orgName);

        if (!orgName) {
            res.json(getErrorMessage('\'orgName\''));
            return;
        }

        if (orgName !== 'Org1' && orgName !== 'Org2') {
            res.status(200).json({
                success: false,
                message: `Invalid org name  ${orgName}`
            })
        }

        let username;

        if (orgName === 'Org1') {
            username = appConfig.org1User;
            if (localStorage.getItem('orgOne')) {

                res.status(200).json({
                    success: false,
                    message: `${orgName} user already exist`
                })
            }
        }

        if (orgName === 'Org2') {
            username = appConfig.org2User;
            if (localStorage.getItem('orgTwo')) {
                res.status(200).json({
                    success: false,
                    message: `${orgName} user already exist`
                })
            }

        }



        let response = await helper.getRegisteredUser(username, orgName, true);
        logger.debug('-- returned from registering the username %s for organization %s', username, orgName);
        if (response && typeof response !== 'string') {
            logger.debug('Successfully registered the username %s for organization %s', username, orgName);


            if (orgName === 'Org1') {
                localStorage.setItem('orgOne', true);
            } else {
                localStorage.setItem('orgTwo', true);
            }



            response.success = true;

            res.status(200).json(response);
        } else {
            logger.debug('Failed to register the username %s for organization %s with::%s', username, orgName, response);
            res.json({ success: false, message: response });
        }
    } catch (error) {
        res.status(200).json({
            success: false,
            message: error
        });
    }
}


dao.addChannel = async (req, res, next) => {
    try {
        if (localStorage.getItem('channel')) {
            res.status(200).json({
                success: false,
                message: "Channel already added"
            });
        } else {
            logger.info('<<<<<<<<<<<<<<<<< C R E A T E  C H A N N E L >>>>>>>>>>>>>>>>>');
            logger.debug('End point : /channels');

            let username = appConfig.org1User;
            let orgName = appConfig.org1Name;
            let channelName = 'mychannel';
            let channelPath = '../artifacts/channel/mychannel.tx';
            let result = await createChannel.createChannel(channelName, channelPath, username, orgName);

            if (result.success) {
                localStorage.setItem("channel", true);
            }
            res.status(200).json({
                success: true,
                message:result.message
            });
        }
    } catch (error) {   
        res.status(200).json({
            success: false,
            message: error
        });
    }
}



dao.joinChannel = async (req, res, next) => {
    try {
        let orgName = req.body.orgName;
        if (!orgName) {
            res.json(getErrorMessage('\'orgName\''));
            return;
        }

        if (orgName !== 'Org1' && orgName !== 'Org2') {
            res.status(200).json({
                success: false,
                message: `Invalid org name  ${orgName}`
            })
        }

        let username;

        let channelName = 'mychannel';

        let peers;

        if (orgName === 'Org1') {
            if (localStorage.getItem('joinOrgOne')) {
                res.status(200).json({
                    success: false,
                    message: "Org one has already joined channel"
                });
            } else {
                username = appConfig.org1User;
                orgName = appConfig.org1Name;
                peers = ["peer0.org1.example.com", "peer1.org1.example.com"]

            }

        }

        if (orgName === 'Org2') {
            if (localStorage.getItem('joinOrgTwo')) {
                res.status(200).json({
                    success: false,
                    message: "Org two has already joined channel"
                });
            } else {
                username = appConfig.org2User;
                orgName = appConfig.org2Name;
                peers = ["peer0.org2.example.com", "peer1.org2.example.com"]

            }
        }


        logger.info('<<<<<<<<<<<<<<<<< J O I N  C H A N N E L >>>>>>>>>>>>>>>>>');



        let result = await join.joinChannel(channelName, peers, username, orgName);

        if (result.success && orgName === 'Org1') {
            localStorage.setItem("joinOrgOne", true)
        } else if (result.success && orgName === 'Org2') {
            localStorage.setItem("joinOrgTwo", true)
        }

        res.status(200).json(result);

    } catch (error) {
       throw error;
    }
}




dao.installChaincode = async (req, res, next) => {
    try {
        let orgName = req.body.orgName;
        if (!orgName) {
            res.json(getErrorMessage('\'orgName\''));
            return;
        }

        if (orgName !== 'Org1' && orgName !== 'Org2') {
            res.status(200).json({
                success: false,
                message: `Invalid org name  ${orgName}`
            })
        }

        let username;

        let channelName = 'mychannel';

        let peers;

        if (orgName === 'Org1') {
            if (localStorage.getItem('chaincodeOrgOne')) {
                res.status(200).json({
                    success: false,
                    message: "Chaincode already installed on org one"
                });
            } else {
                username = appConfig.org1User;
                orgName = appConfig.org1Name;
                peers = ["peer0.org1.example.com", "peer1.org1.example.com"]

            }

        }

        if (orgName === 'Org2') {
            if (localStorage.getItem('chaincodeOrgTwo')) {
                res.status(200).json({
                    success: false,
                    message: "Chaincode already installed on org two"
                });
            } else {
                username = appConfig.org2User;
                orgName = appConfig.org2Name;
                peers = ["peer0.org2.example.com", "peer1.org2.example.com"]

            }
        }


        logger.debug('==================== INSTALL CHAINCODE ==================');

        var chaincodeName = appConfig.chaincodeName;
        var chaincodePath = appConfig.chaincodePath;
        var chaincodeVersion = appConfig.chaincodeVersion;
        var chaincodeType = appConfig.chaincodeType;
        logger.debug('peers : ' + peers); // target peers list
        logger.debug('chaincodeName : ' + chaincodeName);
        logger.debug('chaincodePath  : ' + chaincodePath);
        logger.debug('chaincodeVersion  : ' + chaincodeVersion);
        logger.debug('chaincodeType  : ' + chaincodeType);

        let result = await install.installChaincode(peers, chaincodeName, chaincodePath, chaincodeVersion, chaincodeType, username, orgName)

        if (result.success && orgName === 'Org1') {
            localStorage.setItem("chaincodeOrgOne", true)
        } else if (result.success && orgName === 'Org2') {
            localStorage.setItem("chaincodeOrgTwo", true)
        }

        res.status(200).json(result);

    } catch (error) {
       
        throw error;
    }
}

dao.instantiateChaincode = async (req, res, next) => {
    try {
        if (localStorage.getItem('instantiate')) {
            res.status(200).json({
                success: false,
                message: "Chaincode already instantiated"
            });
        } else {
            var peers = ["peer0.org1.example.com", "peer1.org1.example.com"];
            var chaincodeName = appConfig.chaincodeName;
            var chaincodeVersion = appConfig.chaincodeVersion;
            var channelName = appConfig.channelName;
            var chaincodeType = appConfig.chaincodeType;
            var fcn = req.body.fcn;
            var username = appConfig.org1User;
            var orgName = appConfig.org1Name;
            var args = [];
            logger.debug('peers  : ' + peers);
            logger.debug('channelName  : ' + channelName);
            logger.debug('chaincodeName : ' + chaincodeName);
            logger.debug('chaincodeVersion  : ' + chaincodeVersion);
            logger.debug('chaincodeType  : ' + chaincodeType);
            logger.debug('fcn  : ' + fcn);
            logger.debug('args  : ' + args);


            let result = await instantiate.instantiateChaincode(peers, channelName, chaincodeName, chaincodeVersion, chaincodeType, fcn, args, username, orgName);
            if (result.success) {
                localStorage.setItem("instantiate", true)
            }

            res.status(200).json(result);
        }
    } catch (error) {
        res.status(200).json({
            success: false,
            message: error
        });
    }
}


dao.invokeTransaction = async (req, res, next) => {
    try {
        logger.debug('==================== INVOKE ON CHAINCODE ==================');
        var peers = ["peer0.org1.example.com", "peer0.org2.example.com"];
        var chaincodeName = appConfig.chaincodeName;
        var channelName = appConfig.channelName;
        var fcn = req.body.fcn;
        var args = req.body.args;
        var username = req.user.username;
        var orgName = req.user.orgName;
        logger.debug('channelName  : ' + channelName);
        logger.debug('chaincodeName : ' + chaincodeName);
        logger.debug('fcn  : ' + fcn);
        logger.debug('args  : ' + args);
        if (!chaincodeName) {
            res.json(getErrorMessage('\'chaincodeName\''));
            return;
        }
        if (!channelName) {
            res.json(getErrorMessage('\'channelName\''));
            return;
        }
        if (!fcn) {
            res.json(getErrorMessage('\'fcn\''));
            return;
        }
        if (!args) {
            res.json(getErrorMessage('\'args\''));
            return;
        }

        let message = await invoke.invokeChaincode(peers, channelName, chaincodeName, fcn, args, username, orgName);

        res.status(200).json(message)
    } catch (error) {
        res.status(200).json({
            success: false,
            message: error
        });
    }
}

dao.queryChaincode = async (req, res, next) => {
    try {
        logger.debug('==================== QUERY BY CHAINCODE ==================');
        var peer = "peer0.org1.example.com";
        var chaincodeName = appConfig.chaincodeName;
        var channelName = appConfig.channelName;
        var fcn = req.body.fcn;
        var args = req.body.args;
        var username = req.user.username;
        var orgName = req.user.orgName;

        logger.debug('channelName : ' + channelName);
        logger.debug('chaincodeName : ' + chaincodeName);
        logger.debug('fcn : ' + fcn);
        logger.debug('args : ' + args);

        if (!chaincodeName) {
            res.json(getErrorMessage('\'chaincodeName\''));
            return;
        }
        if (!channelName) {
            res.json(getErrorMessage('\'channelName\''));
            return;
        }
        if (!fcn) {
            res.json(getErrorMessage('\'fcn\''));
            return;
        }
        if (!args) {
            res.json(getErrorMessage('\'args\''));
            return;
        }
        args = args.replace(/'/g, '"');
        args = JSON.parse(args);
        logger.debug(args);

        let message = await query.queryChaincode(peer, channelName, chaincodeName, args, fcn, username, orgName);
        res.status(200).json(message)
    } catch (error) {
        res.status(200).json({
            success: false,
            message: error
        });
    }
}

dao.createAccount = async(req,res,next)=>{
    try {
        let pincode = req.body.pincode;
        let fcn = "CreateAccount"
        var peers = ["peer0.org1.example.com", "peer0.org2.example.com"];
        var chaincodeName = appConfig.chaincodeName;
        var channelName = appConfig.channelName;
     
        var username;
        var orgName;


        if(req.user.loginType === 'admin') {
            username= appConfig.org1User;
            orgName = appConfig.org1Name;
        } else {

            username= req.user.username;
            orgName = req.user.orgName;
        }
        if (!pincode) {
            res.json(getErrorMessage('\'pincode\''));
            return;
        }
        
        // if(req.user.wallet !== false) {
        //     res.status(200).json({
        //         success:false,
        //         message:"Your wallet is already linked with an account"
        //     })
        // }

        const key = wallet.genKey();
        console.log("ecdsa keys",key)
        //getting address from ecdsa keys
        const address = wallet.getWallet(key);
        console.log("address",address)
        //getting private key in pem file form from ecdsa key
        const pem = await wallet.getPrivatekeyAsPem(key);

        console.log("private pem",pem)

        //encrypting private key pem file with pincode
        const cipherString = wallet.getPrivateKeyAsCrypto(pem, pincode);

        console.log("cipher string",cipherString)
        //creating hash of json to be sent to chaincode
        const json_hash = wallet.createAccount(key, appConfig.delimiter);
        // console.log(address)
        console.log("json hash",json_hash)
        // const t = new Date().getTime();
        // const keyfile = {
        //   enc: `enc_key_${address}_${t}.${delimiter.replace(/\./g, '').toLowerCase()}`,
        //   pem: `pk-key_${address}_${t}.pem`,
        // };

        //encrypted file key 
        //todo: save this in file system
        //download(cipherString, keyfile.enc);

        //unencrypted file , to do: sent to user
        //download(pem, keyfile.pem);

        //todo: save cipherstring,address in database
        // return {
        //   address,
        //   cipherString,
        //   json_hash,
        //   pem,
        //   keyfile,
        // }; 

        // res.status(200).json({
        //     success:true,
        //     address,
        //     cipherString,
        //     json_hash
        // })
        let args = [json_hash];

       


        logger.debug("login type:" + req.user.loginType);
        logger.debug('channelName  : ' + channelName);
        logger.debug('chaincodeName : ' + chaincodeName);
        logger.debug('fcn  : ' + fcn);
        logger.debug('args  : ' + args);
        logger.debug('username  : ' + username);
        logger.debug('orgname  : ' + orgName);

        let result = await invoke.invokeChaincode(peers, channelName, chaincodeName, fcn, args, username, orgName);

        if(result.success) {
            let existingUser = await User.findOneAndUpdate({_id:req.user._id},{wallet:true,walletAddress:address,cipherString:cipherString});
        }
        res.status(200).json(result)

    } catch (error) {
        res.status(200).json({
            success: false,
            error: error
        });
    }
}

dao.sendPayment = async(req,res,next)=>{
    try {

        let { pincode,amount, toAddress } = req.body;
    
        let fcn = "Transaction"
        var peers = ["peer0.org1.example.com", "peer0.org2.example.com"];
        var chaincodeName = appConfig.chaincodeName;
        var channelName = appConfig.channelName;
     
        var username;
        var orgName;


        if(req.user.loginType === 'admin') {
            username= appConfig.org1User;
            orgName = appConfig.org1Name;
        } else {

            username= req.user.username;
            orgName = req.user.orgName;
        }
        if (!pincode) {
            res.json(getErrorMessage('\'pincode\''));
            return;
        }
        
        if(req.user.wallet === false) {
            res.status(200).json({
                success: false,
                message: "Please create a wallet before making transaction"
            });
        }

    
        let tx = sendCoins(req.user.cipherString,pincode,amount,toAddress);

        console.log("transaction",tx);
        let args = [tx];

    

        let result = await invoke.invokeChaincode(peers, channelName, chaincodeName, fcn, args, username, orgName);

        // if(result.success) {
        //     let existingUser = await User.findOneAndUpdate({_id:req.user._id},{wallet:true,walletAddress:address,cipherString:cipherString});
        // }
        res.status(200).json(result)
    } catch (error) {
        throw error;
    }
}

sendCoins = async(cipherString,pin,amount,toAddress)=>{
    try {
        let ecdsaKey = wallet.getCryptoAsPrivateKey(cipherString,pin);
        let tx = wallet.makeTransaction(ecdsaKey,amount,toAddress);
        return tx;
    } catch (error) {
        throw error;
    }

}

dao.getConfiguration = async(req,res,next)=>{
    try {

        console.log("hey")

        let result = {
            orgOne: !!localStorage.getItem("orgOne") ? true : false,
            orgTwo: !!localStorage.getItem("orgTwo") ? true : false,
            chaincodeOrgOne: !!localStorage.getItem("chaincodeOrgOne") ? true : false,
            chaincodeOrgTwo: !!localStorage.getItem("chaincodeOrgTwo") ? true : false,
            joinOrgOne: !!localStorage.getItem("joinOrgOne") ? true : false,
            joinOrgTwo:  !!localStorage.getItem("joinOrgTwo") ? true : false,
            instantiate: !!localStorage.getItem("instantiate") ? true : false,
            channel:  !!localStorage.getItem("channel") ? true : false,

        }


        res.status(200).json(result);
        
    } catch (error) {
        throw error;
    }
}
module.exports = dao;