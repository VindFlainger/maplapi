const db = require('./index')
const {commerceCartNotExists, commerceCartItemNotExists} = require("../utils/errors");

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
        expires: {
            type: Date,
            required: true
        }
    }],
})

schema.statics.addItem = async function (cardId, skuId, size, quantity) {

}

schema.statics.delItem = async function (cardId, skuId) {
    const data = await this.updateOne({
        unicId: cardId
    }, {
        $pull: {
            "items": {
                sku: skuId
            }
        }
    })

    if (!data.matchedCount) throw commerceCartNotExists

    if (!data.modifiedCount) throw commerceCartItemNotExists

    return data
}

schema.statics.getItems = async function (cartId) {
    const aggregated = await this.aggregate([
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
                    $map: {
                        input: {
                            $filter: {
                                input: "$items",
                                as: "item",
                                cond: {
                                    $gte: [
                                        "$$item.expires",
                                        new Date(),
                                    ],
                                },
                            },
                        },
                        as: "item",
                        in: {
                            quantity: "$$item.quantity",
                            size: "$$item.size",
                            expires: "$$item.expires",
                            sku: {
                                $arrayElemAt: [
                                    {
                                        $map: {
                                            input: "$skus",
                                            as: "sku",
                                            in: {
                                                $mergeObjects: [
                                                    "$$sku",
                                                    {
                                                        sizing: {
                                                            $map: {
                                                                input:
                                                                    "$$sku.sizing",
                                                                as: "size",
                                                                in: "$$size.size",
                                                            },
                                                        },
                                                    },
                                                ],
                                            },
                                        },
                                    },
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
    ])

    const cart = aggregated[0]

    if (!cart) throw commerceCartNotExists

    return cart.items
}

module.exports = db.model('cart', schema, 'carts')