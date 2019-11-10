const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema(
    {
            'from': { type: String, required: true, lowercase: true, trim: true },
            'to': { type: String, required: true, trim: true },
            'amount': { type: String, required: true,enum:['Org1','Org2']},
            'txId': { type: String, required: true}

    },{
        'timestamps': {
            'createdAt': 'created_at',
            'updatedAt': 'updated_at'
        }
    });




// create and export model
const Transactions = mongoose.model('Transactions', TransactionSchema, 'Transactions');
module.exports = Transactions;