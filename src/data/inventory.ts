import { RAW_MAZDA, RawVehicleItem } from './rawMazda';
import { RAW_ASIAN_MAKES } from './rawAsianMakes';
import { RAW_TOYOTA } from './rawToyota';
import { RAW_AMERICAN_MAKES } from './rawAmericanMakes';
import { RAW_EXTRA } from './rawExtra';

export interface Vehicle {
  id: string;
  stock: string;
  make: string;
  model: string;
  trim: string;
  year: number;
  color: string;
  colorHex: string;
  price: number;
  estimatedMonthly: number;
  mileage: number;
  status: "Nuevo" | "Usado" | "Certificado";
  vin: string;
  url?: string;
  image: string;
  images?: string[];
  specs: {
    engine: string;
    horsepower: string;
    drivetrain: string;
    transmission: string;
    mpg: string;
  };
  highlights: string[];
  notes?: string;
  entryDate?: string;
}

function parseRawVehicle(item: RawVehicleItem): Vehicle | null {
  let photoList = item.photos
    ? item.photos.split('|').map((p) => p.trim()).filter(Boolean)
    : [];

  // Fallback para los vehículos que aún no tienen fotos oficiales en el sistema
  if (photoList.length === 0) {
    photoList = ['https://fakeimg.pl/800x600/111111/00FFFF?text=FOTO+PENDIENTE'];
  }

  const cleanPrice = parseInt(item.price.replace(/[^0-9]/g, ''), 10) || 0;
  const cleanMileage = parseInt(item.mileage.replace(/[^0-9]/g, ''), 10) || 0;
  const idFromUrl = item.url ? item.url.split('/').filter(Boolean).pop() || '' : '';
  const vehicleId = idFromUrl || item.vin.slice(-6) || Math.random().toString(36).substring(2, 9);
  const stock = idFromUrl || item.vin.slice(-6) || 'N/A';
  
  // Calculate standard estimated monthly payment with ~$0 pronto, 72-84 months standard PR rate
  const estimatedMonthly = Math.round((cleanPrice * 0.9) / 60);

  const mainImage = photoList[0];

  // Determine drivetrain from trim or make
  let drivetrain = 'FWD';
  if (item.trim.includes('4WD') || item.model.includes('4WD')) {
    drivetrain = '4WD';
  } else if (item.trim.includes('AWD') || item.model.includes('CX-') || item.model.includes('Outlander')) {
    drivetrain = 'AWD';
  } else if (item.trim.includes('2WD') || item.trim.includes('RWD')) {
    drivetrain = '2WD';
  }

  // Derive horsepower estimate
  let hp = '187 HP';
  if (item.engine.includes('6 Cil') || item.engine.includes('V6')) {
    hp = '280-340 HP';
  } else if (item.engine.includes('Turbo')) {
    hp = '256 HP';
  } else if (item.engine.includes('3 Cil')) {
    hp = '78 HP';
  } else if (item.engine.includes('Hibrido')) {
    hp = '219 HP (Híbrido)';
  } else if (item.engine.includes('Diesel')) {
    hp = '211 HP (Turbo Diesel)';
  }

  return {
    id: vehicleId,
    stock,
    make: item.make,
    model: item.model,
    trim: item.trim,
    year: item.year,
    color: 'Original de Fábrica',
    colorHex: '#333333',
    price: cleanPrice,
    estimatedMonthly,
    mileage: cleanMileage,
    status: item.condition,
    vin: item.vin,
    url: item.url,
    image: mainImage,
    images: photoList,
    specs: {
      engine: item.engine || '4 Cil',
      horsepower: hp,
      drivetrain,
      transmission: 'Automática',
      mpg: item.mpg && item.mpg !== '0/0' ? `${item.mpg} MPG` : 'Eficiente'
    },
    highlights: [
      `${item.condition === 'Nuevo' ? 'Unidad 0 Millas de Fábrica' : 'Inspección Rigurosa 360'}`,
      'Garantía Disponible en Puerto Rico',
      'Aceptamos Trade-In con o sin Deuda',
      'Financiamiento con Bancos y Cooperativas'
    ],
    notes: `${item.make} ${item.model} ${item.trim} ${item.year} listo para entrega inmediata en Puerto Rico.`
  };
}

const COMBINED_RAW_VEHICLES: RawVehicleItem[] = [
  ...RAW_MAZDA,
  ...RAW_TOYOTA,
  ...RAW_ASIAN_MAKES,
  ...RAW_AMERICAN_MAKES,
  ...RAW_EXTRA
];

// Deduplicate by VIN, preferring the one that has photos if duplicates exist
const vehiclesByVin = new Map<string, RawVehicleItem>();
for (const v of COMBINED_RAW_VEHICLES) {
  const existing = vehiclesByVin.get(v.vin);
  if (!existing || (v.photos && !existing.photos)) {
    vehiclesByVin.set(v.vin, v);
  }
}

const ALL_RAW_VEHICLES: RawVehicleItem[] = Array.from(vehiclesByVin.values());

export const INVENTORY: Vehicle[] = ALL_RAW_VEHICLES
  .map(parseRawVehicle)
  .filter((v): v is Vehicle => v !== null);

