import React, { useState } from 'react';
import { Check, X, Award, Sparkles } from 'lucide-react';

export function ComparisonMatrix({ onAskComparison }: { onAskComparison: (model: string) => void }) {
  const [activeTab, setActiveTab] = useState<'CX-30' | 'CX-5' | 'CX-50' | 'CX-70' | 'CX-90'>('CX-30');

  const comparisons = {
    'CX-30': {
      title: 'MAZDA CX-30 VS COMPETENCIA COMPACTA',
      mazdaTitle: 'Mazda CX-30',
      rivalTitle: 'Honda HR-V / Toyota Corolla Cross',
      features: [
        { name: 'Tracción Integral (AWD)', mazda: 'i-ACTIV AWD® DE SERIE en todos los niveles', rival: 'Opcional / Cobro extra costoso', winner: true },
        { name: 'Potencia & Desempeño', mazda: '191 HP Estándar / Opción Turbo 250 HP', rival: '158 - 169 HP max', winner: true },
        { name: 'Diseño & Materiales', mazda: 'Diseño Kodo, acabados en piel y molduras premium', rival: 'Plásticos duros en versiones de entrada', winner: true },
        { name: 'Seguridad Activa', mazda: 'i-ACTIVSENSE® estándar con Radar MRCC', rival: 'Básico o requiere paquete superior', winner: true },
      ],
      argument: 'El CX-30 es el único en su categoría que te da AWD de serie en TODOS los niveles con 191 HP y la opción de subir a 250 HP turbo — la competencia te hace escoger entre eficiencia o potencia, o te cobra el AWD aparte.'
    },
    'CX-5': {
      title: 'MAZDA CX-5 (2026) VS SUV MEDIANAS',
      mazdaTitle: 'Mazda CX-5 2026',
      rivalTitle: 'Toyota RAV4 / Honda CR-V',
      features: [
        { name: 'Pantalla Central Táctil', mazda: 'Hasta 15.6" HD (La más grande en la historia de Mazda)', rival: 'Pantallas estándar de 8" a 10.5"', winner: true },
        { name: 'Control de Clima Inteligente', mazda: 'A/C 100% digital integrado en pantalla', rival: 'Consola tradicional', winner: true },
        { name: 'Tracción & Motor Calibrado', mazda: '187 HP Skyactiv-G e i-ACTIV AWD® estándar', rival: 'Tracción delantera base (FWD)', winner: true },
        { name: 'Refinamiento Interior', mazda: 'Sensación de vehículo de lujo europeo superior', rival: 'Enfoque utilitario', winner: true },
      ],
      argument: 'El CX-5 2026 es un vehículo completamente rediseñado con motor 2.5L de 187 HP e i-ACTIV AWD® de serie. Contra RAV4 o CR-V, Mazda destaca en calidad de marcha Zoom-Zoom, insonorización y una interfaz tecnológica de 15.6".'
    },
    'CX-50': {
      title: 'MAZDA CX-50 VS SUV DE AVENTURA',
      mazdaTitle: 'Mazda CX-50 Gasolina / Híbrida',
      rivalTitle: 'Subaru Outback / Ford Bronco Sport',
      features: [
        { name: 'Eficiencia Híbrida', mazda: '38 MPG Combinado con tracción e-AWD', rival: '~25-31 MPG en Outback / Bronco tradicional', winner: true },
        { name: 'Opciones de Potencia', mazda: '187 HP (Gasolina) / 219 HP (Híbrido) / 256 HP (Turbo)', rival: 'Bronco Sport 3-Cil base con menor torque y refinamiento', winner: true },
        { name: 'Modos Mi-Drive', mazda: 'Normal / Sport / Off-Road / Remolque', rival: 'Modos limitados según versión', winner: true },
        { name: 'Compuerta Trasera', mazda: 'Al ras del piso para deslizar carga pesada', rival: 'Escalón pronunciado', winner: true },
      ],
      argument: 'El CX-50 está diseñado para el cliente activo de Puerto Rico. Supera al Outback en versión híbrida con 38 MPG sin sacrificar capacidad ni potencia.'
    },
    'CX-70': {
      title: 'MAZDA CX-70 VS SUV 2 FILAS PREMIUM',
      mazdaTitle: 'Mazda CX-70 (5 Pasajeros)',
      rivalTitle: 'Honda Passport / Jeep Grand Cherokee',
      features: [
        { name: 'Motorización', mazda: '3.3L Turbo 6 en Línea (340 HP) + Mild Hybrid 48V', rival: 'V6 tradicional sin hibridación', winner: true },
        { name: 'Capacidad de Remolque', mazda: 'Hasta 5,000 lbs con Trailer Hitch View', rival: 'Capacidad inferior en gama media', winner: true },
        { name: 'Tecnología Nativa', mazda: 'Amazon Alexa Integrado + Pantallas Duales 12.3"', rival: 'Sistemas multimedia convencionales', winner: true },
        { name: 'Espacio de Carga', mazda: 'Baúl ultra amplio al eliminar la 3ra fila', rival: 'Espacios recortados', winner: true },
      ],
      argument: 'Si buscas la potencia y presencia de un SUV de alta gama sin necesitar 3 filas, el CX-70 es el rey con su motor 6 en línea de 340 HP y tracción trasera con AWD.'
    },
    'CX-90': {
      title: 'MAZDA CX-90 (3 FILAS) VS SUV FAMILIARES PREMIUM',
      mazdaTitle: 'Mazda CX-90 (7-8 Pasajeros)',
      rivalTitle: 'Toyota Grand Highlander / Honda Pilot / Telluride',
      features: [
        { name: 'Arquitectura & Plataforma', mazda: 'Plataforma Longitudinal Premium con sesgo RWD + i-ACTIV AWD®', rival: 'Plataformas FWD (tracción delantera estirada)', winner: true },
        { name: 'Motorización Turbo Inline 6', mazda: '3.3L e-SKYACTIV® G Turbo 6 en Línea (Hasta 340 HP / 369 lb-ft)', rival: 'Motores 4 Cilindros Turbo o V6 atmosféricos lentos', winner: true },
        { name: 'Control de Postura (KPC)', mazda: 'Kinematic Posture Control para cero balanceo en curvas', rival: 'Balanceo pronunciado de carrocería en curvas', winner: true },
        { name: 'Lujo Interior Artesanal', mazda: 'Piel Nappa, costuras Kakenui inspiradas en Japón y madera genuina', rival: 'Plásticos duros en 2da y 3ra fila', winner: true },
      ],
      argument: 'El CX-90 es el buque insignia de 3 filas de Mazda. Ofrece la ingeniería y dinámica de manejo de una SUV alemana de $90,000 (motor longitudinal de 6 cilindros en línea turbo y tracción AWD con preferencia trasera), con la confiabilidad japonesa y el espacio para toda la familia.'
    }
  };

  const currentComp = comparisons[activeTab];

  return (
    <section id="comparativa" className="max-w-[1200px] mx-auto px-4 py-8">
      <div className="bg-[#000000] border border-[#333333] rounded p-6 sm:p-8 relative overflow-hidden car-card">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <div className="text-sm text-[#00FFFF] uppercase font-black mb-1">
              VENTAJA COMPETITIVA MAZDA
            </div>
            <h2 className="text-2xl sm:text-3xl font-black uppercase text-white">
              ¿POR QUÉ MAZDA ES SUPERIOR?
            </h2>
          </div>

          {/* Model Selector Tabs */}
          <div className="flex gap-2 bg-[#000000] p-1.5 rounded border border-[#333333] overflow-x-auto w-full md:w-auto">
            {(Object.keys(comparisons) as Array<keyof typeof comparisons>).map((model) => (
              <button
                key={model}
                onClick={() => setActiveTab(model)}
                className={`px-4 py-2 rounded text-xs sm:text-sm font-black uppercase transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === model 
                    ? 'bg-[#00FFFF] text-black' 
                    : 'text-[#AAAAAA] hover:text-[#FFFFFF]'
                }`}
              >
                {model}
              </button>
            ))}
          </div>
        </div>

        {/* Comparison Table */}
        <div className="relative border border-[#333333] rounded mb-6 overflow-hidden">
          <div className="sm:hidden bg-[#111111] px-3.5 py-2 text-xs text-[#00FFFF] font-mono border-b border-[#333333] flex items-center justify-between font-bold">
            <span>⇄ DESLIZA PARA COMPARAR</span>
            <span className="text-[#AAAAAA]">100% AWD DE SERIE</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm min-w-[620px]">
              <thead>
                <tr className="bg-[#111111] border-b border-[#333333]">
                  <th className="p-4 text-[#AAAAAA] font-black w-[28%] text-xs sm:text-sm">CARACTERÍSTICA</th>
                  <th className="p-4 text-[#00FFFF] font-black w-[36%] bg-[#00FFFF]/5 border-l border-r border-[#333333] text-xs sm:text-sm">
                    {currentComp.mazdaTitle.toUpperCase()}
                  </th>
                  <th className="p-4 text-[#AAAAAA] font-black w-[36%] text-xs sm:text-sm">{currentComp.rivalTitle.toUpperCase()}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222222]">
                {currentComp.features.map((feat, idx) => (
                  <tr key={idx} className="hover:bg-[#111111] transition-colors">
                    <td className="p-4 font-black text-[#FFFFFF] whitespace-nowrap">{feat.name}</td>
                    <td className="p-4 bg-[#00FFFF]/5 border-l border-r border-[#333333] text-white">
                      <div className="flex items-start gap-2.5">
                        <Check className="w-5 h-5 text-[#00FFFF] shrink-0 mt-0.5" />
                        <span className="font-bold">{feat.mazda}</span>
                      </div>
                    </td>
                    <td className="p-4 text-[#AAAAAA]">
                      <div className="flex items-start gap-2.5">
                        <X className="w-5 h-5 text-[#888888] shrink-0 mt-0.5" />
                        <span className="font-medium">{feat.rival}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Footer */}
        <div className="bg-[#000000] p-5 sm:p-6 rounded border border-[#333333] flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="text-sm sm:text-base text-[#DDDDDD] font-normal leading-relaxed">
            <strong className="text-[#00FFFF] block uppercase mb-1.5 font-black text-sm sm:text-base">Conclusión de Nuestra Asesora Shakira:</strong>
            {currentComp.argument}
          </div>

          <button
            onClick={() => onAskComparison(activeTab)}
            className="btn-ask-ai sm:w-auto px-6 sm:px-8 py-3.5 text-sm sm:text-base whitespace-nowrap shrink-0"
          >
            PREGÚNTAME SOBRE {activeTab}
          </button>
        </div>

      </div>
    </section>
  );
}
