import { Socket } from 'socket.io';
import { getRoomById } from '../services/roomService';

export const socketAuthMiddleware = async (socket: Socket, next: (err?: Error) => void) => {
    const { roomId, accessCode } = socket.handshake.query as { roomId?: string, accessCode?: string };

    if (!roomId || !accessCode) {
        return next(new Error('AUTH_MISSING'));
    }

    if (!/^[a-zA-Z0-9_-]{12}$/.test(roomId)) {
        return next(new Error('INVALID_ROOM_ID'));
    }

    const room = await getRoomById(roomId);
    if (!room) {
        return next(new Error('ROOM_NOT_FOUND'));
    }

    socket.data = { ...socket.data, roomId };
    next();
};

const ipConnections = new Map<string, number>();

export const socketRateLimitMiddleware = (socket: Socket, next: (err?: Error) => void) => {
    const ip = socket.handshake.address;
    const count = ipConnections.get(ip) || 0;

    if (count >= 10) {
        return next(new Error('TOO_MANY_CONNECTIONS'));
    }

    ipConnections.set(ip, count + 1);

    socket.on('disconnect', () => {
        const current = ipConnections.get(ip) || 0;
        if (current > 1) {
            ipConnections.set(ip, current - 1);
        } else {
            ipConnections.delete(ip);
        }
    });

    next();
};
