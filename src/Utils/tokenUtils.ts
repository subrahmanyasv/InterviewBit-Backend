import jwt from "jsonwebtoken";
import dotenv from 'dotenv';
import { AppError, UnauthorizedError } from "./ErrorClass.js";
import { tokenPayload, Tokens } from '../Schemas/auth.schema.js';
dotenv.config();

class TokenUtils {
    private readonly accessTokenKey: string = process.env.JWT_SECRET_ACCESS_TOKEN || 'access_token';
    private readonly refreshTokenKey: string = process.env.JWT_SECRET_REFRESH_TOKEN || 'refresh_token';
    private readonly refreshTokenExpiry: string = process.env.JWT_REFRESH_TOKEN_EXPIRY || '30d';
    private readonly accessTokenExpiry: string = process.env.JWT_ACCESS_TOKEN_EXPIRY || '15m';

    public generateTokens = (payload: tokenPayload) : Tokens  => {
        const accessToken = jwt.sign(payload, this.accessTokenKey, { expiresIn: this.accessTokenExpiry });
        const refreshToken = jwt.sign(payload, this.refreshTokenKey, { expiresIn: this.refreshTokenExpiry });
        return { accessToken, refreshToken };
    }

    public validateRefreshToken= (refreshToken: string) : boolean => {
        return jwt.verify(refreshToken, this.refreshTokenKey);
    }

    public validateAccessToken= (accessToken: string) : boolean => {
        return jwt.verify(accessToken, this.accessTokenKey);
    }

    public getDataFromToken = (refreshToken: string) : tokenPayload | null => {
        try {
            const decoded = jwt.verify(refreshToken, this.refreshTokenKey) as tokenPayload;
            return decoded ? decoded : null;
        }catch( error : unknown  ){
            throw new UnauthorizedError('Invalid refresh token');
        }
    }
}

const tokenUtils = new TokenUtils();
export default tokenUtils;