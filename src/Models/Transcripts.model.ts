import { Schema , model , Document } from 'mongoose';

export interface Transcript extends Document {
    candidate_id: Schema.Types.ObjectId;
    question_order: number;
    question_text: string;
    answer_text: string;
    score: number;
    submitted_at: Date;
    created_at: Date;
}

/*
This is the collection we use to store each question answer pair of a candidate.
This document will be created when candidate starts the interview.
Once user clicks on start interview, all the question and thier order will be created using AI
As user submits answer, we will update the answer_text immediately.
Updation of score is passed to background job as it requires calling AI apis.
*/
const TranscriptSchema = new Schema<Transcript>({
    candidate_id: {
        type: Schema.Types.ObjectId,
        ref: 'Candidate',
        required: [true, 'Candidate ID is required'],
    },
    question_order: {
        type: Number,
        required: [true, 'Question order is required'],
    },
    question_text: {
        type: String,
        required: [true, 'Question text is required'],
        trim: true,
    },
    answer_text: {
        type: String,
        default: '',
        trim: true,
    }, 
    score: {
        type: Number,
        default: 0,
    },
    submitted_at: {
        type: Date,
        default: null,
    },
    created_at: {
        type: Date,
        default: Date.now,  
    }
})

export const TranscriptModel = model<Transcript>('Transcript', TranscriptSchema);