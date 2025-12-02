import jwt from 'jsonwebtoken';
import 'dotenv/config';

const generateAccessToken = (payload: { sub: string }): string => {
    const secret = process.env.ACCESS_TOKEN_SECRET;

    if (secret) {
        const token = jwt.sign(payload, secret, {
            expiresIn: '15m'
        });

        return token;
    }

    throw new Error('No ACCESS_TOKEN_SECRET in .env');
};

const generateRefreshToken = (payload: { sub: string }): string => {
    const secret = process.env.REFRESH_TOKEN_SECRET;

    if (secret) {
        const token = jwt.sign(payload, secret, {
            expiresIn: '7d'
        });

        return token;
    }

    throw new Error('No REFRESH_TOKEN_SECRET in .env');
};

export { generateAccessToken, generateRefreshToken };
