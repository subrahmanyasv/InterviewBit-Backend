import { Request, Response, NextFunction } from "express";
import { BadRequestError } from "../Utils/ErrorClass.js";
import { AnyZodObject } from "zod/v3";


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