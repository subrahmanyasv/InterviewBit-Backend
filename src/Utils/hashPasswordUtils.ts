import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { IPasswordHasher } from '../Schemas/auth.schema.js';
dotenv.config();



class PasswordHasher implements IPasswordHasher {
    private readonly saltRounds: number = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10');

    public async hashPassword(password: string): Promise<string> {
        return await bcrypt.hash(password, this.saltRounds);
    }

    public async comparePassword(password: string, hash: string): Promise<boolean> {
        return await bcrypt.compare(password, hash);
    }
}

const passwordHasher = new PasswordHasher();
export default passwordHasher;