import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

export const globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(`[Error] ${req.method} ${req.path}`, err);

    let statusCode = 500;
    let code = 'INTERNAL_ERROR';
    let message = 'Internal Server Error';

    if (err instanceof AppError) {
        statusCode = err.statusCode;
        code = err.code;
        message = err.message;
    } else if (err.name === 'ZodError') {
        statusCode = 400;
        code = 'VALIDATION_ERROR';
        message = 'Validation failed';
    } else if (err.code === 11000) {
        statusCode = 409;
        code = 'DUPLICATE_KEY';
        message = 'Duplicate key error';
    }

    const response: any = { error: message, code };

    if (process.env.NODE_ENV !== 'production') {
        response.dev = err.stack;
    }

    res.status(statusCode).json(response);
};
