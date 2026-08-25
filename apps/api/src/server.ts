import app from './app.js';
const port = Number(process.env.API_PORT ?? 3000);

// Only start the server locally. Vercel sets the VERCEL environment variable.
if (!process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`API listening on port ${port}`);
  });
}

// Export the express app for Vercel's serverless function handler
export default app;