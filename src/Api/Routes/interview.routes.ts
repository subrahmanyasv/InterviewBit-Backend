import express from 'express';
import { AnyZodObject } from 'zod/v3';
import interviewController from '../Controllers/interview.controller.js';
import { validateRequest } from '../../Middlewares/auth.middleware.js';
import { createInterviewSchema } from '../../Schemas/interview.schema.js';
import { authenticate } from '../../Middlewares/auth.middleware.js';

const router = express.Router();

router.post('/', authenticate, validateRequest(createInterviewSchema as unknown as AnyZodObject), interviewController.create);
router.get("/", authenticate, interviewController.getAll);
router.get("/:InterviewId", authenticate, interviewController.get);
router.delete("/:InterviewId", authenticate, interviewController.delete);
router.get("/:InterviewId/tokenExcel", authenticate, interviewController.candidateTokenExcelDownload);
router.get("/:InterviewId/resultExcel", authenticate, interviewController.interviewResultExcelDownload);
router.get("/:InterviewId/:CandidateId", authenticate, interviewController.getCandidateTranscript);


export default router;