import app from './app.js';

const port = Number(process.env.PORT ?? 3000);
if (!Number.isInteger(port) || port < 0 || port > 65535 || process.env.PORT === '') {
  throw new Error('PORT must be an integer between 0 and 65535.');
}

const server = app.listen(port, '0.0.0.0');
server.once('listening', () => {
  console.log(`MiniAula API listening on port ${server.address().port}`);
});
server.once('error', (error) => {
  console.error(`MiniAula API failed to start: ${error.message}`);
  process.exitCode = 1;
});
