import { createApp } from "./app.js";

/**
 * Start the Express server with Scenarist
 *
 * This file is the entry point for running the server directly.
 * Tests should import from './app.js' instead.
 */
const main = async () => {
  const { app, scenarist } = await createApp();

  // Start MSW (only in non-production)
  if (scenarist) {
    scenarist.start();
  }

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    if (scenarist) {
      console.log(`Scenario control: POST http://localhost:${PORT}/__scenario__`);
    }
  });
};

main().catch(console.error);
