const fs = require('fs');

async function check() {
  const { INVENTORY } = await import('./dist/server.cjs').catch(() => ({}));
  // We don't have INVENTORY exported in server.cjs, let's just parse the raw files.
}
check();
