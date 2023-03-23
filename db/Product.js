const db = require('./index')
const {commerceUnknownProductId, commerceSkuNotAvailable, commerceSkuNotExists, commerceSkuSizeNotExists} = require("../utils/errors");
const sizing = require('./Schemas/sizing')
const sizedImage = require('./Schemas/sizedImage')


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
        freeDescription: {
            type: String,
            maxLength: 10000
        },
        skus: [
            {
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
                        required: true,
                    },
                    sale: {
                        type: Number,
                        required: false
                    },
                    bonuses: {
                        type: Number,
                        default: 0
                    }
                }
            }
        ],
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
        ]
    },
    {
        toJSON: {
            virtuals: true,
            versionKey: false,
        },
        toObject: {
            virtuals: true,
            versionKey: false
        }
    }
)

schema.statics.getProductInfo = async function (productId) {
    const productInfo = await this.findById(productId)
    if (!productInfo) throw commerceUnknownProductId
    return productInfo
}

schema.statics.$decreaseSkuQuantity = async function ({skuId, size, quantity}, session) {
    const data = await this.updateOne({
            "skus._id": skuId
        },
        {
            $inc: {
                "skus.$.sizing.$[sizing].quantity": -quantity
            }
        },
        {
            arrayFilters: [
                {
                    "sizing.size": size,
                    "sizing.quantity": {
                        $gte: quantity
                    }
                }
            ]
        }).session(session)


    if (!data.matchedCount) throw commerceSkuNotExists
    if (!data.modifiedCount) throw commerceSkuNotAvailable

    return data
}

schema.statics.$increaseSkuQuantity = async function ({skuId, size, quantity}, session){
    const data = await this.updateOne({
            "skus._id": skuId
        },
        {
            $inc: {
                "skus.$.sizing.$[sizing].quantity": quantity
            }
        },
        {
            arrayFilters: [
                {
                    "sizing.size": size
                }
            ]
        }).session(session)

    if (!data.matchedCount) throw commerceSkuNotExists
    if (!data.modifiedCount) throw commerceSkuSizeNotExists

    return data
}

module.exports = db.model('product', schema, 'products')