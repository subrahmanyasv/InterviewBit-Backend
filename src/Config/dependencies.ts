/*
Sole purpose of this file is to import concrete definitions, inject them to services, export a ready to use service instance. 
*/



//Auth service dependency injected with mongo respositories and transaction manager. 
import { MongoInterviewerRepository } from '../Repositories/Mongo/MongoInterviewerRepository.js';
import { MongoTransactionManager } from '../Repositories/Mongo/MongoTransactionManager.js';
import  AuthService  from '../Api/Services/auth.service.js';

const interviewerRepo = new MongoInterviewerRepository();
const transactionManager = new MongoTransactionManager();
export const authService = new AuthService(interviewerRepo, transactionManager);


import { MongoInterviewRepository } from '../Repositories/Mongo/MongoInterviewRepository.js';
import { MongoCandidateRepository } from '../Repositories/Mongo/MongoCandidateRepository.js';
import { MongoTranscriptRepository } from '../Repositories/Mongo/MongoTranscriptRepository.js';
import InterviewService from '../Api/Services/interview.service.js';

const interviewRepo = new MongoInterviewRepository();
const candidateRepo = new MongoCandidateRepository();
const transcriptRepo = new MongoTranscriptRepository();

export const interviewService = new InterviewService(interviewRepo, candidateRepo, transcriptRepo, transactionManager);

//TBD: Other modules like CandidateService, InterviewService etc can also be instantiated here with their respective dependencies and exported for use in controllers.