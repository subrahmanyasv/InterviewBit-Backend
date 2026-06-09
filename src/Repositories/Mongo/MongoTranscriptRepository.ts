import { ITranscriptRepository } from "../Interfaces/ITranscriptRepository.js";
import { TranscriptModel } from "../../Models/Transcripts.model.js";
import { ITranscript } from "../../Models/Interfaces/ITranscript.js";

export class MongoTranscriptRepository implements ITranscriptRepository {
    public async findByCandidateId(candidateId: string, options?: any): Promise<ITranscript[]> {
        let query = TranscriptModel.find({ candidate_id: candidateId });
        if (options?.session) query = query.session(options.session);
        const docs = await query.exec();
        return docs.map(doc => this.mapToEntity(doc));
    }

    public async deleteManyByCandidateIds(candidateIds: string[], options?: any): Promise<void> {
        let query = TranscriptModel.deleteMany({ candidate_id: { $in: candidateIds } });
        if (options?.session) query = query.session(options.session);
        await query.exec();
    }

    private mapToEntity(doc: any): ITranscript {
        return {
            id: doc._id.toString(),
            candidate_id: doc.candidate_id.toString(),
            question_order: doc.question_order,
            question_text: doc.question_text,
            answer_text: doc.answer_text,
            score: doc.score,
            submitted_at: doc.submitted_at,
            created_at: doc.created_at
        };
    }
}