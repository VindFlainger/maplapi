const {Router} = require('express')
const {body} = require("express-validator");
const {validateFieldIsRequired, interactingNoProduct} = require("../../utils/errors");
const {validationHandler} = require("../../utils/customValidation");
const Review = require("../../db/Review")
const Product = require("../../db/Product")
const {successModified} = require("../../utils/statuses");

const router = Router()

router.post('/addReview',
    body(['productId', 'review', 'summary', 'rating'], validateFieldIsRequired),
    body('productId')
        .isMongoId()
    ,
    body('summary')
        .isLength({min: 10, max: 1000})
    ,
    body('review')
        .isLength({min: 1, max: 1000})
    ,
    body('rating')
        .isInt({max: 5, min: 1})
        .toInt()
    ,
    validationHandler,
    async (req, res, next) => {


        try {
            const productsExists = await Product.exists({_id: req.body.productId})
            if (!productsExists) throw interactingNoProduct

            await Review.addReview(req.userId, req.body.productId,
                {
                    review: req.body.review,
                    summary: req.body.summary,
                    rating: req.body.rating
                }
            )
            res.json(successModified)
        } catch (err) {
            next(err)
        }
    }
)

router.post('/delReview',
    body(['reviewId'], validateFieldIsRequired),
    body('reviewId')
        .isMongoId()
    ,
    validationHandler,
    async (req, res, next) => {
        try {
            await Review.delReview(req.body.reviewId, req.userId)
            res.json(successModified)
        } catch (err) {
            next(err)
        }
    })


module.exports = router