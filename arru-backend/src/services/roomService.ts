import { nanoid } from 'nanoid';
import bcrypt from 'bcrypt';
import { Room } from '../models/Room';
import { Message } from '../models/Message';

export const createRoom = async (name: string, accessCode: string) => {
    const roomId = nanoid(12);
    const accessCodeHash = await bcrypt.hash(accessCode, 12);
    const expiresAt = new Date(Date.now() + 86400 * 1000);

    await Room.create({ roomId, name, accessCodeHash, expiresAt });
    return { roomId, name, expiresAt };
};

export const getRoomById = async (roomId: string) => {
    const room = await Room.findOne({ roomId });
    if (!room) return null;
    return { roomId: room.roomId, name: room.name, createdAt: room.createdAt, expiresAt: room.expiresAt };
};

export const verifyRoomAccess = async (roomId: string, inputCode: string): Promise<boolean> => {
    const room = await Room.findOne({ roomId });
    if (!room) return false;
    return bcrypt.compare(inputCode, room.accessCodeHash);
};

export const deleteRoom = async (roomId: string) => {
    await Room.deleteOne({ roomId });
    await Message.deleteMany({ roomId });
};
