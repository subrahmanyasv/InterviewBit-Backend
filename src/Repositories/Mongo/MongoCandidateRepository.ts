import { ICandidateRepository } from "../Interfaces/ICandidateRepository.js";
import { CandidateModel } from "../../Models/Candidate.model.js";
import { ICandidate } from "../../Models/Interfaces/ICandidate.js";

export class MongoCandidateRepository implements ICandidateRepository {
    public async insertMany(candidates: Partial<ICandidate>[], options?: any): Promise<ICandidate[]> {
        const docs = await CandidateModel.insertMany(candidates, options) as unknown as any[];
        return docs.map(doc => this.mapToEntity(doc));
    }

    public async findByInterviewId(interviewId: string, options?: any): Promise<ICandidate[]> {
        let query = CandidateModel.find({ interview_id: interviewId });
        if (options?.session) query = query.session(options.session);
        const docs = await query.exec();
        return docs.map(doc => this.mapToEntity(doc));
    }

    public async findById(id: string, options?: any): Promise<ICandidate | null> {
        let query = CandidateModel.findById(id);
        if (options?.session) query = query.session(options.session);
        const doc = await query.exec();
        return doc ? this.mapToEntity(doc) : null;
    }

    public async deleteManyByIds(candidateIds: string[], options?: any): Promise<void> {
        let query = CandidateModel.deleteMany({ _id: { $in: candidateIds } });
        if (options?.session) query = query.session(options.session);
        await query.exec();
    }

    private mapToEntity(doc: any): ICandidate {
        return {
            id: doc._id.toString(),
            interview_id: doc.interview_id.toString(),
            full_name: doc.full_name,
            phone_number: doc.phone_number,
            email: doc.email,
            access_link_token: doc.access_link_token,
            status: doc.status,
            final_score: doc.final_score,
            ai_summary: doc.ai_summary,
            started_at: doc.started_at,
            completed_at: doc.completed_at
        };
    }
}