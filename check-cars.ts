import { INVENTORY } from './src/data/inventory';
import https from 'https';

async function fetchTitle(url: string): Promise<string> {
  if (!url || url === 'N/A' || !url.startsWith('http')) return 'No URL';
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const match = data.match(/<h1[^>]*>(.*?)<\/h1>/i);
        if (match && match[1]) {
          resolve(match[1].trim());
        } else {
          resolve('H1 not found');
        }
      });
    }).on('error', () => resolve('Error fetching'));
  });
}

async function run() {
  console.log(`Checking ${INVENTORY.length} vehicles...`);
  let mismatches = 0;
  for (const car of INVENTORY) {
    if (!car.url || car.url === 'N/A') continue;
    const h1 = await fetchTitle(car.url);
    
    // Check if make and model appear in the H1
    const makeMatch = h1.toLowerCase().includes(car.make.toLowerCase());
    // Special handling if h1 doesn't match make
    if (!makeMatch) {
      console.log(`Mismatch found!`);
      console.log(`  Local data: ${car.year} ${car.make} ${car.model}`);
      console.log(`  Live URL  : ${h1}`);
      console.log(`  URL       : ${car.url}`);
      mismatches++;
    }
  }
  console.log(`Done. Found ${mismatches} mismatches.`);
}

run();
