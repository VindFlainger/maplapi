const {Router} = require('express')
const User = require('../../db/User')

const router = Router()

router.get('/shortData', async (req, res, next) => {
    try {
        const user = await User.getCustomerShortInfo(req.userId)
        res.json(user)
    } catch (err) {
        next(err)
    }
})


module.exports = router