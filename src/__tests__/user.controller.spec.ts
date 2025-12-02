import { db } from '#config/db.js';
import { app } from '#index.js';
import { userTable } from '#models/schema.js';
import { rootUrl } from '#routes/base.routes.js';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

beforeAll(async () => {
    await db.delete(userTable);
});

afterAll(async () => {
    await db.delete(userTable);
});

describe('test createUser function', () => {
    it('should successfully add a valid user', async () => {
        const username = 'test';
        const password = 'password';
        const res = await request(app)
            .post(rootUrl + '/user/add')
            .send({ password: password, username: username });

        expect(res.status).toEqual(200);
    });
});
