const express = require('express');
const cors = require('cors');

const app = express();

// VULN: Wildcard CORS — allows any origin
app.use(cors({ origin: '*' }));
app.use(express.json());

const usersRouter = require('./routes/users');
const authRouter = require('./routes/auth');
const filesRouter = require('./routes/files');

app.use('/users', usersRouter);
app.use('/auth', authRouter);
app.use('/files', filesRouter);

app.listen(3001, () => console.log('Demo app running on :3001'));
module.exports = app;
