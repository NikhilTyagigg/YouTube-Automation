export class AppError extends Error {
  constructor(message: string, public readonly statusCode = 500, public readonly code = 'INTERNAL_ERROR', public readonly isOperational = true) {
    super(message)
    this.name = new.target.name
    Error.captureStackTrace(this, new.target)
  }
}

export class ValidationError extends AppError { constructor(message: string, public readonly details?: unknown) { super(message, 400, 'VALIDATION_ERROR') } }
export class AuthenticationError extends AppError { constructor(message = 'Authentication required') { super(message, 401, 'AUTHENTICATION_ERROR') } }
export class AuthorizationError extends AppError { constructor(message = 'Insufficient permissions') { super(message, 403, 'AUTHORIZATION_ERROR') } }
export class NotFoundError extends AppError { constructor(resource = 'Resource') { super(`${resource} not found`, 404, 'NOT_FOUND') } }
export class ExternalApiError extends AppError { constructor(message: string, details?: unknown) { super(message, 502, 'EXTERNAL_API_ERROR'); this.cause = details } }