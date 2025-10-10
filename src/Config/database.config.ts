import mongoose, { Connection, ConnectOptions } from 'mongoose';
import dotenv from 'dotenv';

import logger from './logger.config.js';
dotenv.config();

/*
@class DatabaseConnection
Description:
Manages the connection to the MongoDB database for the application.
It handles connection retries, disconnections, and provides methods to check the health of connection.
It reads configuration options from environment variables to customize the connection behavior.

Note: This class donot provide access to connection object directly. It only provides methods to connect, disconnect and check health of connection.
Also this file returns a singleton instance of DatabaseConnection class, to ensure only one connection is used throughout the application.

Dependencies:
- Mongoose : For ORM and MongoDB connection management
- dotenv : For loading environment variables from .env file
 */

class DatabaseConnection {
    private connection: Connection;
    private readonly maxRetries: number = parseInt(process.env.MONGO_MAX_RETRIES || '5');
    private readonly retryDelay: number = parseInt(process.env.MONGO_RETRY_DELAY || '3000');

    constructor() {
        // Initialize the connection object. Attach event listeners for connection events.
        //These are done in constructor as we want to set them up as soon as instance is created.
        this.connection = mongoose.connection;
        this.connection.on('connected', () => {
            logger.info('MongoDB connected successfully.');
        });
        this.connection.on('error', (error) => {
            logger.error('MongoDB connection error:', error);
        });
        this.connection.on('disconnected', () => {
            logger.warn('MongoDB disconnected.');
        });
    }

    private getMongoUri = (): string => {
        return process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/interviewbit';
    }

    private getConnectionOptions = (): ConnectOptions => {
        return {
            serverSelectionTimeoutMS: parseInt(process.env.MONGO_SERVER_SELECTION_TIMEOUT || '5000'),
            socketTimeoutMS: parseInt(process.env.MONGO_SOCKET_TIMEOUT || '45000'),
            maxPoolSize: parseInt(process.env.MONGO_MAX_POOL_SIZE || '100'),
            minPoolSize: parseInt(process.env.MONGO_MIN_POOL_SIZE || '10'),
            retryWrites: process.env.MONGO_RETRY_WRITES === 'true' || false,
        };
    }

    public async connect(): Promise<void> {
        const mongoURI = this.getMongoUri();
        const options = this.getConnectionOptions();

        // Using a loop for retries to avoid call stack overflow
        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                await mongoose.connect(mongoURI, options);
                return; 
            } catch (error: any) {
                logger.error(`Attempt ${attempt} failed:`, error.message);
                if (attempt === this.maxRetries) {
                    logger.error('Max retries reached. Could not connect to MongoDB.');
                    throw error; 
                }
                await new Promise(res => setTimeout(res, this.retryDelay));
            }
        }
    }

    public async disconnect(): Promise<void> {
        await this.connection.close();
    }

    public isHealthy(): boolean {
        return this.connection.readyState === 1;
    }
}

export const dbConnection = new DatabaseConnection();
