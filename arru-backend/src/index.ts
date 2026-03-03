import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import roomRouter from './routes/room';
import qrRouter from './routes/qr';
import { initSocketHandlers } from './socket/roomHandlers';
import { globalErrorHandler } from './middleware/errorHandler';
import { globalApiLimiter } from './middleware/rateLimiter';

dotenv.config();

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(helmet());
app.use(express.json({ limit: '50kb' }));
app.use(morgan('combined'));
app.use(globalApiLimiter);

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: { origin: process.env.FRONTEND_URL, methods: ['GET', 'POST'] },
    transports: ['websocket'],
    pingTimeout: 20000,
    pingInterval: 10000
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', ts: Date.now() });
});

app.use('/api/room', roomRouter);
app.use('/api', qrRouter);

initSocketHandlers(io);

app.use('*', (req, res) => {
    res.status(404).json({ error: 'Not found', code: 'NOT_FOUND' });
});

app.use(globalErrorHandler);

const startServer = async () => {
    if (process.env.NODE_ENV !== 'test') {
        await connectDB();
    }
    const PORT = process.env.PORT || 4000;
    httpServer.listen(PORT, () => {
        console.log(`Server listening on port ${PORT}`);
    });
};

if (require.main === module) {
    startServer();
}

export { app, httpServer };
