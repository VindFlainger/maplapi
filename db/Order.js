const db = require('./index')
const mongoose = require('mongoose')

const itemSchema = new db.Schema({
    skuId: {
        type: db.Schema.Types.ObjectId,
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
    },
}, {
    _id: false
})

const schema = new db.Schema({
    owner: {
        type: db.Schema.Types.ObjectId,
        rel: 'user',
        required: true
    },
    status: {
        type: String,
        enum: ['assembling', 'shipping', 'collected']
    },
    totalPrice: {
        type: Number,
        required: true
    },
    items: [itemSchema],
    shipping: {
        price: {
            type: Number,
            default: 0
        },
        excepted: {
            type: Date,
            required: true
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
            }
        },
        operation: {
            type: String,
            required: true,
            maxLength: 200
        }
    }

}, {
    timestamps: {
        createdAt: true,
        updatedAt: true
    }
})

schema.statics.getOrders = async function (userId, offset = 0, limit = 30) {
    const [orders, totalCount] = await Promise.all(
        [
            this.aggregate([
                {
                    $match: {
                        owner: new mongoose.Types.ObjectId(userId)
                    }
                },
                {
                    $skip: offset
                },
                {
                    $limit: limit
                },
                {
                    $unwind: {
                        path: "$items",
                    },
                },
                {
                    $set: {
                        item: "$items",
                    },
                },
                {
                    $unset: ["items"],
                },
                {
                    $lookup: {
                        from: "products",
                        localField: "item.skuId",
                        foreignField: "skus._id",
                        as: "product",
                    },
                },
                {
                    $set: {
                        product: {
                            $arrayElemAt: ["$product", 0],
                        },
                    },
                },
                {
                    $set: {
                        "item.sku": {
                            $arrayElemAt: [
                                {
                                    $filter: {
                                        input: "$product.skus",
                                        as: "sku",
                                        cond: {
                                            $eq: ["$$sku._id", "$item.skuId"],
                                        },
                                    },
                                },
                                0,
                            ],
                        },
                    },
                },
                {
                    $unset: [
                        "item.sku.sizing",
                        "item.sku.pricing",
                    ],
                },
                {
                    $set: {
                        "item.sku.images": {
                            $map: {
                                input: {
                                    $arrayElemAt: ["$item.sku.images", 0],
                                },
                                as: "image",
                                in: {
                                    size: "$$image.size",
                                    url: {
                                        $concat: ["$$image.image"],
                                    },
                                },
                            },
                        },
                        "item.sku.id": "$item.sku._id",
                        "item.sku.name": "$product.name"
                    },
                },
                {
                    $group: {
                        _id: {
                            _id: "$_id",
                            id: "$_id",
                            owner: "$owner",
                            status: "$status",
                            totalPrice: "$totalPrice",
                            shipping: "$shipping",
                            payment: '$payment'
                        },
                        items: {
                            $push: "$item",
                        },
                    },
                },
                {
                    $replaceWith: {
                        $mergeObjects: [
                            {
                                items: "$items",
                            },
                            "$_id",
                        ],
                    },
                },
            ]),
            this.count({
                owner: userId
            }),
        ]
    )

    return {
        totalCount,
        orders,
        offset,
        limit,
        nextOffset: offset + orders.length
    }
}

module.exports = db.model('order', schema, 'orders')