import { test, expect } from '@playwright/test';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

test.describe('E2E Smoke Tests', () => {
    test('Backend health check', async ({ request }) => {
        const res = await request.get(`${BACKEND_URL}/health`);
        expect(res.status()).toBe(200);
        const body = await res.json();
        expect(body.status).toBe('ok');
    });

    test('Room creation API', async ({ request }) => {
        const res = await request.post(`${BACKEND_URL}/api/room`, {
            data: { name: 'Smoke Test Room', accessCode: 'securepass' }
        });
        expect(res.status()).toBe(201);
        const body = await res.json();
        expect(body.roomId).toMatch(/^[a-zA-Z0-9_-]{12}$/);
        expect(body.expiresAt).toBeDefined();
        expect(body.accessCodeHash).toBeUndefined();
    });

    test('Frontend loads correctly', async ({ page }) => {
        const errors: string[] = [];
        page.on('console', msg => {
            if (msg.type() === 'error') errors.push(msg.text());
        });

        await page.goto(FRONTEND_URL);
        await expect(page).toHaveTitle(/Arru/i);
        await expect(page.locator('button', { hasText: 'Create' })).toBeVisible();
        await expect(page.locator('button', { hasText: 'Join' })).toBeVisible();

        expect(errors.length).toBe(0);
    });

    test('Backend 404 handling', async ({ request }) => {
        const res = await request.get(`${BACKEND_URL}/api/nonexistent`);
        expect(res.status()).toBe(404);
    });
});
