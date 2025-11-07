import { AppError } from "../Utils/ErrorClass.js";
import { Request, Response, NextFunction } from "express";

/*
An error handler middleware to catch and respond to errors uniformly. It expects all errors to be instances of AppError for operational errors. For unexpected errors, it sends a generic 500 response.
This approach is to keep error handling consistent and informative for API consumers.

Dependencies:
- express : For types Request, Response, NextFunction
- Custom AppError class for structured error handling
*/
export const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    // If the error is an instance of AppError, it's an operational error we can handle.
    if (err instanceof AppError) {
        res.status(err.StatusCode).json({
            status: 'error',
            message: err.message,
        });
    }else {     // For unexpected errors, log the error and send a generic 500 response.
        res.status(500).json({
            status: 'error',
            message: `Internal Server Error: ${err.message}`,
        });
    }
}