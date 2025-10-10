import { Schema, model, Document } from "mongoose";
import { interviewStatus } from "../Utils/types.js";

export interface Candidate extends Document {
    interview_id: Schema.Types.ObjectId;
    full_name: string;
    phone_number: string;
    emial: string;
    access_link_token: string;
    status: interviewStatus;
    final_score: number;
    ai_summary: string;
    completed_at: Date;
}


const CandidateSchema = new Schema<Candidate>({
    interview_id: {
        type: Schema.Types.ObjectId,
        ref: 'Interview',
        required: [true, 'Interview ID is required'],
    },
    full_name: {
        type: String,
        required: [true, 'Full name is required'],
        trim: true,
    },
    phone_number: {
        type: String,
        required: [true, 'Phone number is required'],
        trim: true,
    },
    emial: {
        type: String,
        required: [true, 'Email is required'],
        trim: true,
        lowercase: true,
        unique: true,
        match: [/\S+@\S+\.\S+/, 'Invalid email format']
    },
    access_link_token: {
        type: String,
        required: [true, 'Access link token is required'],
        trim: true,
    },
    status: {
        type: String,
        enum: Object.values(interviewStatus),
        default: interviewStatus.SCHEDULED,
    },
    final_score: {
        type: Number,
        default: 0,
    },
    ai_summary: {
        type: String,
        default: '',    
    },
    completed_at: {
        type: Date,
        default: null,
    },  
})

export const CandidateModel = model<Candidate>('Candidate', CandidateSchema);
