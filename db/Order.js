const db = require('./index')
const mongoose = require('mongoose')
const crypto = require("crypto");
const validator = require('validator')
const {
    commerceOrderNotExists,
    commerceOrderAlreadyCancelled,
    commerceOrderAlreadyInStatus
} = require("../utils/errors");

const itemSchema = new db.Schema({
    sku: {
        type: db.Schema.Types.ObjectId,
        ref: 'sku',
        required: true
    },
    quantity: {
        type: Number,
        default: 1
    },
    size: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    bonuses: {
        type: Number,
        default: 0
    }
}, {
    _id: false
})

const schema = new db.Schema({
    owner: {
        type: db.Schema.Types.ObjectId,
        rel: 'user',
        select: false
    },
    secret: {
        type: String,
        required: true,
        maxLength: 200
    },
    shippingStatus: {
        type: String,
        enum: ['assembling', 'shipping', 'collected'],
        default: 'assembling'
    },
    status: {
        type: String,
        enum: ['active', 'rejected', 'resolved', 'cancelled'],
        default: 'active'
    },
    items: [itemSchema],
    shipping: {
        price: {
            type: Number,
            default: 0
        },
        exceptDelivery: {
            type: Date,
            required: true
        },
        contact: {
            name: {
                type: String,
                required: true,
                maxLength: 30
            },
            surname: {
                type: String,
                required: true,
                maxLength: 30
            }
        },
        address: {
            location: {
                type: String,
                required: true,
                maxLength: 30
            },
            city: {
                type: String,
                required: true,
                maxLength: 30
            },
            street: {
                type: String,
                required: true,
                maxLength: 30
            },
            house: {
                type: String,
                required: true,
                maxLength: 30
            },
            postcode: {
                type: String,
                required: true,
                validate: {
                    validator: v => validator.isPostalCode(v, 'BY'),
                    message: props => `${props.value} is not a valid postcode number!`
                }
            }
        }
    },
    payment: {

        cardNumber: {
            type: String,
            required: true,
            validate: {
                validator: v => /^\d{16}$/.test(v),
                message: props => `${props.value} is not a valid card number!`
            },
            select: false
        },
        operation: {
            type: String,
            required: true,
            maxLength: 200,
            select: false,
        }
    }

}, {
    timestamps: {
        createdAt: true,
        updatedAt: true
    },
    toJSON: {
        versionKey: false
    }
})

schema.statics.$createOrder = async function (
    {
        items,
        shippingLocation,
        shippingCity,
        shippingStreet,
        shippingHouse,
        shippingPostcode,
        shippingPrice,
        contactName,
        contactSurname,
        owner,
        cardNumber,
        operation
    },
    session
) {
    const secret = crypto.randomBytes(32).toString('hex')

    await this.create([{
        ...owner ? {owner} : {},
        secret,
        items,
        shipping: {
            price: shippingPrice,
            exceptDelivery: new Date(Date.now() + 86000000),
            address: {
                location: shippingLocation,
                city: shippingCity,
                street: shippingStreet,
                house: shippingHouse,
                postcode: shippingPostcode
            },
            contact: {
                name: contactName,
                surname: contactSurname
            }
        },
        payment: {
            cardNumber,
            operation
        }
    }], {session})

    return secret
}

schema.statics.$cancelOrder = async function (orderId, session) {
    const data = await this.updateOne({
        _id: orderId
    }, {
        $set: {
            status: 'cancelled'
        }
    }).session(session)

    if (!data.matchedCount) throw commerceOrderNotExists
    if (!data.modifiedCount) throw commerceOrderAlreadyCancelled

    return data
}

schema.statics.changeOrderStatus = async function (orderId, status) {
    const data = await this.updateOne({
        _id: orderId
    }, {
        $set: {
            status: status
        }
    })

    if (!data.matchedCount) throw commerceOrderNotExists
    if (!data.modifiedCount) throw commerceOrderAlreadyInStatus

    return data
}

schema.statics.changeShippingStatus = async function (orderId, status) {
    const data = await this.updateOne({
        _id: orderId
    }, {
        $set: {
            shippingStatus: status
        }
    })

    if (!data.matchedCount) throw commerceOrderNotExists
    if (!data.modifiedCount) throw commerceOrderAlreadyInStatus

    return data
}

schema.statics.getUserOrders = async function (userId, offset = 0, limit = 30) {
    const [orders, totalCount] = await Promise.all([
            this.find(
                {
                    owner: userId
                }
            )
                .populate({
                    path: 'items.sku',
                    ref: 'sku'
                })
        ]
    )

    return {
        totalCount,
        orders,
        offset,
        limit,
        nextOffset: offset + orders.length,
    }
}


module.exports = db.model('order', schema, 'orders')