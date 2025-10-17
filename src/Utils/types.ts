import { Request } from "express";
import { tokenPayload } from "../Schemas/auth.schema.js";

export enum interviewStatus {
    SCHEDULED= 'Scheduled',
    COMPLETED= 'Completed',
    CANCELLED= 'Cancelled',
    INPROGRESS=  'In Progress'
}

export interface customRequest extends Request {
    interviewer : tokenPayload
}