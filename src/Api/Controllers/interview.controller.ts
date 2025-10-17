import mongoose, { Schema, Types } from "mongoose";
import interviewService from "../Services/interview.service.js";
import { Request, Response, NextFunction } from "express";
import { IGetCandidateTranscript } from "../../Schemas/interview.schema.js";


class InterviewController{
    public async create(req: Request, res: Response, next: NextFunction) {
        try{
            const payload = req.body;
            const interviewerId: Schema.Types.ObjectId = req.interviewer._id;
            const interview = await interviewService.createInterviewService(payload, interviewerId);
            res.status(201).json(interview);
        }catch( error: unknown ) {
            next(error);
        }
    }

    public async getAll(req: Request, res: Response, next: NextFunction) {
        try{
            const interviewerId: Schema.Types.ObjectId = req.interviewer._id;
            const interviews = await interviewService.getAllInterviwsService(interviewerId);
            res.status(200).json(interviews);
        }catch( error: unknown ) {
            next(error);
        }
    }

    public async get(req: Request, res: Response, next: NextFunction) {
        try{
            const InterviewId: mongoose.Types.ObjectId = new Types.ObjectId(req.params.InterviewId);
            const interview = await interviewService.getInterviewService(InterviewId);
            res.status(200).json(interview);
        }catch( error: unknown ) {
            next(error);
        }
    }

    public async getTranscript(req: Request, res: Response, next: NextFunction) {
        try{
            const InterviewId: String = req.params.InterviewId;
            const CandidateId: String = req.params.CandidateId;
            const interviewerId: String = req.interviewer._id.toString();
            const transcript = await interviewService.getCandidateTranscript(InterviewId, CandidateId, interviewerId);
            res.status(200).json(transcript);
        }catch( error: unknown ) {
            next(error);
        }
    }

    public async delete(req: Request, res: Response, next: NextFunction) {
        try{
            const InterviewId: String = req.params.InterviewId;
            const interviewerId: String = req.interviewer._id.toString();
            await interviewService.deleteInterview(InterviewId, interviewerId);
            res.status(200).json({ message: 'Interview deleted successfully' });
        }catch( error: unknown ) {
            next(error);
        }
    }

    public async candidateTokenExcelDownload(req: Request, res: Response, next: NextFunction) {
        try{
            const interviewId: String = req.params.InterviewId;
            const interviewerId: String = req.interviewer._id.toString();

            const result: Buffer = await interviewService.generateCandidateLinkExcel(interviewId, interviewerId);

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=candidate_links.xlsx');
            res.status(200).send(result);
        }catch( error: unknown ){
            next(error);
        }
    }


    public async interviewResultExcelDownload(req: Request, res: Response, next: NextFunction) {
        try{
            const interviewId: String = req.params.InterviewId;
            const interviewerId: String = req.interviewer._id.toString();

            const result: Buffer = await interviewService.generateInterviewSummaryExcel(interviewId, interviewerId);

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=interview_summary.xlsx');
            res.status(200).send(result);
        }catch( error: unknown ){
            next(error);
        }
    }

    public async getCandidateTranscript(req: Request, res: Response, next: NextFunction) {
        try{
            const InterviewId: String = req.params.InterviewId;
            const CandidateId: String = req.params.CandidateId;
            const interviewerId: String = req.interviewer._id.toString();
            const transcript : IGetCandidateTranscript = await interviewService.getCandidateTranscript(InterviewId, CandidateId, interviewerId);
            res.status(200).json(transcript);
        }catch( error: unknown ){
            next(error);    
        }
    }
}

const interviewController = new InterviewController();
export default interviewController;