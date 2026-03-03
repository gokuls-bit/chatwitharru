const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;

if (!uri) {
    console.error('MONGODB_URI is required');
    process.exit(1);
}

async function runChecks() {
    const client = new MongoClient(uri);
    let failed = false;

    try {
        await client.connect();
        const db = client.db();

        // TLS check
        if (!uri.startsWith('mongodb+srv://')) {
            console.log('FAIL: Connection string must use mongodb+srv:// (TLS)');
            failed = true;
        } else {
            console.log('PASS: TLS (mongodb+srv) used');
        }

        // Room collection indexes
        const roomIndexes = await db.collection('rooms').indexes().catch(() => []);
        const roomTtl = roomIndexes.find(idx => idx.key.expiresAt === 1);
        if (!roomTtl) {
            console.log('FAIL: Rooms collection TTL index on expiresAt missing');
            failed = true;
        } else if (roomTtl.expireAfterSeconds !== 0) {
            console.log(`FAIL: Rooms collection TTL expireAfterSeconds must be 0, got ${roomTtl.expireAfterSeconds}`);
            failed = true;
        } else {
            console.log('PASS: Rooms collection TTL index correct');
        }

        const roomIdIdx = roomIndexes.find(idx => idx.key.roomId === 1);
        if (!roomIdIdx || !roomIdIdx.unique) {
            console.log('FAIL: Rooms collection unique index on roomId missing');
            failed = true;
        } else {
            console.log('PASS: Rooms collection roomId unique index correct');
        }

        // Message collection indexes
        const msgIndexes = await db.collection('messages').indexes().catch(() => []);
        const msgTtl = msgIndexes.find(idx => idx.key.expiresAt === 1);
        if (!msgTtl || msgTtl.expireAfterSeconds !== 0) {
            console.log('FAIL: Messages collection TTL index on expiresAt missing or expireAfterSeconds != 0');
            failed = true;
        } else {
            console.log('PASS: Messages collection TTL index correct');
        }

        const msgCompound = msgIndexes.find(idx => idx.key.roomId === 1 && idx.key.serverTs === -1);
        if (!msgCompound) {
            console.log('FAIL: Messages collection compound index {roomId: 1, serverTs: -1} missing');
            failed = true;
        } else {
            console.log('PASS: Messages collection compound index correct');
        }

    } catch (err) {
        console.error('Connection or db error', err);
        failed = true;
    } finally {
        await client.close();
    }

    if (failed) process.exit(1);
    console.log('All MongoDB checks passed.');
    process.exit(0);
}

runChecks();
