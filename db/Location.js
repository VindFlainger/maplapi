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

locationSchema.statics.getAvailableLocations = async function (language = 'en') {
    return await this.aggregate([
        {
            $match: {
                'languages.language': language
            }
        },
        {
            $addFields: {
                value: '$location',
                language: {
                    $filter: {
                        input: '$languages',
                        as: 'lang',
                        cond: {$eq: ['$$lang.language', language]}
                    }
                }
            }
        },
        {
            $project: {
                value: 1,
                title: {$arrayElemAt: ['$language.text', 0]}
            }
        }
    ])
}

locationSchema.statics.isExists = async function (location) {
    return await this.findOne({location})
}

module.exports = db.model('location', locationSchema, 'locations')

