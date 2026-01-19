import { db } from '#config/db.js';
import { mazeTable, userTable } from '#models/database.schema.js';
import { createMazeSchema, solveSchema } from '#models/validation.schema.js';
import { getAccessTokenSub, validateAccessToken } from '#utils/jwt.js';
import { Pathfinder } from '#utils/pathfinder.js';
import { InvalidMazeError, NoPathFoundError } from '#utils/pathfinderErrors.js';
import { eq, sql } from 'drizzle-orm';
import { createInsertSchema, createUpdateSchema } from 'drizzle-zod';
//import { createSelectSchema } from 'drizzle-zod';
import { Request, Response } from 'express';
import * as z from 'zod';

const solve = (cols: number, mazeString: string, rows: number) => {
    solveSchema.parse({ cols: cols, mazeString: mazeString, rows: rows });

    const pathfinder = new Pathfinder(mazeString, rows, cols);

    return pathfinder.solve();
};

const solveMaze = (req: Request, res: Response): void => {
    try {
        if (req.body) {
            const data = req.body as {
                cols: number;
                mazeString: string;
                rows: number;
            };

            const mazeString: string = data.mazeString;
            const rows = data.rows;
            const cols = data.cols;

            const solvedMazeString = solve(cols, mazeString, rows);

            res.status(200).send({ mazeString: solvedMazeString });
        } else {
            res.status(400).send('Bad Request');
        }
    } catch (error) {
        if (
            error instanceof InvalidMazeError ||
            error instanceof NoPathFoundError
        ) {
            res.status(400).send(error.message);
        } else if (error instanceof z.ZodError) {
            res.status(400).send('There was an error with your request');
        }
    }
};

const createMaze = async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;

    const accessToken = authHeader?.split(' ')[1];

    if (!accessToken) {
        res.status(403).send('No accessToken provided');
        return;
    }

    const accessTokenUserId = getAccessTokenSub(accessToken);

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
        return;
    }

    if (!req.body) {
        res.status(400).send('Bad Request');
        return;
    } else {
        let data;
        try {
            data = createMazeSchema.parse(req.body);
        } catch {
            res.status(400).send('Bad Request');
            return;
        }

        let isPublic;

        if (data.isPublic) {
            isPublic = 1;
        } else {
            isPublic = 0;
        }

        let solvedMazeString;

        try {
            solvedMazeString = solve(data.cols, data.mazeString, data.rows);
        } catch (error) {
            if (
                error instanceof InvalidMazeError ||
                error instanceof NoPathFoundError
            ) {
                res.status(400).send(error.message);
            } else if (error instanceof z.ZodError) {
                res.status(400).send('There was an error with your request');
            }
            return;
        }

        const schemaParams = {
            cols: data.cols,
            isPublic: isPublic,
            mazeString: data.mazeString,
            name: data.name,
            rows: data.rows,
            solvedMazeString: solvedMazeString,
            userId: accessTokenUserId
        };

        try {
            const mazeInsertSchema = createInsertSchema(mazeTable);
            const parsed = mazeInsertSchema.parse(schemaParams);

            await db.insert(mazeTable).values(parsed);
            res.status(201).send('Successfully created maze');
        } catch (error) {
            let message = 'Unknown error';
            if (error instanceof z.ZodError) {
                message = error.message;
            }
            res.status(400).send({ message: message });
        }
    }
};

const getMazes = async (req: Request, res: Response): Promise<void> => {
    try {
        const mazes = await db
            .select()
            .from(mazeTable)
            .where(sql`${mazeTable.isPublic} = 1`);

        res.status(200).send({ mazes: mazes });
    } catch {
        res.status(500).send('Server Error');
    }
};

const getMazesLoggedIn = async (req: Request, res: Response): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;

        const accessToken = authHeader?.split(' ')[1];

        if (!accessToken) {
            res.status(403).send('No accessToken provided');
            return;
        }

        const accessTokenUserId = getAccessTokenSub(accessToken);

        const mazes = await db
            .select()
            .from(mazeTable)
            .where(
                sql`${mazeTable.isPublic} = 1 OR ${mazeTable.userId} = ${accessTokenUserId}`
            );

        res.status(200).send({ mazes: mazes });
        return;
    } catch {
        res.status(500).send('Server Error');
    }
};

const getMaze = async (req: Request, res: Response): Promise<void> => {
    const mazeParam = req.params.id;
    if (isNaN(parseInt(mazeParam))) {
        res.status(400).send({ message: 'Parameter is not a number' });
    } else {
        try {
            if (req.headers.authorization) {
                const token = req.headers.authorization.split(' ')[1];

                if (token) {
                    const validationResult = await validateAccessToken(token);
                    if (validationResult.status == 200) {
                        const userId = getAccessTokenSub(token);
                        const maze = await db
                            .select()
                            .from(mazeTable)
                            .where(
                                sql`(${mazeTable.id} = ${parseInt(mazeParam)} AND ${mazeTable.isPublic} = 1) OR ${mazeTable.userId} = ${userId}`
                            );

                        if (maze.length == 0) {
                            res.status(404).send('Maze not found');
                        } else {
                            res.status(200).send({ maze: maze[0] });
                        }
                        return;
                    }
                }
            }

            const maze = await db
                .select({
                    cols: mazeTable.cols,
                    id: mazeTable.id,
                    isPublic: mazeTable.isPublic
                })
                .from(mazeTable)
                .where(eq(mazeTable.id, parseInt(mazeParam)));

            if (maze.length == 0) {
                res.status(404).send('Maze not found');
            } else if (maze[0].isPublic == 0) {
                res.status(403).send('Maze is private');
            } else {
                res.status(200).send({ maze: maze });
            }
        } catch {
            res.status(500).send('Server Error');
        }
    }
};

const deleteMaze = async (req: Request, res: Response): Promise<void> => {
    const mazeParam = req.params.id;
    if (isNaN(parseInt(mazeParam))) {
        res.status(400).send({ message: 'Parameter is not a number' });
    } else {
        try {
            const mazes = await db
                .select()
                .from(mazeTable)
                .where(sql`${mazeTable.id} = ${parseInt(mazeParam)}`);

            if (mazes.length == 0) {
                res.status(404).send('Maze does not exist');
                return;
            }

            const authHeader = req.headers.authorization;

            const token = authHeader?.split(' ')[1];

            if (!token) {
                res.status(403).send('Not Authorised');
                return;
            }

            if (getAccessTokenSub(token) == mazes[0].userId) {
                await db
                    .delete(mazeTable)
                    .where(eq(mazeTable.id, parseInt(mazeParam)));
                res.status(200).send('Successfully deleted maze');
            } else {
                res.status(403).send('Not Authorised');
            }
        } catch {
            res.status(500).send('Server Error');
        }
    }
};

const updateMaze = async (req: Request, res: Response): Promise<void> => {
    const mazeParam = req.params.id;
    if (isNaN(parseInt(mazeParam))) {
        res.status(400).send({ message: 'Parameter is not a number' });
    } else {
        if (!req.body) {
            res.status(400).send('No body was received');
            return;
        }
        try {
            const maze = await db
                .select()
                .from(mazeTable)
                .where(sql`${mazeTable.id} = ${parseInt(mazeParam)}`);

            if (maze.length == 0) {
                res.status(404).send('Maze does not exist');
                return;
            }

            const authHeader = req.headers.authorization;

            const token = authHeader?.split(' ')[1];

            if (!token) {
                res.status(403).send('Not Authorised');
                return;
            }

            if (getAccessTokenSub(token) == maze[0].userId) {
                const body = req.body as {
                    cols?: number;
                    isPublic?: boolean;
                    mazeString?: string;
                    name?: string;
                    rows?: number;
                };
                const mazeUpdateSchema = createUpdateSchema(mazeTable).omit({
                    userId: true
                });

                let cols;
                let rows;
                let mazeString;
                if (!body.cols) {
                    cols = maze[0].cols;
                } else {
                    cols = body.cols;
                }

                if (!body.rows) {
                    rows = maze[0].rows;
                } else {
                    rows = body.rows;
                }

                if (!body.mazeString) {
                    mazeString = maze[0].mazeString;
                } else {
                    mazeString = body.mazeString;
                }

                let solvedMazeString;
                try {
                    solvedMazeString = solve(cols, mazeString, rows);

                    const combinedSchema = Object.assign(body, {
                        solvedMazeString: solvedMazeString
                    });
                    const parsed = mazeUpdateSchema.parse(combinedSchema);

                    await db
                        .update(mazeTable)
                        .set(parsed)
                        .where(eq(mazeTable.id, parseInt(mazeParam)));
                    res.status(200).send('Successfully updated maze');
                } catch (error) {
                    if (
                        error instanceof InvalidMazeError ||
                        error instanceof NoPathFoundError
                    ) {
                        res.status(400).send(error.message);
                    } else if (error instanceof z.ZodError) {
                        res.status(400).send(
                            'There was an error with your request'
                        );
                    }
                    return;
                }
            } else {
                res.status(403).send('Unauthorised');
            }
        } catch {
            res.status(500).send('Server Error');
        }
    }
};

export {
    createMaze,
    deleteMaze,
    getMaze,
    getMazes,
    getMazesLoggedIn,
    solveMaze,
    updateMaze
};
