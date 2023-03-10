const db = require('./index')

const schema = new db.Schema({
    owner: {
        type: db.Schema.Types.ObjectId,
        rel: 'user',
        required: true
    },
    product: {
        type: db.Schema.Types.ObjectId,
        rel: 'user',
        required: true
    },
    sku: {
        type: db.Schema.Types.ObjectId,
        required: true
    },
    quantity: {
        type: Number,
        default: 1
    },
    pricing: {
        delivery: {
            type: Number,
            required: true
        },
        price: {
            type: Number,
            required: true
        },
        sale: {
            type: Number,
            required: false
        },
        bonuses: {
            type: Number,
            default: 0
        }
    },
    shipping: {
        exceptedTime: {
            type: Date,
            required: true
        },
        address: {
            location: {
                type: String,
                required: true
            },
            city: {
                type: String,
                required: true
            },
            street: {
                type: String,
                required: true
            },
            house: {
                type: String,
                required: true
            },
            postcode: {
                type: String,
                required: true
            }
        }
    }
}, {
    timestamps: {
        createdAt: true,
        updatedAt: true
    }
})