import { db } from '#config/db.js';
import { userTable } from '#models/schema.js';
import { hash } from '#utils/hash.js';
import { createInsertSchema } from 'drizzle-zod';
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
        res.status(200).send();
    } catch (error) {
        let message = 'Unknown error';
        if (error instanceof z.ZodError) {
            message = error.message;
        }

        res.status(400).send({ message: message });
    }
};

export { createUser };
