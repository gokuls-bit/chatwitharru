import { Server, Socket } from 'socket.io';
import crypto from 'crypto';
import { verifyRoomAccess, getRoomById } from '../services/roomService';
import { Message } from '../models/Message';
import { socketAuthMiddleware, socketRateLimitMiddleware } from './middleware';

export const initSocketHandlers = (io: Server) => {
    io.use(socketRateLimitMiddleware);
    io.use(socketAuthMiddleware);

    io.on('connection', (socket: Socket) => {
        socket.on('join_room', async (data: { roomId: string; accessCode: string }) => {
            try {
                const { roomId, accessCode } = data;
                const validAccess = await verifyRoomAccess(roomId, accessCode);

                if (!validAccess) {
                    socket.emit('error', { code: 'ACCESS_DENIED' });
                    return;
                }

                await socket.join(roomId);
                socket.to(roomId).emit('user_joined', { socketId: socket.id, publicKey: null });

                const roomSize = io.sockets.adapter.rooms.get(roomId)?.size || 1;
                socket.emit('join_success', { roomId, memberCount: roomSize });
            } catch (err) {
                socket.emit('error', { code: 'INTERNAL_ERROR' });
            }
        });

        socket.on('key_exchange', (data: { publicKey: string }) => {
            const { roomId } = socket.data;
            if (!roomId) return;
            if (!socket.rooms.has(roomId)) return;

            const { publicKey } = data;
            if (typeof publicKey !== 'string' || publicKey.length > 500) return;

            socket.to(roomId).emit('key_exchange', { publicKey, socketId: socket.id });
        });

        socket.on('send_message', async (data: { roomId: string, ciphertext: string, iv: string, senderPub: string }) => {
            const { roomId, ciphertext, iv, senderPub } = data;

            if (!roomId || !socket.rooms.has(roomId)) {
                socket.emit('error', { code: 'NOT_IN_ROOM' });
                return;
            }

            if (!ciphertext || !iv) return;

            const nonce = crypto.randomUUID();
            const payload = { ciphertext, iv, senderPub, nonce, serverTs: Date.now() };

            io.to(roomId).emit('encrypted_message', payload);

            try {
                const room = await getRoomById(roomId);
                if (room) {
                    await Message.create({
                        roomId,
                        ciphertext,
                        iv,
                        nonce,
                        senderPub,
                        serverTs: payload.serverTs,
                        expiresAt: room.expiresAt
                    });
                }
            } catch (e) {
                console.error('Failed to persist message', e);
            }
        });

        socket.on('disconnecting', () => {
            for (const room of socket.rooms) {
                if (room !== socket.id) {
                    socket.to(room).emit('user_left', { socketId: socket.id });
                }
            }
        });
    });
};
