const RequestError = require("./RequestError");

module.exports.generalPathNotFound = new RequestError(1, 'unknown path', 404)
module.exports.generalIllegalInteraction = new RequestError(2, 'illegal interaction with protected objects not owned by current user', 401)

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

module.exports.interactingNoProduct = new RequestError(301, "product with such id doesn't exist", 404)
module.exports.interactingNoReview = new RequestError(302, "review with such doesn't exist", 404)
module.exports.interactingNoLocation = new RequestError(303, "location doesn't exist", 404)
module.exports.interactingNoSku = new RequestError(304, "sku with such id doesn't exist", 404)
module.exports.interactingNoSkuInWishlist = new RequestError(305, "sku with such id doesn't exist in the wishlist", 400)
module.exports.interactingSkuAlreadyInWishlist = new RequestError(306, "sku with a given id already exists", 400)
module.exports.interactingDefaultMethodExists = new RequestError(307, "default payment method is already exists", 400)
module.exports.interactingToManyMethods = new RequestError(308, "exceeded the maximum number of payment methods", 400)
module.exports.interactionNoPaymentMethod = new RequestError(309, "payment method with such id doesn't exist", 400)

module.exports.commerceUnknownProductId = new RequestError(601, "product with such id not exists", 404)
module.exports.commerceCartNotExists = new RequestError(602, "cart with the received unicId doesn't exists", 404)
module.exports.commerceCartItemNotExists = new RequestError(603, "cart item with the received skuId doesn't exists", 404)
module.exports.commerceNoSku = new RequestError(604, "sku with such id doesn't exist", 404)
module.exports.commerceNoSkuSize = new RequestError(605, "invalid size for received sku", 404)


