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


module.exports = db.model('category', schema, 'categories')