const RequestError = require("./RequestError");

module.exports.FieldIsRequired = new RequestError(101, 'field is required', 400)


module.exports.authUserAlreadyExists = new RequestError(201, 'user with such login already exists', 404)
module.exports.authUserNotExists = new RequestError(202, 'user with such login not exists', 404)
module.exports.authIncorrectPassword = new RequestError(203, 'incorrect password', 404)
