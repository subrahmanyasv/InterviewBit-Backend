import mongoose, { Schema, Types } from 'mongoose';
import crypto from 'crypto';
import ExcelJS from 'exceljs';
import { InterviewModel, Interview } from '../../Models/Interview.model.js';
import { CandidateModel, Candidate } from "../../Models/Candidate.model.js";
import { TranscriptModel, Transcript } from '../../Models/Transcripts.model.js';
import { interviewStatus } from '../../Utils/types.js';
import { ICreateInterview, IGetInterview, IGetCandidateTranscript } from '../../Schemas/interview.schema.js';
import { BadRequestError, NotFoundError, UnauthorizedError, ForbiddenError } from '../../Utils/ErrorClass.js';

/*
@class InterviewService
Description: This class gives us all the services related to interview module. It allows us to create interviews, get list of interviews, get a single detailed interview, update a single interview, and also download result of an interview.
This class also gives methods to download the excel file of summary of interview, excel file for login credentials of candidates.

Dependencies:
    - mongoose: The Mongoose library for MongoDB interaction.
    - crypto: Utility for generating random bytes.
    - DB models: Mongoose models for interviews and candidates.

Methods:
    - createInterviewService(payload: ICreateInterview, interviewerId: Types.ObjectId | String): Promise<Interview>
    - getAllInterviwsService(interviewerId: Types.ObjectId | String): Promise<Interview[]>
    - getInterviewService(InterviewId: Types.ObjectId | String): Promise<IGetInterview>
    - updateInterviewService(InterviewId: Types.ObjectId | String, payload: IUpdateInterview): Promise<Interview>
    - deleteInterview(InterviewId: String, interviewerId: String): Promise<void>
    - getCandidateTranscript(InterviewId: String, CandidateId: String, interviewerId: String): Promise<IGetCandidateTranscript>
    - generateInterviewSummaryExcel(InterviewId: String, interviewerId: String): Promise<Buffer>
    - generateCandidateLinkExcel(InterviewId: String, interviewerId: String): Promise<Buffer>
*/

class InterviewService {

    /*
    @method createInterviewService
    @description: This method creates a new interview. This method is the one that creates an interview, and also creates candidates for the interview. This method accepts the data to be stored about interview, and a list of candidate emails. It also needs interviewer id.

    First it saves the interview details in the interviews collection. Then using its id, creates an array using map() function to map interviewId with the candidate email and setting initial type.
    Then it stores all the candidates using insertMany() method.

    @params: payload: ICreateInterview, interviewerId: Types.ObjectId | String
    @returns: Promise<Interview>
    */
    public async createInterviewService(payload: ICreateInterview, interviewerId: Schema.Types.ObjectId | String): Promise<Interview> {
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
                interviewerId: interviewerId
            }], { session });

            if (!newInterviews) throw new Error("Interview not created");

            const candidatesToCreate = candidate_emails.map((email: string) => ({
                interview_id: newInterviews[0]._id,
                email,
                access_link_token: crypto.randomBytes(20).toString('hex'),
                status: interviewStatus.SCHEDULED
            }))

            await CandidateModel.insertMany(candidatesToCreate, { session });

            await session.commitTransaction();
            return newInterviews[0];
        } catch (error: unknown) {
            await session.abortTransaction();
            throw error;
        } finally {
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
    public async getAllInterviwsService(interviewerId: Schema.Types.ObjectId | String): Promise<Interview[]> {
        try {
            const interviews: Interview[] = await InterviewModel.find({ interviewerId: interviewerId });
            return interviews;
        } catch (error: unknown) {
            throw error;
        }
    }

    /*
    @method getInterviewService
    @description: This method retrieves the details of a specific interview using its unique Interview ID.

    It performs a database lookup using `InterviewModel.findById()` to find the interview document. If no interview is found with the provided ID, it throws a `NotFoundError` with an appropriate message.
    Otherwise, it returns the interview object.

    @params: InterviewId: Types.ObjectId | String
    @returns: Promise<IGetInterview> - Returns the interview document if found, otherwise throws an error.
    */
    public async getInterviewService(InterviewId: mongoose.Types.ObjectId | String): Promise<IGetInterview> {
        try {
            const interview: Interview | null = await InterviewModel.findById(InterviewId);
            if (!interview) throw new NotFoundError("Interview not found");

            const interviewId: Schema.Types.ObjectId = interview._id as Schema.Types.ObjectId;
            const candidates: Candidate[] = await CandidateModel.find({ interview_id: interviewId });
            return { interview, candidates };

        } catch (error: unknown) {
            throw error;
        }
    }

    /*
    @method geenrateCandidateLinkExcel
    @Description: This service is used to fetch candidates list of an interview and convert it to excel file. We do that using the library exceljs. 
    
    First we check if interviewId is valid and it belongs to current interivewer. If true, then we fetch the details of the candidates of that interivew.
    Once its fetched, we use ExcelJS to create a new workbook and add a worksheet to it. Then we add columns to the worksheet. Then we loop through the candidates and add each candidate to the worksheet.
    Finally we return the buffer of the workbook.

    @params: interviewId: Types.ObjectId | String, interviewerId: Types.ObjectId | String
    @returns: Promise<Buffer>

    @Dependencies: 
        - exceljs
    */

    public async generateCandidateLinkExcel(interviewId: Types.ObjectId | String, interviewerId: Types.ObjectId | String): Promise<Buffer> {
        try {
            const interview: Interview | null = await InterviewModel.findById(interviewId);
            if (!interview) throw new NotFoundError("Interview not found");

            if (interview.interviewerId.toString() !== interviewerId.toString()) throw new Error("Unauthorized access");

            const candidates = await CandidateModel.find({ interview_id: interviewId });
            if (candidates.length == 0) throw new NotFoundError("Candidates not found");

            const workbook = new ExcelJS.Workbook();
            const workSheet = workbook.addWorksheet('Candidate Links');

            workSheet.columns = [
                { header: 'Candidate Email', key: 'emial', width: 50 },
                { header: 'Access Link Token', key: 'access_link_token', width: 50 },
            ]

            candidates.forEach((candidate) => {
                workSheet.addRow({
                    emial: candidate.email,
                    access_link_token: candidate.access_link_token
                });
            });

            const arrayBuffer : ArrayBuffer = await workbook.xlsx.writeBuffer();
            const buffer : Buffer = Buffer.from(arrayBuffer);
            return buffer;
        } catch (error: unknown) {
            throw error;
        }
    }



    /*
    @method generateInterviewSummaryExcel
    @description: This service is used to generate interview summary excel file. We do that using the library exceljs.

    First we check if interviewId is valid and it belongs to current interivewer. If true, then we fetch the details of the candidates of that interivew. Once its fetched, we use ExcelJS to create a new workbook and add a worksheet to it. Then we add columns to the worksheet. Then we loop through the candidates and add each candidate to the worksheet. Finally we return the buffer of the workbook.

    @params: interviewId: Types.ObjectId | String, interviewerId: Types.ObjectId | String
    @returns: Promise<Buffer>

    @Dependencies: 
        - exceljs
    */
    public async generateInterviewSummaryExcel(interviewId:Types.ObjectId | String, interviewerId: Types.ObjectId | String): Promise<Buffer> {
        try{
            const interview: Interview | null = await InterviewModel.findById(interviewId);
            if (!interview) throw new NotFoundError("Interview not found");

            if(interview.status != interviewStatus.COMPLETED) throw new BadRequestError("Interview not completed");
            
            if (interview.interviewerId.toString() !== interviewerId.toString()) throw new UnauthorizedError("Unauthorized access");

            const candidates = await CandidateModel.find({ interview_id: interviewId });
            if (candidates.length == 0) throw new NotFoundError("Candidates not found");

            const workbook = new ExcelJS.Workbook();
            const workSheet = workbook.addWorksheet('Interview Summary');

            workSheet.columns = [
                { header: "Candidate Email", key: "email", width: 50 },
                { header: "Candidate Name", key: 'full_name', width: 50 },
                { header: 'Phone number', key: 'phone_number', width: 50 },
                { header: "Final Score", key: "final_score", width: 50 },
                { header: "AI Summary", key: "ai_summary", width: 50 },
                { header: "Completed At", key: "completed_at", width: 50 },
            ]

            candidates.forEach((candidate) => {
                workSheet.addRow({
                    email: candidate.email,
                    full_name: candidate.full_name,
                    phone_number: candidate.phone_number,
                    final_score: candidate.final_score,
                    ai_summary: candidate.ai_summary,
                    completed_at: candidate.completed_at
                });
            })

            const arrayBuffer : ArrayBuffer = await workbook.xlsx.writeBuffer();
            const buffer : Buffer = Buffer.from(arrayBuffer);
            return buffer;
        }catch( error: unknown ){
            throw error;
        }
    }



    /*
    @method getCandidateTranscript
    @description: This service is used to get the initial transcript of the candidate.
    First we check if interviewId is valid and belongs to the interviewer. If its ture, then we check if interview is scheduled or cancelled. If any one is true, then we throw error. Otherwise, we fetch the candidate and transcripts of that candidate. Then we return the candidate and transcripts. 

    @params: interviewId: string, candidateId: string, interviewerId: string
    @returns: Promise<IGetCandidateTranscript>
    */
    public async getCandidateTranscript(interviewId: String, candidateId: String, interviewerId: String): Promise<IGetCandidateTranscript> {
        const interview: Interview | null = await InterviewModel.findById(interviewId);
        if (!interview) {
            throw new NotFoundError(`Interview with ID ${interviewId} not found.`);
        }
        if (interview.interviewerId.toString() !== interviewerId.toString()) {
            throw new ForbiddenError('You are not authorized to access this interview.');
        }

        if(interview.status == interviewStatus.SCHEDULED) throw new BadRequestError("Interview not started");
        if(interview.status == interviewStatus.CANCELLED) throw new BadRequestError("Interview cancelled");

        const candidate = await CandidateModel.findById(candidateId);
        if (!candidate || candidate.interview_id.toString() !== interviewId) {
            throw new NotFoundError(`Candidate with ID ${candidateId} not found in this interview.`);
        }

        const transcripts = await TranscriptModel.find({ candidate_id: candidateId });
        return { candidate, transcripts };
    }


    /*
    @method deleteInterview
    @description: This service is used to delete the interview. First we check if the interviewer is authorized to delete the interview. If its true, then we delete the interview.

    @params: interviewId: string, interviewerId: string
    @returns: Promise<void>
    */

    public async deleteInterview(interviewId: String, interviewerId: String): Promise<void> {
        const session = await mongoose.startSession();
        try {
            session.startTransaction();

            const interview = await InterviewModel.findById(interviewId).session(session);
            if (!interview) {
                throw new NotFoundError(`Interview with ID ${interviewId} not found.`);
            }
            if (interview.interviewerId.toString() !== interviewerId.toString()) {
                throw new ForbiddenError('You are not authorized to delete this interview.');
            }

            // Find all candidates associated with the interview
            const candidates = await CandidateModel.find({ interview_id: interviewId }).session(session);
            const candidateIds = candidates.map(c => c._id);

            if (candidateIds.length > 0) {
                // Delete all transcripts for those candidates
                await TranscriptModel.deleteMany({ candidate_id: { $in: candidateIds } }).session(session);
                
                // Delete all the candidates
                await CandidateModel.deleteMany({ _id: { $in: candidateIds } }).session(session);
            }

            // Finally, delete the interview itself
            await InterviewModel.findByIdAndDelete(interviewId).session(session);

            await session.commitTransaction();
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            await session.endSession();
        }
    }
}

const interviewService = new InterviewService();
export default interviewService;