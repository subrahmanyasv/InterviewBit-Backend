// This file defines the IInterviewer interface, which represents the structure of an interviewer object in the application. 

export interface IInterviewer {
    id?: string;
    full_name: string;
    email: string;
    password_hash?: string; 
    created_at?: Date;
}