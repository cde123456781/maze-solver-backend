import { rootUrl } from '#routes/base.routes.js';
import mazeRoutes from '#routes/maze.routes.js';
import userRoutes from '#routes/user.routes.js';
import { getPort } from '#utils/dotenv.js';
import express from 'express';

const app = express();
app.use(express.json());
const port = getPort();

app.get('/', (req, res) => {
    res.send('Hello World');
    console.log('Response sent');
});

app.use(rootUrl, mazeRoutes);
app.use(rootUrl, userRoutes);

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});

export { app };
