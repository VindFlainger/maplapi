const db = require('../index')
const sizedImage = require("../Schemas/sizedImage");
const sizing = require("../Schemas/sizing")


const schema = new db.Schema({
    categories: [{
        type: String,
        required: true
    }],
    productId: {
        type: db.Schema.Types.ObjectId,
        ref: 'product',
        required: true
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

const getQuery = (
    {
        categories,
        color,
        maxPrice,
        minPrice,
        details = [],
        sizing = []
    }
) => {
    let minPriceQ = {}
    if (minPrice) {
        minPriceQ = {
            $or: [
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
            ],
        }
    }

    let maxPriceQ = {}
    if (maxPrice) {
        maxPriceQ = {
            $or: [
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
            ],
        }
    }

    let detailsQ = {}
    if (details.length) {
        detailsQ = {
            details: {
                $all: details.map(detail => ({
                        $elemMatch: {
                            name: detail.name,
                            value: {
                                $in: [...detail.value],
                            },
                        },
                    })
                )
            }
        }
    }

    let sizingQ = {}
    if (sizing.length) {
        sizingQ = {
            sizing: {
                $elemMatch: {
                    size: {$in: [...sizing]},
                    quantity: {
                        $gte: 1
                    }
                }
            },
        }
    }

    return {
        categories: {$in: categories},
        ...color ? {color} : {},
        ...minPriceQ,
        ...maxPriceQ,
        ...detailsQ,
        ...sizingQ
    }
}

schema.statics.getCount = async function (
    {
        categories,
        color,
        maxPrice,
        minPrice,
        details,
        sizing
    }) {

    const query = getQuery({
        categories,
        color,
        maxPrice,
        minPrice,
        details,
        sizing
    })

    return await this.count(query)
}

schema.statics.getFilters = async function (categories) {
    return await this.aggregate([
        {
            $match: {
                categories: {$in: categories}
            }
        },
        {
            $unwind: {
                path: "$sizing",
            },
        },
        {
            $unwind: {
                path: "$details",
            },
        },
        {
            $unwind: {
                path: "$details.value",
            },
        },
        {
            $group: {
                _id: null,
                colors: {
                    $addToSet: "$color",
                },
                sizing: {
                    $addToSet: "$sizing.size",
                },
                details: {
                    $addToSet: "$details",
                },
            },
        },
        {
            $set: {
                details: {
                    $reduce: {
                        input: "$details",
                        initialValue: [],
                        in: {
                            $let: {
                                vars: {
                                    exists: {
                                        $indexOfArray: [
                                            "$$value.name",
                                            "$$this.name",
                                        ],
                                    },
                                },
                                in: {
                                    $cond: [
                                        {
                                            $lt: ["$$exists", 0],
                                        },
                                        {
                                            $concatArrays: [
                                                "$$value",
                                                [
                                                    {
                                                        $let: {
                                                            vars: {
                                                                pthis: "$$this",
                                                            },
                                                            in: {
                                                                name: "$$pthis.name",
                                                                value: {
                                                                    $reduce: {
                                                                        input:
                                                                            "$details",
                                                                        initialValue:
                                                                            [],
                                                                        in: {
                                                                            $cond: [
                                                                                {
                                                                                    $eq: [
                                                                                        "$$this.name",
                                                                                        "$$pthis.name",
                                                                                    ],
                                                                                },
                                                                                {
                                                                                    $concatArrays:
                                                                                        [
                                                                                            "$$value",
                                                                                            [
                                                                                                "$$this.value",
                                                                                            ],
                                                                                        ],
                                                                                },
                                                                                "$$value",
                                                                            ],
                                                                        },
                                                                    },
                                                                },
                                                            },
                                                        },
                                                    },
                                                ],
                                            ],
                                        },
                                        {
                                            $concatArrays: [
                                                "$$value",
                                                [],
                                            ],
                                        },
                                    ],
                                },
                            },
                        },
                    },
                },
            },
        },
        {
            $unset: ['_id']
        }
    ])
}

schema.statics.findSkus = async function (
    {
        categories,
        color,
        maxPrice,
        minPrice,
        details = [],
        sizing = []
    },
    offset = 0,
    limit = 30,
) {

    const query = getQuery({
        categories,
        color,
        maxPrice,
        minPrice,
        details,
        sizing
    })




    const [skus, totalCount] = await Promise.all([
        this.aggregate(
            [
                {
                    $match: {
                        ...query
                    }
                },
                {
                    $set: {
                        images: {
                            $map: {
                                input: "$images",
                                as: "images",
                                in: {
                                    $map: {
                                        input: "$$images",
                                        as: "image",
                                        in: {
                                            $mergeObjects: [
                                                "$$image",
                                                {
                                                    url: {
                                                        $concat: [process.env.IMAGES_BASE, '$$image.image'],
                                                    },
                                                },
                                            ],
                                        },
                                    },
                                },
                            },
                        },
                    }
                },
                {
                    $skip: offset
                },
                {
                    $limit: limit
                }
            ],
        ),
        this.getCount({
            categories,
            color,
            maxPrice,
            minPrice,
            details,
            sizing
        })
    ])

    return {
        skus,
        totalCount,
        offset,
        limit,
        nextOffset: offset + skus.length
    }
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
                productId: '$_id',
            },
        },
        {
            $unset: ["skus", "sku"],
        },
    ]
})


module.exports = Sku