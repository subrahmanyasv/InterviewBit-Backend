import { Request, Response, NextFunction, RequestHandler } from "express";
import { BadRequestError, UnauthorizedError } from "../Utils/ErrorClass.js";
import { AnyZodObject } from "zod/v3";
import  tokenUtils  from "../Utils/tokenUtils.js";
import { tokenPayload } from "../Schemas/auth.schema.js";


export const validateRequest = (schema : AnyZodObject) => 
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params
            });
            next();
        } catch (error: unknown) {
            next(new BadRequestError((error as Error).message));
        }
    }


export const authenticate: RequestHandler = async (req: Request, res: Response , next: NextFunction) => {
    try{
        const authHeader = req.headers.authorization;

        if(!authHeader || !authHeader.startsWith('Bearer ')){
            throw new UnauthorizedError("Auth token missing");
        }
        const accessToken = authHeader.split(' ')[1];
        if (!accessToken) {
            throw new UnauthorizedError('Authentication token is malformed.');
        }
        const decodedPayload = tokenUtils.getDataFromToken(accessToken);
        if (!decodedPayload) {
            throw new UnauthorizedError('Invalid or expired access token.');
        }

        req.interviewer = decodedPayload;
        next();
    }catch( error: unknown ){
        next(error);
    }
}