const mongoose = require('mongoose');

const PurchaseRequestSchema = new mongoose.Schema(
    {
            'from': { type: String, required: true, lowercase: true, trim: true },
            'amount': { type: String, required: true},
            'status':{ type: String , default:'pending'},
            'txId': { type: String}

    },{
        'timestamps': {
            'createdAt': 'created_at',
            'updatedAt': 'updated_at'
        }
    });




// create and export model
const PurchaseRequests = mongoose.model('PurchaseRequests', PurchaseRequestSchema, 'PurchaseRequests');
module.exports = PurchaseRequests;