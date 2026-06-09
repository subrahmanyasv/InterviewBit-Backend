export interface ITranscript {
    id?: string;
    candidate_id: string;
    question_order: number;
    question_text: string;
    answer_text: string;
    score: number;
    submitted_at?: Date;
    created_at?: Date;
}