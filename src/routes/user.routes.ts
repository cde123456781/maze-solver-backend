import * as user from '#controllers/user.controller.js';
import { Router } from 'express';

const router = Router();

router.post('/user/add', user.createUser);

export default router;
