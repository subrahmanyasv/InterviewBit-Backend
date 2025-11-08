import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { URL } from 'url';
import mongoose from 'mongoose'; // Needed for ObjectId casting
import logger from '../Config/logger.config.js';
import tokenUtils from '../Utils/tokenUtils.js';
import { InterviewModel } from '../Models/Interview.model.js';
import { tokenPayload } from '../Schemas/auth.schema.js';

// Extending the standard WebSocket to add our app-specific data.
// This is a common pattern in TypeScript to avoid 'any' casting later.
export interface ExtWebSocket extends WebSocket {
    interviewerId?: string;
    interviewId?: string;
    isAlive: boolean; 
}