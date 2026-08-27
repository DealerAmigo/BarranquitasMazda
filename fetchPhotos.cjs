const fs = require('fs');
const https = require('https');

async function fetchHtml(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Referer": "https://wilfredoq.inv360.me/"
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function run() {
  const fileContent = fs.readFileSync('src/data/rawExtra.ts', 'utf8');
  // quick hack to extract JSON
  const jsonStr = fileContent.substring(fileContent.indexOf('['), fileContent.lastIndexOf(']') + 1);
  const items = JSON.parse(jsonStr);

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.url && !item.photos) {
      try {
        console.log('Fetching', item.url);
        const html = await fetchHtml(item.url);
        const matches = html.match(/https:\/\/apicdn\.inventario360\.com\/cdn-cgi\/image\/[^"'\s\)]+\.(?:jpg|jpeg|webp|png)/gi) || [];
        
        const cleanUrls = [];
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
      } catch (e) {
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
