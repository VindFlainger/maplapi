const {Router} = require('express')
const Category = require('../db/Category')
const Product = require('../db/Product')
const Review = require('../db/Review')
const {query, body} = require("express-validator");
const {validateFieldIsRequired} = require("../utils/errors");
const {validationHandler} = require("../utils/customValidation");

const router = Router()

router.get('/getCategories', async (req, res, next) => {
        try {
            const categories = await Category.getTree()
            res.json(categories)
        } catch (err) {
            next(err)
        }
    }
)

router.post('/getProducts',
    body(['target'])
        .notEmpty()
        .withMessage(validateFieldIsRequired)
    ,
    body('limit')
        .default(30)
        .isInt({max: 30, min: 5})
        .toInt()
    ,
    body('offset')
        .default(0)
        .isInt({min: 0})
        .toInt()
    ,
    body('target')
        .isString()
    ,
    body(['category_1', 'category_2', 'category_3', 'color'])
        .optional()
        .isString()
    ,
    body('minPrice')
        .optional()
        .isInt({min: 0})
        .toInt()
    ,
    body('maxPrice')
        .optional()
        .isInt({min: 0})
        .toInt()
    ,
    body('sizes')
        .optional()
        .isArray({max: 20})
        .toArray()
    ,
    body('details')
        .optional()
        .isArray({max: 20})
        .toArray()
    ,
    body('details.*')
        .isObject()
    ,
    body('details.*.name')
        .isString()
    ,
    body('details.*.value')
        .isArray()
        .toArray()
    ,
    body('details.*.value.*')
        .isString()
    ,
    validationHandler,
    async (req, res, next) => {
        try {
            const products = await Product.getSkus(
                req.body.offset,
                req.body.limit,
                {
                    target: req.body.target,
                    category_1: req.body.category_1,
                    category_2: req.body.category_2,
                    category_3: req.body.category_3,
                    color: req.body.color,
                    minPrice: req.body.minPrice,
                    maxPrice: req.body.maxPrice,
                    sizes: req.body.sizes,
                    details: req.body.details
                }
            )
            res.json(products)
        } catch (err) {
            next(err)
        }

    }
)


router.get('/getProductInfo',
    query(['productId'])
        .notEmpty()
        .withMessage(validateFieldIsRequired)
    ,
    query('productId')
        .isMongoId()
    ,
    validationHandler,
    async (req, res, next) => {
        try {
            const [productInfo, reviews] = await
                Promise.all(
                    [
                        Product.getProductInfo(req.query.productId),
                        Review.getProductReviews(req.query.productId)
                    ]
                )
            res.json({...productInfo.toObject(), reviews})
        } catch (err) {
            next(err)
        }
    }
)

router.get('/getReviews',
    query(['productId'])
        .notEmpty()
        .withMessage(validateFieldIsRequired)
    ,
    query('productId')
        .isMongoId()
    ,
    query('ownerId')
        .if(query('ownerId').isMongoId())
        .if(query('ownerId').isEmpty())
    ,
    query('limit')
        .optional()
        .isInt({min: 0})
        .toInt()
    ,
    query('offset')
        .optional()
        .isInt({min: 0})
        .toInt()
    ,
    validationHandler,
    async (req, res, next) => {
        try {
            const reviews = await Review.getProductReviews(req.query.productId, req.query.ownerId, req.query.offset, req.query.limit)
            res.json(reviews)
        } catch (err) {
            next(err)
        }
    }
)
module.exports = router
