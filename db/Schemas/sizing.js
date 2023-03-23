const db = require("../index");

const sizing = new db.Schema({
        size: {
            type: String,
            required: true,
            maxLength: 30
        },
        quantity: {
            type: Number,
            required: true
        }
    }
)

module.exports = sizing