import express, { Express, Request, Response } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const port : number  = parseInt(process.env.PORT || '3000');
const app : Express = express();

app.use(bodyParser.json());
app.use(cors());

app.use('/test', (req: Request, res: Response) => {
    res.json({ message: 'API is working' });
})

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});