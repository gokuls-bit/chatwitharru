export class AppError extends Error {
    public isOperational: boolean;

    constructor(message: string, public statusCode: number, public code: string) {
        super(message);
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
