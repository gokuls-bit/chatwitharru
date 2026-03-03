import mongoose, { Schema, Document } from 'mongoose';

export interface MessageDocument extends Document {
    roomId: string;
    ciphertext: string;
    iv: string;
    nonce: string;
    senderPub: string;
    serverTs: number;
    expiresAt: Date;
}

const messageSchema = new Schema<MessageDocument>({
    roomId: { type: String, required: true, index: true },
    ciphertext: { type: String, required: true },
    iv: { type: String, required: true },
    nonce: { type: String, required: true, unique: true },
    senderPub: { type: String },
    serverTs: { type: Number, required: true },
    expiresAt: { type: Date, required: true },
});

messageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
messageSchema.index({ roomId: 1, serverTs: -1 });

export const Message = mongoose.model<MessageDocument>('Message', messageSchema);
