import React, { useState } from 'react';
import { Cpu, Zap, Cog, ArrowRight, CheckCircle2, HelpCircle, Shield, Sparkles, MessageSquare } from 'lucide-react';

interface Props {
  onAskAI?: (prompt: string) => void;
}

export default function CX50HybridTechModule({ onAskAI }: Props) {
  const [activeMotor, setActiveMotor] = useState<'MG1' | 'MG2' | 'MGR'>('MG2');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const motors = {
    MG1: {
      name: 'MG1 (Motor-Generador 1 - Delantero)',
      location: 'Eje Delantero / Acoplado al Motor 2.5L',
      tag: 'ARRANQUE & GENERACIÓN PRINCIPAL',
      desc: 'Funciona como el motor de arranque de alta tensión para encender el motor de gasolina con suavidad instantánea y actúa como el generador eléctrico principal que recarga continuamente el paquete de baterías híbridas.',
      features: [
        'Enciende y apaga el motor de gasolina sin vibraciones ni ruidos de motor de arranque tradicional',
        'Genera electricidad constante para alimentar al motor MG2 o recargar la batería de tracción',
        'Regula la velocidad del conjunto de engranajes planetarios de la transmisión e-CVT'
      ],
      color: '#00FFFF'
    },
    MG2: {
      name: 'MG2 (Motor-Generador 2 - Delantero)',
      location: 'Eje Delantero / Tracción Primaria',
      tag: 'PROPULSIÓN ELÉCTRICA & REGENERACIÓN',
      desc: 'Es el motor eléctrico de tracción principal en el eje delantero. Mueve el vehículo en modo 100% eléctrico a bajas velocidades y asiste al motor de gasolina en aceleraciones fuertes para lograr 219 HP combinados.',
      features: [
        'Impulsa el vehículo en modo EV silencioso en maniobras de estacionamiento y tráfico lento',
        'Entrega torque instantáneo al acelerar a fondo para adelantamientos ágiles',
        'Recupera energía cinética en frenadas regenerativas para recargar la batería'
      ],
      color: '#00FFFF'
    },
    MGR: {
      name: 'MGR (Motor-Generador Trasero)',
      location: 'Eje Trasero / e-AWD Independiente',
      tag: 'TRACCIÓN TOTAL INTELIGENTE e-AWD',
      desc: 'Está ubicado de forma totalmente independiente en el eje trasero sin necesidad de cardán mecánico pesado. Otorga tracción eléctrica instantánea a las ruedas traseras de manera 100% automática.',
      features: [
        'Se activa de milisegundos al detectar pérdida de agarre en lluvia o curvas cerradas de Puerto Rico',
        'Proporciona empuje adicional al arrancar en pendientes empinadas para evitar patinaje',
        'Regenera energía eléctrica adicional desde el eje trasero durante desaceleraciones'
      ],
      color: '#39FF14'
    }
  };

  const faqs = [
    {
      q: '¿La Mazda CX-50 Híbrida es CVT?',
      a: 'Sí. Utiliza una transmisión e-CVT (Transmisión Electrónica Continuamente Variable). A diferencia de una CVT tradicional de banda o polea, esta usa un sistema de engranajes planetarios que combina la fuerza del motor de gasolina y los motores eléctricos. Es sumamente suave, no da tirones y maximiza el ahorro de combustible hasta 38 MPG combinado.'
    },
    {
      q: '¿Por qué se dice que tiene 3 motores eléctricos?',
      a: 'El sistema de tracción integral inteligente (e-AWD) se compone de tres motores eléctricos individuales. Técnicamente se les llama Motores-Generadores (MG) porque no solo impulsan el vehículo, sino que también regeneran energía al frenar para recargar la batería híbrida sin necesidad de enchufar.'
    },
    {
      q: '¿Cómo se llaman y qué hace cada uno de los 3 motores eléctricos?',
      a: '• MG1 (Delantero): Motor de arranque y generador principal de electricidad para la batería.\n• MG2 (Delantero): Motor de tracción principal del eje delantero y propulsor en modo 100% eléctrico.\n• MGR (Trasero): Motor independiente en el eje trasero que activa la tracción e-AWD inteligente en curvas, pendientes y superficies resbaladizas.'
    }
  ];

  return (
    <section id="modulo-tecnico-cx50" className="max-w-[1200px] mx-auto px-4 py-10 scroll-mt-20">
      <div className="bg-[#0A0A0A] border border-[#333333] rounded-lg p-6 sm:p-10 relative overflow-hidden shadow-2xl">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#00FFFF]/5 rounded-full blur-3xl pointer-events-none" />

        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#222222] pb-6 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#00FFFF]/10 border border-[#00FFFF]/30 rounded text-[#00FFFF] text-xs font-mono font-bold uppercase mb-2">
              <Zap className="w-3.5 h-3.5" />
              MÓDULO TÉCNICO DE INGENIERÍA
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white font-mono uppercase tracking-tight">
              SISTEMA HÍBRIDO DE <span className="text-[#00FFFF]">3 MOTORES</span>
            </h2>
            <p className="text-sm sm:text-base text-[#AAAAAA] font-mono mt-1">
              Arquitectura e-AWD y transmisión e-CVT de engranajes planetarios en la Mazda CX-50 Hybrid 2026.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onAskAI?.('Explícame a detalle cómo funciona el sistema de 3 motores eléctricos y la transmisión e-CVT de la Mazda CX-50 Híbrida')}
              className="inline-flex items-center gap-2 bg-[#111111] hover:bg-[#00FFFF] text-white hover:text-black border border-[#333333] hover:border-[#00FFFF] px-4 py-2.5 rounded text-xs font-mono font-bold uppercase transition-all"
            >
              <MessageSquare className="w-4 h-4 text-[#00FFFF] group-hover:text-black" />
              <span>Preguntar a Shakira</span>
            </button>
          </div>
        </div>

        {/* Transmission & Planetary Gears Explainer Banner */}
        <div className="bg-[#111111] border border-[#222222] rounded-lg p-5 sm:p-6 mb-8 grid lg:grid-cols-3 gap-6 items-center">
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#00FFFF] uppercase">
              <Cog className="w-4 h-4 text-[#00FFFF] animate-spin-slow" />
              TRANSMISIÓN e-CVT CON ENGRANAJES PLANETARIOS
            </div>
            <h3 className="text-lg sm:text-xl font-black text-white font-mono">
              ¿Por qué NO es una CVT tradicional de banda?
            </h3>
            <p className="text-xs sm:text-sm text-[#CCCCCC] leading-relaxed">
              La <strong className="text-white">e-CVT</strong> de la Mazda CX-50 Híbrida reemplaza las bandas y poleas de fricción tradicionales por un sofisticado divisor de potencia planetario. Distribuye la fuerza del motor de gasolina 2.5L y los motores eléctricos con acople directo de engranajes, eliminando retrasos, eliminando tirones y logrando <span className="text-[#00FFFF] font-bold">38 MPG combinados</span> con máxima durabilidad.
            </p>
          </div>

          <div className="bg-[#050505] border border-[#333333] p-4 rounded space-y-2 text-xs font-mono">
            <div className="text-[#888888] font-bold uppercase text-[10px]">BENEFICIOS CLAVE e-CVT</div>
            <div className="flex items-center gap-2 text-white">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#00FFFF] shrink-0" />
              <span>Cero bandas ni poleas de desgaste</span>
            </div>
            <div className="flex items-center gap-2 text-white">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#00FFFF] shrink-0" />
              <span>Respuesta de torque inmediata</span>
            </div>
            <div className="flex items-center gap-2 text-white">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#00FFFF] shrink-0" />
              <span>219 HP de potencia combinada</span>
            </div>
          </div>
        </div>

        {/* 3 Motors Interactive Diagnostic Breakdown */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm sm:text-base font-black text-white font-mono uppercase tracking-wider flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#00FFFF]" />
              LOS 3 MOTORES-GENERADORES (MG) ELÉCTRICOS
            </h3>
            <span className="text-[11px] font-mono text-[#888888]">Toca cada motor para inspeccionar su función</span>
          </div>

          {/* Motor Selector Tabs */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6">
            {(['MG1', 'MG2', 'MGR'] as const).map((mKey) => {
              const motor = motors[mKey];
              const isSelected = activeMotor === mKey;
              return (
                <button
                  key={mKey}
                  onClick={() => setActiveMotor(mKey)}
                  className={`p-3 sm:p-4 text-left border rounded transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-[#161616] border-[#00FFFF] shadow-[0_0_20px_rgba(0,255,255,0.15)] ring-1 ring-[#00FFFF]'
                      : 'bg-[#0E0E0E] border-[#222222] hover:border-[#444444] hover:bg-[#121212]'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className={`font-mono font-black text-sm sm:text-base ${isSelected ? 'text-[#00FFFF]' : 'text-white'}`}>
                      {mKey}
                    </span>
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      mKey === 'MGR' ? 'bg-[#39FF14]/10 text-[#39FF14]' : 'bg-[#00FFFF]/10 text-[#00FFFF]'
                    }`}>
                      {mKey === 'MGR' ? 'EJE TRASERO' : 'DELANTERO'}
                    </span>
                  </div>
                  <span className="text-[11px] sm:text-xs font-mono text-[#888888] truncate block">
                    {mKey === 'MG1' ? 'Generador & Arranque' : mKey === 'MG2' ? 'Tracción Delantera' : 'e-AWD Eléctrico'}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Selected Motor Detail Panel */}
          <div className="bg-[#111111] border border-[#333333] rounded-lg p-6 relative">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-[#222222] pb-4 mb-4">
              <div>
                <span className="text-[10px] font-mono font-black text-[#00FFFF] tracking-widest uppercase">
                  {motors[activeMotor].tag}
                </span>
                <h4 className="text-lg sm:text-2xl font-black text-white font-mono">
                  {motors[activeMotor].name}
                </h4>
              </div>
              <div className="text-xs font-mono text-[#888888] bg-[#000000] px-3 py-1.5 border border-[#333333] rounded self-start md:self-auto">
                📍 {motors[activeMotor].location}
              </div>
            </div>

            <p className="text-sm sm:text-base text-[#DDDDDD] leading-relaxed mb-6 font-sans">
              {motors[activeMotor].desc}
            </p>

            <div className="space-y-2.5">
              <span className="text-xs font-mono font-bold text-[#888888] uppercase tracking-wider block">
                FUNCIONAMIENTO TÉCNICO EN RUTA:
              </span>
              <div className="grid sm:grid-cols-3 gap-3">
                {motors[activeMotor].features.map((feat, idx) => (
                  <div key={idx} className="bg-[#050505] border border-[#222222] p-3.5 rounded flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#00FFFF] shrink-0 mt-0.5" />
                    <span className="text-xs text-[#CCCCCC] leading-relaxed">{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Technical FAQ (P & R) Accordion */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <HelpCircle className="w-4 h-4 text-[#00FFFF]" />
            <h3 className="text-sm sm:text-base font-black text-white font-mono uppercase tracking-wider">
              PREGUNTAS TÉCNICAS FRECUENTES (P & R)
            </h3>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="bg-[#111111] border border-[#222222] hover:border-[#333333] rounded overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4"
                  >
                    <span className="text-xs sm:text-sm font-black text-white font-mono flex items-center gap-2.5">
                      <span className="text-[#00FFFF] font-bold">P:</span> {faq.q}
                    </span>
                    <span className="text-[#00FFFF] font-mono font-bold text-sm shrink-0">
                      {isOpen ? '−' : '+'}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-4 sm:px-5 pb-5 pt-1 text-xs sm:text-sm text-[#CCCCCC] border-t border-[#222222]/60 font-sans leading-relaxed whitespace-pre-line bg-[#0A0A0A]">
                      <span className="text-[#00FFFF] font-bold font-mono block mb-1">RESPUESTA TÉCNICA:</span>
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
}
