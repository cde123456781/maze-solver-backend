import * as maze from '#controllers/maze.controller.js';
import { authenticateToken } from '#middleware/authorisation.js';
import { Router } from 'express';

const router = Router();

router.get('/maze', maze.getMazes);
router.get('/maze/:id', maze.getMaze);
router.post('/maze/solve', maze.solveMaze);
router.post('/maze/create', authenticateToken, maze.createMaze);
router.delete('/maze/delete/:id', authenticateToken, maze.deleteMaze);
router.patch('/maze/update/:id', authenticateToken, maze.updateMaze);

export default router;
