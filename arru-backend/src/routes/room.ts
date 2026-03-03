import { Router } from 'express';
import { z } from 'zod';
import { createRoom, getRoomById } from '../services/roomService';
import { roomCreationLimiter } from '../middleware/rateLimiter';
import { validateBody } from '../middleware/validate';
import { AppError } from '../utils/AppError';

const router = Router();

const roomSchema = z.object({
    name: z.string().min(1).max(50).regex(/^[a-zA-Z0-9 _-]+$/),
    accessCode: z.string().min(6).max(24)
});

router.post('/', roomCreationLimiter, validateBody(roomSchema), async (req, res, next) => {
    try {
        const { name, accessCode } = req.body;
        const room = await createRoom(name, accessCode);
        res.status(201).json(room);
    } catch (error) {
        next(error);
    }
});

router.get('/:roomId', async (req, res, next) => {
    try {
        const { roomId } = req.params;
        if (!/^[a-zA-Z0-9_-]{12}$/.test(roomId)) {
            throw new AppError('Invalid room ID', 400, 'INVALID_ROOM_ID');
        }
        const room = await getRoomById(roomId);
        if (!room) {
            throw new AppError('Room not found', 404, 'NOT_FOUND');
        }
        res.status(200).json(room);
    } catch (error) {
        next(error);
    }
});

export default router;
