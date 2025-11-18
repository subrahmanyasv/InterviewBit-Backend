import { Request, NextFunction, Response , RequestHandler } from "express";
import { CandidateAuthRequest, interviewStatus } from "../Utils/types.js";
import { Candidate, CandidateModel } from "../Models/Candidate.model.js";
import { Interview, InterviewModel } from "../Models/Interview.model.js";
import { NotFoundError, UnauthorizedError } from "../Utils/ErrorClass.js";

const calculateTimeRemaining = (startTime: Date, numQuestions: number, timePerQuestionMinutes: number): number => {
    const totalAllowedTimeMs = numQuestions * timePerQuestionMinutes * 60 * 1000;
    const elapsedMs = Date.now() - startTime.getTime();
    const remainingMs = totalAllowedTimeMs - elapsedMs;
    return Math.floor(remainingMs / (60 * 1000)); 
};


export const authenticateCandidate: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const candidateToken = req.params.interviewToken as string;
        if(!candidateToken){
            throw new UnauthorizedError("Candidate token missing");
        }

        const candidate: Candidate | null = await CandidateModel.findOne({ access_link_token: candidateToken });
        if(!candidate){
            throw new NotFoundError("Candidate not found");
        }

        if(candidate.status === interviewStatus.COMPLETED){
            res.status(200).json({
                message: "Interview already completed",
                candidateDetails: candidate
            });
            return;
        }

        const interview: Interview | null = await InterviewModel.findById(candidate.interview_id);
        if(!interview){
            throw new NotFoundError("Associated interview not found");
        }

        if( candidate.status === interviewStatus.SCHEDULED ){
            const currentTime = new Date();
            const buffer_time_minutes : number= interview.buffer_time_minutes;
            const scheduledTimeWithBuffer: Date = new Date(interview.scheduled_start_time.getTime() + buffer_time_minutes * 60000);

            if(currentTime < interview.scheduled_start_time || currentTime > scheduledTimeWithBuffer){
                throw new UnauthorizedError("Interview not yet started or buffer time exceeded");
            }
            
        }else if( candidate.status === interviewStatus.INPROGRESS ){
            const startedAt : Date = candidate.started_at;
            const minutesPerQuestion : number= interview.minutes_per_question;
            const numQuestions : number= interview.num_questions;

            const timeRemaining = calculateTimeRemaining(startedAt, numQuestions, minutesPerQuestion);
            if(timeRemaining <= 0){
                throw new UnauthorizedError("Interview time has elapsed");
            }
            
        }
        next();
    }catch( error: unknown ){
        next(error);
    }
}
