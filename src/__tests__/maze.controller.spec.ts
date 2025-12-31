import { db } from '#config/db.js';
import { app } from '#index.js';
import * as schema from '#models/database.schema.js';
import { maze } from '#models/type.schema.js';
import { rootUrl } from '#routes/base.routes.js';
import { getAccessTokenSub } from '#utils/jwt.js';
import { reset } from 'drizzle-seed';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
let userId: number;

let accessToken: string;

let mazeId: number;

beforeAll(async () => {
    await reset(db, schema);

    const username = 'test1';
    const password = 'password';

    await request(app)
        .post(rootUrl + '/users/add')
        .send({ password: password, username: username });

    const res1 = await request(app)
        .post(rootUrl + '/users/login')
        .send({ password: password, username: username });

    const body = res1.body as { accessToken: string };
    accessToken = body.accessToken;
    userId = getAccessTokenSub(accessToken);
});

describe('test solveMaze function', () => {
    it('should return a response with the correct mazeString', async () => {
        const mazeString = 'S W     W  F';
        const expectedResponse = { mazeString: 'SPW P  PW PF' };

        const res = await request(app)
            .post(rootUrl + '/maze/solve')
            .send({ cols: 3, mazeString: mazeString, rows: 4 });

        expect(res.status).toEqual(200);

        expect(res.body).toEqual(expectedResponse);
    });

    it('should return a 400 response when receiving an invalid request', async () => {
        const res1 = await request(app)
            .post(rootUrl + '/maze/solve')
            .send({ cols: 3, rows: 4 });

        expect(res1.status).toEqual(400);

        const res2 = await request(app)
            .post(rootUrl + '/maze/solve')
            .send();

        expect(res2.status).toEqual(400);

        const res3 = await request(app)
            .post(rootUrl + '/maze/solve')
            .send({ cols: 'a', mazeString: 'S W     W  F', rows: '4' });

        expect(res3.status).toEqual(400);
    });
});

describe('test createMaze function', () => {
    it('should fail if an accessToken is not provided', async () => {
        const res = await request(app)
            .post(rootUrl + '/maze/create')
            .send();

        expect(res.status).toEqual(401);
    });

    it('should fail if an accessToken is provided but without a request body', async () => {
        const res = await request(app)
            .post(rootUrl + '/maze/create')
            .send()
            .set({ authorization: 'Bearer ' + accessToken });

        expect(res.status).toEqual(400);
    });

    it('should fail if an accessToken is provided but without a valid request body', async () => {
        const mazeString = 'S W     W  F';

        const res = await request(app)
            .post(rootUrl + '/maze/create')
            .send({ cols: 3, mazeString: mazeString, rows: 4 })
            .set({ authorization: 'Bearer ' + accessToken });

        expect(res.status).toEqual(400);
    });

    it('should should succeed if an accessToken is provided with a valid request body', async () => {
        const mazeString = 'S W     W  F';

        const res1 = await request(app)
            .post(rootUrl + '/maze/create')
            .send({
                cols: 3,
                isPublic: false,
                mazeString: mazeString,
                name: 'H',
                rows: 4
            })
            .set({ authorization: 'Bearer ' + accessToken });

        expect(res1.status).toEqual(201);

        const res2 = await request(app)
            .post(rootUrl + '/maze/create')
            .send({
                cols: 2,
                isPublic: true,
                mazeString: 'F  S',
                name: 'H',
                rows: 2
            })
            .set({ authorization: 'Bearer ' + accessToken });

        expect(res2.status).toEqual(201);
    });
});

describe('test getMazes function', () => {
    it('should retrieve all mazes successfully', async () => {
        const res = await request(app)
            .get(rootUrl + '/maze')
            .send()
            .set({ authorization: 'Bearer ' + accessToken });

        expect(res.status).toEqual(200);

        const body = res.body as {
            mazes: maze[];
        };

        expect(body.mazes.length).toEqual(2);
        expect(body.mazes[0].userId).toEqual(userId);

        mazeId = body.mazes[0].id;
    });

    it('should not retrieve private mazes if not logged in', async () => {
        const res = await request(app)
            .get(rootUrl + '/maze')
            .send();

        expect(res.status).toEqual(200);

        const body = res.body as {
            mazes: maze[];
        };

        expect(body.mazes.length).toEqual(1);
    });
});

describe('test getMaze function', () => {
    it('should respond with a 404 if the maze does not exist', async () => {
        const res = await request(app)
            .get(rootUrl + '/maze/-1')
            .send();

        expect(res.status).toEqual(404);
    });

    it('should respond with a 400 if the maze parameter is not a number', async () => {
        const res = await request(app)
            .get(rootUrl + '/maze/a')
            .send();

        expect(res.status).toEqual(400);
    });

    it('should respond with a 403 if the maze is private and the user is not logged in', async () => {
        const res = await request(app)
            .get(rootUrl + '/maze/' + mazeId.toString())
            .send();

        expect(res.status).toEqual(403);
    });

    it('should succeed if logged in and maze exists', async () => {
        const res = await request(app)
            .get(rootUrl + '/maze/' + mazeId.toString())
            .send()
            .set({ authorization: 'Bearer ' + accessToken });

        expect(res.status).toEqual(200);

        const body = res.body as {
            maze: maze;
        };

        expect(body.maze.userId).toEqual(userId);
    });
});

describe('test updateMaze function', () => {
    it('should fail if accessToken is not provided', async () => {
        const res = await request(app)
            .patch(rootUrl + '/maze/update/' + userId.toString())
            .send({});

        expect(res.status).toEqual(401);
    });

    it('should fail if maze does not exist', async () => {
        const res = await request(app)
            .patch(rootUrl + '/maze/update/-1')
            .send({})
            .set({ authorization: 'Bearer ' + accessToken });

        expect(res.status).toEqual(404);
    });

    it('should fail if maze param is not a number', async () => {
        const res = await request(app)
            .patch(rootUrl + '/maze/update/a')
            .send({})
            .set({ authorization: 'Bearer ' + accessToken });

        expect(res.status).toEqual(400);
    });

    it('should fail provided maze is invalid', async () => {
        const res = await request(app)
            .patch(rootUrl + '/maze/update/' + mazeId.toString())
            .send({ rows: 30 })
            .set({ authorization: 'Bearer ' + accessToken });

        expect(res.status).toEqual(400);
    });

    it('should succeed if provided maze is valid', async () => {
        const res = await request(app)
            .patch(rootUrl + '/maze/update/' + mazeId.toString())
            .send({ cols: 3, mazeString: 'S       F', rows: 3, userId: 100000 })
            .set({ authorization: 'Bearer ' + accessToken });

        expect(res.status).toEqual(200);

        const res2 = await request(app)
            .get(rootUrl + '/maze/' + mazeId.toString())
            .send()
            .set({ authorization: 'Bearer ' + accessToken });

        expect(res.status).toEqual(200);

        const body = res2.body as {
            maze: maze;
        };

        expect(body.maze.cols).toEqual(3);
        expect(body.maze.rows).toEqual(3);
        expect(body.maze.mazeString).toEqual('S       F');
        expect(body.maze.userId).toEqual(userId);
    });
});

describe('test deleteMaze function', () => {
    it('should fail if accessToken is not provided', async () => {
        const res = await request(app)
            .delete(rootUrl + '/maze/delete/' + userId.toString())
            .send({});

        expect(res.status).toEqual(401);
    });

    it('should fail if maze does not exist', async () => {
        const res = await request(app)
            .delete(rootUrl + '/maze/delete/-1')
            .send()
            .set({ authorization: 'Bearer ' + accessToken });

        expect(res.status).toEqual(404);
    });

    it('should fail if maze param is not a number', async () => {
        const res = await request(app)
            .delete(rootUrl + '/maze/delete/a')
            .send({})
            .set({ authorization: 'Bearer ' + accessToken });

        expect(res.status).toEqual(400);
    });

    it('should should succeed if authorised', async () => {
        const res = await request(app)
            .delete(rootUrl + '/maze/delete/' + mazeId.toString())
            .send({})
            .set({ authorization: 'Bearer ' + accessToken });

        expect(res.status).toEqual(200);

        const res2 = await request(app)
            .get(rootUrl + '/maze')
            .send();

        const body = res2.body as {
            mazes: maze[];
        };
        expect(body.mazes.length).toEqual(1);
    });

    it('should successfully cascade delete if user is deleted', async () => {
        const res1 = await request(app)
            .delete(rootUrl + '/users/delete/' + userId.toString())
            .send()
            .set({ authorization: 'Bearer ' + accessToken });

        expect(res1.status).toEqual(200);

        const res2 = await request(app)
            .get(rootUrl + '/maze')
            .send();

        const body = res2.body as {
            mazes: maze[];
        };
        expect(body.mazes.length).toEqual(0);
    });
});
