/*
The AppError class is a custom error class that extends the built-in Error class in JavaScript/TypeScript. It is designed to represent application-specific errors with additional properties that help in error handling and reporting.
*/
export class AppError extends Error {
    public readonly StatusCode: number;
    public readonly isOperational: boolean;

    constructor(message: string, statusCode: number, isOperational = true) {
        super(message);
        this.StatusCode = statusCode;
        this.isOperational = isOperational;

        Error.captureStackTrace(this, this.constructor);
    }
}


// Specific error classes for common HTTP errors.
export class BadRequestError extends AppError {
    constructor(message: string) {
        super(message, 400);
    }
}

export class NotFoundError extends AppError {
    constructor(message: string) {
        super(message, 404);
    }   
}

export class UnauthorizedError extends AppError {
    constructor(message: string = 'Unauthorized') {
        super(message, 401);
    }
}

export class ForbiddenError extends AppError {
    constructor(message: string = 'Forbidden') {
      super(message, 403);
    }
}

export class InternalServerError extends AppError {
    constructor(message: string = 'Internal Server Error') {
        super(message, 500);
    }
}

export class CORSError extends AppError {
    constructor(message: string = 'CORS Error') {
        super(message, 403);
    }
}