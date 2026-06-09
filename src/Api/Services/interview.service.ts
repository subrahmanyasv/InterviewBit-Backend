import crypto from 'crypto';
import { interviewStatus } from '../../Utils/types.js';
import { ICreateInterview, IGetInterview, IGetCandidateTranscript } from '../../Schemas/interview.schema.js';
import { BadRequestError, NotFoundError, UnauthorizedError, ForbiddenError } from '../../Utils/ErrorClass.js';

import { IInterview } from '../../Models/Interfaces/IInterview.js';
import { IInterviewRepository } from '../../Repositories/Interfaces/IInterviewRepository.js';
import { ICandidateRepository } from '../../Repositories/Interfaces/ICandidateRepository.js';
import { ITranscriptRepository } from '../../Repositories/Interfaces/ITranscriptRepository.js';
import { ITransactionManager } from '../../Repositories/Interfaces/ITransactionManager.js';

class InterviewService {

    constructor(
        private interviewRepo: IInterviewRepository,
        private candidateRepo: ICandidateRepository,
        private transcriptRepo: ITranscriptRepository,
        private transactionManager: ITransactionManager
    ) {}

    public async createInterviewService(payload: ICreateInterview, interviewerId: string): Promise<IInterview> {
        const { title, domain, status, scheduled_start_time, buffer_time_minutes, num_questions, candidate_emails, minutes_per_question } = payload;
        return await this.transactionManager.withTransaction(async (dbOptions) => {
            const newInterviews = await this.interviewRepo.create([{
                title,
                domain,
                status,
                scheduled_start_time,
                buffer_time_minutes,
                num_questions,
                minutes_per_question,
                interviewerId: interviewerId
            }], dbOptions);

            if (!newInterviews || newInterviews.length === 0) throw new Error("Interview not created");

            const candidatesToCreate = candidate_emails.map((email: string) => ({
                interview_id: newInterviews[0].id!,
                email,
                access_link_token: crypto.randomBytes(20).toString('hex'),
                status: interviewStatus.SCHEDULED
            }));

            await this.candidateRepo.insertMany(candidatesToCreate, dbOptions);

            return newInterviews[0];
        });
    }

    public async getAllInterviwsService(interviewerId: string): Promise<IInterview[]> {
        return await this.interviewRepo.findByInterviewerId(interviewerId);
    }

    public async getInterviewService(interviewId: string): Promise<IGetInterview> {
        const interview = await this.interviewRepo.findById(interviewId);
        if (!interview) throw new NotFoundError("Interview not found");

        const candidates = await this.candidateRepo.findByInterviewId(interview.id!);
        return { interview, candidates };
    }

    public async generateCandidateLinkExcel(interviewId: string, interviewerId: string): Promise<Buffer> {
         throw new Error("Excel generation feature has been moved/commented out temporarily.");
    }

    public async generateInterviewSummaryExcel(interviewId: string, interviewerId: string): Promise<Buffer> {
         throw new Error("Excel generation feature has been moved/commented out temporarily.");
    }

    public async getCandidateTranscript(interviewId: string, candidateId: string, interviewerId: string): Promise<IGetCandidateTranscript> {
        const interview = await this.interviewRepo.findById(interviewId);
        if (!interview) {
            throw new NotFoundError(`Interview with ID ${interviewId} not found.`);
        }
        if (interview.interviewerId !== interviewerId) {
            throw new ForbiddenError('You are not authorized to access this interview.');
        }

        if(interview.status == interviewStatus.SCHEDULED) throw new BadRequestError("Interview not started");
        if(interview.status == interviewStatus.CANCELLED) throw new BadRequestError("Interview cancelled");

        const candidate = await this.candidateRepo.findById(candidateId);
        if (!candidate || candidate.interview_id !== interviewId) {
            throw new NotFoundError(`Candidate with ID ${candidateId} not found in this interview.`);
        }

        const transcripts = await this.transcriptRepo.findByCandidateId(candidateId);
        return { candidate, transcripts };
    }

    public async deleteInterview(interviewId: string, interviewerId: string): Promise<void> {
        return await this.transactionManager.withTransaction(async (dbOptions) => {
            const interview = await this.interviewRepo.findById(interviewId, dbOptions);
            if (!interview) {
                throw new NotFoundError(`Interview with ID ${interviewId} not found.`);
            }
            if (interview.interviewerId !== interviewerId) {
                throw new ForbiddenError('You are not authorized to delete this interview.');
            }

            const candidates = await this.candidateRepo.findByInterviewId(interviewId, dbOptions);
            const candidateIds = candidates.map(c => c.id as string);

            if (candidateIds.length > 0) {
                await this.transcriptRepo.deleteManyByCandidateIds(candidateIds, dbOptions);
                await this.candidateRepo.deleteManyByIds(candidateIds, dbOptions);
            }

            await this.interviewRepo.deleteById(interviewId, dbOptions);
        });
    }
}

export default InterviewService;