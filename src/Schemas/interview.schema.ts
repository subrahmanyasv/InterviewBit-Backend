import { z } from 'zod';
import { interviewStatus } from '../Utils/types.js';

// IMPORTANT: Import the clean domain interfaces, NOT the Mongoose Models
import { IInterview } from "../Models/Interfaces/IInterview.js";
import { ICandidate } from "../Models/Interfaces/ICandidate.js";
import { ITranscript } from '../Models/Interfaces/ITranscript.js';

export const createInterviewSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').max(100),
    domain: z.string().min(1, 'Domain is required').max(100),
    status: z
      .nativeEnum(interviewStatus)
      .refine((val) => Object.values(interviewStatus).includes(val), {
        message:
          'Invalid status provided. Must be one of: Scheduled, Completed, Cancelled, In Progress',
      }),
    scheduled_start_time: z
      .string()
      .refine((v) => !isNaN(Date.parse(v)), {
        message: 'Invalid date format for scheduled start time',
      })
      .transform((v) => new Date(v)),

    buffer_time_minutes: z
      .number()
      .int()
      .positive('Buffer time must be a positive number'),

    num_questions: z
      .number()
      .int()
      .positive('Number of questions must be a positive number'),

    candidate_emails: z
      .array(z.string().email('Invalid email address'))
      .nonempty('At least one candidate email is required'),
    minutes_per_question: z
      .number()
      .int()
      .positive('Minutes per question must be a positive number')
      .optional(),
  }),
});

export type ICreateInterview = z.infer<typeof createInterviewSchema>['body'];

// UPDATE: Use the clean interfaces here
export interface IGetInterview {
  interview: IInterview,
  candidates: ICandidate[]
}

export interface IGetCandidateTranscript {
  candidate: ICandidate,
  transcripts: ITranscript[]
}