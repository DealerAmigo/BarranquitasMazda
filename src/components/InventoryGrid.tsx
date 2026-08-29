import React, { useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight, Image as ImageIcon, Sparkles, Filter } from 'lucide-react';
import { Vehicle, INVENTORY } from '../data/inventory';
import { handleImageError, getProxyImageUrl } from '../utils/imageHelper';

interface InventoryGridProps {
  onSelectVehicle: (vehicle: Vehicle) => void;
  onAskAI: (vehicle: Vehicle) => void;
  selectedCategory?: string;
  onSelectCategory?: (cat: string) => void;
  inventoryType?: 'NUEVOS' | 'COMPLETO';
  onSelectInventoryType?: (type: 'NUEVOS' | 'COMPLETO') => void;
}

export function InventoryGrid({ 
  onSelectVehicle, 
  onAskAI,
  selectedCategory: propCategory,
  onSelectCategory: propSetCategory,
  inventoryType: propInventoryType,
  onSelectInventoryType: propSetInventoryType
}: InventoryGridProps) {
  // Default to the 2nd tab "INVENTARIO COMPLETO" as requested
  const [localInventoryType, setLocalInventoryType] = useState<'NUEVOS' | 'COMPLETO'>('COMPLETO');
  const [localSelectedCategory, setLocalSelectedCategory] = useState<string>('ALL');
  
  const inventoryType = propInventoryType !== undefined ? propInventoryType : localInventoryType;
  const setInventoryType = propSetInventoryType || setLocalInventoryType;

  const selectedCategory = propCategory !== undefined ? propCategory : localSelectedCategory;
  const setSelectedCategory = propSetCategory || setLocalSelectedCategory;

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'year'>('featured');
  const [cardPhotoIndex, setCardPhotoIndex] = useState<{ [carId: string]: number }>({});

  const categories = [
    { id: 'ALL', label: 'TODOS LOS VEHÍCULOS' },
    { id: 'MAZDA', label: 'MAZDA' },
    { id: 'TOYOTA', label: 'TOYOTA' },
    { id: 'SUVS', label: 'SUVs & CROSSOVERS' },
    { id: 'PICKUPS', label: 'PICKUPS, CAMIONES & COMERCIALES' },
    { id: 'SEDANS', label: 'SEDANES & COMPACTOS' },
    { id: 'HYBRID', label: 'HÍBRIDOS' },
    { id: 'NUEVOS', label: 'NUEVOS 0 MILLAS' },
    { id: 'USADOS', label: 'USADOS' },
  ];

  const filteredVehicles = useMemo(() => {
    return INVENTORY.filter((v) => {
      // Main Tab Filter (SOLO NUEVOS vs INVENTARIO COMPLETO)
      if (inventoryType === 'NUEVOS' && v.status !== 'Nuevo') {
        return false;
      }

      // Model/Category Filter
      if (selectedCategory === 'MAZDA' && v.make?.toLowerCase() !== 'mazda') return false;
      if (selectedCategory === 'TOYOTA' && v.make?.toLowerCase() !== 'toyota') return false;
      if (selectedCategory === 'SUVS' && !['cx-30', 'cx-5', 'cx-50', 'cx-70', 'cx-90', 'rav4', '4runner', 'highlander', 'venue', 'tucson', 'sportage', 'outlander', 'corolla cross', 'soul'].some(m => v.model.toLowerCase().includes(m))) return false;
      
      const commercialModels = ['sprinter', 'transit', 'promaster', 'express', 'savana', 'nv', 'f-450', 'f-550', 'super duty', 'súper duty', 'econoline', 'cargo', 'cutaway'];
      const pickupModels = ['tacoma', 'tundra', 'ranger', 'maverick', 'f-150', 'f-250', 'f-350', 'colorado', 'gladiator', 'santa cruz', 'frontier', 'titan', 'silverado', 'sierra', 'ram'];
      const pickupAndCommercial = [...pickupModels, ...commercialModels];
      
      if (selectedCategory === 'PICKUPS' && !pickupAndCommercial.some(m => v.model.toLowerCase().includes(m))) return false;
      if (selectedCategory === 'SEDANS' && !['corolla', 'yaris', 'mazda3', 'rio', 'accent', 'forte', 'mirage', 'versa', 'spark'].some(m => v.model.toLowerCase().includes(m))) return false;
      if (selectedCategory === 'HYBRID' && !v.trim.toLowerCase().includes('hybrid') && !v.specs.engine.toLowerCase().includes('hibrid')) return false;
      if (selectedCategory === 'NUEVOS' && v.status !== 'Nuevo') return false;
      
      if (selectedCategory === 'USADOS') {
        if (v.status !== 'Usado' && v.status !== 'Certificado') return false;
        // Exclude heavy commercial trucks from the regular 'Usados' tab to keep it consumer-focused
        if (commercialModels.some(m => v.model.toLowerCase().includes(m))) return false;
      }

      // Text Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match = 
          (v.make && v.make.toLowerCase().includes(q)) ||
          v.model.toLowerCase().includes(q) ||
          v.trim.toLowerCase().includes(q) ||
          v.stock.toLowerCase().includes(q) ||
          v.color.toLowerCase().includes(q) ||
          v.vin.toLowerCase().includes(q) ||
          v.year.toString().includes(q);
        if (!match) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'featured') {
        // Priority 1: New Mazdas (0 miles)
        const aIsMazdaNew = a.make?.toLowerCase() === 'mazda' && a.status === 'Nuevo';
        const bIsMazdaNew = b.make?.toLowerCase() === 'mazda' && b.status === 'Nuevo';
        if (aIsMazdaNew && !bIsMazdaNew) return -1;
        if (!aIsMazdaNew && bIsMazdaNew) return 1;

        // Priority 2: Other Mazdas
        const aIsMazda = a.make?.toLowerCase() === 'mazda';
        const bIsMazda = b.make?.toLowerCase() === 'mazda';
        if (aIsMazda && !bIsMazda) return -1;
        if (!aIsMazda && bIsMazda) return 1;

        // Priority 3: Other New vehicles
        const aIsNew = a.status === 'Nuevo';
        const bIsNew = b.status === 'Nuevo';
        if (aIsNew && !bIsNew) return -1;
        if (!aIsNew && bIsNew) return 1;

        // Then by Year descending, then price
        if (b.year !== a.year) return b.year - a.year;
        return a.price - b.price;
      }
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'year') return b.year - a.year;
      return 0;
    });
  }, [inventoryType, selectedCategory, searchQuery, sortBy]);

  const handleNextCardPhoto = (e: React.MouseEvent, vehicle: Vehicle) => {
    e.stopPropagation();
    const photos = vehicle.images && vehicle.images.length > 0 ? vehicle.images : [vehicle.image];
    setCardPhotoIndex(prev => {
      const current = prev[vehicle.id] || 0;
      const next = (current + 1) % photos.length;
      return { ...prev, [vehicle.id]: next };
    });
  };

  const handlePrevCardPhoto = (e: React.MouseEvent, vehicle: Vehicle) => {
    e.stopPropagation();
    const photos = vehicle.images && vehicle.images.length > 0 ? vehicle.images : [vehicle.image];
    setCardPhotoIndex(prev => {
      const current = prev[vehicle.id] || 0;
      const prevIdx = current === 0 ? photos.length - 1 : current - 1;
      return { ...prev, [vehicle.id]: prevIdx };
    });
  };

  return (
    <section id="inventario" className="max-w-[1200px] mx-auto px-0 sm:px-4 py-8">
      {/* Main Tabs Container: SOLO NUEVOS vs INVENTARIO COMPLETO (2nd tab active by default) */}
      <div className="flex justify-center mb-6">
        <div className="bg-[#000000] border border-[#333333] p-1.5 rounded inline-flex gap-2">
          {/* Tab 1: Solo Nuevos */}
          <button
            onClick={() => setInventoryType('NUEVOS')}
            className={`px-6 py-3 text-sm sm:text-base font-black uppercase transition-all cursor-pointer rounded ${
              inventoryType === 'NUEVOS'
                ? 'bg-[#00FFFF] text-black shadow-none'
                : 'text-[#888888] hover:text-white hover:bg-white/5'
            }`}
          >
            SOLO NUEVOS
          </button>

          {/* Tab 2: Inventario Completo (Activo por defecto) */}
          <button
            onClick={() => setInventoryType('COMPLETO')}
            className={`px-6 py-3 text-sm sm:text-base font-black uppercase transition-all cursor-pointer rounded flex items-center gap-2 ${
              inventoryType === 'COMPLETO'
                ? 'bg-[#00FFFF] text-black shadow-none'
                : 'text-[#888888] hover:text-white hover:bg-white/5'
            }`}
          >
            <span>INVENTARIO COMPLETO</span>
            <span className={`text-xs px-2 py-0.5 rounded font-mono ${
              inventoryType === 'COMPLETO' ? 'bg-black text-[#00FFFF]' : 'bg-[#222222] text-[#888888]'
            }`}>
              {INVENTORY.length}
            </span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#000000] p-4 sm:p-5 rounded border border-[#333333] mb-8 space-y-4">
        {/* Sub-Category Model Filter Tabs */}
        <div className="flex gap-2.5 overflow-x-auto pb-1.5 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 text-xs sm:text-sm font-black uppercase whitespace-nowrap transition-colors cursor-pointer border ${
                selectedCategory === cat.id
                  ? 'bg-[#00FFFF] text-[#000000] border-[#00FFFF]'
                  : 'bg-[#000000] text-[#FFFFFF] border-[#333333] hover:border-[#00FFFF]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search & Sort */}
        <div className="flex flex-col sm:flex-row gap-3.5 items-center justify-between pt-3 border-t border-[#333333]">
          <div className="relative w-full sm:w-96">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#888888]" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por modelo, stock, color, VIN..."
              className="w-full bg-[#000000] border border-[#333333] rounded pl-10 pr-3 py-2.5 text-sm text-white placeholder:text-[#666666] focus:outline-none focus:border-[#00FFFF]"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between text-sm text-[#888888]">
            <span className="font-mono text-[#00FFFF] font-bold">{filteredVehicles.length} UNIDADES EN {inventoryType === 'NUEVOS' ? 'SOLO NUEVOS' : 'INVENTARIO COMPLETO'}</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-[#000000] border border-[#333333] text-[#FFFFFF] font-bold text-xs sm:text-sm rounded px-3 py-2 focus:outline-none focus:border-[#00FFFF]"
            >
              <option value="featured">Mazda Nuevos Primero</option>
              <option value="year">Año más reciente</option>
              <option value="price-asc">Precio: Menor a Mayor</option>
              <option value="price-desc">Precio: Mayor a Menor</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid of Car Cards */}
      {filteredVehicles.length === 0 ? (
        <div className="bg-[#000000] border border-[#333333] rounded p-12 text-center text-[#888888]">
          <p className="text-lg text-white mb-2 font-bold">NO SE ENCONTRARON VEHÍCULOS</p>
          <button
            onClick={() => { setInventoryType('COMPLETO'); setSelectedCategory('ALL'); setSearchQuery(''); }}
            className="text-sm text-[#00FFFF] underline cursor-pointer font-bold"
          >
            Ver inventario completo
          </button>
        </div>
      ) : (
        <div className="inventory-grid">
          {filteredVehicles.map((vehicle) => {
            const photos = vehicle.images && vehicle.images.length > 0 ? vehicle.images : [vehicle.image];
            const currentIdx = cardPhotoIndex[vehicle.id] || 0;
            const currentPhoto = photos[currentIdx] || vehicle.image;

            return (
              <div key={vehicle.id} className="car-card">
                {/* Image Container with Photos & Badges */}
                <div 
                  className="relative cursor-pointer bg-[#000000]"
                  onClick={() => onSelectVehicle(vehicle)}
                >
                  <img 
                    src={getProxyImageUrl(currentPhoto)} 
                    alt={`${vehicle.make} ${vehicle.model} ${vehicle.trim}`}
                    referrerPolicy="no-referrer"
                    onError={(e) => handleImageError(e, currentPhoto)}
                    className="car-img"
                  />

                  {/* Left & Right mini photo navigation buttons */}
                  {photos.length > 1 && (
                    <>
                      <button
                        onClick={(e) => handlePrevCardPhoto(e, vehicle)}
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-[#00FFFF] hover:text-black text-white p-1 rounded-full border border-[#333333] transition-colors cursor-pointer"
                        title="Foto anterior"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleNextCardPhoto(e, vehicle)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-[#00FFFF] hover:text-black text-white p-1 rounded-full border border-[#333333] transition-colors cursor-pointer"
                        title="Foto siguiente"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </>
                  )}

                  {/* Photo count indicator */}
                  {photos.length > 1 && (
                    <div className="absolute bottom-2 right-2 bg-black/85 border border-[#333333] text-white text-xs px-2 py-0.5 rounded flex items-center gap-1 font-bold">
                      <ImageIcon className="w-3.5 h-3.5 text-[#00FFFF]" /> {currentIdx + 1}/{photos.length}
                    </div>
                  )}

                  {/* Stock tag */}
                  <div className="absolute top-2 right-2 bg-black/85 border border-[#333333] text-[#00FFFF] text-xs px-2.5 py-1 rounded font-mono font-bold">
                    STOCK #{vehicle.stock}
                  </div>
                </div>

                {/* Content */}
                <div className="car-content">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="bg-[#00FFFF] text-black font-black text-xs px-2.5 py-0.5 rounded">
                      {vehicle.year}
                    </span>
                    <span className="car-badge">{vehicle.status}</span>
                  </div>

                  <h3 
                    onClick={() => onSelectVehicle(vehicle)}
                    className="car-title cursor-pointer hover:text-[#00FFFF] transition-colors leading-tight"
                  >
                    {vehicle.year} {vehicle.make ? vehicle.make.toUpperCase() : ''} {vehicle.model.toUpperCase()}
                  </h3>
                  <div className="text-sm text-[#00FFFF] font-extrabold uppercase tracking-wide mb-2.5">
                    PAQUETE: {vehicle.trim.toUpperCase()}
                  </div>

                  <div 
                    onClick={() => onSelectVehicle(vehicle)}
                    className="border-t border-b border-[#333333] py-2.5 px-1.5 mb-3 flex items-center justify-between cursor-pointer hover:border-[#00FFFF] transition-colors group/cardbtn"
                  >
                    <span className="text-sm font-mono font-black text-[#00FFFF] uppercase tracking-wide">
                      VER PRECIO & CUOTA
                    </span>
                    <span className="text-xs font-mono text-[#AAAAAA] group-hover/cardbtn:text-white font-bold transition-colors">
                      TARJETA INTERNA ➔
                    </span>
                  </div>

                  <div className="car-specs">
                    <span>Año: <strong>{vehicle.year}</strong></span>
                    <span>Millas: {vehicle.mileage === 0 ? '0 (Nueva)' : vehicle.mileage.toLocaleString()}</span>
                    <span>Motor: {vehicle.specs.engine}</span>
                    <span>MPG: {vehicle.specs.mpg.replace(' MPG', '')}</span>
                  </div>

                  {/* Action Button: Exact Match to User Template */}
                  <div className={`mt-auto grid gap-2.5 ${vehicle.url && vehicle.url !== 'N/A' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    <button 
                      onClick={() => onAskAI(vehicle)}
                      className="btn-ask-ai"
                      style={{ marginTop: 0, width: '100%', padding: '14px 6px', fontSize: '1rem' }}
                    >
                      PREGÚNTAME
                    </button>
                    {vehicle.url && vehicle.url !== 'N/A' && (
                      <a
                        href={vehicle.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center bg-transparent border border-[#00FFFF] text-[#00FFFF] font-black uppercase text-center hover:bg-[#00FFFF] hover:text-black transition-colors"
                        style={{ width: '100%', textDecoration: 'none', fontSize: '1rem', padding: '14px 6px' }}
                      >
                        FICHA 360°
                      </a>
                    )}
                  </div>

                  <div className="mt-2.5 text-center">
                    <button
                      onClick={() => onSelectVehicle(vehicle)}
                      className="text-sm text-[#AAAAAA] hover:text-[#FFFFFF] py-1 transition-colors cursor-pointer font-bold"
                    >
                      Ver detalles & fotos completas
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
