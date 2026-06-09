import { ICandidate } from "../../Models/Interfaces/ICandidate.js";

export interface ICandidateRepository {
    insertMany(candidates: Partial<ICandidate>[], options?: unknown): Promise<ICandidate[]>;
    findByInterviewId(interviewId: string, options?: unknown): Promise<ICandidate[]>;
    findById(id: string, options?: unknown): Promise<ICandidate | null>;
    deleteManyByIds(candidateIds: string[], options?: unknown): Promise<void>;
}