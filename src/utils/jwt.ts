import 'dotenv/config';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

import { getAccessJWTSecret, getRefreshJWTSecret } from './dotenv.js';

const generateAccessToken = (id: number): string => {
    const secret = getAccessJWTSecret();

    const payload = { jti: uuidv4(), sub: id };

    if (secret) {
        const token = jwt.sign(payload, secret, {
            expiresIn: '15m'
        });

        return token;
    }

    throw new Error('No ACCESS_TOKEN_SECRET in .env');
};

const generateRefreshToken = (id: number): string => {
    const secret = getRefreshJWTSecret();
    const payload = { jti: uuidv4(), sub: id };

    if (secret) {
        const token = jwt.sign(payload, secret, {
            expiresIn: '7d'
        });

        return token;
    }

    throw new Error('No REFRESH_JWT_SECRET in .env');
};

const getAccessTokenSub = (token: string): number => {
    const decoded = jwt.verify(token, getAccessJWTSecret()) as JwtPayload;
    if (decoded.sub) {
        if (isNaN(parseInt(decoded.sub))) {
            throw new Error('Invalid token subject');
        } else {
            return parseInt(decoded.sub);
        }
    } else {
        throw new Error("Token doesn't have a subject");
    }
};

const getRefreshTokenSub = (token: string): number => {
    const decoded = jwt.verify(token, getRefreshJWTSecret()) as JwtPayload;
    if (decoded.sub) {
        if (isNaN(parseInt(decoded.sub))) {
            throw new Error('Invalid token subject');
        } else {
            return parseInt(decoded.sub);
        }
    } else {
        throw new Error("Token doesn't have a subject");
    }
};

const getAccessJti = (token: string): string | undefined => {
    const decoded = jwt.verify(token, getAccessJWTSecret()) as JwtPayload;
    return decoded.jti;
};

const getRefreshJti = (token: string): string | undefined => {
    const decoded = jwt.verify(token, getRefreshJWTSecret()) as JwtPayload;
    return decoded.jti;
};

export {
    generateAccessToken,
    generateRefreshToken,
    getAccessJti,
    getAccessTokenSub,
    getRefreshJti,
    getRefreshTokenSub
};
