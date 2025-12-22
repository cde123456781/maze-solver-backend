import { rootUrl } from '#routes/base.routes.js';
import jwtRoutes from '#routes/jwt.routes.js';
import mazeRoutes from '#routes/maze.routes.js';
import userRoutes from '#routes/user.routes.js';
import { getPort } from '#utils/dotenv.js';
import cookieParser from 'cookie-parser';
import express from 'express';

const app = express();
// eslint-disable-next-line @typescript-eslint/no-unsafe-call
app.use(cookieParser());
app.use(express.json());
const port = getPort();

app.get('/', (req, res) => {
    res.send('Hello World');
    console.log('Response sent');
});

app.use(rootUrl, mazeRoutes);
app.use(rootUrl, userRoutes);
app.use(rootUrl, jwtRoutes);

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});

export { app };
