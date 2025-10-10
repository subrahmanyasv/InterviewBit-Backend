import { Request, Response, NextFunction } from 'express';
import logger from '../Config/logger.config.js';

/*
Middleware to log incoming HTTP requests.
It logs the HTTP method, URL, response status code, and the time taken to process the request.
We use the 'finish' event on the response object to ensure we log the status code after the response has been sent.
*/

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info(`${req.method}  ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
    });

    next();
};