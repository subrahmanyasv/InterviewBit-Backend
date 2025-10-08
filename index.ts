import express, { Express, Request, Response } from 'express';
import cors, { CorsOptions } from 'cors';
import dotenv from 'dotenv';

import { corsOptions } from './src/Config/configuration.js';
dotenv.config();

const port: number = parseInt(process.env.PORT || '3000');
const app: Express = express();

const initializeApp = () => {
    try {
        console.log("Starting the application...");

        //TODO:  Connect to Database


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

        //TODO: Define your routes here


        app.use('/test', (req: Request, res: Response) => {
            res.json({ message: 'API is working' });
        })
        

        //Start the application
        const server = app.listen(port, () => {
            console.log(`Server is running at http://localhost:${port}`);
        });


        server.on('error', (error: Error) => {
            console.error('Server error:', error.message);
            process.exit(1);
        })

        const gracefulShutdown = async (signal: string) => {
            console.log(`Received ${signal}. Shutting down gracefully...`);
            server.close(async () => {
                console.log('HTTP server closed.');

                try {
                    //TODO: Close database connections and any other here.

                    process.exit(0);
                } catch (error : unknown) {
                    console.error('Error during shutdown:', (error as Error).message);
                    process.exit(1);
                }
            });
        }

        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

        console.log("Application started successfully.");
    } catch (error : unknown) {
        console.error("Error during application initialization:", (error as Error).message);
        process.exit(1);
    }

}


initializeApp();