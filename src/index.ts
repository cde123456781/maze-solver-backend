import 'dotenv/config';
import { rootUrl } from '#routes/base.routes.js';
import mazeRoutes from '#routes/maze.routes.js';
import express from 'express';

const app = express();
app.use(express.json());
const port = process.env.PORT ?? '9001';

app.get('/', (req, res) => {
    res.send('Hello World');
    console.log('Response sent');
});

app.use(rootUrl, mazeRoutes);

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});

export { app };
