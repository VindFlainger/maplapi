const {Router} = require('express')
const User = require('../../db/User')

const router = Router()

router.get('/shortData', async (req, res, next) => {
    const user = await User.findOne({})
    res.json(user)
})
module.exports = router