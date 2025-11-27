import { Pathfinder } from '#utils/pathfinder.js';
import { InvalidMazeError, NoPathFoundError } from '#utils/pathfinderErrors.js';
//import { createSelectSchema } from 'drizzle-zod';
import { Request, Response } from 'express';
import * as z from 'zod';

const solveMaze = (
    req: Request<
        unknown,
        Response,
        { cols: string; mazeString: string; rows: string }
    >,
    res: Response
): void => {
    try {
        const solveSchema = z.object({
            cols: z.number().min(1),
            mazeString: z.string(),
            rows: z.number().min(1)
        });

        const data = req.body;

        const mazeString: string = data.mazeString;
        const rows = data.rows;
        const cols = data.cols;

        solveSchema.parse({ cols: cols, mazeString: mazeString, rows: rows });

        const pathfinder = new Pathfinder(
            mazeString,
            parseInt(rows),
            parseInt(cols)
        );

        const solvedMazeString = pathfinder.solve();

        res.status(200).send({ mazeString: solvedMazeString });
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

export { solveMaze };
