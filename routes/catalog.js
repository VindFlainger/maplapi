const {Router} = require('express')
const Category = require('../db/Category')
const Sku = require('../db/Views/Sku')
const Review = require('../db/Review')
const Product = require('../db/Product')
const {query} = require("express-validator");
const {validateFieldIsRequired} = require("../utils/errors");
const {validationHandler} = require("../utils/customValidation");

const router = Router()

router.get('/getSubCategories',
    query(['category'])
        .notEmpty()
        .withMessage(validateFieldIsRequired)
    ,
    query(['category'])
        .isString()
    ,
    validationHandler,
    async (req, res, next) => {
        try {
            const categories = await Category.findSubtree(req.query.category)
            res.json(categories)
        } catch (err) {
            next(err)
        }
    }
)


router.get('/getProducts',
    query(['category'])
        .notEmpty()
        .withMessage(validateFieldIsRequired)
    ,
    query(['category'])
        .isString()
    ,
    query('limit')
        .default(30)
        .isInt({max: 30, min: 5})
        .toInt()
    ,
    query('offset')
        .default(0)
        .isInt({min: 0})
        .toInt()
    ,
    query('minPrice')
        .optional()
        .isInt({min: 0})
        .toInt()
    ,
    query('maxPrice')
        .optional()
        .isInt({min: 0})
        .toInt()
    ,
    query('sizes')
        .optional()
        .isArray({max: 20})
        .toArray()
    ,
    query('details')
        .optional()
        .isArray({max: 20})
        .toArray()
    ,
    query('details.*')
        .isObject()
    ,
    query('details.*.name')
        .isString()
    ,
    query('details.*.value')
        .isArray()
        .toArray()
    ,
    query('details.*.value.*')
        .isString()
    ,
    validationHandler,
    async (req, res, next) => {
        try {
            const categories = await Category.findSubtree(req.query.category)
            categories.push(req.query.category)

            const skuInfo = await Sku.findSkus(
                {
                    categories: categories,
                    color: req.query.color,
                    minPrice: req.query.minPrice,
                    maxPrice: req.query.maxPrice,
                    sizes: req.query.sizes,
                    details: req.query.details
                },
                req.query.offset,
                req.query.limit
            )
            res.json(skuInfo)
        } catch (err) {
            next(err)
        }
    }
)


router.get('/getFilters',
    query(['category'])
        .notEmpty()
        .withMessage(validateFieldIsRequired)
    ,
    query(['category'])
        .isString()
    ,
    validationHandler,
    async (req, res, next) => {
        try {
            const categories = await Category.findSubtree(req.query.category)
            categories.push(req.query.category)

            const filters = await Sku.getFilters(categories)

            res.json(filters)
        } catch (err) {
            next(err)
        }
    }
)


router.get('/getCount',
    query(['category'])
        .notEmpty()
        .withMessage(validateFieldIsRequired)
    ,
    query(['category'])
        .isString()
    ,
    query('limit')
        .default(30)
        .isInt({max: 30, min: 5})
        .toInt()
    ,
    query('offset')
        .default(0)
        .isInt({min: 0})
        .toInt()
    ,
    query('minPrice')
        .optional()
        .isInt({min: 0})
        .toInt()
    ,
    query('maxPrice')
        .optional()
        .isInt({min: 0})
        .toInt()
    ,
    query('sizes')
        .optional()
        .isArray({max: 20})
        .toArray()
    ,
    query('details')
        .optional()
        .isArray({max: 20})
        .toArray()
    ,
    query('details.*')
        .isObject()
    ,
    query('details.*.name')
        .isString()
    ,
    query('details.*.value')
        .isArray()
        .toArray()
    ,
    query('details.*.value.*')
        .isString()
    ,
    validationHandler,
    async (req, res, next) => {
        try {
            const categories = await Category.findSubtree(req.query.category)
            categories.push(req.query.category)

            const count = await Sku.getCount(
                {
                    categories: categories,
                    color: req.query.color,
                    minPrice: req.query.minPrice,
                    maxPrice: req.query.maxPrice,
                    sizes: req.query.sizes,
                    details: req.query.details
                },
            )

            res.json(count)
        } catch (err) {
            next(err)
        }
    }
)

router.get('/getProduct',
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
            const productInfo = await Product.getProductInfo(req.query.productId)

            res.json(productInfo)
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

