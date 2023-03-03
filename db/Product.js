const db = require('./index')
const sizedImage = require('./Schemas/sizedImage')
const {commerceUnknownProductId} = require("../utils/errors");

const sizingSchema = new db.Schema({
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
        ordering: {
            orders: [
                {
                    type: db.Schema.Types.ObjectId,
                    ref: 'order'
                }
            ],
            count: {
                type: Number,
                default: 0
            }
        }
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

sizingSchema.virtual('totalQuantity')
    .get(function () {
            return this.quantity - this.ordering.count
        }
    )

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
                _id: false,
                color: {
                    type: String,
                    required: true,
                    maxLength: 40
                },
                images: [[sizedImage]],
                sizing: [sizingSchema],
                pricing: {
                    price: {
                        type: Number,
                        required: true,
                        max: 999999
                    },
                    sale: {
                        type: Number,
                        max: 99999
                    },
                    bonuses: {
                        type: Number,
                        max: 99999
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
            transform: (doc, ret) => {
                ret.skus = ret.skus.map(sku => {
                    sku.sizing = sku.sizing.map(size => {
                        delete size.ordering
                        delete size.quantity
                        return size
                    })
                    return sku
                })
            }
        },
        toObject: {
            virtuals: true,
            versionKey: false
        }
    }
)

schema.statics.getProducts =
    async function (
        offset,
        limit,
        {
            target,
            category_1,
            category_2,
            category_3,
            minPrice,
            maxPrice,
            color,
            sizes = [],
            details = []
        }
    ) {
        const categories = {target}
        const skus = {$elemMatch: {}}
        let $details = {}
        if (category_1) categories.category_1 = category_1
        if (category_2) categories.category_2 = category_2
        if (category_3) categories.category_3 = category_3

        if (color) {
            skus.$elemMatch.color = color
        }

        if (minPrice || maxPrice) {
            skus.$elemMatch["pricing.price"] = {
                ...minPrice ? {$gte: minPrice} : {},
                ...maxPrice ? {$lte: maxPrice} : {}
            }
        }

        if (sizes && sizes.length) {
            skus.$elemMatch.sizing = {
                $elemMatch: {
                    size: {
                        $in: sizes
                    },
                    quantity: {
                        $gt: 0
                    }
                }
            }
        }

        if (details && details.length) {
            $details = {}
            $details.$all = details.map(detail => (
                {
                    $elemMatch: {
                        name: detail.name,
                        value: {
                            $all: detail.value
                        }
                    }
                }
            ))
        }


        console.log({
            ...categories,
            ...Object.keys(skus.$elemMatch).length ? {skus: {...skus}} : {},
            ...Object.keys($details).length ? {details: {...$details}} : {}
        })

        return this.find({
            ...categories,
            ...Object.keys(skus.$elemMatch).length ? {skus: {...skus}} : {},
            ...Object.keys($details).length ? {details: {...$details}} : {}
        })
    }

schema.statics.getProductInfo = async function (id) {
    const productInfo = await this.findById(id)
    if (!productInfo) throw commerceUnknownProductId
    return productInfo
}


module.exports = db.model('product', schema, 'products')