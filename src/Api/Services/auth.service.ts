import { loginType, signupType, Tokens, tokenPayload } from '../../Schemas/auth.schema.js';
import passwordHasher from '../../Utils/hashPasswordUtils.js';
import tokenUtils from '../../Utils/tokenUtils.js';
import { BadRequestError, UnauthorizedError } from '../../Utils/ErrorClass.js';
import { IInterviewerRepository } from '../../Repositories/Interfaces/IInterviewerRepository.js';
import { ITransactionManager } from '../../Repositories/Interfaces/ITransactionManager.js';
import { Schema } from 'mongoose'; // Only imported for casting the _id in the token payload if absolutely necessary

class AuthService {
    
    constructor(
        private interviewerRepo: IInterviewerRepository,
        private transactionManager: ITransactionManager
    ) {}
    
    public async register(payload: signupType): Promise<Tokens> {
        const { full_name, email, password } = payload;         

        return await this.transactionManager.withTransaction(async (dbOptions) => {
            const existingInterviewer = await this.interviewerRepo.findByEmail(email);
            if (existingInterviewer) {
                throw new BadRequestError('An interviewer with this email already exists.');
            }

            const hashedPassword = await passwordHasher.hashPassword(password);
            
            const newInterviewer = await this.interviewerRepo.create({
                full_name,
                email,
                password_hash: hashedPassword,
            }, dbOptions);

            //==========================================================
            //Issue: The _id field in the token payload is expected to be of type Schema.Types.ObjectId, which creates coupling. To be fixed after P5 issue resolved.
            //==========================================================
            const tokens: Tokens = tokenUtils.generateTokens({
                _id: newInterviewer.id as unknown as Schema.Types.ObjectId,  
                email: newInterviewer.email,
                full_name: newInterviewer.full_name,
            });

            return tokens;
        });
    }
    
    public async login(payload: loginType): Promise<Tokens> {
        const { email, password } = payload;    

        const interviewer = await this.interviewerRepo.findByEmailWithPassword(email);

        if (!interviewer || !interviewer.password_hash) {
            throw new UnauthorizedError('Invalid credentials. Please check your email and password.');
        }

        const isPasswordCorrect = await passwordHasher.comparePassword(password, interviewer.password_hash);

        if (!isPasswordCorrect) {
            throw new UnauthorizedError('Invalid credentials. Please check your email and password.');
        }

        const tokens: Tokens = tokenUtils.generateTokens({
            _id: interviewer.id as unknown as Schema.Types.ObjectId,
            email: interviewer.email,
            full_name: interviewer.full_name,
        });

        return tokens;
    }

    public async validateLogout(refreshToken: string): Promise<boolean> {
        const decodedPayload = tokenUtils.getDataFromToken(refreshToken) as tokenPayload | null;

        if (!decodedPayload || !decodedPayload._id) {
            throw new UnauthorizedError('Invalid refresh token payload.');
        }

        const interviewer = await this.interviewerRepo.findById(decodedPayload._id.toString());

        if (!interviewer) {
            throw new UnauthorizedError('User for this token no longer exists.');
        }

        return true;
    }

    public async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
        const decodedPayload = tokenUtils.getDataFromToken(refreshToken) as tokenPayload | null;

        if (!decodedPayload || !decodedPayload._id) {
            throw new UnauthorizedError('Invalid refresh token payload.');
        }

        const interviewer = await this.interviewerRepo.findById(decodedPayload._id.toString());
        if (!interviewer) {
            throw new UnauthorizedError('User for this token no longer exists.');
        }

        const { accessToken } = tokenUtils.generateTokens({
            _id: interviewer.id as unknown as Schema.Types.ObjectId,
            email: interviewer.email,
            full_name: interviewer.full_name,
        });

        return { accessToken };
    }
}

export default AuthService;