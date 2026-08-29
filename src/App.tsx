import React, { useState } from 'react';
import { InventoryGrid } from './components/InventoryGrid';
import { MazdaLogo } from './components/MazdaLogo';
import { CarModal } from './components/CarModal';
import { ChatWidget } from './components/ChatWidget';
import { ComparisonMatrix } from './components/ComparisonMatrix';
import { PreQualModal } from './components/PreQualModal';
import { HamburgerMenu } from './components/HamburgerMenu';
import { Vehicle, INVENTORY } from './data/inventory';
import { 
  ShieldCheck, 
  Zap, 
  Calculator, 
  CheckCircle, 
  Award, 
  ArrowRight,
  Sparkles,
  MapPin,
  Menu
} from 'lucide-react';

export default function App() {
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isPreQualOpen, setIsPreQualOpen] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [preQualVehicle, setPreQualVehicle] = useState<Vehicle | null>(null);
  const [externalTrigger, setExternalTrigger] = useState<{ vehicle?: Vehicle | null; customPrompt?: string; timestamp: number } | null>(null);

  // When clicking "PREGÚNTAME" on any car card or modal
  const handleAskAboutVehicle = (vehicle: Vehicle) => {
    setExternalTrigger({
      vehicle,
      timestamp: Date.now()
    });
  };

  const handleAskComparison = (model: string) => {
    const matched = INVENTORY.find(v => v.model === model);
    if (matched) {
      setExternalTrigger({
        vehicle: matched,
        timestamp: Date.now()
      });
    } else {
      setExternalTrigger({
        customPrompt: `Hola Shakira, me gustaría conocer las ventajas del Mazda ${model} frente a sus competidores y las opciones de financiamiento disponibles.`,
        timestamp: Date.now()
      });
    }
  };

  const handleOpenPreQual = (vehicle?: Vehicle) => {
    setPreQualVehicle(vehicle || null);
    setIsPreQualOpen(true);
  };

  const handleOpenChat = () => {
    setExternalTrigger({
      customPrompt: '¡Hola Shakira! Me gustaría recibir orientación sobre las ofertas y financiamiento disponibles.',
      timestamp: Date.now()
    });
  };

  return (
    <div className="min-h-screen bg-[#000000] text-[#FFFFFF] selection:bg-[#00FFFF] selection:text-black">
      
      {/* Top Notification Bar */}
      <div className="bg-[#000000] border-b border-[#222222] py-2 px-4 text-center text-xs sm:text-sm font-bold text-[#AAAAAA] flex items-center justify-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[#00FFFF] animate-ping" />
        <span className="text-[#00FFFF] tracking-wide">SHOWROOM INTERACTIVO - BARRANQUITAS MAZDA PUERTO RICO</span>
        <span className="hidden md:inline text-[#888888]">• TRACCIÓN i-ACTIV AWD® DE SERIE</span>
      </div>

      {/* Navigation Header (Main Brand Bar) */}
      <header className="sticky top-0 z-30 bg-[#000000]/95 backdrop-blur-md border-b border-[#222222]">
        <div className="max-w-[1200px] mx-auto px-3 sm:px-4 py-2 sm:py-3 relative flex items-center justify-between">
          {/* Menu Button positioned nicely */}
          <button
            onClick={() => setIsMenuOpen(true)}
            className="bg-[#111111] hover:bg-[#222222] border border-[#333333] hover:border-[#00FFFF] text-white hover:text-[#00FFFF] p-2 sm:p-2.5 rounded transition-all cursor-pointer flex items-center gap-1.5 shrink-0 z-10"
            aria-label="Abrir menú de categorías"
            title="Menú de Categorías, AWD y Comparativa"
          >
            <Menu className="w-5 h-5 text-[#00FFFF]" />
            <span className="font-black text-xs sm:text-sm uppercase tracking-wider hidden sm:inline">MENÚ</span>
          </button>

          {/* Fully Centered Prominent Logo for Mobile and Desktop */}
          <div className="flex-1 flex items-center justify-center px-2">
            <MazdaLogo className="w-full max-w-[280px] sm:max-w-[380px] md:max-w-[440px]" />
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 text-xs uppercase font-black text-[#AAAAAA] shrink-0 z-10">
            <a href="#inventario" className="hover:text-[#00FFFF] transition-colors">Inventario</a>
            <a href="#comparativa" className="hover:text-[#00FFFF] transition-colors">Comparativa</a>
            <a href="#tecnologia" className="hover:text-[#00FFFF] transition-colors">Tecnología AWD</a>
          </nav>

          {/* Dummy spacer on mobile to keep logo perfectly centered */}
          <div className="w-[38px] sm:hidden pointer-events-none" />
        </div>

        {/* Subheader Toolbar: Balanced Centered Actions for Mobile & Desktop */}
        <div className="bg-[#0a0a0a] border-t border-[#222222] py-2 px-3 sm:px-4">
          <div className="max-w-[1200px] mx-auto flex items-center justify-center gap-2 sm:gap-4">
            {/* Location Pin Button */}
            <a 
              href="https://maps.app.goo.gl/77uboxwhn7e2GMRbA" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 sm:gap-2 bg-[#141414] hover:bg-[#1f1f1f] border border-[#333333] hover:border-[#FF3333] text-[#CCCCCC] hover:text-white px-3 sm:px-6 py-2.5 rounded text-xs sm:text-sm font-bold uppercase tracking-wider transition-all text-center shadow"
              title="Ver ubicación en Google Maps"
            >
              <MapPin className="w-4 h-4 text-[#FF3333] shrink-0" />
              <span className="truncate">Barranquitas, PR</span>
            </a>

            {/* Pre-qualification CTA Button */}
            <a
              href="https://www.cognitoforms.com/BarranquitasMazda1/SolicitudDeCr%C3%A9dito"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 sm:gap-2 bg-[#00FFFF] hover:bg-[#55FFFF] text-black px-3 sm:px-8 py-2.5 rounded text-xs sm:text-sm font-black uppercase tracking-wide transition-all shadow-md hover:shadow-[#00FFFF]/20 cursor-pointer underline text-center"
              title="Solicitud de Crédito Online"
            >
              <Calculator className="w-4 h-4 shrink-0" />
              <span className="truncate">Precalificar</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Inventory Grid Section */}
      <InventoryGrid 
        onSelectVehicle={(vehicle) => setSelectedVehicle(vehicle)}
        onAskAI={(vehicle) => handleAskAboutVehicle(vehicle)}
        selectedCategory={selectedCategory}
        onSelectCategory={(cat) => setSelectedCategory(cat)}
      />

      {/* Comparison Matrix Section */}
      <ComparisonMatrix onAskComparison={handleAskComparison} />

      {/* Technology i-ACTIV Section */}
      <section id="tecnologia" className="max-w-[1200px] mx-auto px-4 py-12">
        <div className="bg-[#000000] border border-[#333333] rounded p-6 sm:p-10 relative overflow-hidden car-card">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <span className="text-sm uppercase text-[#00FFFF] font-black">
                INGENIERÍA JAPONESA
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-white uppercase">
                i-ACTIV AWD® DE SERIE
              </h2>
              <p className="text-base text-[#DDDDDD] font-normal leading-relaxed">
                El sistema de tracción integral i-ACTIV AWD de Mazda monitorea las condiciones del camino 200 veces por segundo. Evalúa la temperatura exterior, el uso de los limpiaparabrisas y el ángulo del volante para transferir potencia antes de que ocurra un deslizamiento.
              </p>
              <ul className="space-y-3 text-sm text-[#FFFFFF]">
                <li className="flex items-center gap-2.5">
                  <CheckCircle className="w-5 h-5 text-[#00FFFF] shrink-0" />
                  <span className="font-bold">Estándar en 100% de la gama SUV (CX-30, CX-5, CX-50, CX-70, CX-90)</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle className="w-5 h-5 text-[#00FFFF] shrink-0" />
                  <span className="font-bold">Sin costo adicional ni paquetes extras forzados</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle className="w-5 h-5 text-[#00FFFF] shrink-0" />
                  <span className="font-bold">Máxima seguridad para el clima y carreteras de Puerto Rico</span>
                </li>
              </ul>
            </div>

            <div className="bg-[#000000] p-6 sm:p-8 border border-[#333333] space-y-4">
              <h3 className="text-base sm:text-lg uppercase text-[#00FFFF] font-black">
                ¿DESEAS COTIZAR CON TU PRONTO O TRADE-IN?
              </h3>
              <p className="text-sm text-[#AAAAAA] font-bold leading-relaxed">
                Calcula tu pago mensual estimado al instante con la ayuda de nuestra ejecutiva virtual Shakira.
              </p>
              <button
                onClick={() => handleOpenPreQual()}
                className="btn-ask-ai text-base"
              >
                CALCULAR PAGO & PRECALIFICAR
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#333333] bg-[#000000] py-10 px-4 text-sm text-[#AAAAAA]">
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 bg-[#000000] border-2 border-[#00FFFF] flex items-center justify-center text-[#00FFFF] font-black text-sm">
              BM
            </div>
            <div>
              <span className="font-black text-white text-sm sm:text-base">SHOWROOM INTERACTIVO - BARRANQUITAS MAZDA</span>
              <p className="text-xs text-[#888888]">Barranquitas Mazda Puerto Rico</p>
            </div>
          </div>

          <div className="text-center md:text-right text-xs sm:text-sm space-y-1.5">
            <p>© 2026 Barranquitas Mazda Puerto Rico. Todos los derechos reservados.</p>
            <p className="text-[#888888] max-w-xl">Los pagos mostrados son estimados. El pago final depende del crédito, pronto, plazo, intereses, cargos y aprobación de la institución financiera.</p>
          </div>
        </div>
      </footer>

      {/* Vehicle Full Specs Modal */}
      <CarModal 
        vehicle={selectedVehicle}
        onClose={() => setSelectedVehicle(null)}
        onAskAI={(v) => handleAskAboutVehicle(v)}
      />

      {/* Pre-Qualification & Financing Calculator Modal */}
      <PreQualModal 
        isOpen={isPreQualOpen}
        onClose={() => setIsPreQualOpen(false)}
        selectedVehicle={preQualVehicle}
        onSuccess={() => {
          if (externalTrigger) {
            setExternalTrigger({
              ...externalTrigger,
              timestamp: Date.now()
            });
          }
        }}
      />

      {/* Hamburger Drawer Menu */}
      <HamburgerMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onSelectCategory={(catId) => setSelectedCategory(catId)}
        onOpenPreQual={() => handleOpenPreQual()}
        onOpenChat={handleOpenChat}
        currentCategory={selectedCategory}
      />

      {/* Floating AI Sales Agent Chatbot */}
      <ChatWidget externalTrigger={externalTrigger} />

    </div>
  );
}
