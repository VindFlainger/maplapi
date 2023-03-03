const db = require('./index')
const sizedImage = require('./Schemas/sizedImage')

const schema = new db.Schema({
    name: {
        type: String,
        required: true,
        maxLength: 50
    },
    icons: [sizedImage]
})

module.exports = db.model('maintenance', schema, 'maintenances')