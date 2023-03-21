const db = require("../index");

const sizing = new db.Schema({
        size: {
            type: String,
            required: true,
            maxLength: 20
        },
        quantity: {
            type: Number,
            required: true,
            max: 999999
        },
        orders: [
            {
                type: db.Schema.Types.ObjectId,
                ref: 'order'
            }
        ],

    }, {
        toJSON: {
            virtuals: true,
            versionKey: false
        },
        toObject: {
            virtuals: true,
            versionKey: false
        }
    }
)

module.exports