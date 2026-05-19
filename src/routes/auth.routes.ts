import { Router } from 'express';
import authenticate from '../middleware/authenticate.js';
import * as handler from '../handlers/auth.handler.js';

const router = Router();

router.post('/register', handler.register);
router.post('/login', handler.login);
router.post('/refresh', handler.refresh);
router.post('/logout', authenticate, handler.logout);

export default router;
