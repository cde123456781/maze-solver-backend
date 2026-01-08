import * as jwt from '#middleware/authorisation.js';
import { Router } from 'express';

const router = Router();

router.post('/refresh', jwt.refreshToken);

export default router;
