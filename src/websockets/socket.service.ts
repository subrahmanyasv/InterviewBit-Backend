import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { URL } from 'url';
import logger from '../Config/logger.config.js';
import tokenUtils from '../Utils/tokenUtils.js';
import { InterviewModel } from '../Models/Interview.model.js';
import { CandidateModel } from '../Models/Candidate.model.js';
import { TranscriptModel } from '../Models/Transcripts.model.js';
import  interviewService  from '../Api/Services/interview.service.js';
import { tokenPayload } from '../Schemas/auth.schema.js';

export interface ExtWebSocket extends WebSocket {
    interviewerId?: string;
    interviewId?: string;
    isAlive: boolean; 
}

class WebSocketService {
    private wss: WebSocketServer | null = null;
    private interviewRooms = new Map<string, Set<ExtWebSocket>>();

    public initialize(wssInstance: WebSocketServer): void {
        this.wss = wssInstance;

        this.wss.on('connection', (ws: ExtWebSocket, req: IncomingMessage) => {
            this.handleConnection(ws, req);
        });
        logger.info('WebSocket Service initialized.');
    }

    private async handleConnection(ws: ExtWebSocket, req: IncomingMessage): Promise<void> {
        ws.isAlive = true;

        try {
            
            const url = new URL(req.url || '', 'http://localhost');
            const token = url.searchParams.get('token');
            const interviewId = url.searchParams.get('interviewId');

            if (!token || !interviewId) {
                logger.warn(`WS connection failed: Missing params. URL: ${req.url}`);
                ws.close(1008, 'Missing token or interviewId');
                return;
            }

            const decoded = tokenUtils.getDataFromToken(token) as tokenPayload | null;
            if (!decoded || !decoded._id) {
                logger.warn('WS connection failed: Invalid token.');
                ws.close(1008, 'Invalid authentication token');
                return;
            }

            const interview = await InterviewModel.findById(interviewId);
            if (!interview) {
                 logger.warn(`WS connection failed: Interview ${interviewId} not found.`);
                 ws.close(1008, 'Interview not found');
                 return;
            }

            if (interview.interviewerId.toString() !== decoded._id.toString()) {
                logger.warn(`WS connection denied: User ${decoded._id} tried to access interview ${interviewId}.`);
                ws.close(1008, 'Unauthorized access to this interview');
                return;
            }

            ws.interviewerId = decoded._id.toString();
            ws.interviewId = interviewId;

            this.joinRoom(interviewId, ws);
            this.setupSignalHandlers(ws);

            logger.info(`WS connected: User ${ws.interviewerId} joined room ${ws.interviewId}`);

            await this.sendInitialDashboardData(ws, interviewId);

        } catch (error) {
            logger.error('Error during WS connection handling:', error);
            ws.close(1011, 'Internal server error during handshake');
        }
    }

    public shutdown(): void {
        if (this.wss) {
            logger.info('Shutting down WebSocket service...');
            this.wss.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.close(1001, 'Server shutting down'); 
                }
            });

            this.wss.close(() => {
                logger.info('WebSocket server closed.');
            });
            this.interviewRooms.clear();
        }
    }

    private async sendInitialDashboardData(ws: ExtWebSocket, interviewId: string): Promise<void> {
        try {
            const interview = await InterviewModel.findById(interviewId).lean();
            const candidates = await CandidateModel.find({ interview_id: interviewId }).lean();

            if (!interview) return; 

            const candidateIds = candidates.map(c => c._id);
            const progressData = await TranscriptModel.aggregate([
                { $match: { candidate_id: { $in: candidateIds }, submitted_at: { $ne: null } } },
                { $group: { _id: "$candidate_id", answeredCount: { $count: {} } } }
            ]);

            const progressMap = new Map<string, number>();
            progressData.forEach((item: any) => {
                progressMap.set(item._id.toString(), item.answeredCount);
            });

            const candidatePayload = candidates.map(candidate => ({
                _id: candidate._id,
                full_name: candidate.full_name,
                email: candidate.email,
                status: candidate.status,
                progress: `${progressMap.get(candidate._id.toString()) || 0}/${interview.num_questions}`
            }));

            const message = {
                event: 'dashboard:init',
                data: {
                    interview: {
                        title: interview.title,
                        status: interview.status,
                        scheduled_start_time: interview.scheduled_start_time,
                        num_questions: interview.num_questions,
                    },
                    candidates: candidatePayload
                }
            };

            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(message));
            }

        } catch (error) {
            logger.error(`Failed to send initial data for interview ${interviewId}:`, error);
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ event: 'error', message: 'Failed to load dashboard data' }));
            }
        }
    }

    
    private joinRoom(interviewId: string, ws: ExtWebSocket): void {
        if (!this.interviewRooms.has(interviewId)) {
            this.interviewRooms.set(interviewId, new Set());
        }
        this.interviewRooms.get(interviewId)!.add(ws);
    }

    private leaveRoom(interviewId: string, ws: ExtWebSocket): void {
        const room = this.interviewRooms.get(interviewId);
        if (room) {
            room.delete(ws);
            if (room.size === 0) {
                this.interviewRooms.delete(interviewId);
                logger.debug(`Room ${interviewId} is empty and has been removed.`);
            }
        }
    }


    private setupSignalHandlers(ws: ExtWebSocket): void {
        ws.on('close', (code, reason) => {
            if (ws.interviewId) {
                this.leaveRoom(ws.interviewId, ws);
                logger.info(`WS disconnected: User ${ws.interviewerId} left room ${ws.interviewId}. Code: ${code}`);
            }
        });

        ws.on('error', (err) => {
             logger.error(`WS error for user ${ws.interviewerId}:`, err);
        });

        ws.on('pong', () => {
            ws.isAlive = true;
        });

        ws.on('message', async (data: string) => {
            try {
                const message = JSON.parse(data.toString());
                
                switch (message.event) {
                    case 'request:candidate_details':
                        await this.handleCandidateDetailsRequest(ws, message.payload);
                        break;
                    
                    //-------------------------------------------------
                    // Additional event handlers can be added here
                    //-------------------------------------------------

                    default:
                        logger.warn(`Unknown WS event from ${ws.interviewerId}: ${message.event}`);
                }
            } catch (error) {
                logger.error('Failed to handle WS message:', error);
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ event: 'error', message: 'Invalid message format' }));
                }
            }
        });
    }


    private async handleCandidateDetailsRequest(ws: ExtWebSocket, payload: any): Promise<void> {
        try {
            const candidateId = payload?.candidateId;
            if (!candidateId) {
                throw new Error('candidateId missing from payload');
            }

            // We securely use the IDs we attached to the socket during connection.
            // This prevents a client from requesting data they aren't authorized for.
            const transcriptData = await interviewService.getCandidateTranscript(
                ws.interviewId!,
                candidateId,
                ws.interviewerId!
            ); //

            // Send the data back *only* to the client who asked for it.
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    event: 'response:candidate_details',
                    data: transcriptData
                }));
            }

        } catch (error: any) {
            logger.error(`Failed to get candidate transcript for ${ws.interviewerId}:`, error.message);
            // Send a specific error back to the client
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ 
                    event: 'error', 
                    message: `Could not load candidate details: ${error.message}` 
                }));
            }
        }
    }
}

const webSocketService = new WebSocketService();
export default webSocketService;