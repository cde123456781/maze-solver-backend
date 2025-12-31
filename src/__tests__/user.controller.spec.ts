import { db } from '#config/db.js';
import { app } from '#index.js';
import * as schema from '#models/database.schema.js';
import { rootUrl } from '#routes/base.routes.js';
import { reset } from 'drizzle-seed';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

let userId: number;

let accessToken: string;
let refreshTokenCookie: string;

beforeAll(async () => {
    await reset(db, schema);
});

describe('test createUser function', () => {
    it('should successfully add a valid user', async () => {
        const username1 = 'test1';
        const password1 = 'password';

        const username2 = 'test2';
        const password2 = 'password';

        const res1 = await request(app)
            .post(rootUrl + '/users/add')
            .send({ password: password1, username: username1 });

        expect(res1.status).toEqual(201);

        const res2 = await request(app)
            .post(rootUrl + '/users/add')
            .send({ password: password2, username: username2 });

        expect(res2.status).toEqual(201);
    });

    it("should respond appropriately if request doesn't contain username or password", async () => {
        const res1 = await request(app)
            .post(rootUrl + '/users/add')
            .send({ username: 'username1' });

        expect(res1.status).toEqual(400);

        const res2 = await request(app)
            .post(rootUrl + '/users/add')
            .send({});

        expect(res2.status).toEqual(400);

        const res3 = await request(app)
            .post(rootUrl + '/users/add')
            .send();

        expect(res3.status).toEqual(400);
    });
});

describe('test getUsers function', () => {
    it('should retrieve users successfully', async () => {
        const res = await request(app).get(rootUrl + '/users');

        const users = res.body as { users: { id: number; username: string }[] };
        expect(users.users.length).toEqual(2);
        userId = users.users[0].id;
    });
});

describe('test getUser function', () => {
    it('should retrieve a valid user successfully', async () => {
        const res = await request(app).get(
            rootUrl + '/users/' + userId.toString()
        );

        const body = res.body as {
            mazes: { id: number; mazeString: string; name: string }[];
            user: { id: number; username: string };
        };

        expect(res.status).toEqual(200);
        expect(body.user.username).toEqual('test1');
    });
});

describe('test login function', () => {
    it('should fail if request does not contain username or password', async () => {
        const req1 = { username: 'test1' };

        const res1 = await request(app)
            .post(rootUrl + '/users/login')
            .send(req1);

        const req2 = { password: 'abc' };
        const res2 = await request(app)
            .post(rootUrl + '/users/login')
            .send(req2);

        const res3 = await request(app)
            .post(rootUrl + '/users/login')
            .send();

        expect(res1.status).toEqual(400);
        expect(res2.status).toEqual(400);
        expect(res3.status).toEqual(400);
    });

    it('should fail to login if credentials are incorrect', async () => {
        const req1 = { password: 'test', username: 'test1' };

        const res1 = await request(app)
            .post(rootUrl + '/users/login')
            .send(req1);

        expect(res1.status).toEqual(401);
    });

    it('should fail to login if username does not exist', async () => {
        const req1 = { password: 'test', username: 'test00' };

        const res1 = await request(app)
            .post(rootUrl + '/users/login')
            .send(req1);

        expect(res1.status).toEqual(404);
    });

    it('should successfully login if credentials are correct', async () => {
        const req1 = { password: 'password', username: 'test1' };

        const res1 = await request(app)
            .post(rootUrl + '/users/login')
            .send(req1);

        expect(res1.status).toEqual(200);

        const body = res1.body as { accessToken: string };

        accessToken = body.accessToken;
        refreshTokenCookie = res1.headers['set-cookie'];
    });
});

describe('test refresh function', () => {
    it('should fail if a refreshToken is not provided as a cookie', async () => {
        const res1 = await request(app)
            .post(rootUrl + '/refresh')
            .send();

        expect(res1.status).toEqual(403);
    });

    it('should fail if an invalid refreshToken is provided as a cookie', async () => {
        const res1 = await request(app)
            .post(rootUrl + '/refresh')
            .send()
            .set('Cookie', ['refreshToken=jlksjfalkdj;']);

        expect(res1.status).toEqual(403);
    });

    it('should succeed if a valid refresh token is sent as a cookie', async () => {
        const res1 = await request(app)
            .post(rootUrl + '/refresh')
            .send()
            .set('Cookie', [refreshTokenCookie]);
        expect(res1.status).toEqual(200);

        // try refreshing again with the old refreshToken

        const res2 = await request(app)
            .post(rootUrl + '/refresh')
            .send()
            .set('Cookie', [refreshTokenCookie]);
        expect(res2.status).toEqual(403);
        expect(res2.text).toEqual('Invalid token');

        const body = res1.body as { accessToken: string };

        accessToken = body.accessToken;
        refreshTokenCookie = res1.headers['set-cookie'];
    });
});

describe('test update function', () => {
    it('should fail if an accessToken is not provided', async () => {
        const res1 = await request(app)
            .patch(rootUrl + '/users/update/' + userId.toString())
            .send({});

        expect(res1.status).toEqual(401);
    });

    it('should fail if an invalid accessToken is provided', async () => {
        const res1 = await request(app)
            .patch(rootUrl + '/users/update/' + userId.toString())
            .send({})
            .set({ authorization: 'Bearer blabla' });

        expect(res1.status).toEqual(401);
    });

    it('should fail if authenticated for another user', async () => {
        const res1 = await request(app)
            .patch(rootUrl + '/users/update/' + (userId + 1).toString())
            .send({})
            .set({ authorization: 'Bearer ' + accessToken });

        expect(res1.status).toEqual(403);
    });

    it('should fail if the user does not exist', async () => {
        const res1 = await request(app)
            .patch(rootUrl + '/users/update/-1')
            .send({})
            .set({ authorization: 'Bearer ' + accessToken });
        expect(res1.status).toEqual(404);
    });

    it('should fail if a body is not provided', async () => {
        const res1 = await request(app)
            .patch(rootUrl + '/users/update/' + userId.toString())
            .send()
            .set({ authorization: 'Bearer ' + accessToken });
        expect(res1.status).toEqual(400);
    });

    it('should fail if an invalid request body is provided', async () => {
        const res1 = await request(app)
            .patch(rootUrl + '/users/update/' + userId.toString())
            .send({ password: 'test', username: '' })
            .set({ authorization: 'Bearer ' + accessToken });
        expect(res1.status).toEqual(400);
    });

    it('should succeed if the user exists and a valid token is provided', async () => {
        const res1 = await request(app)
            .patch(rootUrl + '/users/update/' + userId.toString())
            .send({ username: 'test9000' })
            .set({ authorization: 'Bearer ' + accessToken });
        expect(res1.status).toEqual(200);

        const res2 = await request(app)
            .get(rootUrl + '/users/' + userId.toString())
            .send();

        const body = res2.body as {
            mazes: { id: number; mazeString: string }[];
            user: { id: number; username: string };
        };

        expect(body.user.username).toEqual('test9000');
    });
});

describe('test logout function', () => {
    it('should fail if an accessToken is not provided', async () => {
        const res1 = await request(app)
            .post(rootUrl + '/users/logout')
            .send()
            .set({ cookie: 'refreshToken=jlksjfalkdj;' });

        expect(res1.status).toEqual(403);
    });

    it('should fail if a refreshToken is not provided', async () => {
        const res1 = await request(app)
            .post(rootUrl + '/users/logout')
            .send()
            .set({ authorization: 'Bearer ' + accessToken });

        expect(res1.status).toEqual(403);
    });

    it('should fail if an invalid token is provided', async () => {
        const res1 = await request(app)
            .post(rootUrl + '/users/logout')
            .send()
            .set({
                authorization: 'Bearer ' + accessToken,
                cookie: 'refreshToken=jlksjfalkdj;'
            });

        expect(res1.status).toEqual(403);
        expect(res1.text).toEqual('Invalid refreshToken');

        const res2 = await request(app)
            .post(rootUrl + '/users/logout')
            .send()
            .set({
                authorization: 'Bearer asdf',
                cookie: refreshTokenCookie
            });

        expect(res2.status).toEqual(403);
        expect(res2.text).toEqual('Invalid accessToken');
    });

    it('should logout successfully if valid accessToken and refreshToken are provided', async () => {
        const res1 = await request(app)
            .post(rootUrl + '/users/logout')
            .send()
            .set({
                authorization: 'Bearer ' + accessToken,
                cookie: refreshTokenCookie
            });

        expect(res1.status).toEqual(200);
        expect(res1.text).toEqual('Successfully logged out');
    });
});

describe('test delete function', () => {
    it('should fail if an accessToken is not provided', async () => {
        const res1 = await request(app)
            .delete(rootUrl + '/users/delete/' + userId.toString())
            .send();

        expect(res1.status).toEqual(401);
    });

    it('should fail if an invalid accessToken is provided', async () => {
        const res1 = await request(app)
            .delete(rootUrl + '/users/delete/' + userId.toString())
            .send()
            .set({ authorization: 'Bearer blabla' });

        expect(res1.status).toEqual(401);
    });

    it('should fail if authenticated for another user', async () => {
        const res1 = await request(app)
            .delete(rootUrl + '/users/delete/' + (userId + 1).toString())
            .send()
            .set({ authorization: 'Bearer ' + accessToken });

        expect(res1.status).toEqual(403);
    });

    it('should delete the user successfully if authenticated', async () => {
        const req1 = { password: 'password', username: 'test9000' };

        const res1 = await request(app)
            .post(rootUrl + '/users/login')
            .send(req1);

        expect(res1.status).toEqual(200);
        const body = res1.body as { accessToken: string };
        accessToken = body.accessToken;
        refreshTokenCookie = res1.headers['set-cookie'];

        const res2 = await request(app)
            .delete(rootUrl + '/users/delete/' + userId.toString())
            .send()
            .set({ authorization: 'Bearer ' + accessToken });

        expect(res2.status).toEqual(200);
    });

    it('should fail if the user does not exist', async () => {
        const res1 = await request(app)
            .delete(rootUrl + '/users/delete/' + userId.toString())
            .send()
            .set({ authorization: 'Bearer ' + accessToken });

        expect(res1.status).toEqual(404);
    });
});
