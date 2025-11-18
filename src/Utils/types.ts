import { Request } from "express";
import { tokenPayload } from "../Schemas/auth.schema.js";
import { Candidate } from "../Models/Candidate.model.js";
import { Interview } from "../Models/Interview.model.js";

export enum interviewStatus {
    SCHEDULED= 'Scheduled',
    COMPLETED= 'Completed',
    CANCELLED= 'Cancelled',
    INPROGRESS=  'In Progress'
}

export interface customRequest extends Request {
    interviewer : tokenPayload
}

export interface CandidateAuthRequest extends Request {
    access_link_token: string;
    candidate: Candidate;
    interview: Interview;
}