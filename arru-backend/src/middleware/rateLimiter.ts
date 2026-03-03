import rateLimit from 'express-rate-limit';

export const roomCreationLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: 'Too many room creation requests', code: 'RATE_LIMITED' },
    standardHeaders: true,
    legacyHeaders: false,
});

export const joinAttemptLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 20,
    skipSuccessfulRequests: true,
    message: { error: 'Too many join attempts', code: 'RATE_LIMITED' },
});

export const globalApiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    message: { error: 'Too many requests', code: 'RATE_LIMITED' },
});
