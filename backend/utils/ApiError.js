class ApiError extends Error {
  constructor(status, message, code = 'API_ERROR', details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, ApiError);
  }
}

module.exports = ApiError;
