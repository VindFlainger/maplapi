class RequestError {
    constructor(code = 0, message = '', status = 400) {
        this.code = code
        this.message = message
        this.status = status
    }
}

module.exports = RequestError

