import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight, 
  Image as ImageIcon, 
  Sparkles, 
  Filter 
} from 'lucide-react';
import { Vehicle, INVENTORY } from '../data/inventory';
import { handleImageError, getProxyImageUrl } from '../utils/imageHelper';

interface InventoryGridProps {
  onSelectVehicle: (vehicle: Vehicle) => void;
  onAskAI: (vehicle: Vehicle) => void;
  selectedCategory?: string;
  onSelectCategory?: (cat: string) => void;
}

export function InventoryGrid({ 
  onSelectVehicle, 
  onAskAI,
  selectedCategory: propCategory,
  onSelectCategory: propSetCategory
}: InventoryGridProps) {
  const [localSelectedCategory, setLocalSelectedCategory] = useState<string>('ALL');
  const selectedCategory = propCategory !== undefined ? propCategory : localSelectedCategory;
  const setSelectedCategory = propSetCategory || setLocalSelectedCategory;

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const ITEMS_PER_PAGE = 20;
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

  // Reset to page 1 whenever category, search query, or sorting changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchQuery, sortBy]);

  const filteredVehicles = useMemo(() => {
    return INVENTORY.filter((v) => {
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
  }, [selectedCategory, searchQuery, sortBy]);

  // Exact pagination logic (20 items per page)
  const totalPages = Math.ceil(filteredVehicles.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, filteredVehicles.length);
  const paginatedVehicles = filteredVehicles.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    const el = document.getElementById('inventario');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

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
    <section id="inventario" className="max-w-[1200px] mx-auto px-2 sm:px-4 py-6">
      {/* Filter and Search Bar */}
      <div className="bg-[#000000] p-3 sm:p-4 rounded border border-[#333333] mb-6 space-y-3">
        {/* Category Quick Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 text-xs sm:text-sm font-black uppercase whitespace-nowrap transition-colors cursor-pointer border rounded ${
                selectedCategory === cat.id
                  ? 'bg-[#00FFFF] text-[#000000] border-[#00FFFF] shadow'
                  : 'bg-[#000000] text-[#FFFFFF] border-[#333333] hover:border-[#00FFFF]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search & Sort */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between pt-2.5 border-t border-[#333333]">
          <div className="relative w-full sm:w-80 md:w-96">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#888888]" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por modelo, stock, color, VIN..."
              className="w-full bg-[#000000] border border-[#333333] rounded pl-9 pr-3 py-2 text-xs sm:text-sm text-white placeholder:text-[#666666] focus:outline-none focus:border-[#00FFFF]"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between text-xs sm:text-sm text-[#888888]">
            <span className="font-mono text-[#00FFFF] font-bold">
              {filteredVehicles.length} UNIDADES {filteredVehicles.length > 0 ? `(PÁG. ${currentPage} DE ${totalPages})` : ''}
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-[#000000] border border-[#333333] text-[#FFFFFF] font-bold text-xs rounded px-2.5 py-1.5 focus:outline-none focus:border-[#00FFFF] cursor-pointer"
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
        <div className="bg-[#000000] border border-[#333333] rounded p-10 text-center text-[#888888]">
          <p className="text-base text-white mb-2 font-bold uppercase">No se encontraron vehículos</p>
          <button
            onClick={() => { setSelectedCategory('ALL'); setSearchQuery(''); }}
            className="text-xs text-[#00FFFF] underline cursor-pointer font-bold uppercase"
          >
            Ver todos los vehículos
          </button>
        </div>
      ) : (
        <>
          <div className="inventory-grid">
            {paginatedVehicles.map((vehicle) => {
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

                    {/* Action Button */}
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

          {/* Pagination Navigation Controls (20 units per page) */}
          {filteredVehicles.length > ITEMS_PER_PAGE && (
            <div className="mt-8 pt-6 border-t border-[#222222] flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#050505] p-4 rounded">
              <div className="text-xs text-[#AAAAAA] font-mono">
                Mostrando <span className="text-[#00FFFF] font-bold">{startIndex + 1} - {endIndex}</span> de <span className="text-white font-bold">{filteredVehicles.length}</span> autos
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* First Page */}
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                  className="p-2 bg-[#111111] hover:bg-[#222222] disabled:opacity-30 disabled:cursor-not-allowed border border-[#333333] text-white rounded transition-colors"
                  title="Primera Página"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>

                {/* Prev Page */}
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 bg-[#111111] hover:bg-[#222222] disabled:opacity-30 disabled:cursor-not-allowed border border-[#333333] text-white rounded text-xs font-bold flex items-center gap-1 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Anterior</span>
                </button>

                {/* Page Number Buttons */}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`w-8 h-8 rounded text-xs font-bold transition-all cursor-pointer border ${
                      currentPage === pageNum
                        ? 'bg-[#00FFFF] text-black border-[#00FFFF] font-black shadow-md'
                        : 'bg-[#111111] text-[#CCCCCC] border-[#333333] hover:bg-[#222222] hover:text-white hover:border-[#888888]'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}

                {/* Next Page */}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 bg-[#111111] hover:bg-[#222222] disabled:opacity-30 disabled:cursor-not-allowed border border-[#333333] text-white rounded text-xs font-bold flex items-center gap-1 transition-colors"
                >
                  <span className="hidden sm:inline">Siguiente</span>
                  <ChevronRight className="w-4 h-4" />
                </button>

                {/* Last Page */}
                <button
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages}
                  className="p-2 bg-[#111111] hover:bg-[#222222] disabled:opacity-30 disabled:cursor-not-allowed border border-[#333333] text-white rounded transition-colors"
                  title="Última Página"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}

