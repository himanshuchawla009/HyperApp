const mongoose = require('mongoose');

const ConfigSchema = new mongoose.Schema(
    {
        'orgOne':{type:Boolean,default:false},
        'orgTwo':{type:Boolean,default:false},
        'channel':{type:Boolean,default:false},
        'joinOrgOne':{type:Boolean,default:false},
        'joinOrgTwo':{type:Boolean,default:false},
        'installOrgOne':{type:Boolean,default:false},
        'installOrgTwo':{type:Boolean,default:false},
        'instantiate':{type:Boolean,default:false},
    });







// create and export model
const Config = mongoose.model('Config', ConfigSchema, 'Config');
module.exports = Config;