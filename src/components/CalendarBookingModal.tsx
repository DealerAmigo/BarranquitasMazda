import React, { useState, useEffect } from 'react';
import { Calendar, Clock, X, CarFront, User as UserIcon } from 'lucide-react';
import { initAuth, googleSignIn, logout, getAccessToken } from '../lib/firebase';
import { User } from 'firebase/auth';

interface CalendarBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEALER_CALENDAR_ID = "4b88a04ce85c4b7cfe9e0bd55f29cd3bcdc79ce0148d6846e03c54ac32faca0c@group.calendar.google.com";

export function CalendarBookingModal({ isOpen, onClose }: CalendarBookingModalProps) {
  const [needsAuth, setNeedsAuth] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [booked, setBooked] = useState(false);

  useEffect(() => {
    const unsubscribe = initAuth(
      (user, t) => {
        setUser(user);
        setToken(t);
        setNeedsAuth(false);
      },
      () => setNeedsAuth(true)
    );
    return () => unsubscribe();
  }, []);

  if (!isOpen) return null;

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setToken(result.accessToken);
        setUser(result.user);
        setNeedsAuth(false);
      }
    } catch (err) {
      console.error('Login failed:', err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !time) return;
    
    // Check confirmation (required for writing to user's Google Calendar)
    const confirmed = window.confirm(`¿Autorizas crear un evento en tu Google Calendar para la cita el ${date} a las ${time}?`);
    if (!confirmed) return;

    setIsBooking(true);
    try {
      const t = await getAccessToken();
      if (!t) {
        setNeedsAuth(true);
        setIsBooking(false);
        return;
      }

      const startDateTime = new Date(`${date}T${time}:00`);
      const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // 1 hour

      const event = {
        summary: `Test Drive / Cita VIP - ${vehicle || 'Mazda'}`,
        description: `Cita VIP en Barranquitas Mazda Puerto Rico.\nVehículo de interés: ${vehicle || 'No especificado'}\nAsesor Virtual: Shakira`,
        start: {
          dateTime: startDateTime.toISOString(),
          timeZone: 'America/Puerto_Rico',
        },
        end: {
          dateTime: endDateTime.toISOString(),
          timeZone: 'America/Puerto_Rico',
        },
        attendees: [
          { email: DEALER_CALENDAR_ID }
        ]
      };

      const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?sendUpdates=all', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${t}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event)
      });

      if (!res.ok) {
        throw new Error('Failed to create calendar event');
      }

      setBooked(true);
    } catch (error) {
      console.error(error);
      alert('Hubo un error al agendar la cita. Por favor, intenta nuevamente.');
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#000000] border border-[#333333] w-full max-w-md rounded overflow-hidden shadow-2xl relative flex flex-col car-card">
        <div className="p-5 border-b border-[#333333] flex items-center justify-between bg-[#000000]">
          <div>
            <span className="text-[#00FFFF] text-xs font-black uppercase">
              SINCRONIZACIÓN OFICIAL
            </span>
            <h2 className="text-lg sm:text-xl font-black text-white mt-1 uppercase flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#00FFFF]" />
              Agendar Cita VIP
            </h2>
          </div>
          <button 
            onClick={onClose} 
            className="text-[#888888] hover:text-[#00FFFF] p-1.5 rounded transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {booked ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#00FFFF]/10 text-[#00FFFF] flex items-center justify-center mx-auto border border-[#00FFFF]/20">
                <Calendar className="w-8 h-8" />
              </div>
              <h3 className="text-white font-black text-xl">¡CITA CONFIRMADA!</h3>
              <p className="text-[#888888] text-xs font-bold leading-relaxed">
                Hemos añadido el evento a tu Google Calendar y notificado a nuestro equipo. Te esperamos en Barranquitas Mazda.
              </p>
              <button 
                onClick={onClose}
                className="mt-4 w-full bg-[#333333] text-white font-black py-3.5 uppercase text-xs hover:bg-[#444444] transition-colors rounded-sm"
              >
                CERRAR
              </button>
            </div>
          ) : needsAuth ? (
            <div className="text-center py-6 space-y-6">
              <p className="text-[#CCCCCC] text-xs font-bold leading-relaxed">
                Para agendar tu cita y añadirla automáticamente a tu calendario, inicia sesión de forma segura con Google.
              </p>
              
              <button 
                onClick={handleLogin}
                disabled={isLoggingIn}
                className="mx-auto w-full max-w-[280px] bg-[#111111] border border-[#333333] text-white hover:bg-[#222222] hover:border-[#00FFFF] flex items-center justify-center gap-3 py-3 px-4 rounded-sm transition-all disabled:opacity-50"
              >
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  <path fill="none" d="M0 0h48v48H0z"></path>
                </svg>
                <span className="font-bold text-xs uppercase tracking-wide">
                  {isLoggingIn ? 'CONECTANDO...' : 'CONTINUAR CON GOOGLE'}
                </span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleBook} className="space-y-5">
              <div className="flex items-center justify-between p-3 bg-[#111111] border border-[#333333] rounded-sm">
                <div className="flex items-center gap-2 text-xs">
                  <UserIcon className="w-4 h-4 text-[#888888]" />
                  <span className="text-[#CCCCCC] font-bold truncate max-w-[200px]">{user?.email}</span>
                </div>
                <button 
                  type="button" 
                  onClick={logout}
                  className="text-xs font-bold text-[#00FFFF] hover:underline uppercase"
                >
                  SALIR
                </button>
              </div>

              <div>
                <label className="block text-[10px] uppercase text-[#888888] font-black tracking-widest mb-1.5">FECHA DE LA CITA</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#00FFFF]" />
                  <input 
                    type="date" 
                    required
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full bg-[#111111] border border-[#333333] rounded-sm pl-10 pr-4 py-3 text-white text-xs font-bold focus:outline-none focus:border-[#00FFFF] transition-colors [color-scheme:dark]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase text-[#888888] font-black tracking-widest mb-1.5">HORA DE LA CITA</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#00FFFF]" />
                  <input 
                    type="time" 
                    required
                    value={time}
                    onChange={e => setTime(e.target.value)}
                    className="w-full bg-[#111111] border border-[#333333] rounded-sm pl-10 pr-4 py-3 text-white text-xs font-bold focus:outline-none focus:border-[#00FFFF] transition-colors [color-scheme:dark]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase text-[#888888] font-black tracking-widest mb-1.5">VEHÍCULO DE INTERÉS (OPCIONAL)</label>
                <div className="relative">
                  <CarFront className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#00FFFF]" />
                  <input 
                    type="text" 
                    value={vehicle}
                    onChange={e => setVehicle(e.target.value)}
                    placeholder="Ej. CX-50, CX-90..."
                    className="w-full bg-[#111111] border border-[#333333] rounded-sm pl-10 pr-4 py-3 text-white text-xs font-bold placeholder-[#555555] focus:outline-none focus:border-[#00FFFF] transition-colors"
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={isBooking}
                className="w-full bg-[#00FFFF] text-black font-black py-3.5 uppercase text-xs tracking-wider hover:bg-[#55FFFF] transition-colors rounded-sm disabled:opacity-50 mt-6"
              >
                {isBooking ? 'AGENDANDO...' : 'CONFIRMAR EN GOOGLE CALENDAR'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
