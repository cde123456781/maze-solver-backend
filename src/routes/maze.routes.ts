import * as maze from '#controllers/maze.controller.js';
import { Router } from 'express';

const router = Router();

router.get('/maze/solve', maze.solveMaze);

export default router;
