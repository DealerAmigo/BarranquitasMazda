import React, { useState } from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import { INVENTORY, Vehicle } from '../data/inventory';

interface PreQualModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedVehicle?: Vehicle | null;
  onSuccess: (msg: string) => void;
}

export function PreQualModal({ isOpen, onClose, selectedVehicle, onSuccess }: PreQualModalProps) {
  const defaultVehicle = INVENTORY.length > 0 ? INVENTORY[0] : null;
  const [vehicleId, setVehicleId] = useState<string>(selectedVehicle?.id || defaultVehicle?.id || '');
  const [downPayment, setDownPayment] = useState<number>(3000);
  const [termMonths, setTermMonths] = useState<number>(72);
  const [hasTradeIn, setHasTradeIn] = useState<boolean>(false);
  const [tradeInValue, setTradeInValue] = useState<number>(5000);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const currentVehicle = INVENTORY.find(v => v.id === vehicleId) || selectedVehicle || defaultVehicle;
  const basePrice = currentVehicle?.price || 35000;
  const netAmount = Math.max(0, basePrice - downPayment - (hasTradeIn ? tradeInValue : 0));
  // Standard APR ~6.5%
  const monthlyInterest = 0.065 / 12;
  const estimatedMonthly = Math.round(
    (netAmount * (monthlyInterest * Math.pow(1 + monthlyInterest, termMonths))) / 
    (Math.pow(1 + monthlyInterest, termMonths) - 1)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          email,
          vehicle: currentVehicle ? `${currentVehicle.year} ${currentVehicle.make || 'Mazda'} ${currentVehicle.model} ${currentVehicle.trim}` : 'No especificado',
          stock: currentVehicle?.stock || '',
          vin: currentVehicle?.vin || '',
          price: currentVehicle?.price || 0,
          downPayment,
          monthlyEstimate: estimatedMonthly,
          termMonths,
          tradeIn: hasTradeIn ? `Sí ($${tradeInValue.toLocaleString()})` : 'No',
          source: 'Modal de Precalificación & Calculadora',
          notes: `Pronto: $${downPayment.toLocaleString()} | Plazo: ${termMonths}m | Trade-In: ${hasTradeIn ? `$${tradeInValue.toLocaleString()}` : 'No'}`
        })
      });
    } catch (err) {
      console.warn("Could not sync lead with backend Sheets:", err);
    }

    setIsSubmitting(false);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
      const vehicleDesc = currentVehicle 
        ? ` para el ${currentVehicle.make || 'Mazda'} ${currentVehicle.model} ${currentVehicle.trim} (Stock #${currentVehicle.stock})` 
        : ' para un vehículo';
      onSuccess(`¡Excelente ${name}! Hemos registrado tu solicitud${vehicleDesc} con pago estimado de ~$${estimatedMonthly}/mes. Un asesor te contactará al ${phone}.`);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#000000] border border-[#333333] w-full max-w-2xl rounded overflow-hidden shadow-2xl relative max-h-[90vh] flex flex-col car-card">

        {/* Header */}
        <div className="p-5 border-b border-[#333333] flex justify-between items-center bg-[#000000]">
          <div>
            <span className="text-[#00FFFF] text-xs sm:text-sm font-black uppercase">
              SIN IMPACTO A TU CRÉDITO
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
              PRECALIFICACIÓN & CALCULADORA DE PAGO
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="text-[#AAAAAA] hover:text-[#00FFFF] p-1.5 rounded transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 text-sm text-[#FFFFFF]">
          {submitted ? (
            <div className="text-center py-12 space-y-3">
              <CheckCircle2 className="w-14 h-14 text-[#00FFFF] mx-auto animate-bounce" />
              <h3 className="text-xl font-black text-white">¡PRECALIFICACIÓN REGISTRADA!</h3>
              <p className="text-sm text-[#AAAAAA]">
                Enviando los datos a nuestra Asesora Virtual Shakira para tu cotización...
              </p>
            </div>
          ) : (
            <>
              {/* Vehicle Select */}
              <div>
                <label className="block text-xs sm:text-sm uppercase text-[#AAAAAA] font-bold mb-2">
                  Selecciona la Unidad
                </label>
                <select
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                  className="w-full bg-[#000000] border border-[#333333] rounded p-3 text-sm text-white focus:outline-none focus:border-[#00FFFF] font-bold"
                >
                  {INVENTORY.length === 0 ? (
                    <option value="">Cualquier modelo disponible</option>
                  ) : (
                    INVENTORY.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.make} {v.model} ({v.year}) - {v.trim} | ${v.price.toLocaleString()} (Stock #{v.stock})
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Calculator Sliders */}
              <div className="bg-[#000000] p-4 sm:p-5 rounded border border-[#333333] space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between mb-1.5 text-sm">
                      <span className="text-[#AAAAAA] font-bold">Pronto Inicial:</span>
                      <span className="font-black text-[#00FFFF]">${downPayment.toLocaleString()}</span>
                    </div>
                    <input 
                      type="range"
                      min={0}
                      max={(currentVehicle?.price || 40000) * 0.5}
                      step={500}
                      value={downPayment}
                      onChange={(e) => setDownPayment(Number(e.target.value))}
                      className="w-full accent-[#00FFFF]"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between mb-1.5 text-sm">
                      <span className="text-[#AAAAAA] font-bold">Plazo de Financiamiento:</span>
                      <span className="font-black text-[#00FFFF]">{termMonths} Meses</span>
                    </div>
                    <select
                      value={termMonths}
                      onChange={(e) => setTermMonths(Number(e.target.value))}
                      className="w-full bg-[#000000] border border-[#333333] text-white rounded p-2.5 text-sm font-bold focus:border-[#00FFFF]"
                    >
                      <option value={48}>48 Meses (4 Años)</option>
                      <option value={60}>60 Meses (5 Años)</option>
                      <option value={72}>72 Meses (6 Años)</option>
                      <option value={84}>84 Meses (7 Años)</option>
                    </select>
                  </div>
                </div>

                {/* Trade In Switch */}
                <div className="pt-3 border-t border-[#333333]">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={hasTradeIn}
                        onChange={(e) => setHasTradeIn(e.target.checked)}
                        className="rounded border-[#333333] accent-[#00FFFF] w-4 h-4"
                      />
                      <span className="text-white font-bold text-sm">¿Tienes un auto para Trade-In?</span>
                    </label>
                    {hasTradeIn && (
                      <span className="font-black text-[#00FFFF] text-base">${tradeInValue.toLocaleString()}</span>
                    )}
                  </div>
                  {hasTradeIn && (
                    <div className="mt-3">
                      <input 
                        type="range"
                        min={1000}
                        max={30000}
                        step={500}
                        value={tradeInValue}
                        onChange={(e) => setTradeInValue(Number(e.target.value))}
                        className="w-full accent-[#00FFFF]"
                      />
                    </div>
                  )}
                </div>

                {/* Resulting Monthly Estimated Banner */}
                <div className="bg-[#111111] p-4 rounded border border-[#333333] flex justify-between items-center">
                  <div>
                    <span className="text-xs sm:text-sm text-[#AAAAAA] uppercase block font-bold">Cuota Mensual Estimada</span>
                    <span className="text-2xl sm:text-3xl font-black text-[#00FFFF]">${estimatedMonthly}/mes*</span>
                  </div>
                  <span className="text-xs text-[#AAAAAA] text-right font-mono">Tasa est. ~6.5% APR</span>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-3.5">
                <span className="text-xs sm:text-sm uppercase text-[#AAAAAA] font-bold block">
                  Información de Contacto
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <input 
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Nombre y Apellidos"
                      className="w-full bg-[#000000] border border-[#333333] rounded p-3 text-sm text-white focus:outline-none focus:border-[#00FFFF] placeholder:text-[#666666]"
                    />
                  </div>
                  <div>
                    <input 
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Teléfono (Ej: 787-555-0199)"
                      className="w-full bg-[#000000] border border-[#333333] rounded p-3 text-sm text-white focus:outline-none focus:border-[#00FFFF] placeholder:text-[#666666]"
                    />
                  </div>
                </div>
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Correo electrónico (Opcional)"
                  className="w-full bg-[#000000] border border-[#333333] rounded p-3 text-sm text-white focus:outline-none focus:border-[#00FFFF] placeholder:text-[#666666]"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-ask-ai text-sm sm:text-base py-3.5"
              >
                {isSubmitting ? 'PROCESANDO...' : 'SOLICITAR PRECALIFICACIÓN'}
              </button>

              <p className="text-xs text-[#AAAAAA] text-center leading-relaxed">
                *Los pagos mostrados son estimados. El pago final depende del crédito, pronto, plazo, intereses, cargos y aprobación de la institución financiera.
              </p>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
