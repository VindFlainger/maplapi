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

schema.statics.getSkus =
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
        const match = {}
        let $details = {}
        const $color = {}
        const $minPrice = {}
        const $maxPrice = {}
        const $sizes = {}
        if (target) match.target = new RegExp(`^${target}$`, 'i')
        if (category_1) match.category_1 = new RegExp(`^${category_1}$`, 'i')
        if (category_2) match.category_2 = new RegExp(`^${category_2}$`, 'i')
        if (category_3) match.category_3 = new RegExp(`^${category_3}$`, 'i')

        if (minPrice) {
            $minPrice.$or =
                [
                    {
                        "pricing.price": {
                            $gte: minPrice,
                        },
                    },
                    {
                        "pricing.sale": {
                            $gte: minPrice,
                        },
                    },
                ]
        }

        if (maxPrice) {
            $maxPrice.$or =
                [
                    {
                        "pricing.price": {
                            $lte: maxPrice,
                        },
                    },
                    {
                        "pricing.sale": {
                            $lte: maxPrice,
                        },
                    },
                ]
        }

        if (color) {
            $color.color = color
        }

        if (sizes.length) {
            $sizes.size = {$in: sizes}
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

        return this.aggregate([
                {
                    $match: {
                        ...match
                    },
                },
                {
                    $unwind: {
                        path: "$skus",
                    },
                },
                {
                    $set: {
                        color: "$skus.color",
                        images: "$skus.images",
                        sizing: "$skus.sizing",
                        pricing: "$skus.pricing",
                        skuId: '$skus._id',
                        productId: '$_id'
                    },
                },
                {
                    $set: {
                        sizing: {
                            $map: {
                                input: "$sizing",
                                as: "size",
                                in: {
                                    size: "$$size.size",
                                    quantity: {
                                        $subtract: [
                                            "$$size.quantity",
                                            {
                                                $size: "$$size.orders",
                                            },
                                        ],
                                    },
                                },
                            },
                        },
                    },
                },
                {
                    $unset: ["skus", "_id"],
                },
                {
                    $match: {
                        ...$color,
                        ...$minPrice,
                        ...$maxPrice,
                        sizing: {
                            $elemMatch: {
                                ...$sizes,
                                quantity: {
                                    $gt: 0,
                                },
                            },
                        },
                        details: {
                            ...$details
                        },
                    },
                },
            ]
        )
    }

schema.statics.getProductInfo = async function (productId) {
    const productInfo = await this.findById(productId)
    if (!productInfo) throw commerceUnknownProductId
    return productInfo
}

schema.statics.populateSkus = async function (skus) {
    return await this.aggregate(
        [
            {
                $match: {
                    "skus._id": {
                        $in: skus
                    },
                },
            },
            {
                $unwind: {
                    path: "$skus",
                },
            },
            {
                $match: {
                    "skus._id": {
                        $in: skus
                    },
                },
            },
            {
                $set: {
                    color: "$skus.color",
                    image: {
                        $map: {
                            input: {$arrayElemAt: ["$skus.images", 0]},
                            as: 'img',
                            in: {
                                size: '$$img.size',
                                url: {$concat: [process.env.IMAGES_BASE, "$$img.image"]}
                            }
                        }
                    },
                    pricing: "$skus.pricing",
                    skuId: "$skus._id",
                    productId: "$_id",
                },
            },
            {
                $unset: ["_id", "skus", "features", "tags", "details"],
            },
        ]
    )
}


module.exports = db.model('product', schema, 'products')