import jwt, { SignOptions } from "jsonwebtoken";
import dotenv from 'dotenv';
import { AppError, UnauthorizedError } from "./ErrorClass.js";
import { tokenPayload, Tokens } from '../Schemas/auth.schema.js';
dotenv.config();

class TokenUtils {
    private readonly accessTokenKey: string = process.env.JWT_SECRET_ACCESS_TOKEN || 'access_token';
    private readonly refreshTokenKey: string = process.env.JWT_SECRET_REFRESH_TOKEN || 'refresh_token';
    private readonly accesTokenOptions: SignOptions = {
        expiresIn: parseInt(process.env.JWT_ACCESS_TOKEN_EXPIRY || '900'),
    };
    private readonly refreshTokenOptions : SignOptions = {
        expiresIn: parseInt(process.env.JWT_REFRESH_TOKEN_EXPIRY || '2592000'),
    };

    public generateTokens = (payload: tokenPayload) : Tokens  => {
        const accessToken = jwt.sign(payload, this.accessTokenKey, this.accesTokenOptions);
        const refreshToken = jwt.sign(payload, this.refreshTokenKey, this.refreshTokenOptions);
        return { accessToken, refreshToken };
    }

    public async validateRefreshToken(refreshToken: string): Promise<boolean> {
        try {
            const decoded = await jwt.verify(refreshToken, this.refreshTokenKey);
            return true; // or any other appropriate boolean value
        } catch (error) {
            return false; // or any other appropriate boolean value
        }
    }
    
    public async validateAccessToken(accessToken: string): Promise<boolean> {
        try {
            const decoded = await jwt.verify(accessToken, this.accessTokenKey);
            return true; 
        } catch (error) {
            return false; 
        }
    }

    public getDataFromToken = (accessToken: string) : tokenPayload | null => {
        try {
            const decoded = jwt.verify(accessToken, this.accessTokenKey) as tokenPayload;
            return decoded ? decoded : null;
        }catch( error : unknown  ){
            throw new UnauthorizedError('Invalid refresh token');
        }
    }
}

const tokenUtils = new TokenUtils();
export default tokenUtils;