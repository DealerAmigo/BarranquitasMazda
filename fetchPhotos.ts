import fs from 'fs';
import { RAW_EXTRA } from './src/data/rawExtra.js';

async function fetchHtml(url: string) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0",
      "Referer": "https://wilfredoq.inv360.me/"
    }
  });
  return response.text();
}

async function run() {
  const items = [...RAW_EXTRA];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.url && !item.photos) {
      try {
        console.log('Fetching', item.url);
        const html = await fetchHtml(item.url);
        const matches = html.match(/https:\/\/apicdn\.inventario360\.com\/cdn-cgi\/image\/[^"'\s\)]+\.(?:jpg|jpeg|webp|png)/gi) || [];
        
        const cleanUrls: string[] = [];
        for (const raw of matches) {
          if (raw.includes('/accounts/') || raw.includes('logo_')) continue;
          const highRes = raw.replace(/width=\d+,height=\d+/, 'width=1024,height=768');
          if (!cleanUrls.includes(highRes)) {
            cleanUrls.push(highRes);
          }
        }
        
        if (cleanUrls.length > 0) {
          item.photos = cleanUrls.join(' | ');
          console.log('  -> Found', cleanUrls.length, 'photos');
        } else {
          console.log('  -> No photos found');
        }
      } catch (e: any) {
        console.error('Error on', item.url, e.message);
      }
      
      // wait a bit to avoid rate limits
      await new Promise(r => setTimeout(r, 200));
    }
  }

  const outContent = `import { RawVehicleItem } from './rawMazda';\n\nexport const RAW_EXTRA: RawVehicleItem[] = ${JSON.stringify(items, null, 2)};`;
  fs.writeFileSync('src/data/rawExtra.ts', outContent);
  console.log('Done!');
}

run();
