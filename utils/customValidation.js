const {validationResult} = require("express-validator");
const RequestError = require("./RequestError");

module.exports.validationHandler = (req, res, next) => {
    const vr = validationResult(req)
    if (!vr.isEmpty()) {
        const definedError = vr.array().find(error => error.value instanceof RequestError)

        if (definedError) {
            const message = `error in param ${definedError.param}: ${definedError.value.message}`
            next(new RequestError(definedError.value.code, message, definedError.value.status))
        } else {
            next(vr.array({onlyFirstError: true}))
        }
    }
    next()
}
