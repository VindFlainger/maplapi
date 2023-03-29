const db = require('./index')

const schema = new db.Schema({
    name: {
        type: String,
        required: true
    },
    parent: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    }
})

schema.statics.findSubtree = async function (category) {
    const categories = await this.find({
        parent: RegExp(`^${category}`, 'i')
    })

    return categories.map(ctg => ctg.category)
}


schema.statics.findTreeToRoot = async function (category) {

    const parents = []

    const totalCount = category.split('/').length

    for (let i = 1; i <= totalCount; i++) {
        parents.push(category.split('/', i).join('/'))
    }


    const categories = await this.aggregate([
        {
            $match: {
                parent: {
                    $in: parents,
                },
            },
        },
        {
            $group: {
                _id: "$parent",
                subcategories: {
                    $addToSet: "$name",
                },
            },
        },
        {
            $set: {
                parent: "$_id",
            },
        },
        {
            $unset: "_id",
        },
        {
            $sort: {
                parent: 1,
            },
        },
    ])

    const digestSubcategories = (parent, subcategories) => {
        const $subcategories = subcategories.map(category => {
            const i = categories.findIndex(ctg => ctg.parent.endsWith(category))

            if (i === -1) return category
            else return digestSubcategories(categories[i].parent, categories[i].subcategories)
        })

        return {
            parent,
            subcategories: $subcategories
        }
    }

    const tree = digestSubcategories(categories[0].parent, categories[0].subcategories)

    return tree
}

module.exports = db.model('category', schema, 'categories')