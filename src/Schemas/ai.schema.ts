import { Transcript } from "../Models/Transcripts.model.js";
import { Candidate } from "../Models/Candidate.model.js";


/*
@AI_PROMPTS
This object contains template functions for generating prompts for the AI model to perform specific tasks.
Each function returns a string prompt with placeholders filled in.

- Used to get the proper prompt for various AI tasks like:
  - Generating interview questions
  - Evaluating candidate answers
  - Summarizing interview performance
*/
export const AI_PROMPTS = {
    /**
     * Generates the prompt for creating interview questions.
     * Input variables: {domain}, {num_questions}
     */
    GENERATE_QUESTIONS_TEMPLATE: `
You are an expert technical interviewer in the field of {domain}.
Generate exactly {num_questions} interview questions for a candidate in this domain.
The questions should strictly test technical knowledge and problem-solving skills relevant to {domain}.

IMPORTANT: Return ONLY a raw JSON array of objects. Do not include any markdown formatting.
Each object must have exactly these fields:
- "question_text": The question itself (string).
- "difficulty": One of "Easy", "Medium", or "Hard".

Example output format:
[
  {{ "question_text": "What is event bubbling?", "difficulty": "Easy" }}
]
`,

    /**
     * Generates the prompt for evaluating a single answer.
     * Input variables: {question}, {answer}, {domain}
     */
    EVALUATE_ANSWER_TEMPLATE: `
You are an expert technical interviewer in {domain}.
Evaluate the following candidate answer.

Question: "{question}"
Candidate Answer: "{answer}"

Tasks:
1. Score the answer from 1 to 10 based on correctness, depth, and clarity. (1 = wrong, 10 = perfect).
2. Provide a concise 1-2 sentence feedback justifying the score.

IMPORTANT: Return ONLY a raw JSON object. No markdown.
Example output format:
{{ "score": 7, "feedback": "Good understanding of the core concept." }}
`,

    /**
     * Generates the prompt for the final interview summary.
     * Input variables: {domain}, {qa_history}
     */
    GENERATE_SUMMARY_TEMPLATE: `
You are an expert technical interviewer in {domain}.
Summarize the following interview performance.

Domain: {domain}

Q&A History:
{qa_history}

Tasks:
1. Write a concise summary paragraph (approx. 4-5 sentences) evaluating the candidate's overall performance, highlighting key strengths and major weaknesses.
2. Provide a final "Hire" or "No Hire" recommendation based strictly on the technical performance.

IMPORTANT: Return ONLY a raw JSON object. No markdown.
Example output format:
{{
  "summary_text": "The candidate showed strong knowledge in...",
  "recommendation": "Hire"
}}
`
};




// --- Input/Output Schemas for AI Service Methods ---
// 1. Generate Questions Input
export interface IGenerateQuestionsInput {
    domain: string;
    num_questions: number;
}

// 2. Generate quesions output
export interface IGeneratedQuestion {
    question_text: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
}

// 3. Evaluate answer output
export interface IEvaluationResult {
    score: number;      // 1-10
    feedback: string;   // A concise 1-2 sentence feedback
}


// 4. Interview Summary Output
export interface IInterviewSummary {
    summary_text: string;
    recommendation: 'Strong Hire' | 'Hire' | 'Review' | 'No Hire';
}


// --- WebSocket Event Schemas (Pub/Sub Pattern) ---

// Interface to define data sent for Dashboard 1.
// Gives just enough info to show candidate progress on dashboard.
export interface IAnswerSubmittedEvent {
    interviewId: string;        // To know which room to send this to.
    candidateId: string;        // To identify candidate
    transcriptId: string;       // To identify which Q&A this is about
    question_order: number;     // To track progress

    //ToDo: Analyze and update if any other fields are needed.
}


// Interface to define data sent when candidate score is updated.
// Used to update dashboard 2 in real-time.
export interface IScoreUpdatedEvent {
    interviewId: string;
    candidateId: string;
    transcript: Transcript;
}


// WebSocket Event Types and Message Interfaces
export type WSServerEvent = 
    | 'dashboard:init' 
    | 'response:candidate_details' 
    | 'candidate:progress_update' 
    | 'candidate:score_update'    
    | 'error' 
    | 'pong';
export interface IWSServerMessage { event: WSServerEvent; data?: any; message?: string; }
export interface IDashboardInitData { /* ... */ }
export interface ICandidateDetailsResponse { candidate: Candidate; transcripts: Transcript[]; }
export type WSClientEvent = 'request:candidate_details' | 'ping';
export interface IWSClientMessage { event: WSClientEvent; payload?: any; }
export interface ICandidateDetailsRequest { candidateId: string; }