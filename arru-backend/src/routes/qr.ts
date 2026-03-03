import { Router } from 'express';
import QRCode from 'qrcode';
import { getRoomById } from '../services/roomService';
import { AppError } from '../utils/AppError';
import rateLimit from 'express-rate-limit';

const router = Router();

export const qrLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    message: { error: 'Too many QR requests', code: 'RATE_LIMITED' }
});

router.get('/qr/:roomId', qrLimiter, async (req, res, next) => {
    try {
        const { roomId } = req.params;
        if (!/^[a-zA-Z0-9_-]{12}$/.test(roomId)) {
            throw new AppError('Invalid room ID', 400, 'INVALID_ROOM_ID');
        }

        const room = await getRoomById(roomId);
        if (!room) {
            throw new AppError('Room not found', 404, 'NOT_FOUND');
        }

        const shareUrl = process.env.FRONTEND_URL + '/room/' + roomId;
        const svg = await QRCode.toString(shareUrl, { type: 'svg', errorCorrectionLevel: 'H' });

        res.setHeader('Content-Type', 'image/svg+xml');
        res.status(200).send(svg);
    } catch (error) {
        next(error);
    }
});

export default router;
