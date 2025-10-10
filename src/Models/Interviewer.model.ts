import { Schema, model , Document } from 'mongoose';

export interface Interviewer extends Document {
    full_name : string;
    email: string;
    password_hash : string;
    created_at: Date;
}

const InterviewerSchema = new Schema<Interviewer>( {
    full_name: {
        type: String,
        required: [true, 'Full name is required'],
        trim: true,
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        trim: true,
        lowercase: true,
        unique: true,
        match: [/\S+@\S+\.\S+/, 'Invalid email format']
    },
    password_hash: {
        type: String,
        required: [true, 'Password hash is required'],
        select: false,  
    },
    created_at: {
        type: Date,
        default: Date.now,  
    }
})

export const InterviewerModel = model<Interviewer>('Interviewer', InterviewerSchema);