const {Router} = require('express')
const User = require('../../db/User')
const router = Router()

router.get('/getCustomerData', async (req, res, next) => {
    try {
        const user = await User.getCustomerData(req.userId)
        res.json(user)
    } catch (err) {
        next(err)
    }
})


module.exports = router