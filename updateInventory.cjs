const fs = require('fs');

const csv = fs.readFileSync('new_data.csv', 'utf8');
const lines = csv.split('\n').filter(Boolean);
const headers = lines[0].split(',');
const rawItems = [];

for (let i = 1; i < lines.length; i++) {
  // Simple CSV parser ignoring commas inside quotes for now (just standard split)
  const cols = [];
  let inQuotes = false;
  let curr = '';
  for(let char of lines[i]) {
    if(char === '"') inQuotes = !inQuotes;
    else if(char === ',' && !inQuotes) {
      cols.push(curr);
      curr = '';
    } else {
      curr += char;
    }
  }
  cols.push(curr);
  
  if (cols.length < 5) continue; // skip bad lines

  // Marca,Modelo,Trim,Año,Condición,Millaje,Precio,Motor,MPG,VIN,Link Ficha
  // 0    1      2    3   4         5       6      7     8   9   10
  
  rawItems.push({
    make: cols[0] || '',
    model: cols[1] || '',
    trim: cols[2] || '',
    year: parseInt(cols[3], 10) || 0,
    condition: cols[4] || 'Usado',
    mileage: cols[5] ? cols[5].replace(/"/g, '') : '',
    price: cols[6] ? cols[6].replace(/"/g, '') : '',
    engine: cols[7] || '',
    mpg: cols[8] || '',
    vin: cols[9] || '',
    url: cols[10] || '',
    photos: '' // they don't have photos in the CSV
  });
}

const content = `import { RawVehicleItem } from './rawMazda';\n\nexport const RAW_EXTRA: RawVehicleItem[] = ${JSON.stringify(rawItems, null, 2)};`;

fs.writeFileSync('src/data/rawExtra.ts', content);
