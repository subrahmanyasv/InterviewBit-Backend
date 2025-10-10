import { mongo, Mongoose } from 'mongoose';
import z from 'zod';
import mongoose from 'mongoose';

export const signupSchema = z.object({
    body: z.object({
        full_name: z.string().min(2).max(100),
        email: z.string().email(),
        password: z.string().min(6), 
    })
})

export const loginSchema = z.object({
    body: z.object({
        email: z.string().email(),  
        password: z.string().min(6), 
    })
})

export type loginType = z.infer<typeof loginSchema>['body'];
export type signupType = z.infer<typeof signupSchema>['body'];

export interface tokenPayload {
    _id: mongoose.Types.ObjectId;
    email?: string;
    full_name?: string;
}

export interface Tokens {
    accessToken: string;
    refreshToken: string;
}

export interface IPasswordHasher {
    hashPassword(password: string): Promise<string>;
    comparePassword(password: string, hash: string): Promise<boolean>;
}
