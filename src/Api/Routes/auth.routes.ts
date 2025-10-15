import express from 'express';
import authController from '../Controllers/auth.controller.js';
import { validateRequest } from '../../Middlewares/auth.middleware.js';
import { loginSchema, signupSchema } from '../../Schemas/auth.schema.js';
import { AnyZodObject } from 'zod/v3';
const router = express.Router();

router.post('/register', validateRequest(signupSchema as unknown as AnyZodObject), authController.register);
router.post('/login', validateRequest(loginSchema as unknown as AnyZodObject), authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authController.logout);

export default router;
