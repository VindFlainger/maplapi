const db = require('../index')
const sizedImage = require("../Schemas/sizedImage");
const sizing = require("../Schemas/sizing")


const schema = new db.Schema({
    target: {
        type: String,
        required: true,
        select: false
    },
    category_1: {
        type: String,
        required: false,
        select: false
    },
    category_2: {
        type: String,
        required: false,
        select: false
    },
    category_3: {
        type: String,
        required: false,
        select: false
    },
    name: {
        type: String,
        required: true,
        maxLength: 100
    },
    label: {
        type: String,
        required: true,
        maxLength: 50
    },
    tags: [
        {
            type: String,
            maxLength: 50,
            minLength: 2
        }
    ],
    description: {
        type: String,
        required: true,
        maxLength: 1000
    },
    details: [
        {
            _id: false,
            name: {
                type: String,
                required: true,
                maxLength: 50
            },
            value: [String]
        }
    ],
    features: [
        {
            type: String,
            required: true,
            maxLength: 300
        }
    ],
    color: {
        type: String,
        required: true,
        maxLength: 40
    },
    images: [[sizedImage]],
    sizing: [sizing],
    pricing: {
        price: {
            type: Number,
            required: true
        },
        sale: {
            type: Number
        },
        bonuses: {
            type: Number,
            default: 0
        }
    }
})

schema.statics.receiveSkuData = async function (skuId, size, quantity) {
    const sku = await this.findOne({
        _id: skuId,
        sizing: {
            $elemMatch: {
                size: size,
                quantity: {
                    $gte: quantity
                }
            }
        }
    })

    return sku ? {
        skuId,
        size,
        quantity,
        price: Math.min(sku.pricing.price, sku.pricing.sale ? sku.pricing.sale : Infinity),
        bonuses: sku.pricing.bonuses || 0
    } : null
}


const Sku = db.model('sku', schema);


Sku.createCollection({
    viewOn: 'products',
    pipeline: [
        {
            $match: {},
        },
        {
            $unwind: {
                path: "$skus",
            },
        },
        {
            $set: {
                sku: "$skus",
            },
        },
        {
            $set: {
                _id: "$sku._id",
                color: "$sku.color",
                sizing: "$sku.sizing",
                pricing: "$sku.pricing",
                images: "$sku.images",
            },
        },
        {
            $unset: ["skus", "sku"],
        },
    ]
})

module.exports = Sku