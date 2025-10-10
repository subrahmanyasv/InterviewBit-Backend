import { createLogger, format, transports } from 'winston';

/*
Description: The file configures and exports a Winston logger instance for logging within the application.

Congiguration Details:
 - Log levels: The logger is set to 'info' level in production and 'debug' level in development.
 - Formats: Colored + Console output for development and JSON format for production.
 - Transports: Logs are sent to the console and also written to files (error.log for errors and combined.log for all logs).
 - Error Handling: The logger is configured to handle exceptions and not exit on error.

Dependencies: Winston
*/



const { combine, timestamp, printf, colorize, errors, json } = format;

const consoleFormat = printf(({level , message, timestamp, stack}) => {
    return `${timestamp} ${level}: ${stack || message}`;
})

const logger = createLogger({
    level : process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        errors({ stack: true }), 
        process.env.NODE_ENV === 'production' ? json() : colorize({ all: true }),
        process.env.NODE_ENV === 'production' ? json() : consoleFormat
    ),
    transports: [
        new transports.Console(),
        new transports.File({ filename: 'logs/error.log', level: 'error' }),
        new transports.File({ filename: 'logs/combined.log' })
    ],
    exitOnError: false, 
})

export default logger;