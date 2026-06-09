import { ITranscript } from "../../Models/Interfaces/ITranscript.js";

export interface ITranscriptRepository {
    findByCandidateId(candidateId: string, options?: unknown): Promise<ITranscript[]>;
    deleteManyByCandidateIds(candidateIds: string[], options?: unknown): Promise<void>;
}