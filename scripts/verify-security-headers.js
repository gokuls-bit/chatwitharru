const http = require('http');
const https = require('https');

const FRONTEND_URL = process.env.FRONTEND_URL;
const BACKEND_URL = process.env.BACKEND_URL;

if (!FRONTEND_URL || !BACKEND_URL) {
    console.error('FRONTEND_URL and BACKEND_URL must be set');
    process.exit(1);
}

const reqMod = (url) => url.startsWith('https') ? https : http;

const checkHeaders = (url, path, validators) => {
    return new Promise((resolve, reject) => {
        reqMod(url).get(url + path, (res) => {
            let failed = false;
            const headers = res.headers;

            for (const [header, validator] of Object.entries(validators)) {
                const val = headers[header.toLowerCase()];
                const result = validator(val);
                if (!result.pass) {
                    console.error(`\x1b[31mFAIL ${url} ${header}: ${result.msg}\x1b[0m`);
                    failed = true;
                } else {
                    console.log(`\x1b[32mPASS [${header}]\x1b[0m`);
                }
            }
            resolve(failed);
        }).on('error', (e) => {
            console.error(`\x1b[31mERROR requesting ${url}: ${e.message}\x1b[0m`);
            resolve(true);
        });
    });
};

const backendValidators = {
    'Strict-Transport-Security': (v) => v && v.includes('max-age=31536000') ? { pass: true } : { pass: false, msg: `expected to contain max-age=31536000, got ${v}` },
    'X-Content-Type-Options': (v) => v === 'nosniff' ? { pass: true } : { pass: false, msg: `expected nosniff, got ${v}` },
    'X-Frame-Options': (v) => ['DENY', 'SAMEORIGIN'].includes(v) ? { pass: true } : { pass: false, msg: `expected DENY or SAMEORIGIN, got ${v}` },
    'Content-Security-Policy': (v) => !!v ? { pass: true } : { pass: false, msg: `expected to be present` },
    'X-Powered-By': (v) => !v ? { pass: true } : { pass: false, msg: `expected NOT to be present, got ${v}` }
};

const frontendValidators = {
    'X-Frame-Options': (v) => !!v ? { pass: true } : { pass: false, msg: `expected to be present` },
    'Content-Security-Policy': (v) => !!v ? { pass: true } : { pass: false, msg: `expected to be present` }
};

async function run() {
    let hasFailed = false;
    hasFailed |= await checkHeaders(BACKEND_URL, '/health', backendValidators);
    hasFailed |= await checkHeaders(FRONTEND_URL, '/', frontendValidators);

    process.exit(hasFailed ? 1 : 0);
}

run();
