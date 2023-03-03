const db = require('./index')

const schema = new db.Schema({
    target: {
        type: String,
        required: true,
        enum: ['men', 'women']
    },
    category_1: {
        type: String,
        required: false
    },
    category_2: {
        type: String,
        required: false
    },
    category_3: {
        type: String,
        required: false
    },
    tags: [
        {
            type: String,
            maxLength: 50,
            minLength: 2
        }
    ]
})

schema.statics.getTree = async function () {
    const categories = await this.aggregate([
        {
            "$group": {
                _id: {
                    target: "$target",
                    category_1: "$category_1",
                    category_2: "$category_2"
                },
                categories_3: {
                    $push: "$category_3"
                }
            },

        },
        {
            "$addFields": {
                target: "$_id.target",
                category_1: "$_id.category_1",
                category_2: {
                    "$cond": {
                        if: {
                            $and: [
                                "$_id.category_2",
                                "categories_3"
                            ]
                        },
                        then: {
                            category: "$_id.category_2",
                            subcategories: "$categories_3"
                        },
                        else: null
                    }
                },

            }
        },
        {
            $unset: "_id"
        },
        {
            "$group": {
                _id: {
                    target: "$target",
                    category_1: "$category_1",

                },
                categories_2: {
                    $push: "$category_2"
                }
            },

        },
        {
            "$addFields": {
                target: "$_id.target",
                category_1: {
                    $cond: {
                        if: {
                            "$and": [
                                "$_id.category_1",
                                "categories_2"
                            ]
                        },
                        then: {
                            categoty: "$_id.category_1",
                            subcategories: "$categories_2"
                        },
                        else: null
                    }
                },

            }
        },
        {
            $unset: "_id"
        },
        {
            $group: {
                _id: {
                    target: "$target",
                },
                subcategories: {
                    $push: "$category_1"
                }
            },

        },
        {
            $addFields: {
                category: "$_id.target"
            }
        },
        {
            $unset: "_id"
        },
    ])
    const formated = categories.map(ctg => {
        ctg.subcategories = ctg.subcategories
            .filter(subcategory => !!subcategory)
            .map($ctg => {
                    $ctg.subcategories = $ctg.subcategories
                        .filter(subcategory => subcategory)

                    return $ctg
                }
            )
        return ctg
    })

    return formated
}

module.exports = db.model('category', schema, 'categories')