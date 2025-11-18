import { Request, NextFunction, Response , RequestHandler } from "express";
import { CandidateAuthRequest, interviewStatus } from "../Utils/types.js";
import { Candidate, CandidateModel } from "../Models/Candidate.model.js";
import { Interview, InterviewModel } from "../Models/Interview.model.js";
import { NotFoundError, UnauthorizedError } from "../Utils/ErrorClass.js";

// Helper function to calculate remaining time in minutes
// First calculates total allowed time based on number of questions and time per question
// Then subtracts elapsed time since interview started to get remaining time
// Returns remaining time in minutes
const calculateTimeRemaining = (startTime: Date, numQuestions: number, timePerQuestionMinutes: number): number => {
    const totalAllowedTimeMs = numQuestions * timePerQuestionMinutes * 60 * 1000;
    const elapsedMs = Date.now() - startTime.getTime();
    const remainingMs = totalAllowedTimeMs - elapsedMs;
    return Math.floor(remainingMs / (60 * 1000)); 
};


/*
@Middleware to authenticate candidate based on access link token
Checks:
    - Validity of token
    - Candidate existence
    - Interview existence
    - Interview status and timing constraints

Adds candidate and interview details to request object upon successful authentication
*/
export const authenticateCandidate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const candidateToken = req.params.access_link_token as string;
        if(!candidateToken){
            throw new UnauthorizedError("Candidate token missing");
        }

        const candidate: Candidate | null = await CandidateModel.findOne({ access_link_token: candidateToken });
        if(!candidate){
            throw new NotFoundError("Candidate not found");
        }

        //If interview already completed then send 410 Gone status
        if(candidate.status === interviewStatus.COMPLETED){
            res.status(410).json({
                message: "Interview already completed",
                candidateDetails: candidate
            });
            return;
        }

        const interview: Interview | null = await InterviewModel.findById(candidate.interview_id);
        if(!interview){
            throw new NotFoundError("Associated interview not found");
        }

        //If status is scheduled, check if current time is within scheduled time + buffer
        //If status is in progress, check if current time is within startedAt + timeRemaining
        if( candidate.status === interviewStatus.SCHEDULED ){

            // Get current time and calculate scheduled time with buffer
            const currentTime = new Date();
            const buffer_time_minutes : number= interview.buffer_time_minutes;
            const scheduledTimeWithBuffer: Date = new Date(interview.scheduled_start_time.getTime() + buffer_time_minutes * 60000);

            // Check if current time is within the allowed window
            if(currentTime < interview.scheduled_start_time || currentTime > scheduledTimeWithBuffer){
                throw new UnauthorizedError("Interview not yet started or buffer time exceeded");
            }
            
        }else if( candidate.status === interviewStatus.INPROGRESS ){
            //Get startedAt, numQuestions, minutesPerQuestion to calculate time remaining
            const startedAt : Date = candidate.started_at;
            const minutesPerQuestion : number= interview.minutes_per_question;
            const numQuestions : number= interview.num_questions;

            const timeRemaining = calculateTimeRemaining(startedAt, numQuestions, minutesPerQuestion);
            if(timeRemaining <= 0){
                throw new UnauthorizedError("Interview time has elapsed");
            }
            
        }

        // Attach candidate and interview details to request object
        (req as CandidateAuthRequest).candidate = candidate;
        (req as CandidateAuthRequest).interview = interview;
        (req as CandidateAuthRequest).access_link_token = candidateToken;
        next();
    }catch( error: unknown ){
        next(error);
    }
}
