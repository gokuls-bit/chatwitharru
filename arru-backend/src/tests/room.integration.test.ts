import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { app } from '../index';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

describe('Room API Integration', () => {
    let createdRoomId: string;

    describe('POST /api/room', () => {
        it('returns 201 with roomId and expiresAt on valid input', async () => {
            const res = await request(app)
                .post('/api/room')
                .send({ name: 'Test Room', accessCode: 'secure123' });

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('roomId');
            expect(res.body).toHaveProperty('expiresAt');
            expect(res.body).not.toHaveProperty('accessCodeHash');

            createdRoomId = res.body.roomId;
        });

        it('returns 400 when name is empty', async () => {
            const res = await request(app).post('/api/room').send({ name: '', accessCode: 'testcode' });
            expect(res.status).toBe(400);
        });

        it('returns 400 when accessCode is shorter than 6 chars', async () => {
            const res = await request(app).post('/api/room').send({ name: 'Room', accessCode: 'test' });
            expect(res.status).toBe(400);
        });

        it('returns 400 when name contains special characters', async () => {
            const res = await request(app).post('/api/room').send({ name: 'Room @', accessCode: 'secure123' });
            expect(res.status).toBe(400);
        });

        it('returns 400 when request body is not JSON', async () => {
            const res = await request(app).post('/api/room').send('not json').set('Content-Type', 'text/plain');
            expect(res.status).toBe(400);
        });
    });

    describe('GET /api/room/:roomId', () => {
        it('returns 200 with room data for valid existing roomId', async () => {
            const res = await request(app).get(`/api/room/${createdRoomId}`);
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('name', 'Test Room');
            expect(res.body).not.toHaveProperty('accessCodeHash');
        });

        it('returns 404 for non-existent roomId', async () => {
            const res = await request(app).get('/api/room/123456789012');
            expect(res.status).toBe(404);
        });

        it('returns 400 for malformed roomId', async () => {
            const res = await request(app).get('/api/room/short');
            expect(res.status).toBe(400);
        });
    });

    describe('Rate Limiting', () => {
        it('returns 429 after exceeding 10 room creation requests in window', async () => {
            for (let i = 0; i < 10; i++) {
                await request(app).post('/api/room').send({ name: 'Test', accessCode: 'secure123' });
            }
            const res = await request(app).post('/api/room').send({ name: 'Test', accessCode: 'secure123' });
            expect(res.status).toBe(429);
            expect(res.body).toHaveProperty('code', 'RATE_LIMITED');
        });
    });
});
