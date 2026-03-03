import mongoose, { Schema, Document } from 'mongoose';

export interface RoomDocument extends Document {
    roomId: string;
    name: string;
    accessCodeHash: string;
    createdAt: Date;
    expiresAt: Date;
}

const roomSchema = new Schema<RoomDocument>({
    roomId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 50 },
    accessCodeHash: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
});

roomSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Room = mongoose.model<RoomDocument>('Room', roomSchema);
