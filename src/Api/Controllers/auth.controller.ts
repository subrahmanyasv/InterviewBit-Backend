import { Request, Response, NextFunction } from 'express';
import authService from '../Services/auth.service.js';
import { loginType, signupType, Tokens } from '../../Schemas/auth.schema.js';
import { UnauthorizedError } from '../../Utils/ErrorClass.js';

/*
@class AuthController
Descripton: The class provides essential endpoints for registering a new interviewer, logging in an interviewer, and refreshing access tokens.

Dependencies: 
    - authService: The authentication service responsible for registering a new interviewer, logging in an interviewer, and refreshing access tokens.
    - loginType, signupType, Tokens: Custom types for login and signup data, and access tokens.
    - UnauthorizedError: Custom error class for unauthorized access.

Methods: 
    - register(req: Request, res: Response, next: NextFunction): Promise<void>
    - login(req: Request, res: Response, next: NextFunction): Promise<void>
    - refreshToken(req: Request, res: Response, next: NextFunction): Promise<void>
    - logout(req: Request, res: Response, next: NextFunction): Promise<void>
*/



class AuthController {
    public async register(req: Request, res: Response, next: NextFunction) {
        try {
            const payload: signupType = req.body;
            const tokens: Tokens = await authService.register(payload);

            res.cookie('refreshToken', tokens.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: parseInt(process.env.HTTP_COOKIE_MAX_AGE || '86400000')
            });

            res.status(201).json({
                accessToken: tokens.accessToken,
                message: 'Interviewer registered successfully'
            });
        } catch (error: unknown) {
            next(error);
        }
    }


    public async login(req: Request, res: Response, next: NextFunction) {
        try {
            const payload: loginType = req.body;
            const tokens: Tokens = await authService.login(payload);

            res.cookie('refreshToken', tokens.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: parseInt(process.env.HTTP_COOKIE_MAX_AGE || '86400000')
            }); 

            res.status(200).json({
                accessToken: tokens.accessToken,
                message: 'Interviewer logged in successfully'
            });
        }catch( error: unknown) {
            next(error);
        }
    }

    public async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const refreshToken = req.cookies.refreshToken;
            if (!refreshToken) {
                throw new UnauthorizedError('No refresh token provided.');
            }

            const { accessToken } = await authService.refreshToken(refreshToken);

            res.status(200).json({
                accessToken,
                message: 'Access token refreshed successfully.',
            });
        } catch (error) {
            next(error);
        }
    }

    public async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const refreshToken = req.cookies.refreshToken;
            if (!refreshToken) {
                res.status(200).json({ message: 'No active session to log out from.' });
                return;
            }
            await authService.validateLogout(refreshToken);
            
            res.clearCookie('refreshToken', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
            });

            res.status(200).json({ message: 'Logout successful.' });
        } catch (error) {
            console.error(error);
            next(error);
        }
    }
}

const authController = new AuthController();
export default authController;