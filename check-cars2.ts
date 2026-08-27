import { INVENTORY } from './src/data/inventory';
import https from 'https';

async function fetchTitle(car: any): Promise<void> {
  const url = car.url;
  if (!url || url === 'N/A' || !url.startsWith('http')) return;
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const match = data.match(/<h1[^>]*>(.*?)<\/h1>/i);
        const h1 = match && match[1] ? match[1].trim() : 'H1 not found';
        const makeMatch = h1.toLowerCase().includes(car.make.toLowerCase());
        if (!makeMatch) {
          console.log(`Mismatch: Local=${car.year} ${car.make} ${car.model} | Live=${h1} | URL=${car.url}`);
        }
        resolve();
      });
    }).on('error', () => resolve());
  });
}

async function run() {
  console.log(`Checking ${INVENTORY.length} vehicles...`);
  const promises = INVENTORY.map(fetchTitle);
  await Promise.all(promises);
  console.log(`Done.`);
}
run();
