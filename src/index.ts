import express, { Express, Request, Response } from 'express';
import cors, { CorsOptions } from 'cors';
import dotenv from 'dotenv';

import { corsOptions } from './Config/cors.config.js';
import { dbConnection } from './Config/database.config.js';
import logger from './Config/logger.config.js';
import { requestLogger} from './Middlewares/requestLogger.js';
import { errorHandler } from './Middlewares/errorHandler.js';
dotenv.config();

const port: number = parseInt(process.env.PORT || '3000');
const app: Express = express();

const initializeApp = async () => {
    try {
        logger.info("Starting the application...");

        //Connect to Database
        await dbConnection.connect();

        //Initialize express Middlewares
        app.use(express.urlencoded({ extended: true }));
        app.use(express.json());
        app.use(cors(corsOptions));

        //Basic security headers
        app.use((req, res, next) => {
            res.setHeader('X-Content-Type-Options', 'nosniff');
            res.setHeader('X-Frame-Options', 'DENY');
            res.setHeader('X-XSS-Protection', '1; mode=block');
            next();
        });
        
        //Initialize custom middlewares
        app.use(requestLogger);

        //TODO: Define your routes here


        app.use('/test', (req: Request, res: Response) => {
            res.json({ message: 'API is working' });
        })

        //Global Error Handler
        app.use(errorHandler);
        
        //Start the application
        const server = app.listen(port, () => {
            logger.info(`Server is running at http://localhost:${port}`);
        });


        server.on('error', (error: Error) => {
            logger.error('Server error:', error.message);
            process.exit(1);
        })

        const gracefulShutdown = async (signal: string) => {
            logger.info(`Received ${signal}. Shutting down gracefully...`);
            server.close(async () => {
                logger.warn('HTTP server closed.');

                try {
                    //TODO: Close database connections and any other here
                    await dbConnection.disconnect();

                    process.exit(0);
                } catch (error : unknown) {
                    logger.error('Error during shutdown:', (error as Error).message);
                    process.exit(1);
                }
            });
        }

        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

        logger.info("Application started successfully.");
    } catch (error : unknown) {
        logger.error("Error during application initialization:", (error as Error).message);
        process.exit(1);
    }

}

initializeApp();