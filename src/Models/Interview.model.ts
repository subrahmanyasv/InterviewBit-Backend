import { Schema, model, Document } from 'mongoose';
import { interviewStatus } from '../Utils/types.js';


export interface Interview extends Document {
    interviewId: Schema.Types.ObjectId;
    interviewerId : Schema.Types.ObjectId;
    title: string;
    domain: string;
    status: interviewStatus;
    scheduled_start_time: Date;
    buffer_time_minutes: number;
    num_questions: number;
    created_at: Date;
}

const InterviewSchema = new Schema<Interview>({
    interviewerId: {
        type: Schema.Types.ObjectId,
        ref: 'Interviewer',
        required: [true, 'Interviewer ID is required'],
    },
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,    
    },  
    domain: {
        type: String,
        required: [true, 'Domain is required'],
        trim: true,
    },
    status: {
        type: String,
        enum: Object.values(interviewStatus),
        default: interviewStatus.SCHEDULED,
    }, 
    scheduled_start_time: {
        type: Date,
        required: [true, 'Scheduled start time is required'],
    },
    buffer_time_minutes: {
        type: Number,
        required: [true, 'Buffer time is required'],
    },
    num_questions: {
        type: Number,
        required: [true, 'Number of questions is required'],
    },
    created_at: {
        type: Date,
        default: Date.now,  
    }
})

export const InterviewModel = model<Interview>('Interview', InterviewSchema);   
