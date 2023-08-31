class AppError extends Error {
    constructor(errorCode, message, statusCode) {
        super(message);
        this.errorCode = errorCode;
        this.statusCode = statusCode;
        this.name = 'AppError';
    }
}


module.exports = AppError;