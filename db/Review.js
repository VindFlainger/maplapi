const db = require('./index')
const {interactingNoReview, generalIllegalInteraction} = require("../utils/errors");

const schema = new db.Schema({
    owner: {
        type: db.Schema.Types.ObjectId,
        required: true,
        ref: 'user'
    },
    product: {
        type: db.Schema.Types.ObjectId,
        required: true,
        ref: 'product'
    },
    rating: {
        type: Number,
        required: true,
        max: 5,
        min: 1
    },
    summary: {
        type: String,
        required: true,
        minLength: 10,
        maxLength: 70
    },
    review: {
        type: String,
        required: true,
        maxLength: 1000
    }
}, {
    timestamps: {
        createdAt: true,
        updatedAt: true
    },
    toJSON: {
        versionKey: false
    }
})

schema.statics.addReview = async function (ownerId, productId, {rating, summary, review}) {
    return await this.findOneAndUpdate(
        {
            owner: ownerId,
            product: productId
        },
        {
            rating,
            summary,
            review
        },
        {
            upsert: true
        }
    )
}

schema.statics.delReview = async function (reviewId, ownerId) {
    const review = await this.findById(reviewId)
    if (!review) throw interactingNoReview

    if (review.owner.toString() !== ownerId) throw generalIllegalInteraction

    return await this.deleteOne({_id: reviewId})
}

schema.statics.getProductReviews = async function (productId) {
    return await this
        .find({product: productId})
        .populate({
            path: 'owner',
            transform: doc => {
                return {
                    id: doc._id,
                    name: doc.customerInfo.name
                }
            }
        })
}

module.exports = db.model('review', schema, 'reviews')