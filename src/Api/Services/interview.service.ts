import mongoose, { Schema, Types } from 'mongoose';
import crypto from 'crypto';
import { InterviewModel, Interview } from '../../Models/Interview.model.js';
import { CandidateModel, Candidate } from "../../Models/Candidate.model.js";
import { interviewStatus } from '../../Utils/types.js';
import { ICreateInterview } from '../../Schemas/interview.schema.js';
import { NotFoundError } from '../../Utils/ErrorClass.js';

/*
@class InterviewService
Description: This class gives us all the services related to interview module. It allows us to create interviews, get list of interviews, get a single detailed interview, update a single interview, and also download result of an interview.
This class also gives methods to download the excel file of summary of interview, excel file for login credentials of candidates.

Dependencies:
    - mongoose: The Mongoose library for MongoDB interaction.
    - crypto: Utility for generating random bytes.
    - DB models: Mongoose models for interviews and candidates.

Methods:
    - createInterviewService(payload: ICreateInterview, interviewerId: Types.ObjectId | String): Promise<void>
    - getAllInterviwsService(interviewerId: Types.ObjectId | String): Promise<Interview[]>
    - getInterviewService(InterviewId: Types.ObjectId | String): Promise<Interview>
*/

class InterviewService {

    /*
    @method createInterviewService
    @description: This method creates a new interview. This method is the one that creates an interview, and also creates candidates for the interview. This method accepts the data to be stored about interview, and a list of candidate emails. It also needs interviewer id.

    First it saves the interview details in the interviews collection. Then using its id, creates an array using map() function to map interviewId with the candidate email and setting initial type.
    Then it stores all the candidates using insertMany() method.

    @params: payload: ICreateInterview, interviewerId: Types.ObjectId | String
    @returns: Promise<void>
    */
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

    /*
    @method getAllInterviwsService
    @description: This method retrieves all interviews that belong to a particular interviewer. It takes the interviewer’s ID and fetches all the interviews associated with that ID from the database.

    It queries the `InterviewModel` collection using the interviewer’s ID and returns the list of interviews as an array. If no interviews exist for the given ID, it simply returns an empty array.

    @params: interviewerId: Types.ObjectId | String
    @returns: Promise<Interview[]> - Returns an array of Interview objects belonging to the interviewer.
    */
    public async getAllInterviwsService(interviewerId: Types.ObjectId | String) : Promise<Interview[]> {
        try{
            const interviews: Interview[] = await InterviewModel.find({ interviererId: interviewerId });
            return interviews;
        }catch( error : unknown ){
            throw error;
        }
    }

    /*
    @method getInterviewService
    @description: This method retrieves the details of a specific interview using its unique Interview ID.

    It performs a database lookup using `InterviewModel.findById()` to find the interview document. If no interview is found with the provided ID, it throws a `NotFoundError` with an appropriate message.
    Otherwise, it returns the interview object.

    @params: InterviewId: Types.ObjectId | String
    @returns: Promise<Interview> - Returns the interview document if found, otherwise throws an error.
    */
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

const interviewService = new InterviewService();
export default interviewService;