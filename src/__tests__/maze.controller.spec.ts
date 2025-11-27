import { app } from '#index.js';
import { rootUrl } from '#routes/base.routes.js';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

describe('test solveMaze function', () => {
    it('should return a response with the correct mazeString', async () => {
        const mazeString = 'S W     W  F';
        const expectedResponse = { mazeString: 'SPW P  PW PF' };

        const res = await request(app)
            .get(rootUrl + '/maze/solve')
            .send({ cols: 3, mazeString: mazeString, rows: 4 });

        expect(res.status).toEqual(200);

        expect(res.body).toEqual(expectedResponse);
    });

    it('should return a 400 response when receiving an invalid request', async () => {
        const res = await request(app)
            .get(rootUrl + '/maze/solve')
            .send({ cols: 3, rows: 4 });

        expect(res.status).toEqual(400);
    });
});
