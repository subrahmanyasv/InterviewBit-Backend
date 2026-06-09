import { interviewStatus } from "../../Utils/types.js";

export interface IInterview {
    id?: string;
    interviewerId: string;
    title: string;
    domain: string;
    status: interviewStatus;
    scheduled_start_time: Date;
    buffer_time_minutes: number;
    num_questions: number;
    minutes_per_question?: number;
    created_at?: Date;
}