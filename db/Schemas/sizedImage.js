const db = require("../index");

module.exports = new db.Schema({
    size: {
        type: Number,
        required: true,
        enum: [32, 64, 256, 512, 1024]
    },
    image: {
        type: String,
        required: true
    }
}, {
    _id: false,
    versionKey: false,
    virtuals: {
        url: {
            get() {
                return `${process.env.HOST}static/images/${this.image}`
            }
        }
    },
    toObject: {
        virtuals: true
    },
    toJSON: {
        virtuals: true
    }
})