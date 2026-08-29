import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Zap, Gauge, Fuel, CheckCircle, ExternalLink, MessageSquare, ChevronLeft, ChevronRight, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Vehicle } from '../data/inventory';
import { handleImageError, getProxyImageUrl } from '../utils/imageHelper';

interface CarModalProps {
  vehicle: Vehicle | null;
  onClose: () => void;
  onAskAI: (vehicle: Vehicle) => void;
}

export function CarModal({ vehicle, onClose, onAskAI }: CarModalProps) {
  const [activePhotoIdx, setActivePhotoIdx] = useState<number>(0);
  const [dynamicPhotos, setDynamicPhotos] = useState<string[]>([]);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState<boolean>(false);

  useEffect(() => {
    if (!vehicle) return;
    setActivePhotoIdx(0);
    const initialList = vehicle.images && vehicle.images.length > 0 ? vehicle.images : [vehicle.image];
    setDynamicPhotos(initialList);

    // Fetch all available real photos from server live scraper
    setIsLoadingPhotos(true);
    fetch(`/api/vehicles/${vehicle.id}/photos`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.photos && data.photos.length > 0) {
          setDynamicPhotos(data.photos);
        }
      })
      .catch((err) => {
        console.warn("Could not fetch extra photos for vehicle:", err);
      })
      .finally(() => {
        setIsLoadingPhotos(false);
      });
  }, [vehicle?.id]);

  if (!vehicle) return null;

  const photoList = dynamicPhotos.length > 0 ? dynamicPhotos : (vehicle.images && vehicle.images.length > 0 ? vehicle.images : [vehicle.image]);
  const currentPhoto = photoList[activePhotoIdx] || vehicle.image;

  const handlePrevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActivePhotoIdx((prev) => (prev === 0 ? photoList.length - 1 : prev - 1));
  };

  const handleNextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActivePhotoIdx((prev) => (prev === photoList.length - 1 ? 0 : prev + 1));
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-[#000000] border-0 sm:border border-[#333333] w-full h-full sm:h-auto max-w-[480px] rounded-none sm:rounded overflow-hidden shadow-2xl relative max-h-[100dvh] sm:max-h-[92vh] flex flex-col car-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#333333] flex justify-between items-start bg-[#000000]">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="bg-[#00FFFF] text-black text-xs sm:text-sm font-black px-2.5 py-0.5 rounded">
                AÑO {vehicle.year}
              </span>
              <span className="text-[#00FFFF] text-xs sm:text-sm font-black uppercase">
                {vehicle.status}
              </span>
              <span className="text-xs sm:text-sm text-[#AAAAAA] font-mono font-bold">
                STOCK: #{vehicle.stock}
              </span>
              {photoList.length > 0 && (
                <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-[#00FFFF] border border-[#333333] px-2.5 py-0.5 rounded font-mono font-bold">
                  {isLoadingPhotos ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#00FFFF]" />
                      <span>Cargando galería...</span>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-3.5 h-3.5 text-[#00FFFF]" /> 
                      <span>{photoList.length} FOTOS REALES (HD)</span>
                    </>
                  )}
                </span>
              )}
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              {vehicle.year} {vehicle.make ? vehicle.make.toUpperCase() : ''} {vehicle.model.toUpperCase()}
            </h2>
            <p className="text-sm sm:text-base text-[#00FFFF] font-extrabold uppercase tracking-wide">
              PAQUETE EXACTO: {vehicle.trim.toUpperCase()}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-[#AAAAAA] hover:text-[#00FFFF] p-1.5 rounded hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-7 h-7" />
          </button>
        </div>

        {/* Content Scrollable */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5">
          {/* Gallery Section */}
          <div className="flex flex-col gap-3 sm:gap-4 items-start">
            {/* Main Interactive Carousel */}
            <div className="w-full space-y-3">
              <div className="relative rounded overflow-hidden border border-[#333333] bg-[#111111] aspect-video group">
                <img 
                  key={currentPhoto}
                  src={getProxyImageUrl(currentPhoto)} 
                  alt={`${vehicle.model} ${vehicle.trim} - Foto ${activePhotoIdx + 1}`} 
                  referrerPolicy="no-referrer"
                  onError={(e) => handleImageError(e, currentPhoto)}
                  className="w-full h-full object-cover transition-opacity duration-300"
                />

                {/* Left/Right Navigation arrows */}
                {photoList.length > 1 && (
                  <>
                    <button
                      onClick={handlePrevPhoto}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 bg-black/80 hover:bg-[#00FFFF] hover:text-black text-white p-2.5 rounded-full border border-[#333333] transition-all cursor-pointer"
                      title="Foto anterior"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                      onClick={handleNextPhoto}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-black/80 hover:bg-[#00FFFF] hover:text-black text-white p-2.5 rounded-full border border-[#333333] transition-all cursor-pointer"
                      title="Foto siguiente"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </>
                )}

                {/* Counter Badge */}
                <div className="absolute bottom-3 right-3 bg-black/85 border border-[#333333] text-white text-xs sm:text-sm px-3 py-1 rounded font-mono font-bold flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-[#00FFFF]" />
                  <span>Foto {activePhotoIdx + 1} de {photoList.length}</span>
                </div>
              </div>

              {/* Thumbnails Row */}
              {photoList.length > 1 && (
                <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none">
                  {photoList.map((thumbUrl, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActivePhotoIdx(idx)}
                      className={`relative shrink-0 w-20 h-14 rounded overflow-hidden border transition-all cursor-pointer ${
                        activePhotoIdx === idx 
                          ? 'border-[#00FFFF] scale-105' 
                          : 'border-[#333333] opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img 
                        src={getProxyImageUrl(thumbUrl)} 
                        alt={`Miniatura ${idx + 1}`}
                        referrerPolicy="no-referrer"
                        onError={(e) => handleImageError(e, thumbUrl)}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Price & Purchase Info */}
            <div className="w-full bg-[#000000] p-4 rounded border border-[#333333] space-y-3">
              <div className="border-b border-[#333333] pb-3">
                <span className="text-xs sm:text-sm text-[#AAAAAA] uppercase block font-bold">Precio Dealer</span>
                <div className="text-3xl sm:text-4xl font-black text-[#00FFFF]">
                  ${vehicle.price.toLocaleString()}
                </div>
                <div className="text-sm sm:text-base text-[#FFFFFF] mt-1.5 font-bold">
                  Cuota estimada desde <span className="text-[#00FFFF] font-black">${vehicle.estimatedMonthly}/mes*</span>
                </div>
              </div>

              {/* Specs List */}
              <div className="space-y-2.5 text-sm text-[#FFFFFF]">
                <div className="flex justify-between py-1.5 border-b border-[#222222]">
                  <span className="text-[#AAAAAA]">Año Modelo:</span>
                  <span className="font-bold text-[#00FFFF]">{vehicle.year}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#222222]">
                  <span className="text-[#AAAAAA]">Paquete / Versión:</span>
                  <span className="font-bold text-white">{vehicle.trim}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#222222]">
                  <span className="text-[#AAAAAA]">Color Exterior:</span>
                  <span className="font-bold">{vehicle.color}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#222222]">
                  <span className="text-[#AAAAAA]">Millaje:</span>
                  <span className="font-bold">{vehicle.mileage === 0 ? '0 Mi (Nueva de Fábrica)' : `${vehicle.mileage.toLocaleString()} Millas`}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#222222]">
                  <span className="text-[#AAAAAA]">Tracción:</span>
                  <span className="font-bold text-[#00FFFF]">{vehicle.specs.drivetrain}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#222222]">
                  <span className="text-[#AAAAAA]">VIN:</span>
                  <span className="font-mono text-xs text-[#AAAAAA]">{vehicle.vin}</span>
                </div>
              </div>

              {/* Main Button with Exact Underline & Cyan Styling */}
              <div className={`mt-auto grid gap-2.5 ${vehicle.url && vehicle.url !== 'N/A' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                <button
                  onClick={() => {
                    onClose();
                    onAskAI(vehicle);
                  }}
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
            </div>
          </div>

          {/* Technical Specs 4-col */}
          <div>
            <h3 className="text-base sm:text-lg font-black uppercase text-[#00FFFF] mb-3.5">
              Especificaciones Técnicas
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div className="bg-[#000000] p-3.5 rounded border border-[#333333]">
                <div className="flex items-center gap-2 text-[#00FFFF] mb-1.5">
                  <Zap className="w-4 h-4" />
                  <span className="font-bold">Motor</span>
                </div>
                <p className="text-[#FFFFFF] font-bold">{vehicle.specs.engine}</p>
              </div>

              <div className="bg-[#000000] p-3.5 rounded border border-[#333333]">
                <div className="flex items-center gap-2 text-[#00FFFF] mb-1.5">
                  <Gauge className="w-4 h-4" />
                  <span className="font-bold">Potencia</span>
                </div>
                <p className="text-[#FFFFFF] font-bold">{vehicle.specs.horsepower}</p>
              </div>

              <div className="bg-[#000000] p-3.5 rounded border border-[#333333]">
                <div className="flex items-center gap-2 text-[#00FFFF] mb-1.5">
                  <Fuel className="w-4 h-4" />
                  <span className="font-bold">Transmisión</span>
                </div>
                <p className="text-[#FFFFFF] font-bold">{vehicle.specs.transmission}</p>
              </div>

              <div className="bg-[#000000] p-3.5 rounded border border-[#333333]">
                <div className="flex items-center gap-2 text-[#00FFFF] mb-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="font-bold">Inspección</span>
                </div>
                <p className="text-[#FFFFFF] font-bold">115 Puntos Aprobada</p>
              </div>
            </div>
          </div>

          {/* Highlights & Features */}
          <div>
            <h3 className="text-base sm:text-lg font-black uppercase text-[#00FFFF] mb-3.5">
              Equipamiento Destacado
            </h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {vehicle.highlights.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2.5 text-sm text-[#FFFFFF] bg-[#000000] p-3 rounded border border-[#333333]">
                  <CheckCircle className="w-4 h-4 text-[#00FFFF] shrink-0" />
                  <span className="font-bold">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-[#333333] bg-[#000000] flex flex-col sm:flex-row gap-3.5 items-center justify-between">
          <div className="text-xs sm:text-sm text-[#AAAAAA] leading-relaxed">
            *Los pagos mostrados son estimados. El pago final depende del crédito, pronto, plazo y aprobación bancaria.
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            {vehicle.url && (
              <a 
                href={vehicle.url} 
                target="_blank" 
                rel="noreferrer"
                className="px-5 py-3 rounded border border-[#333333] text-sm text-[#FFFFFF] hover:text-[#00FFFF] hover:border-[#00FFFF] transition-colors flex items-center justify-center gap-2 font-bold"
              >
                Ficha 360° <ExternalLink className="w-4 h-4" />
              </a>
            )}
            <button
              onClick={() => {
                onClose();
                onAskAI(vehicle);
              }}
              className="bg-[#00FFFF] text-black font-black text-sm uppercase px-6 py-3 rounded hover:bg-[#55FFFF] transition-colors flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto underline"
            >
              PREGÚNTAME
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
