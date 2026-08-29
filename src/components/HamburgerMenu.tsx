import React from 'react';
import { 
  X, 
  Calculator, 
  ShieldCheck, 
  Scale, 
  Car, 
  MapPin, 
  MessageSquare, 
  Sparkles,
  ChevronRight,
  Truck,
  Zap,
  Tag
} from 'lucide-react';
import { MazdaLogo } from './MazdaLogo';

interface HamburgerMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCategory: (catId: string, invType?: 'NUEVOS' | 'COMPLETO') => void;
  onOpenPreQual: () => void;
  onOpenChat: () => void;
  currentCategory: string;
  currentInventoryType: 'NUEVOS' | 'COMPLETO';
}

export function HamburgerMenu({
  isOpen,
  onClose,
  onSelectCategory,
  onOpenPreQual,
  onOpenChat,
  currentCategory,
  currentInventoryType
}: HamburgerMenuProps) {
  if (!isOpen) return null;

  const categories = [
    { id: 'ALL', label: 'Todos los Vehículos', icon: Car },
    { id: 'NUEVOS_DIRECT', label: 'Solo Nuevos (0 Millas)', icon: Sparkles, type: 'NUEVOS' as const },
    { id: 'MAZDA', label: 'Mazda (CX-5, CX-30, CX-50, CX-70, CX-90...)', icon: Car },
    { id: 'TOYOTA', label: 'Toyota (Tacoma, Tundra, RAV4, Corolla...)', icon: Car },
    { id: 'SUVS', label: 'SUVs & Crossovers', icon: Car },
    { id: 'PICKUPS', label: 'Pickups, Camiones & Comerciales', icon: Truck },
    { id: 'SEDANS', label: 'Sedanes & Compactos', icon: Car },
    { id: 'HYBRID', label: 'Híbridos & PHEV', icon: Zap },
    { id: 'USADOS', label: 'Usados Certificados', icon: Tag },
  ];

  const handleCategoryClick = (catId: string, type?: 'NUEVOS' | 'COMPLETO') => {
    if (catId === 'NUEVOS_DIRECT') {
      onSelectCategory('ALL', 'NUEVOS');
    } else {
      onSelectCategory(catId, type || 'COMPLETO');
    }
    onClose();
    // Scroll to inventory
    const el = document.getElementById('inventario');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleNavClick = (anchorId: string) => {
    onClose();
    const el = document.getElementById(anchorId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Dark Backdrop Overlay */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-md bg-[#000000] border-l border-[#333333] h-full overflow-y-auto z-10 flex flex-col shadow-2xl">
        {/* Drawer Header */}
        <div className="p-5 border-b border-[#333333] flex items-center justify-between bg-[#050505] sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <MazdaLogo />
            <div className="ml-2">
              <span className="text-xs text-[#00FFFF] font-extrabold uppercase tracking-widest block">Menú Principal</span>
              <span className="text-sm font-bold text-white">Barranquitas Mazda</span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-[#AAAAAA] hover:text-[#00FFFF] p-2 rounded hover:bg-white/5 transition-colors cursor-pointer"
            aria-label="Cerrar menú"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="p-5 space-y-6 flex-1">
          {/* Main Direct Actions (Precalificación, AWD, Comparativa) */}
          <div>
            <span className="text-xs text-[#00FFFF] uppercase font-black tracking-wider block mb-2.5">
              Acciones Principales
            </span>
            <div className="space-y-2">
              {/* 1. Precalificación */}
              <button
                onClick={() => {
                  onClose();
                  onOpenPreQual();
                }}
                className="w-full bg-[#00FFFF] text-black p-3.5 rounded font-black text-sm uppercase flex items-center justify-between hover:bg-[#55FFFF] transition-all cursor-pointer shadow-lg"
              >
                <div className="flex items-center gap-2.5">
                  <Calculator className="w-5 h-5" />
                  <span>Precalificación & Calculadora</span>
                </div>
                <ChevronRight className="w-5 h-5" />
              </button>

              {/* 2. La AWD */}
              <button
                onClick={() => handleNavClick('tecnologia')}
                className="w-full bg-[#111111] hover:bg-[#222222] border border-[#333333] hover:border-[#00FFFF] text-white p-3.5 rounded font-bold text-sm uppercase flex items-center justify-between transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-[#00FFFF]" />
                  <span className="group-hover:text-[#00FFFF] transition-colors">Tecnología i-ACTIV AWD®</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#888888] group-hover:text-[#00FFFF]" />
              </button>

              {/* 3. La Comparación */}
              <button
                onClick={() => handleNavClick('comparativa')}
                className="w-full bg-[#111111] hover:bg-[#222222] border border-[#333333] hover:border-[#00FFFF] text-white p-3.5 rounded font-bold text-sm uppercase flex items-center justify-between transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <Scale className="w-5 h-5 text-[#00FFFF]" />
                  <span className="group-hover:text-[#00FFFF] transition-colors">Comparación Mazda vs Rivales</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#888888] group-hover:text-[#00FFFF]" />
              </button>
            </div>
          </div>

          {/* Categorías de Inventario */}
          <div>
            <span className="text-xs text-[#00FFFF] uppercase font-black tracking-wider block mb-2.5">
              Categorías de Inventario
            </span>
            <div className="space-y-1.5">
              {categories.map((cat) => {
                const IconComponent = cat.icon;
                const isSelected = 
                  cat.id === 'NUEVOS_DIRECT' 
                    ? currentInventoryType === 'NUEVOS' 
                    : currentCategory === cat.id && currentInventoryType === 'COMPLETO';

                return (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryClick(cat.id, cat.type)}
                    className={`w-full text-left p-3 rounded text-sm font-bold flex items-center justify-between transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-[#00FFFF] text-black border-[#00FFFF] font-black'
                        : 'bg-[#000000] text-[#DDDDDD] border-[#222222] hover:border-[#00FFFF] hover:text-white hover:bg-[#111111]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <IconComponent className={`w-4 h-4 ${isSelected ? 'text-black' : 'text-[#00FFFF]'}`} />
                      <span>{cat.label}</span>
                    </div>
                    <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-black' : 'text-[#666666]'}`} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Asistencia Virtual & Contacto */}
          <div className="pt-3 border-t border-[#333333] space-y-2">
            <button
              onClick={() => {
                onClose();
                onOpenChat();
              }}
              className="w-full bg-[#111111] hover:bg-[#1a1a1a] border border-[#333333] hover:border-[#00FFFF] text-white p-3 rounded font-bold text-sm flex items-center justify-between cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <MessageSquare className="w-5 h-5 text-[#00FFFF]" />
                <span className="group-hover:text-[#00FFFF] transition-colors">Hablar con Asesora Shakira</span>
              </div>
              <span className="text-xs text-[#00FFFF] font-mono">[EN LÍNEA]</span>
            </button>

            <a
              href="https://maps.app.goo.gl/77uboxwhn7e2GMRbA"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-[#000000] hover:bg-[#111111] border border-[#333333] hover:border-red-500 text-[#CCCCCC] hover:text-white p-3 rounded font-bold text-xs sm:text-sm flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5">
                <MapPin className="w-5 h-5 text-[#FF3333]" />
                <span>Barranquitas Mazda (Ver en Google Maps)</span>
              </div>
              <ChevronRight className="w-4 h-4 text-[#888888]" />
            </a>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-[#333333] bg-[#050505] text-center text-xs text-[#888888]">
          <p className="font-bold text-white">Barranquitas Mazda • DealerAmigo PR</p>
          <p className="mt-0.5">Showroom Digital & Inventario en Tiempo Real</p>
        </div>
      </div>
    </div>
  );
}
