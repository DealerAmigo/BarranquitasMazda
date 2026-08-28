import React, { useState, useRef, useEffect } from 'react';
import { Send, ChevronDown, MessageSquare, Minimize2 } from 'lucide-react';
import { Vehicle } from '../data/inventory';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp?: string;
  vehicleRef?: {
    stock: string;
    model: string;
    trim: string;
    price: number;
  };
}

interface ChatWidgetProps {
  initialPrompt?: string;
  selectedVehicle?: Vehicle | null;
  onClearVehicle?: () => void;
  externalTrigger?: {
    vehicle?: Vehicle | null;
    customPrompt?: string;
    timestamp: number;
  } | null;
}

export function ChatWidget({ externalTrigger }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: '¡Hola! 👋 Mi nombre es **Shakira**, tu asesora virtual de ventas en Barranquitas Mazda Puerto Rico.\n\n¿Estás buscando un modelo específico, un pago mensual cómodo para tu presupuesto o tienes un vehículo para trade-in?'
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 7-second delayed popup trigger for Shakira
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsOpen(prev => {
        // Only open if user hasn't closed it manually yet
        return prev ? prev : true;
      });
    }, 7000);

    return () => clearTimeout(timer);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
    }
  }, [messages, isOpen, isMinimized]);

  // Handle external triggers when "PREGÚNTAME" or comparison button is clicked
  useEffect(() => {
    if (externalTrigger) {
      setIsOpen(true);
      setIsMinimized(false);

      if (externalTrigger.vehicle) {
        const v = externalTrigger.vehicle;
        const userText = `Hola Shakira, me interesa conocer más detalles y opciones de pago para el ${v.make || 'Mazda'} ${v.model} ${v.year} (${v.trim}) por $${v.price.toLocaleString()} (Stock #${v.stock}).`;
        
        const userMessage: ChatMessage = {
          id: `user-${Date.now()}`,
          role: 'user',
          text: userText,
          vehicleRef: {
            stock: v.stock,
            model: v.model,
            trim: v.trim,
            price: v.price
          }
        };

        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);

        fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: [...messages, userMessage] })
        })
          .then(res => Promise.all([res.json(), new Promise(r => setTimeout(r, 1200))]))
          .then(([data]) => {
            setMessages(prev => [
              ...prev,
              {
                id: `bot-${Date.now()}`,
                role: 'model',
                text: data.text || `¡Saludos! Qué gusto saludarte. ¡Excelente máquina! El **${v.make || 'Mazda'} ${v.model} ${v.year} (${v.trim})** (Stock #${v.stock}) está disponible en inventario por **$${v.price.toLocaleString()}** (~$${v.estimatedMonthly}/mes*).\n\nCuenta con tracción **i-ACTIV AWD® de serie** y garantía de fábrica.\n\n*Nota: Los pagos mostrados son estimados. El pago final depende del crédito, pronto, plazo, intereses, cargos y aprobación de la institución financiera.*\n\n¿Te gustaría evaluar el pago con algún pronto inicial o tienes algún auto que desees entregar en trade-in?`
              }
            ]);
          })
          .catch(err => {
            console.warn(err);
            setMessages(prev => [
              ...prev,
              {
                id: `bot-${Date.now()}`,
                role: 'model',
                text: `¡Saludos! Qué gusto saludarte. El **${v.make || 'Mazda'} ${v.model} ${v.year} (${v.trim})** (Stock #${v.stock}) está disponible con pago estimado desde **$${v.estimatedMonthly}/mes***.\n\n*Nota: Los pagos mostrados son estimados. El pago final depende del crédito, pronto, plazo, intereses, cargos y aprobación de la institución financiera.*\n\n¿Te gustaría evaluar tu pago mensual con algún pronto o entregar un trade-in?`
              }
            ]);
          })
          .finally(() => {
            setIsLoading(false);
          });
      } else if (externalTrigger.customPrompt) {
        const userText = externalTrigger.customPrompt;
        const userMessage: ChatMessage = {
          id: `user-${Date.now()}`,
          role: 'user',
          text: userText
        };

        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);

        fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: [...messages, userMessage] })
        })
          .then(res => Promise.all([res.json(), new Promise(r => setTimeout(r, 1500))]))
          .then(([data]) => {
            setMessages(prev => [
              ...prev,
              {
                id: `bot-${Date.now()}`,
                role: 'model',
                text: data.text || '¡Con gusto te brindo toda la información! En Barranquitas Mazda contamos con las mejores ofertas y asesoría personalizada para toda la línea Mazda con i-ACTIV AWD® de serie.'
              }
            ]);
          })
          .catch(err => {
            console.warn(err);
            setMessages(prev => [
              ...prev,
              {
                id: `bot-${Date.now()}`,
                role: 'model',
                text: '¡Con gusto te oriento! Toda la línea SUV Mazda cuenta con i-ACTIV AWD® de serie. ¿Me autorizas a tomar tus datos para que un asesor te envíe una cotización personalizada?'
              }
            ]);
          })
          .finally(() => {
            setIsLoading(false);
          });
      }
    }
  }, [externalTrigger]);

  const handleSend = async (customText?: string) => {
    const textToSend = customText || input;
    if (!textToSend.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: textToSend
    };

    setMessages(prev => [...prev, userMessage]);
    if (!customText) setInput('');
    setIsLoading(true);

    // Extract phone numbers or emails if user shared them in chat to automatically record as lead
    const allUserTexts = [...messages.filter(m => m.role === 'user').map(m => m.text), textToSend];
    const fullHistoryText = allUserTexts.join(' | ');

    const phoneMatch = textToSend.match(/(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/) ||
      fullHistoryText.match(/(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/);
    const emailMatch = textToSend.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/) ||
      fullHistoryText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    
    // Look for name candidate across conversation (strictly validated)
    let detectedName = '';
    const nonNameWords = ['su', 'si', 'sí', 'sip', 'no', 'ok', 'vale', 'dale', 'hola', 'buenos', 'tardes', 'noches', 'saludos', 'precio', 'mazda', 'ford', 'toyota', 'carro', 'guagua', 'claro', 'gracias', 'cuanto', 'donde', 'pronto', 'trade', 'pago', 'nuevo', 'usado'];
    for (const msg of allUserTexts) {
      const nameMatch = msg.match(/(?:me llamo|mi nombre es|soy)\s+([A-Za-zÁÉÍÓÚáéíóúñÑ]{2,20}(?:\s+[A-Za-zÁÉÍÓÚáéíóúñÑ]{2,20}){0,2})/i);
      if (nameMatch && nameMatch[1]) {
        const cand = nameMatch[1].trim();
        if (!nonNameWords.includes(cand.toLowerCase())) {
          detectedName = cand;
          break;
        }
      }
    }

    // Vehicle reference
    let vehicleRef = '';
    const referencedMsg = messages.find(m => m.vehicleRef);
    if (referencedMsg && referencedMsg.vehicleRef) {
      vehicleRef = `${referencedMsg.vehicleRef.model} (${referencedMsg.vehicleRef.trim}) - Stock #${referencedMsg.vehicleRef.stock}`;
    }

    // Pronto / Down payment extraction
    let downPaymentVal: number | undefined;
    const prontoMatch = fullHistoryText.match(/(?:pronto|down|inicial)?\s*(?:\$|usd)?\s*([0-9]{1,2},?[0-9]{3})/i);
    if (prontoMatch && prontoMatch[1]) {
      const parsedPronto = parseInt(prontoMatch[1].replace(/,/g, ''), 10);
      if (!isNaN(parsedPronto) && parsedPronto >= 500 && parsedPronto <= 50000) {
        downPaymentVal = parsedPronto;
      }
    }

    // Trade-in extraction
    let tradeInInfo = '';
    const tradeMatch = fullHistoryText.match(/(?:trade|trade-in|entrego|entregar|tengo un|tengo una)\s+([^,|.]+)/i);
    if (tradeMatch && tradeMatch[1]) {
      tradeInInfo = tradeMatch[1].trim();
    }

    if (phoneMatch || emailMatch) {
      try {
        fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: detectedName || 'Prospecto Web',
            phone: phoneMatch ? phoneMatch[0] : '',
            email: emailMatch ? emailMatch[0] : '',
            vehicle: vehicleRef || 'Consulta General Barranquitas Mazda',
            downPayment: downPaymentVal,
            tradeIn: tradeInInfo || undefined,
            notes: `Conversación con Shakira: "${textToSend}"`,
            source: 'Chat Asesora Shakira'
          })
        }).catch(() => {});
      } catch (e) {}
    }

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMessage] })
      });

      // Artificial typing delay for more natural UX
      await new Promise(resolve => setTimeout(resolve, 1000));

      const data = await response.json();
      setMessages(prev => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          role: 'model',
          text: data.text || '¡Con gusto te oriento! En Barranquitas Mazda estamos a tu orden. ¿Con quién tengo el gusto de hablar?'
        }
      ]);
    } catch (error) {
      console.warn('Error in chat:', error);
      setMessages(prev => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          role: 'model',
          text: '¡Con muchísimo gusto te oriento! Para brindarte la mejor atención y verificar las opciones en sistema, ¿con quién tengo el gusto de hablar y a qué número de teléfono o WhatsApp te podemos contactar?'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    '¿Qué modelos tienen disponibles hoy?',
    '¿Por qué el CX-30 es mejor que el Corolla Cross o HR-V?',
    '¿Tienen la CX-50 Híbrida?',
    'Quiero cotizar con Trade-in'
  ];

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-5 right-5 z-40 bg-[#00FFFF] text-black px-4 py-3 border border-black shadow-none hover:bg-[#55FFFF] transition-all flex items-center gap-2 font-black text-xs uppercase cursor-pointer underline"
      >
        <MessageSquare className="w-4 h-4" />
        <span>HABLAR CON SHAKIRA</span>
      </button>
    );
  }

  return (
    <div className={`fixed bottom-4 right-4 sm:bottom-5 sm:right-5 z-40 w-[94vw] sm:w-[380px] bg-[#000000] border border-[#333333] rounded overflow-hidden flex flex-col transition-all duration-200 car-card ${
      isMinimized ? 'h-[52px]' : 'h-[520px] max-h-[85vh]'
    }`}>
      {/* Header */}
      <div className="bg-[#000000] px-4 py-2.5 border-b border-[#333333] flex items-center justify-between select-none">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-[#000000] border border-[#00FFFF] flex items-center justify-center text-[#00FFFF] font-black text-xs">
            S
          </div>
          <div>
            <div className="font-black text-xs sm:text-sm text-white flex items-center gap-1.5 uppercase">
              Shakira • Barranquitas Mazda
              <span className="text-[#00FFFF] text-[9px] font-mono">
                [EN LÍNEA]
              </span>
            </div>
            <div className="text-[10px] text-[#888888]">Asesora Virtual de Ventas</div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button 
            onClick={() => setIsMinimized(!isMinimized)}
            className="text-[#888888] hover:text-[#00FFFF] p-1 rounded hover:bg-white/5 transition-colors cursor-pointer"
            title={isMinimized ? "Expandir" : "Minimizar"}
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={() => setIsOpen(false)}
            className="text-[#888888] hover:text-red-400 p-1 rounded hover:bg-white/5 transition-colors cursor-pointer"
            title="Cerrar"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Chat Body */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-[#000000] text-xs font-normal">
            {messages.map((msg) => (
              <div 
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`p-3 rounded max-w-[88%] leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[#00FFFF] text-black font-bold'
                      : 'bg-[#111111] text-[#FFFFFF] border-l-2 border-[#00FFFF]'
                  }`}
                >
                  {/* Markdown simple renderer */}
                  {msg.text.split('\n').map((line, lIdx) => (
                    <p key={lIdx} className={lIdx > 0 ? 'mt-1.5' : ''}>
                      {line.split(/\*\*(.*?)\*\*/g).map((part, pIdx) => 
                        pIdx % 2 === 1 ? <strong key={pIdx} className={msg.role === 'user' ? 'font-black' : 'text-[#00FFFF] font-bold'}>{part}</strong> : part
                      )}
                    </p>
                  ))}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-[#111111] text-[#00FFFF] border-l-2 border-[#00FFFF] p-2.5 rounded flex items-center gap-1.5 text-xs">
                  <span className="w-1.5 h-1.5 bg-[#00FFFF] rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-[#00FFFF] rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 bg-[#00FFFF] rounded-full animate-bounce [animation-delay:0.4s]" />
                  <span className="ml-1 text-[#888888] text-[10px]">Shakira está verificando inventario...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <div className="px-3 py-1.5 bg-[#000000] border-t border-[#333333] flex gap-1.5 overflow-x-auto no-scrollbar">
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(prompt)}
                disabled={isLoading}
                className="whitespace-nowrap bg-[#000000] hover:bg-[#111111] text-[#888888] hover:text-[#00FFFF] border border-[#333333] hover:border-[#00FFFF] px-2 py-1 rounded text-[10px] transition-all cursor-pointer font-bold"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Area */}
          <div className="p-2.5 bg-[#000000] border-t border-[#333333]">
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="flex gap-2"
            >
              <input 
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Escribe tu consulta o pide una cita..."
                disabled={isLoading}
                className="flex-1 bg-[#000000] border border-[#333333] text-white text-xs px-3 py-2 rounded focus:outline-none focus:border-[#00FFFF] transition-colors placeholder:text-[#666666]"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="bg-[#00FFFF] text-black px-3 py-2 rounded hover:bg-[#55FFFF] disabled:opacity-40 transition-colors cursor-pointer flex items-center justify-center font-bold"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
