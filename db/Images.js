const db = require('./index')
const SizedImage = require('./Schemas/sizedImage')


const schema = new db.Schema({
        originalImage: {
            type: String,
            required: true,
        },
        images: [SizedImage]
    },
    {
        virtuals: {
            originalImageUrl: {
                get() {
                    return process.env.IMAGES_BASE + this.originalImage
                }
            }
        },
        toObject: {
            virtuals: true
        },
        toJSON: {
            virtuals: true
        }
    }
)

module.exports = db.model('image', schema, 'images')