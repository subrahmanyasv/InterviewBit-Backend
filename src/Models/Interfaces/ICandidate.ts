import { interviewStatus } from "../../Utils/types.js";

export interface ICandidate {
    id?: string;
    interview_id: string;
    full_name?: string;
    phone_number?: string;
    email: string;
    access_link_token: string;
    status: interviewStatus;
    final_score: number;
    ai_summary: string;
    started_at?: Date;
    completed_at?: Date;
}