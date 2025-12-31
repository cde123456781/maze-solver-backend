import { db } from '#config/db.js';
import {
    blacklistTable,
    mazeTable,
    userTable
} from '#models/database.schema.js';
import { hash } from '#utils/hash.js';
import { compare } from '#utils/hash.js';
import {
    generateAccessToken,
    generateRefreshToken,
    getAccessJti,
    getAccessTokenSub,
    getRefreshJti,
    getRefreshTokenSub
} from '#utils/jwt.js';
import { eq } from 'drizzle-orm';
import { createInsertSchema, createUpdateSchema } from 'drizzle-zod';
import { Request, Response } from 'express';
import * as z from 'zod';

const createUser = async (
    req: Request<unknown, Response, { password: string; username: string }>,
    res: Response
): Promise<void> => {
    try {
        const userInsertSchema = createInsertSchema(userTable);

        const data = {
            password: await hash(req.body.password),
            username: req.body.username
        };
        const parsed: { password: string; username: string } =
            userInsertSchema.parse(data);

        await db.insert(userTable).values(parsed);
        res.status(201).send('Successfully created account');
    } catch (error) {
        let message = 'Unknown error';
        if (error instanceof z.ZodError) {
            message = error.message;
        }

        res.status(400).send({ message: message });
    }
};

const deleteUser = async (req: Request, res: Response): Promise<void> => {
    const userParam = req.params.id;
    if (isNaN(parseInt(userParam))) {
        res.status(400).send({ message: 'Parameter is not a number' });
    } else {
        const user: {
            id: number;
            username: string;
        }[] = await db
            .select({
                id: userTable.id,
                username: userTable.username
            })
            .from(userTable)
            .where(eq(userTable.id, parseInt(userParam)));

        if (user.length == 0) {
            res.status(404).send('User not found');
        } else {
            const userId = user[0].id;
            const authHeader = req.headers.authorization;

            const token = authHeader?.split(' ')[1];

            if (token) {
                const tokenUserId = getAccessTokenSub(token);

                if (userId == tokenUserId) {
                    await db.delete(userTable).where(eq(userTable.id, userId));
                    res.status(200).send('Successfully deleted user');
                } else {
                    res.status(403).send('Invalid token for user');
                }
            } else {
                res.status(403).send('Token was invalid');
            }
        }
    }
};

const updateUser = async (req: Request, res: Response): Promise<void> => {
    const userParam = req.params.id;
    const authHeader = req.headers.authorization;

    const token = authHeader?.split(' ')[1];

    const userId = parseInt(userParam);

    if (!req.body) {
        res.status(400).send('No body was received');
        return;
    }
    const body = req.body as { password?: string; username?: string };
    if (body.password) {
        body.password = await hash(body.password);
    }

    if (isNaN(userId)) {
        res.status(400).send({ message: 'Parameter is not a number' });
    } else {
        const user: {
            id: number;
            username: string;
        }[] = await db
            .select({
                id: userTable.id,
                username: userTable.username
            })
            .from(userTable)
            .where(eq(userTable.id, userId));

        if (user.length == 0) {
            res.status(404).send('User not found');
        } else {
            if (token) {
                const tokenUserId = getAccessTokenSub(token);

                if (userId == tokenUserId) {
                    try {
                        const userUpdateSchema = createUpdateSchema(userTable);
                        const parsed = userUpdateSchema.parse(body);
                        await db
                            .update(userTable)
                            .set(parsed)
                            .where(eq(userTable.id, userId));
                        res.status(200).send('Successfully updated user');
                    } catch (error) {
                        let message = 'Unknown error';
                        if (error instanceof z.ZodError) {
                            message = error.message;
                        }
                        res.status(400).send({ message: message });
                    }
                } else {
                    res.status(403).send('Invalid token for user');
                }
            } else {
                res.status(403).send('Token was invalid');
            }
        }
    }
};

const getUser = async (req: Request, res: Response): Promise<void> => {
    const userParam = req.params.id;
    if (isNaN(parseInt(userParam))) {
        res.status(400).send({ message: 'Parameter is not a number' });
    } else {
        const user: {
            id: number;
            username: string;
        }[] = await db
            .select({
                id: userTable.id,
                username: userTable.username
            })
            .from(userTable)
            .where(eq(userTable.id, parseInt(userParam)));

        if (user.length == 0) {
            res.status(404).send('User not found');
        } else {
            const mazes: {
                cols: number;
                id: number;
                mazeString: string;
                name: string;
                rows: number;
            }[] = await db
                .select({
                    cols: mazeTable.cols,
                    id: mazeTable.id,
                    mazeString: mazeTable.mazeString,
                    name: mazeTable.name,
                    rows: mazeTable.rows
                })
                .from(mazeTable)
                .where(eq(mazeTable.userId, parseInt(userParam)));
            res.status(200).send({ mazes: mazes, user: user[0] });
        }
    }
};

const getUsers = async (req: Request, res: Response): Promise<void> => {
    const users: { id: number; username: string }[] = await db
        .select({
            id: userTable.id,
            username: userTable.username
        })
        .from(userTable);

    res.status(200).send({ users: users });
};

const login = async (req: Request, res: Response): Promise<void> => {
    if (!req.body) {
        res.status(400).send('Bad Request');
        return;
    }

    const { password, username } = req.body as {
        password: string;
        username: string;
    };
    if (!(password && username)) {
        res.status(400).send('Username or Password is missing');
    } else {
        try {
            const user = await db
                .select()
                .from(userTable)
                .where(eq(userTable.username, username));

            if (user.length == 0) {
                res.status(404).send('User does not exist');
            } else {
                const match = await compare(password, user[0].password);
                if (!match) {
                    res.status(401).send({ message: 'Invalid Credentials' });
                } else {
                    const accessToken = generateAccessToken(user[0].id);
                    const refreshToken = generateRefreshToken(user[0].id);

                    res.status(200)
                        .cookie('refreshToken', refreshToken, {
                            httpOnly: true,
                            path: '/auth/refresh'
                        })
                        .send({
                            accessToken: accessToken,
                            refreshToken: refreshToken
                        });
                }
            }
        } catch (error) {
            if (error) {
                res.status(500).send('Server Error');
            }
        }
    }
};

const logout = async (req: Request, res: Response): Promise<void> => {
    const authHeader = req.headers.authorization;

    const accessToken = authHeader?.split(' ')[1];

    let accessTokenUserId;
    let refreshTokenUserId;

    const refreshToken = (req.cookies as { refreshToken: string }).refreshToken;

    if (!refreshToken) {
        res.status(403).send('refreshToken not provided');
        return;
    }

    if (accessToken) {
        try {
            accessTokenUserId = getAccessTokenSub(accessToken);
        } catch (error) {
            if (error) {
                res.status(403).send('Invalid accessToken');
            }
            return;
        }

        try {
            refreshTokenUserId = getRefreshTokenSub(refreshToken);
        } catch (error) {
            if (error) {
                res.status(403).send('Invalid refreshToken');
            }
            return;
        }

        if (refreshTokenUserId != accessTokenUserId) {
            res.status(403).send('refreshToken does not belong to accessToken');
            return;
        }

        const user: {
            id: number;
            username: string;
        }[] = await db
            .select({
                id: userTable.id,
                username: userTable.username
            })
            .from(userTable)
            .where(eq(userTable.id, accessTokenUserId));

        if (user.length == 0) {
            res.status(404).send('Tokens do not belong to any user');
        } else {
            const accessJti = getAccessJti(accessToken);
            const refreshJti = getRefreshJti(refreshToken);

            if (!(accessJti === undefined || refreshJti === undefined)) {
                await db.insert(blacklistTable).values({ uuid: accessJti });
                await db.insert(blacklistTable).values({ uuid: refreshJti });
                res.status(200).send('Successfully logged out');
            } else {
                res.status(403).send('JTI missing');
            }
        }
    } else {
        res.status(403).send('No accessToken provided');
    }
};

export { createUser, deleteUser, getUser, getUsers, login, logout, updateUser };
