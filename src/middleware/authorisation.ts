import { db } from '#config/db.js';
import { blacklistTable, userTable } from '#models/database.schema.js';
import { getRefreshJWTSecret } from '#utils/dotenv.js';
import {
    generateAccessToken,
    generateRefreshToken,
    validateAccessToken
} from '#utils/jwt.js';
import { eq } from 'drizzle-orm';
import { Request, Response } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

const isBlacklisted = async (jti: string): Promise<boolean> => {
    const isBlacklisted =
        (
            await db
                .select()
                .from(blacklistTable)
                .where(eq(blacklistTable.uuid, jti))
        ).length > 0;

    return isBlacklisted;
};

const authenticateToken = async (
    req: Request,
    res: Response,
    next: () => void
): Promise<void> => {
    const authHeader = req.headers.authorization;
    if (!(authHeader === undefined)) {
        const token = authHeader.split(' ')[1];

        if (!token) {
            res.status(401).send({ message: 'Token not found' });
        } else {
            const validationResult = await validateAccessToken(token);
            if (validationResult.status == 200) {
                next();
            } else {
                res.status(validationResult.status).send(
                    validationResult.message
                );
            }
        }
    } else {
        res.status(401).send('Access token was not provided');
    }
};

const refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
        const refreshToken = (req.cookies as { refreshToken: string })
            .refreshToken;

        if (!refreshToken) {
            res.status(403).send('refreshToken not provided');
            return;
        }

        const decoded = jwt.verify(
            refreshToken,
            getRefreshJWTSecret()
        ) as JwtPayload;
        const jti = decoded.jti;
        if (jti) {
            if (await isBlacklisted(jti)) {
                res.status(403).send('Invalid token');
            } else {
                let userId;
                if (decoded.sub === undefined) {
                    res.status(403).send('Invalid sub for refresh token');
                    return;
                } else {
                    userId = parseInt(decoded.sub);
                }

                const user: {
                    id: number;
                }[] = await db
                    .select({ id: userTable.id })
                    .from(userTable)
                    .where(eq(userTable.id, userId));

                if (user.length == 0) {
                    res.status(403).send(
                        'refreshToken does not belong to any user'
                    );
                    return;
                }

                await db.insert(blacklistTable).values({ uuid: jti });

                const accessToken = generateAccessToken(userId);
                const refreshToken = generateRefreshToken(userId);

                res.status(200)
                    .cookie('refreshToken', refreshToken, {
                        httpOnly: true,
                        path: '/auth/refresh'
                    })
                    .send({
                        accessToken: accessToken
                    });
            }
        } else {
            res.status(403).json({
                message: 'Invalid or expired token'
            });
        }
    } catch (error) {
        if (error) {
            res.status(403).send('Invalid refresh token');
        }
    }
};

export { authenticateToken, isBlacklisted, refreshToken };
