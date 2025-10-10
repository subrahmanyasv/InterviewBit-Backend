import express from 'express';
import { loginType, signupType } from '../../Schemas/auth.schema.js';
import passwordHasher from '../../Utils/hashPasswordUtils.js';
import tokenUtils from "../../Utils/tokenUtils.js"
class AuthService {
    private readonly hasher;

    constructor() {
        this.hasher = passwordHasher;   
    }

    async login(payload: loginType ) : Promise<void> {
        const { email, password } = payload;

        //1. Find if user exists and get details from db.
        //2. If user exists, compare password with hashed password stored in db.
        //3. If password matches, generate access and refresh tokens.
        //4. Return tokens to user.

    }
}

