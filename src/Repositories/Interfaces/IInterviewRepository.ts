import { IInterview } from "../../Models/Interfaces/IInterview.js";

export interface IInterviewRepository {
    create(data: Partial<IInterview>[], options?: unknown): Promise<IInterview[]>;
    findById(id: string, options?: unknown): Promise<IInterview | null>;
    findByInterviewerId(interviewerId: string, options?: unknown): Promise<IInterview[]>;
    deleteById(id: string, options?: unknown): Promise<void>;
}