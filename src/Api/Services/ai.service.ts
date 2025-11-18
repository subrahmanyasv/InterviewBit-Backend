import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { InternalServerError } from "../../Utils/ErrorClass.js";
import { Transcript } from "../../Models/Transcripts.model.js";
import logger from "../../Config/logger.config.js";
import {
    AI_PROMPTS,
    IGeneratedQuestion,
    IEvaluationResult,
    IInterviewSummary,
    IGenerateQuestionsInput
} from "../../Schemas/ai.schema.js";




class AIService {
    private model: ChatGoogleGenerativeAI;
    private generationChain;
    private evaluationChain;
    private summaryChain;
    constructor() {
        const apiKey = process.env.GEMINI_API_KEY; 

        if (!apiKey) {
            logger.error("GEMINI_API_KEY is not set in .env. AI Service will not function.");
            throw new InternalServerError("AI Service is not configured. Missing API key.");
        }

        this.model = new ChatGoogleGenerativeAI({
            apiKey: apiKey,
            model: "gemini-2.5-flash",
            temperature: 0.3, 
        });
        logger.info("AI Service initialized successfully with gemini-2.5-flash");

         // 1. Question Generation Chain
         const generationPrompt = PromptTemplate.fromTemplate(AI_PROMPTS.GENERATE_QUESTIONS_TEMPLATE);
         const generationParser = new JsonOutputParser<IGeneratedQuestion[]>();
         this.generationChain = generationPrompt.pipe(this.model).pipe(generationParser);
 
         // 2. Answer Evaluation Chain
         const evaluationPrompt = PromptTemplate.fromTemplate(AI_PROMPTS.EVALUATE_ANSWER_TEMPLATE);
         const evaluationParser = new JsonOutputParser<IEvaluationResult>();
         this.evaluationChain = evaluationPrompt.pipe(this.model).pipe(evaluationParser);
 
         // 3. Interview Summary Chain
         const summaryPrompt = PromptTemplate.fromTemplate(AI_PROMPTS.GENERATE_SUMMARY_TEMPLATE);
         const summaryParser = new JsonOutputParser<IInterviewSummary>();
         this.summaryChain = summaryPrompt.pipe(this.model).pipe(summaryParser);

    }


    public async generateQuestions(domain: string, num_questions: number): Promise<IGeneratedQuestion[]> {
        logger.debug(`Invoking question generation chain for ${domain}`);
        try {
            const input = { domain, num_questions };
            const questions = await this.generationChain.invoke(input);
            logger.info(`Successfully generated ${questions.length} questions for ${domain}.`);
            return questions;
        } catch (error) {
            logger.error('Error in generateQuestions chain:', error);
            throw new InternalServerError("Failed to generate questions from AI.");
        }
    }


    public async evaluateAnswer(domain: string, question: string, answer: string): Promise<IEvaluationResult> {
        logger.debug(`Invoking evaluation chain for question: ${question.substring(0, 20)}...`);
        try {
            const input = { 
                domain: domain, 
                question: question, 
                answer: answer 
            };
            const result = await this.evaluationChain.invoke(input);
            logger.info(`Successfully evaluated answer. Score: ${result.score}`);
            return result;
        } catch (error) {
            logger.error('Error in evaluateAnswer chain:', error);
            throw new InternalServerError("Failed to evaluate answer from AI.");
        }
    }


    public async generateSummary(domain: string, transcripts: Transcript[]): Promise<IInterviewSummary> {
        logger.debug(`Invoking summary chain for ${transcripts.length} transcripts`);
        try {
            // 1. Construct the history string from the transcripts
            const qa_history = transcripts.map((t, i) => `Q${i+1}: ${t.question_text} Answer: ${t.answer_text || "(No answer provided)"} Score: ${t.score}/10`).join('\n');

            const input = { 
                domain: domain, 
                qa_history: qa_history 
            };

            const summary = await this.summaryChain.invoke(input);
            logger.info(`Successfully generated summary. Recommendation: ${summary.recommendation}`);
            return summary;
            
        } catch (error) {
            logger.error('Error in generateSummary chain:', error);
            throw new InternalServerError("Failed to generate summary from AI.");
        }
    }

}

// Export a single instance of the service for the rest of the application to use
const aiService = new AIService();
export default aiService;