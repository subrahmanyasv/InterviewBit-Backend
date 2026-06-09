import { IInterviewerRepository } from "../Interfaces/IInterviewerRepository";
import { InterviewerModel } from "../../Models/Interviewer.model.js";
import { IInterviewer } from "../../Models/Interfaces/IInterviewer.js";

export class MongoInterviewerRepository implements IInterviewerRepository {
    
    public async create(data: Partial<IInterviewer>, options?: any): Promise<IInterviewer> {
        const docs = await InterviewerModel.create([data], options);
        return this.mapToEntity(docs[0]);
    }

    public async findById(id: string): Promise<IInterviewer | null> {
        const doc = await InterviewerModel.findById(id);
        return doc ? this.mapToEntity(doc) : null;
    }

    public async findByEmail(email: string): Promise<IInterviewer | null> {
        const doc = await InterviewerModel.findOne({ email });
        return doc ? this.mapToEntity(doc) : null;
    }

    public async findByEmailWithPassword(email: string): Promise<IInterviewer | null> {
        // Specifically requesting the password_hash that is normally hidden
        const doc = await InterviewerModel.findOne({ email }).select('+password_hash');
        return doc ? this.mapToEntity(doc, true) : null;
    }

    private mapToEntity(doc: any, includePassword = false): IInterviewer {
        const entity: IInterviewer = {
            id: doc._id.toString(),
            full_name: doc.full_name,
            email: doc.email,
            created_at: doc.created_at
        };

        if (includePassword && doc.password_hash) {
            entity.password_hash = doc.password_hash;
        }

        return entity;
    }
}