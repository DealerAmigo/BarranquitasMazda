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
  if (item.make.toLowerCase() === 'mazda') {
    if (item.model.startsWith('CX-')) {
      if (item.trim.toLowerCase().includes('hybrid') || item.engine.toLowerCase().includes('hibrido')) {
        drivetrain = 'e-AWD Inteligente';
      } else if (item.model === 'CX-70' || item.model === 'CX-90') {
        drivetrain = 'i-ACTIV AWD® (Arquitectura RWD)';
      } else {
        drivetrain = 'i-ACTIV AWD® de serie';
      }
    } else if (item.trim.includes('AWD')) {
      drivetrain = 'i-ACTIV AWD®';
    } else {
      drivetrain = 'FWD';
    }
  } else if (item.trim.includes('4WD') || item.model.includes('4WD')) {
    drivetrain = '4WD';
  } else if (item.trim.includes('AWD') || item.model.includes('Outlander')) {
    drivetrain = 'AWD';
  } else if (item.trim.includes('2WD') || item.trim.includes('RWD')) {
    drivetrain = '2WD';
  }

  // Derive precise engine, horsepower and transmission specifications
  let engine = item.engine || 'N/A';
  let hp = 'N/A';
  let transmission = 'Automática';

  if (item.make.toLowerCase() === 'mazda') {
    if (item.model === 'CX-5') {
      if (item.year >= 2026) {
        engine = 'Skyactiv-G 2.5L 4 Cil DOHC';
        hp = '187 HP @ 6,000 RPM';
        transmission = 'Skyactiv-Drive 6 vel Automática';
      } else if (item.trim.toLowerCase().includes('turbo')) {
        engine = 'Skyactiv-G 2.5L Dynamic Pressure Turbo';
        hp = '256 HP @ 5,000 RPM';
        transmission = 'Skyactiv-Drive 6 vel Automática';
      } else {
        engine = 'Skyactiv-G 2.5L 4 Cil DOHC';
        hp = '187 HP @ 6,000 RPM';
        transmission = 'Skyactiv-Drive 6 vel Automática';
      }
    } else if (item.model === 'CX-30') {
      if (item.trim.toLowerCase().includes('turbo')) {
        engine = 'Skyactiv-G 2.5L Turbo';
        hp = '250 HP @ 5,000 RPM';
      } else {
        engine = 'Skyactiv-G 2.5L 4 Cil DOHC';
        hp = '191 HP @ 6,000 RPM';
      }
      transmission = 'Skyactiv-Drive 6 vel con Modo Sport';
    } else if (item.model === 'CX-50') {
      if (item.trim.toLowerCase().includes('hybrid') || item.engine.toLowerCase().includes('hibrido')) {
        engine = '2.5L 4 Cil Electrificado + 3 Motores Eléctricos';
        hp = '219 HP Combinados';
        transmission = 'e-CVT Electrónica Inteligente';
      } else if (item.trim.toLowerCase().includes('turbo')) {
        engine = 'Skyactiv-G 2.5L Turbo con Mi-Drive';
        hp = '256 HP @ 5,000 RPM';
        transmission = 'Skyactiv-Drive 6 vel';
      } else {
        engine = 'Skyactiv-G 2.5L 4 Cil con Mi-Drive';
        hp = '187 HP @ 6,000 RPM';
        transmission = 'Skyactiv-Drive 6 vel';
      }
    } else if (item.model === 'CX-70' || item.model === 'CX-90') {
      if (item.trim.toLowerCase().includes('phev')) {
        engine = '2.5L e-Skyactiv PHEV Híbrido Enchufable';
        hp = '323 HP Combinados';
        transmission = 'Automática 8 vel';
      } else if (item.trim.toLowerCase().includes('turbo s') || item.trim.toLowerCase().includes('3.3 turbo s')) {
        engine = 'e-Skyactiv G 3.3L Turbo 6 en Línea + M-Hybrid';
        hp = '340 HP @ 5,000 RPM';
        transmission = 'Automática 8 vel';
      } else {
        engine = 'e-Skyactiv G 3.3L Turbo 6 en Línea + M-Hybrid';
        hp = '280 HP @ 5,000 RPM';
        transmission = 'Automática 8 vel';
      }
    } else if (item.model.includes('Mazda3')) {
      if (item.trim.toLowerCase().includes('turbo')) {
        engine = 'Skyactiv-G 2.5L Turbo';
        hp = '250 HP @ 5,000 RPM';
      } else {
        engine = 'Skyactiv-G 2.5L 4 Cil DOHC';
        hp = '191 HP @ 6,000 RPM';
      }
      transmission = 'Skyactiv-Drive 6 vel';
    } else if (item.model.includes('MX-5') || item.model.includes('Miata')) {
      engine = 'Skyactiv-G 2.0L 4 Cil DOHC';
      hp = '181 HP @ 7,000 RPM';
      transmission = item.trim.toLowerCase().includes('manual') ? 'Manual 6 vel' : 'Automática 6 vel';
    } else {
      engine = item.engine || 'Skyactiv-G';
      hp = 'N/A';
      transmission = 'Automática';
    }
  } else {
    // Non-Mazda Vehicles: As requested, HP is N/A because it's third-party/used inventory
    hp = 'N/A';
    engine = item.engine || 'N/A';
    transmission = 'Automática';
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
      engine: engine,
      horsepower: hp,
      drivetrain,
      transmission: transmission,
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
  .filter((v): v is Vehicle => v !== null)
  .sort((a, b) => {
    // 1. Mazda Nuevo (0 millas) first
    const aIsMazdaNew = a.make?.toLowerCase() === 'mazda' && a.status === 'Nuevo';
    const bIsMazdaNew = b.make?.toLowerCase() === 'mazda' && b.status === 'Nuevo';
    if (aIsMazdaNew && !bIsMazdaNew) return -1;
    if (!aIsMazdaNew && bIsMazdaNew) return 1;

    // 2. Other Mazdas
    const aIsMazda = a.make?.toLowerCase() === 'mazda';
    const bIsMazda = b.make?.toLowerCase() === 'mazda';
    if (aIsMazda && !bIsMazda) return -1;
    if (!aIsMazda && bIsMazda) return 1;

    // 3. Other New vehicles
    const aIsNew = a.status === 'Nuevo';
    const bIsNew = b.status === 'Nuevo';
    if (aIsNew && !bIsNew) return -1;
    if (!aIsNew && bIsNew) return 1;

    // 4. Sort by Year descending, then price
    if (b.year !== a.year) return b.year - a.year;
    return a.price - b.price;
  });

