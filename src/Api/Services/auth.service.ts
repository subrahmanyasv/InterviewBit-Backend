import mongoose , { Schema, Types } from 'mongoose';
import { loginType, signupType, Tokens, tokenPayload } from '../../Schemas/auth.schema.js';
import { InterviewerModel, Interviewer } from '../../Models/Interviewer.model.js';
import passwordHasher from '../../Utils/hashPasswordUtils.js';
import tokenUtils from '../../Utils/tokenUtils.js';
import { BadRequestError, UnauthorizedError } from '../../Utils/ErrorClass.js';

/*
@class AuthService
Descripton: The class provides essential services to perform authentication and authorization. It includes methods for registering a new interviewer, logging in an interviewer, and refreshing access tokens.

Dependencies:
    - mongoose: The Mongoose library for MongoDB interaction.
    - loginType, signupType: Custom types for login and signup data.
    - InterviewModel and Interviewer: Mongoose models for interviews and interviewers.
    - passwordHasher: Utility for hashing passwords.
    - tokenUtils: Utility for generating and validating tokens.

Methods:
    - register(payload: signupType): Promise<Tokens>
    - login(payload: loginType): Promise<Tokens>
    - validateLogout(refreshToken: string): Promise<boolean>

*/
class AuthService {
    
    public async register(payload: signupType): Promise<Tokens> {
        const { full_name, email, password } = payload;         // Destructure payload

        const session = await mongoose.startSession();         //Create a session object and start session
        session.startTransaction();

        try {
            //Check if user exists. If yes, throw a BadRequestError
            const existingInterviewer = await InterviewerModel.findOne({ email }).session(session);
            if (existingInterviewer) {
                throw new BadRequestError('An interviewer with this email already exists.');
            }

            //Hash the password using passwordHasher and create new interviewer record.
            const hashedPassword = await passwordHasher.hashPassword(password);
            const newInterviewer : Interviewer = (await InterviewerModel.create([{
                full_name,
                email,
                password_hash: hashedPassword,
            }], { session }))[0];

            //Generate tokens using tokenUtils
            const tokens : Tokens = tokenUtils.generateTokens({
                _id: newInterviewer._id as Schema.Types.ObjectId,
                email: newInterviewer.email,
                full_name: newInterviewer.full_name,
            });

            await session.commitTransaction();
            return tokens;
        } catch (error) {
            await session.abortTransaction();
            throw error; 
        } finally {
            session.endSession();
        }
    }

    
    public async login(payload: loginType): Promise<Tokens> {
        const { email, password } = payload;    // Destructure payload

        //Check if user exists
        const interviewer = await InterviewerModel.findOne({ email }).select('+password_hash');

        //If user doesn't exist, throw a UnauthorizedError
        if (!interviewer) {
            throw new UnauthorizedError('Invalid credentials. Please check your email and password.');
        }

        //Check if password is correct
        const isPasswordCorrect = await passwordHasher.comparePassword(password, interviewer.password_hash);

        //If password is incorrect, throw a UnauthorizedError
        if (!isPasswordCorrect) {
            throw new UnauthorizedError('Invalid credentials. Please check your email and password.');
        }

        //Generate tokens
        const tokens  : Tokens = tokenUtils.generateTokens({
            _id: interviewer._id as Schema.Types.ObjectId,
            email: interviewer.email,
            full_name: interviewer.full_name,
        });

        return tokens;
    }

    public async validateLogout(refreshToken: string): Promise<boolean> {
        // Decode and verify the refresh token. This will throw an error if the token is invalid/expired.
        const decodedPayload = tokenUtils.getDataFromToken(refreshToken) as tokenPayload | null;

        if (!decodedPayload || !decodedPayload._id) {
            throw new UnauthorizedError('Invalid refresh token payload.');
        }

        // Check if the user from the token still exists in the database.
        const interviewer = await InterviewerModel.findById(decodedPayload._id);

        if (!interviewer) {
            // This handles the case where a user was deleted but their token is still circulating.
            throw new UnauthorizedError('User for this token no longer exists.');
        }

        // If all checks pass, the user is valid to be logged out.
        return true;
    }

    public async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
        // Decode and verify the refresh token. getDataFromToken handles verification internally.
        const decodedPayload = tokenUtils.getDataFromToken(refreshToken) as tokenPayload | null;

        if (!decodedPayload || !decodedPayload._id) {
            throw new UnauthorizedError('Invalid refresh token payload.');
        }

        // Ensure the user associated with the token still exists.
        const interviewer = await InterviewerModel.findById(decodedPayload._id);
        if (!interviewer) {
            throw new UnauthorizedError('User for this token no longer exists.');
        }

        // Generate a new access token.
        const { accessToken } = tokenUtils.generateTokens({
            _id: interviewer._id as Schema.Types.ObjectId,
            email: interviewer.email,
            full_name: interviewer.full_name,
        });

        return { accessToken };
    }
}

const authService = new AuthService();
export default authService;
