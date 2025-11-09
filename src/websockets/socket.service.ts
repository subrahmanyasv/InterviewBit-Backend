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

/*
@interface ExtWebSocket
@description: Extends the base WebSocket interface from the 'ws' library.
This allows us to attach custom state properties to each client's connection,
such as their authenticated interviewerId, the interviewId they are
subscribed to, and a flag for heartbeat checks (isAlive).
*/
export interface ExtWebSocket extends WebSocket {
    interviewerId?: string;
    interviewId?: string;
    isAlive: boolean; 
}

/*
@class WebSocketService
Description: This class manages all WebSocket connections for the application,
providing real-time updates to interviewers monitoring their dashboards. It
handles connection authentication, manages "rooms" based on interviewId to
broadcast events to the correct clients, and processes incoming messages
from clients (e.g., requesting details for a specific candidate).

Dependencies:
    - ws: The core WebSocket library for server and client management.
    - http (IncomingMessage): Used to read the initial HTTP upgrade request.
    - url: Utility for parsing URL parameters (like token) from the connection request.
    - logger.config.js: For logging service-level events and errors.
    - tokenUtils.js: For decoding and-validating authentication tokens.
    - DB models: InterviewModel, CandidateModel, TranscriptModel for fetching data.
    - interview.service.js: Used to fetch specific data, like candidate transcripts.

Methods:
    - initialize(wssInstance: WebSocketServer): void
    - shutdown(): void
    - handleConnection(ws: ExtWebSocket, req: IncomingMessage): Promise<void>
    - sendInitialDashboardData(ws: ExtWebSocket, interviewId: string): Promise<void>
    - joinRoom(interviewId: string, ws: ExtWebSocket): void
    - leaveRoom(interviewId: string, ws: ExtWebSocket): void
    - setupSignalHandlers(ws: ExtWebSocket): void
    - handleCandidateDetailsRequest(ws: ExtWebSocket, payload: any): Promise<void>
*/
class WebSocketService {
    // The main WebSocketServer instance.
    private wss: WebSocketServer | null = null;
    
    // Manages "rooms". The key is the interviewId (string), and the value is a Set
    // of all connected ExtWebSocket clients (interviewers) subscribed to that interview.
    private interviewRooms = new Map<string, Set<ExtWebSocket>>();

    /*
    @method initialize
    @description: Initializes the WebSocket service by attaching it to an existing
    WebSocketServer instance (usually created in the main server file). It binds
    the 'connection' event listener, which delegates new connections to the
    `handleConnection` method.

    @params: wssInstance: WebSocketServer - The WebSocketServer instance to attach to.
    @returns: void
    */
    public initialize(wssInstance: WebSocketServer): void {
        this.wss = wssInstance;

        this.wss.on('connection', (ws: ExtWebSocket, req: IncomingMessage) => {
            this.handleConnection(ws, req);
        });
        logger.info('WebSocket Service initialized.');
    }

    /*
    @method handleConnection
    @description: This private method is the core handler for all new WebSocket
    connections. It performs authentication and authorization:
    1.  Sets the `isAlive` flag for heartbeat checks.
    2.  Parses the connection URL to get the `token` and `interviewId`.
    3.  Closes the connection if parameters are missing.
    4.  Validates the `token` using `tokenUtils`.
    5.  Fetches the interview from the database.
    6.  Authorizes the user by checking if the `interviewerId` from the token
        matches the `interviewerId` on the interview document.
    7.  If successful, it attaches `interviewerId` and `interviewId` to the `ws` object.
    8.  Adds the client to the correct room using `joinRoom`.
    9.  Sets up event listeners ('close', 'error', 'pong', 'message') using `setupSignalHandlers`.
    10. Sends the initial dashboard data to the new client.

    @params: ws: ExtWebSocket - The newly connected WebSocket client.
    @params: req: IncomingMessage - The initial HTTP upgrade request.
    @returns: Promise<void>
    */
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

    /*
    @method shutdown
    @description: Gracefully shuts down the WebSocket service. It iterates
    over all connected clients, closes their connections with a 'Server shutting down'
    message, and then closes the main `wss` instance. It also clears the
    `interviewRooms` map.

    @params: None
    @returns: void
    */
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

    /*
    @method sendInitialDashboardData
    @description: Fetches and sends the initial state of the dashboard to a
    newly connected client. It retrieves interview details, the full list of
    candidates for that interview, and aggregates their progress (number of
    answered questions) from the Transcripts collection. This data is
    sent as a single 'dashboard:init' event.

    @params: ws: ExtWebSocket - The client to send the data to.
    @params: interviewId: string - The ID of the interview to fetch data for.
    @returns: Promise<void>
    */
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

    
    /*
    @method joinRoom
    @description: Adds a client to an interview "room". The room is
    represented by a Set of WebSockets stored in the `interviewRooms` Map
    under the `interviewId` key. If the room doesn't exist, it is created.

    @params: interviewId: string - The ID of the room to join.
    @params: ws: ExtWebSocket - The client to add to the room.
    @returns: void
    */
    private joinRoom(interviewId: string, ws: ExtWebSocket): void {
        if (!this.interviewRooms.has(interviewId)) {
            this.interviewRooms.set(interviewId, new Set());
        }
        this.interviewRooms.get(interviewId)!.add(ws);
    }

    /*
    @method leaveRoom
    @description: Removes a client from an interview "room". This is
    typically called when a client disconnects. If the room becomes empty
    after the client leaves, the room itself is deleted from the
    `interviewRooms` Map to conserve memory.

    @params: interviewId: string - The ID of the room to leave.
    @params: ws: ExtWebSocket - The client to remove from the room.
    @returns: void
    */
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


    /*
    @method setupSignalHandlers
    @description: Attaches all necessary event listeners to a WebSocket
    client's connection.
    - 'close': Cleans up the connection by calling `leaveRoom`.
    - 'error': Logs any WebSocket errors.
    - 'pong': Responds to heartbeat checks, setting `isAlive` to true.
    - 'message': Parses incoming JSON messages and routes them to the
      appropriate handler (e.g., `handleCandidateDetailsRequest`) based
      on the `message.event` property.

    @params: ws: ExtWebSocket - The client to attach listeners to.
    @returns: void
    */
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


    /*
    @method handleCandidateDetailsRequest
    @description: Handles the 'request:candidate_details' event from a
    client. It validates the payload and then securely calls
    `interviewService.getCandidateTranscript` using the authenticated
    `interviewId` and `interviewerId` stored on the `ws` object. This
    prevents a client from requesting data they are not authorized for.
    The resulting data is sent *only* to the requesting client via a
    'response:candidate_details' event.

    @params: ws: ExtWebSocket - The client that sent the request.
    @params: payload: any - The parsed message payload, expected to
                            contain a `candidateId`.
    @returns: Promise<void>
    */
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