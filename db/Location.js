const db = require('./index')
const {interactionLocationNotAvailable} = require("../utils/errors");

const schema = new db.Schema({
    location: {
        type: String,
        required: true
    },
    shippingPrice: {
        type: Number,
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

schema.statics.getAvailableLocations = async function (language = 'en') {
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

schema.statics.getShippingPrice = async function (location) {
    const locationData = this.findOne({
        location
    })

    if (!locationData) throw interactionLocationNotAvailable

    return locationData.shippingPrice
}

schema.statics.isExists = async function (location) {
    return await this.findOne({location})
}

module.exports = db.model('location', schema, 'locations')

