import { IInterviewer } from "../../Models/Interfaces/IInterviewer.js";

export interface IInterviewerRepository {
    create(data: Partial<IInterviewer>, options?: unknown): Promise<IInterviewer>;
    findById(id: string): Promise<IInterviewer | null>;
    findByEmail(email: string): Promise<IInterviewer | null>;
    findByEmailWithPassword(email: string): Promise<IInterviewer | null>;
}