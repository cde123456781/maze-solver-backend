import * as user from '#controllers/user.controller.js';
import { authenticateToken } from '#middleware/authorisation.js';
import { Router } from 'express';

const router = Router();

router.post('/users/login', user.login);
router.post('/users/logout', user.logout);
router.post('/users/add', user.createUser);
router.patch('/users/update/:id', authenticateToken, user.updateUser);
router.delete('/users/delete/:id', authenticateToken, user.deleteUser);
router.get('/users/:id', user.getUser);
router.get('/users', user.getUsers);

export default router;
