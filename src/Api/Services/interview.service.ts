import mongoose, { Schema, Types } from 'mongoose';
import crypto from 'crypto';
import { InterviewModel, Interview } from '../../Models/Interview.model.js';
import { CandidateModel, Candidate } from "../../Models/Candidate.model.js";
import { interviewStatus } from '../../Utils/types.js';
import { ICreateInterview } from '../../Schemas/interview.schema.js';
import { NotFoundError } from '../../Utils/ErrorClass.js';

class InterviewService {

    public async createInterviewService(payload: ICreateInterview, interviewerId: Types.ObjectId | String) : Promise<void> {
        const { title, domain, status, scheduled_start_time, buffer_time_minutes, num_questions, candidate_emails } = payload;

        const session = await mongoose.startSession();
        try {
            session.startTransaction();
            const newInterviews: Interview[] = await InterviewModel.create([{ 
                title, 
                domain, 
                status, 
                scheduled_start_time, 
                buffer_time_minutes, 
                num_questions, 
                interviererId: interviewerId 
            }], { session });

            if(!newInterviews) throw new Error("Interview not created");

            const candidatesToCreate = candidate_emails.map((email: string)=>({
                interview_id : newInterviews[0]._id,
                email,
                access_link_token: crypto.randomBytes(20).toString('hex'),
                status: interviewStatus.SCHEDULED
            }))

            await CandidateModel.insertMany(candidatesToCreate, { session });

            await session.commitTransaction();
        }catch( error: unknown ){
            await session.abortTransaction();
            throw error;
        }finally{
            await session.endSession();
        }
    }

    public async getAllInterviwsService(interviewerId: Types.ObjectId | String) : Promise<Interview[]> {
        try{
            const interviews: Interview[] = await InterviewModel.find({ interviererId: interviewerId });
            return interviews;
        }catch( error : unknown ){
            throw error;
        }
    }

    public async getInterviewService(InterviewId: Types.ObjectId | String) : Promise<Interview> {
        try{
            const interview: Interview | null= await InterviewModel.findById(InterviewId);
            if(!interview) throw new NotFoundError("Interview not found");
            return interview;
        }catch( error : unknown ){
            throw error;
        }
    }


}