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
    id: true,
    timestamps: {
        createdAt: true,
        updatedAt: true
    },
    toJSON: {
        versionKey: false,
        virtuals: true
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

schema.statics.getProductReviews = async function (productId, ownerId, offset = 0, limit = 30) {
    const [others, totalCount, my] = await Promise.all(
        [
            this
                .find(
                    {
                        product: productId,
                        ...ownerId ? {owner: {$ne: ownerId}} : {}
                    }
                )
                .skip(offset)
                .limit(limit)
                .populate({
                    path: 'owner',
                    transform: doc => {
                        return {
                            id: doc._id,
                            name: doc.customerInfo.name
                        }
                    }
                })
            ,
            this.count({
                product: productId,
                ...ownerId ? {owner: {$ne: ownerId}} : {}
            })
            ,
            (
                async () => {
                    if (!ownerId) return
                    return await this
                        .findOne(
                            {
                                product: productId,
                                owner: ownerId
                            }
                        )
                        .populate({
                            path: 'owner',
                            transform: doc => {
                                return {
                                    id: doc._id,
                                    name: doc.customerInfo.name
                                }
                            }
                        })
                })()
        ]
    )
    return {
        others,
        totalCount,
        limit,
        offset,
        nextOffset: offset + others.length,
        my
    }
}

schema.statics.getUserReviews = async function (ownerId, offset = 0, limit = 30) {
    const [reviews, totalCount] = await Promise.all(
        [
            this.find({
                owner: ownerId
            })
                .skip(offset)
                .limit(limit)
                .populate({
                        path: 'product',
                        transform: doc => {
                            return {
                                id: doc.id,
                                name: doc.name,
                                previewImage: doc.skus[0]?.images?.[0]
                            }
                        }
                    }
                )
            ,
            this.count({
                owner: ownerId
            })
        ]
    )

    return {
        reviews,
        offset,
        limit,
        totalCount,
        nextOffset: offset + reviews.length
    }
}

module.exports = db.model('review', schema, 'reviews')