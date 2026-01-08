import {
    MAX_COLS,
    MAX_MAZE_NAME,
    MAX_ROWS,
    MIN_COLS,
    MIN_MAZE_NAME,
    MIN_MAZE_STRING,
    MIN_ROWS
} from '#models/database.schema.js';
import z from 'zod';

const solveSchema = z.object({
    cols: z.number().min(MIN_COLS).max(MAX_COLS),
    mazeString: z.string().min(MIN_MAZE_STRING),
    rows: z.number().min(MIN_ROWS).max(MAX_ROWS)
});

const createMazeSchema = z.object({
    cols: z.number().min(MIN_COLS).max(MAX_COLS),
    isPublic: z.boolean(),
    mazeString: z.string().min(MIN_MAZE_STRING),
    name: z.string().min(MIN_MAZE_NAME).max(MAX_MAZE_NAME),
    rows: z.number().min(MIN_ROWS).max(MAX_ROWS)
});

export { createMazeSchema, solveSchema };
