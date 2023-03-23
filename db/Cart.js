const db = require('./index')
const {commerceCartNotExists, commerceCartItemNotExists} = require("../utils/errors");
const crypto = require("crypto");

const schema = new db.Schema({
    unicId: {
        type: String,
        required: false
    },
    items: [{
        quantity: {
            type: Number,
            default: 1,
            min: 1
        },
        size: {
            type: String,
            required: true,
            maxLength: 30
        },
        sku: {
            type: db.Schema.Types.ObjectId,
            required: true
        },
        _id: false
    }],
})

schema.statics.addItem = async function (cartId, skuId, size, quantity) {
    const isExists = await this.exists({
        unicId: cartId,
        'items': {
            $elemMatch: {
                size,
                sku: skuId
            }
        }
    })


    if (isExists) {
        await this.updateOne({
            unicId: cartId,
            'items': {
                $elemMatch: {
                    sku: skuId,
                    size
                }
            }
        }, {$set: {'items.$.quantity': quantity}})
    } else {
        await this.updateOne({
            unicId: cartId
        }, {
            $addToSet: {
                "items": {
                    sku: skuId,
                    quantity,
                    size
                }
            }
        })
    }

    return await this.getItems(cartId)
}

schema.statics.delItem = async function (cartId, skuId, size) {
    const data = await this.updateOne({
        unicId: cartId
    }, {
        $pull: {
            "items": {
                sku: skuId,
                size

            }
        }
    })

    if (!data.matchedCount) throw commerceCartNotExists

    if (!data.modifiedCount) throw commerceCartItemNotExists

    return await this.getItems(cartId)
}

schema.statics.getItems = async function (cartId) {
    // efficiency has left the chat =(
    // TODO: think about another approach of live updating
    const aggregated = await this.aggregate(
        [
            {
                $match: {
                    unicId: cartId,
                },
            },
            {
                $lookup: {
                    from: "skus",
                    localField: "items.sku",
                    foreignField: "_id",
                    as: "skus",
                },
            },
            {
                $set: {
                    items: {
                        $filter: {
                            input: "$items",
                            as: "item",
                            cond: {
                                $in: ["$$item.sku", "$skus._id"],
                            },
                        },
                    },
                },
            },
            {
                $set: {
                    items: {
                        $map: {
                            input: "$items",
                            as: "item",
                            in: {
                                quantity: "$$item.quantity",
                                size: "$$item.size",
                                expires: "$$item.expires",
                                skuId: "$$item.sku",
                                sku: {
                                    $arrayElemAt: [
                                        "$skus",
                                        {
                                            $indexOfArray: [
                                                "$skus._id",
                                                "$$item.sku",
                                            ],
                                        },
                                    ],
                                },
                            },
                        },
                    },
                },
            },
            {
                $set: {
                    items: {
                        $map: {
                            input: "$items",
                            as: "item",
                            in: {
                                $mergeObjects: [
                                    "$$item",
                                    {
                                        sku: {
                                            $mergeObjects: [
                                                "$$item.sku",
                                                {
                                                    availableQuantity: {
                                                        $reduce: {
                                                            input:
                                                                "$$item.sku.sizing",
                                                            initialValue: 0,
                                                            in: {
                                                                $cond: [
                                                                    {
                                                                        $eq: [
                                                                            "$$this.size",
                                                                            "$$item.size",
                                                                        ],
                                                                    },
                                                                    "$$this.quantity",
                                                                    "$$value",
                                                                ],
                                                            },
                                                        },
                                                    },
                                                },
                                            ],
                                        },
                                    },
                                ],
                            },
                        },
                    },
                },
            },
            {
                $set: {
                    items: {
                        $filter: {
                            input: "$items",
                            as: "item",
                            cond: {
                                $gt: [
                                    "$$item.sku.availableQuantity",
                                    0,
                                ],
                            },
                        },
                    },
                },
            },
            {
                $set: {
                    items: {
                        $map: {
                            input: "$items",
                            as: "item",
                            in: {
                                $mergeObjects: [
                                    "$$item",
                                    {
                                        quantity: {
                                            $min: [
                                                "$$item.quantity",
                                                "$$item.sku.availableQuantity",
                                            ],
                                        },
                                    },
                                    {
                                        sku: {
                                            $mergeObjects: [
                                                "$$item.sku",
                                                {
                                                    sizing: {
                                                        $map: {
                                                            input:
                                                                "$$item.sku.sizing",
                                                            as: "size",
                                                            in: "$$size.size",
                                                        },
                                                    },
                                                },
                                            ],
                                        },
                                    },
                                ],
                            },
                        },
                    },
                },
            },
            {
                $unset: [
                    "skus",
                    "items.sku.availableQuantity",
                ],
            },
        ]
    )

    const cart = aggregated[0]

    if (!cart) throw commerceCartNotExists

    await this.updateOne({
        unicId: cartId
    }, {
        $set: {
            items: cart.items
        }
    })

    return cart.items
}


schema.statics.initCart = async function () {
    const unicId = crypto.randomBytes(32).toString('hex')

    await this.create({
        unicId,
        items: []
    })

    return unicId
}

// TODO: rewrite with the specialized mongoDB query
schema.statics.mergeCarts = async function (aCartId, bCartId) {
    const [aCart, bCart] = await Promise.all([
        this.findOne({
            unicId: aCartId
        }),
        this.findOne({
            unicId: bCartId
        }),

    ])

    if (!aCart || !bCart) throw commerceCartNotExists

    await Promise.all(bCart.items.map(item => this.addItem(aCartId, item.sku, item.size, item.quantity)))

    return await this.getItems(aCartId)
}

module.exports = db.model('cart', schema, 'carts')