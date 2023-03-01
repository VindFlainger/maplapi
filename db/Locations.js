const db = require('./index')

const locationSchema = new db.Schema({
    location: {
        type: String,
        required: true
    },
    languages: [
        {
            language: {
                type: String,
                enum: ['en', 'ru']
            },
            text: {
                type: String,
                required: true
            }
        }
    ]
})

module.exports = db.model('location', locationSchema, 'locations')