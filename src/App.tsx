import React, { useState } from 'react';
import { InventoryGrid } from './components/InventoryGrid';
import { MazdaLogo } from './components/MazdaLogo';
import { CarModal } from './components/CarModal';
import { ChatWidget } from './components/ChatWidget';
import { ComparisonMatrix } from './components/ComparisonMatrix';
import CX50HybridTechModule from './components/CX50HybridTechModule';
import { PreQualModal } from './components/PreQualModal';
import { CalendarBookingModal } from './components/CalendarBookingModal';
import { Vehicle, INVENTORY } from './data/inventory';
import { 
  ShieldCheck, 
  Zap, 
  Calculator, 
  CheckCircle, 
  Award, 
  ArrowRight,
  Sparkles,
  Calendar,
  MapPin
} from 'lucide-react';

export default function App() {
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isPreQualOpen, setIsPreQualOpen] = useState<boolean>(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false);
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

  return (
    <div className="min-h-screen bg-[#000000] text-[#FFFFFF] selection:bg-[#00FFFF] selection:text-black">
      
      {/* Top Notification Bar */}
      <div className="bg-[#000000] border-b border-[#333333] py-2 px-4 text-center text-xs font-bold text-[#888888] flex items-center justify-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[#00FFFF] animate-ping" />
        <span className="text-[#00FFFF]">SHOWROOM INTERACTIVO - BARRANQUITAS MAZDA PUERTO RICO</span>
        <span className="hidden sm:inline text-[#888888]">• TRACCIÓN i-ACTIV AWD® DE SERIE</span>
      </div>

      {/* Navigation Header */}
      <nav className="sticky top-0 z-30 bg-[#000000]/95 backdrop-blur-md border-b border-[#333333]">
        <div className="max-w-[1200px] mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MazdaLogo />
            <div className="hidden sm:block ml-2 border-l border-[#333333] pl-3">
              <p className="text-[10px] text-[#00FFFF] font-bold tracking-widest uppercase">Showroom</p>
              <p className="text-xs text-[#888888] font-semibold">Interactivo en Vivo</p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6 text-xs uppercase font-bold text-[#888888]">
            <a href="#inventario" className="hover:text-[#00FFFF] transition-colors">Inventario</a>
            <a href="#comparativa" className="hover:text-[#00FFFF] transition-colors">Comparativa</a>
            <a href="#modulo-tecnico-cx50" className="hover:text-[#00FFFF] transition-colors">Híbrido 3 Motores</a>
            <a href="#tecnologia" className="hover:text-[#00FFFF] transition-colors">Tecnología AWD</a>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <a 
              href="https://maps.app.goo.gl/77uboxwhn7e2GMRbA" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[#FF3333] hover:text-white transition-colors flex items-center gap-1.5 group"
              title="Ubicación Barranquitas Mazda"
            >
              <MapPin className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline text-[10px] sm:text-xs font-bold tracking-widest uppercase text-[#AAAAAA] group-hover:text-white transition-colors font-mono">
                Barranquitas
              </span>
            </a>
            
            <button
              onClick={() => setIsCalendarOpen(true)}
              className="text-[#888888] text-xs font-black uppercase hover:text-[#00FFFF] transition-colors flex items-center gap-1.5 cursor-pointer ml-1"
            >
              <Calendar className="w-4 h-4 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Agendar Cita</span>
            </button>
            <button
              onClick={() => handleOpenPreQual()}
              className="bg-[#00FFFF] text-black text-[10px] sm:text-xs font-black uppercase px-2.5 py-1.5 sm:px-4 sm:py-2 hover:bg-[#55FFFF] transition-colors flex items-center gap-1 sm:gap-1.5 cursor-pointer underline whitespace-nowrap ml-1"
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Precalificar</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Inventory Grid Section */}
      <InventoryGrid 
        onSelectVehicle={(vehicle) => setSelectedVehicle(vehicle)}
        onAskAI={(vehicle) => handleAskAboutVehicle(vehicle)}
      />

      {/* Comparison Matrix Section */}
      <ComparisonMatrix onAskComparison={handleAskComparison} />

      {/* Technical Module: 3-Motor Hybrid System (Mazda CX-50) */}
      <CX50HybridTechModule 
        onAskAI={(prompt) => {
          setExternalTrigger({
            customPrompt: prompt,
            timestamp: Date.now()
          });
        }} 
      />

      {/* Technology i-ACTIV Section */}
      <section id="tecnologia" className="max-w-[1200px] mx-auto px-4 py-12">
        <div className="bg-[#000000] border border-[#333333] rounded p-6 sm:p-10 relative overflow-hidden car-card">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <span className="text-xs uppercase text-[#00FFFF] font-black">
                INGENIERÍA JAPONESA
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white uppercase">
                i-ACTIV AWD® DE SERIE
              </h2>
              <p className="text-sm text-[#CCCCCC] font-normal leading-relaxed">
                El sistema de tracción integral i-ACTIV AWD de Mazda monitorea las condiciones del camino 200 veces por segundo. Evalúa la temperatura exterior, el uso de los limpiaparabrisas y el ángulo del volante para transferir potencia antes de que ocurra un deslizamiento.
              </p>
              <ul className="space-y-2 text-xs text-[#FFFFFF]">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#00FFFF]" />
                  <span>Estándar en 100% de la gama SUV (CX-30, CX-5, CX-50, CX-70, CX-90)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#00FFFF]" />
                  <span>Sin costo adicional ni paquetes extras forzados</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#00FFFF]" />
                  <span>Máxima seguridad para el clima y carreteras de Puerto Rico</span>
                </li>
              </ul>
            </div>

            <div className="bg-[#000000] p-6 border border-[#333333] space-y-4">
              <h3 className="text-sm uppercase text-[#00FFFF] font-black">
                ¿DESEAS COTIZAR CON TU PRONTO O TRADE-IN?
              </h3>
              <p className="text-xs text-[#888888] font-bold">
                Calcula tu pago mensual estimado al instante con la ayuda de nuestra ejecutiva virtual Shakira.
              </p>
              <button
                onClick={() => handleOpenPreQual()}
                className="btn-ask-ai"
              >
                CALCULAR PAGO & PRECALIFICAR
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#333333] bg-[#000000] py-10 px-4 text-xs text-[#888888]">
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-[#000000] border border-[#00FFFF] flex items-center justify-center text-[#00FFFF] font-black text-xs">
              BM
            </div>
            <div>
              <span className="font-black text-white">SHOWROOM INTERACTIVO - BARRANQUITAS MAZDA</span>
              <p className="text-[10px] text-[#666666]">Barranquitas Mazda Puerto Rico</p>
            </div>
          </div>

          <div className="text-center md:text-right text-[11px] space-y-1">
            <p>© 2026 Barranquitas Mazda Puerto Rico. Todos los derechos reservados.</p>
            <p className="text-[#666666]">Los pagos mostrados son estimados. El pago final depende del crédito, pronto, plazo, intereses, cargos y aprobación de la institución financiera.</p>
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

      <CalendarBookingModal 
        isOpen={isCalendarOpen} 
        onClose={() => setIsCalendarOpen(false)} 
      />

      {/* Floating AI Sales Agent Chatbot */}
      <ChatWidget externalTrigger={externalTrigger} />

    </div>
  );
}
