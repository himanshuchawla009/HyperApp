
const Admin = require('../models/user');
const config = require('../appConfig');
var log4js = require('log4js');
var logger = log4js.getLogger('createAdmin');



async function removeEverthing() {

    try {
       await Admin.remove({});
       console.log("removed everything")
       createAdmin();
    } catch (error) {
        throw(error);
    }
}


 async function createAdmin() {

    try {
        let adminExist = await Admin.findOne({email:config.adminEmail});
        if(adminExist === null) {

             // create a new user
             let newUser = new Admin();
             newUser.email = config.adminEmail;
             newUser.password =  newUser.generateHash(config.password);
             newUser.orgName = 'Org1';
             newUser.username = config.adminEmail;
             newUser.loginType= 'admin'
            
          
            


            const saveRes = await newUser.save();


          



        } else {
 
            logger.debug("Admin already exists");
        }
    } catch (error) {
        throw(error);
    }
}

removeEverthing();
