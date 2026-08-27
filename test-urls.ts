import { INVENTORY } from './src/data/inventory';
console.log(INVENTORY.filter(v => v.url && v.url !== 'N/A').length, "vehicles have URLs out of", INVENTORY.length);
