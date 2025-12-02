import { getJWTSecret } from '#utils/dotenv.js';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

export function authenticateToken(
    req: Request,
    res: Response,
    next: () => void
): void {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(' ')[1];

        if (!token) {
            res.status(401).send({ message: 'Token not found' });
        } else {
            try {
                const decoded = jwt.verify(token, getJWTSecret());
                req.user = decoded;
                next();
            } catch (error) {
                if (error) {
                    res.status(403).json({
                        message: 'Invalid or expired token'
                    });
                }
            }
        }
    }
}
