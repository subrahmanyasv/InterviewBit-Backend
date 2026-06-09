import { IInterviewRepository } from "../Interfaces/IInterviewRepository.js";
import { InterviewModel } from "../../Models/Interview.model.js";
import { IInterview } from "../../Models/Interfaces/IInterview.js";

export class MongoInterviewRepository implements IInterviewRepository {
    public async create(data: Partial<IInterview>[], options?: any): Promise<IInterview[]> {
        const docs = await InterviewModel.create(data, options);
        return docs.map(doc => this.mapToEntity(doc));
    }

    public async findById(id: string, options?: any): Promise<IInterview | null> {
        let query = InterviewModel.findById(id);
        if (options?.session) query = query.session(options.session);
        const doc = await query.exec();
        return doc ? this.mapToEntity(doc) : null;
    }

    public async findByInterviewerId(interviewerId: string, options?: any): Promise<IInterview[]> {
        let query = InterviewModel.find({ interviewerId });
        if (options?.session) query = query.session(options.session);
        const docs = await query.exec();
        return docs.map(doc => this.mapToEntity(doc));
    }

    public async deleteById(id: string, options?: any): Promise<void> {
        let query = InterviewModel.findByIdAndDelete(id);
        if (options?.session) query = query.session(options.session);
        await query.exec();
    }

    private mapToEntity(doc: any): IInterview {
        return {
            id: doc._id.toString(),
            interviewerId: doc.interviewerId.toString(),
            title: doc.title,
            domain: doc.domain,
            status: doc.status,
            scheduled_start_time: doc.scheduled_start_time,
            buffer_time_minutes: doc.buffer_time_minutes,
            num_questions: doc.num_questions,
            minutes_per_question: doc.minutes_per_question,
            created_at: doc.created_at
        };
    }
}