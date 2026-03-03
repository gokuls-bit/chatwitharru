import mongoose from 'mongoose';

export const connectDB = async () => {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI is required');

    let retries = 5;
    while (retries > 0) {
        try {
            await mongoose.connect(uri);
            console.log('MongoDB connected');
            return;
        } catch (err) {
            console.error('MongoDB connection error:', err);
            retries -= 1;
            if (retries === 0) {
                console.error('Failed to connect to MongoDB after 5 attempts');
                process.exit(1);
            }
            await new Promise(res => setTimeout(res, 3000));
        }
    }
};
