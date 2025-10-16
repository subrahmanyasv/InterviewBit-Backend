import { createLogger, format, transports } from 'winston';

const { combine, timestamp, printf, colorize, errors, json } = format;

/**
 * @description Defines the format for console logs during development.
 * It includes colorization for better readability in the terminal.
 */
const developmentConsoleFormat = combine(
    colorize({ all: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    printf(({ level, message, timestamp, stack }) => {
        return `${timestamp} ${level}: ${stack || message}`;
    })
);

/**
 * @description Defines the structured JSON format for file logs and production console logs.
 * This format is machine-readable and does not contain any color codes.
 */
const productionLogFormat = combine(
    timestamp(),
    errors({ stack: true }),
    json()
);

/**
 * Creates and configures the Winston logger instance.
 * It uses different formats for console and file transports based on the environment.
 */
const logger = createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: process.env.NODE_ENV === 'production' ? productionLogFormat : developmentConsoleFormat,
    transports: [
        new transports.Console(),
        new transports.File({
            filename: 'logs/error.log',
            level: 'error',
            format: productionLogFormat, 
        }),
        new transports.File({
            filename: 'logs/combined.log',
            format: productionLogFormat, 
        }),
    ],
    exitOnError: false,
});

export default logger;