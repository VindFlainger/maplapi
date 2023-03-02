const {validationResult} = require("express-validator");
const RequestError = require("./RequestError");

module.exports.validationHandler = (req, res, next) => {
    const vr = validationResult(req)
    if (!vr.isEmpty()) {
        const definedError = vr.array().find(error => error.msg instanceof RequestError)

        if (definedError) {
            const message = `error in param ${definedError.param}: ${definedError.msg.message}`
            next(new RequestError(definedError.msg.code, message, definedError.msg.status))
        } else {
            const firstError = vr.array({onlyFirstError: true})[0]
            next(new RequestError(0,`error in param ${firstError.param}: ${firstError.msg}`))
        }
    }
    next()
}
