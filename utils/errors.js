const RequestError = require("./RequestError");

module.exports.generalPathNotFound = new RequestError(1, 'unknown path', 404)

module.exports.validateFieldIsRequired = new RequestError(101, 'field is required', 400)


module.exports.authUserAlreadyExists = new RequestError(201, 'user with such login already exists', 401)
module.exports.authUserNotExists = new RequestError(202, 'user with such login not exists', 401)
module.exports.authIncorrectPassword = new RequestError(203, 'incorrect password', 401)
module.exports.authNotStrongPassword = new RequestError(204, 'received password is not strong', 401)
module.exports.authIncorrectRefreshToken = new RequestError(205, 'unregistered refresh token received', 401)
module.exports.authRefreshTokenExpires = new RequestError(206, 'received refresh token expires', 401)
module.exports.authIncorrectAccessToken = new RequestError(207, 'unregistered access token received', 401)
module.exports.authAccessTokenExpires = new RequestError(208, 'received access token expires', 401)
module.exports.authNotCustomerSession = new RequestError(209, "received access token is not customer's", 401)


