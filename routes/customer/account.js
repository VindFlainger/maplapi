const {Router} = require('express')
const User = require('../../db/User')
const Review = require('../../db/Review')

const router = Router()

router.get('/shortData', async (req, res, next) => {
    try {
        const user = await User.getCustomerShortInfo(req.userId)
        res.json(user)
    } catch (err) {
        next(err)
    }
})

router.get('/getReviews', async (req, res, next) => {
    try {
        const reviews = await Review.getUserReviews(req.userId)
        res.json(reviews)
    } catch (err) {
        next(err)
    }
})


module.exports = router