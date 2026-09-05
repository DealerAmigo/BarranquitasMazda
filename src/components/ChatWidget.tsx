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
    
    // Look for name candidate across conversation (strictly and smartly validated)
    let detectedName = '';
    const nonNameWords = new Set([
      'su', 'si', 'sí', 'sip', 'sii', 'no', 'nop', 'ok', 'okay', 'vale', 'dale', 'hola', 'buenos', 'buenas',
      'tardes', 'noches', 'saludos', 'precio', 'mazda', 'ford', 'toyota', 'carro', 'guagua', 'claro', 'gracias',
      'cuanto', 'donde', 'pronto', 'trade', 'tradein', 'trade-in', 'pago', 'nuevo', 'usado', 'solicitud',
      'credito', 'crédito', 'banco', 'cooperativa', 'quiero', 'interesa', 'bien', 'mal', 'hoy', 'mañana'
    ]);

    for (let i = 0; i < messages.length; i++) {
      const m = messages[i];
      if (m.role === 'user') {
        const txt = m.text.trim();
        // Check for explicit "me llamo", "soy", "mi nombre es"
        const explicitM = txt.match(/(?:me llamo|mi nombre es|mi nombre:|soy)\s+([A-Za-zÁÉÍÓÚáéíóúñÑ]{2,20}(?:\s+[A-Za-zÁÉÍÓÚáéíóúñÑ]{2,20}){0,2})/i);
        if (explicitM && explicitM[1]) {
          const cand = explicitM[1].trim();
          if (!nonNameWords.has(cand.toLowerCase())) {
            detectedName = cand;
            break;
          }
        }
        // Check if previous bot message asked for name
        const prevBot = i > 0 ? messages[i - 1]?.text.toLowerCase() || '' : '';
        if (prevBot.includes('con quién') || prevBot.includes('tu nombre') || prevBot.includes('a tu nombre')) {
          // If the user text is a clean 1-3 words string (e.g. "Wilfredo Quiñones" or "Carlos")
          const nameCleanMatch = txt.match(/^([A-Za-zÁÉÍÓÚáéíóúñÑ]{2,20}(?:\s+[A-Za-zÁÉÍÓÚáéíóúñÑ]{2,20}){0,2})$/);
          if (nameCleanMatch && nameCleanMatch[1]) {
            const cand = nameCleanMatch[1].trim();
            if (!nonNameWords.has(cand.toLowerCase()) && !cand.toLowerCase().startsWith('no ')) {
              detectedName = cand;
              break;
            }
          }
        }
      }
    }

    // Also check current textToSend if not found in history
    if (!detectedName) {
      const lastBotMsg = messages.length > 0 ? (messages[messages.length - 1].text || '').toLowerCase() : '';
      const explicitCurrent = textToSend.match(/(?:me llamo|mi nombre es|mi nombre:|soy)\s+([A-Za-zÁÉÍÓÚáéíóúñÑ]{2,20}(?:\s+[A-Za-zÁÉÍÓÚáéíóúñÑ]{2,20}){0,2})/i);
      if (explicitCurrent && explicitCurrent[1]) {
        const cand = explicitCurrent[1].trim();
        if (!nonNameWords.has(cand.toLowerCase())) detectedName = cand;
      } else if (lastBotMsg.includes('con quién') || lastBotMsg.includes('tu nombre') || lastBotMsg.includes('a tu nombre')) {
        const nameCleanMatch = textToSend.trim().match(/^([A-Za-zÁÉÍÓÚáéíóúñÑ]{2,20}(?:\s+[A-Za-zÁÉÍÓÚáéíóúñÑ]{2,20}){0,2})$/);
        if (nameCleanMatch && nameCleanMatch[1]) {
          const cand = nameCleanMatch[1].trim();
          if (!nonNameWords.has(cand.toLowerCase()) && !cand.toLowerCase().startsWith('no ')) {
            detectedName = cand;
          }
        }
      }
    }

    // Vehicle reference
    let vehicleRef = '';
    const referencedMsg = messages.find(m => m.vehicleRef);
    if (referencedMsg && referencedMsg.vehicleRef) {
      vehicleRef = `${referencedMsg.vehicleRef.model} (${referencedMsg.vehicleRef.trim}) - Stock #${referencedMsg.vehicleRef.stock}`;
    } else {
      // Detect mentioned models in conversation
      if (/\bcx[-_ ]?50\b/i.test(fullHistoryText)) vehicleRef = 'Mazda CX-50 2026';
      else if (/\bcx[-_ ]?70\b/i.test(fullHistoryText)) vehicleRef = 'Mazda CX-70 2026 (6 en Línea)';
      else if (/\bcx[-_ ]?90\b/i.test(fullHistoryText)) vehicleRef = 'Mazda CX-90 2026 (3 Filas)';
      else if (/\bcx[-_ ]?30\b/i.test(fullHistoryText)) vehicleRef = 'Mazda CX-30 2026';
      else if (/\bcx[-_ ]?5\b/i.test(fullHistoryText)) vehicleRef = 'Mazda CX-5 2026 Rediseñada';
      else if (/tacoma/i.test(fullHistoryText)) vehicleRef = 'Toyota Tacoma';
      else if (/tundra/i.test(fullHistoryText)) vehicleRef = 'Toyota Tundra';
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
    const isZeroDown = /(?:cero pronto|sin pronto|sin inicial|0 pronto|nada de pronto|100% financiado)/i.test(fullHistoryText);

    // Trade-in extraction
    let tradeInInfo = '';
    const tradeMatch = fullHistoryText.match(/(?:trade|trade-in|entrego|entregar|tengo un|tengo una)\s+([^,|.]+)/i);
    if (tradeMatch && tradeMatch[1]) {
      tradeInInfo = tradeMatch[1].trim();
    }

    // Build clear, human-readable executive notes from the chat
    const keyUserQueries = allUserTexts.filter(t => t.length > 5 && !t.match(/^[0-9+()-\s]+$/));
    const mainQuestion = keyUserQueries.length > 0 ? keyUserQueries[keyUserQueries.length - 1] : 'Consulta de inventario y financiamiento';

    const noteItems: string[] = [];
    if (isZeroDown) noteItems.push('Cliente solicita evaluar financiamiento con 0 pronto');
    if (downPaymentVal) noteItems.push(`Pronto disponible: $${downPaymentVal.toLocaleString()}`);
    if (tradeInInfo) noteItems.push(`Tiene Trade-in: ${tradeInInfo}`);
    if (fullHistoryText.toLowerCase().includes('hibrid') || fullHistoryText.toLowerCase().includes('hybrid')) noteItems.push('Interesado específicamente en versión híbrida');
    if (fullHistoryText.toLowerCase().includes('cita') || fullHistoryText.toLowerCase().includes('prueba')) noteItems.push('Interesado en prueba de manejo / cita');
    noteItems.push(`Última consulta: "${mainQuestion}"`);

    const structuredNotes = noteItems.join(' | ');

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
            downPayment: isZeroDown ? 0 : downPaymentVal,
            tradeIn: tradeInInfo || undefined,
            notes: structuredNotes,
            conversationSummary: `Preguntas del cliente: ${keyUserQueries.slice(-3).map(q => `"${q}"`).join(' -> ')}`,
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

  return (
    <>
      {/* ALWAYS Render the Floating Bubble */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3 pointer-events-none">
        {/* Tooltip pointer (only show when closed) */}
        {!isOpen && (
          <div className="bg-[#000000] border border-[#333333] text-[#FFFFFF] px-4 py-2 rounded-lg text-xs font-bold shadow-2xl mr-2 relative animate-bounce pointer-events-auto">
            ¿En qué te puedo ayudar?
            <div className="absolute top-full right-4 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-[#333333]"></div>
          </div>
        )}
        
        {/* Circular Floating Widget */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative group w-16 h-16 flex items-center justify-center cursor-pointer outline-none pointer-events-auto"
        >
          {/* Outer Ripple / Loader Effect */}
          <div className="absolute inset-0 bg-[#00FFFF] rounded-full animate-ping opacity-20"></div>
          
          {/* Button Body */}
          <div className="relative w-full h-full bg-[#000000] border-2 border-[#00FFFF] rounded-full flex items-center justify-center overflow-hidden transition-transform group-hover:scale-105 shadow-[0_0_20px_rgba(0,255,255,0.3)]">
            <img 
              src="/shakira.png" 
              alt="Shakira" 
              className="w-full h-full object-cover" 
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                if (e.currentTarget.nextElementSibling) {
                  (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'block';
                }
              }} 
            />
            <span className="text-[#00FFFF] font-black text-2xl hidden">S</span>
          </div>
          
          {/* Notification Dot */}
          {!isOpen && (
            <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 border-2 border-black rounded-full animate-pulse"></span>
          )}
        </button>
      </div>

      {/* Conditionally Render the Chat Window ABOVE the bubble */}
      {isOpen && (
        <div className={`fixed bottom-24 right-4 sm:right-5 z-40 w-[94vw] sm:w-[420px] bg-[#000000] border border-[#333333] rounded overflow-hidden flex flex-col transition-all duration-200 car-card ${
          isMinimized ? 'h-[58px]' : 'h-[560px] max-h-[calc(100vh-120px)]'
        }`}>
          {/* Header */}
      <div className="bg-[#000000] px-4 py-3 border-b border-[#333333] flex items-center justify-between select-none">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#00FFFF] overflow-hidden flex-shrink-0 bg-[#111111] flex items-center justify-center">
            <img 
              src="/shakira.png" 
              alt="Shakira" 
              className="w-full h-full object-cover" 
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                if (e.currentTarget.nextElementSibling) {
                  (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'block';
                }
              }}
            />
            <span className="text-[#00FFFF] font-black text-sm hidden">S</span>
          </div>
          <div>
            <div className="font-black text-sm sm:text-base text-white flex items-center gap-2 uppercase">
              Shakira • Barranquitas Mazda
              <span className="text-[#00FFFF] text-xs font-mono font-bold">
                [EN LÍNEA]
              </span>
            </div>
            <div className="text-xs text-[#AAAAAA] font-bold">Asesora Virtual de Ventas</div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button 
            onClick={() => setIsMinimized(!isMinimized)}
            className="text-[#AAAAAA] hover:text-[#00FFFF] p-1.5 rounded hover:bg-white/5 transition-colors cursor-pointer"
            title={isMinimized ? "Expandir" : "Minimizar"}
          >
            <Minimize2 className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setIsOpen(false)}
            className="text-[#AAAAAA] hover:text-red-400 p-1.5 rounded hover:bg-white/5 transition-colors cursor-pointer"
            title="Cerrar"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Chat Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-[#000000] text-sm font-normal">
            {messages.map((msg) => (
              <div 
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`p-3.5 rounded max-w-[88%] leading-relaxed text-sm ${
                    msg.role === 'user'
                      ? 'bg-[#00FFFF] text-black font-bold'
                      : 'bg-[#111111] text-[#FFFFFF] border-l-2 border-[#00FFFF]'
                  }`}
                >
                  {/* Markdown renderer */}
                  {msg.text.split('\n').map((line, lIdx) => {
                    // Remove the URL from the text so it doesn't show up raw
                    const cleanLine = line
                      .replace(/https:\/\/www\.cognitoforms\.com\/BarranquitasMazda1\/SolicitudDeCr%C3%A9dito/g, '')
                      .replace(/https:\/\/www\.cognitoforms\.com\/BarranquitasMazda1\/SolicitudDeCrédito/g, '')
                      .trim();
                      
                    if (!cleanLine) return null;
                    
                    return (
                      <p key={lIdx} className={lIdx > 0 ? 'mt-2' : ''}>
                        {cleanLine.split(/\*\*(.*?)\*\*/g).map((part, pIdx) => 
                          pIdx % 2 === 1 ? <strong key={pIdx} className={msg.role === 'user' ? 'font-black' : 'text-[#00FFFF] font-bold'}>{part}</strong> : part
                        )}
                      </p>
                    );
                  })}
                  
                  {/* Action Buttons rendered once at the bottom of the bubble */}
                  {msg.text.includes('cognitoforms.com/BarranquitasMazda1/SolicitudDeCr') && (
                    <div className="mt-3 pt-3 border-t border-[#333333] flex flex-col gap-2.5">
                      <a
                        href="https://www.cognitoforms.com/BarranquitasMazda1/SolicitudDeCr%C3%A9dito"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full bg-[#00FFFF] hover:bg-[#55FFFF] text-black font-black text-xs sm:text-[13px] uppercase px-3 py-3 rounded text-center transition-all flex items-center justify-center gap-1.5 shadow"
                      >
                        <span>🚀 Llenar Solicitud de Crédito</span>
                      </a>
                      <div className="text-[10px] sm:text-[11px] text-[#AAAAAA] text-center font-bold leading-tight">
                        🔒 100% Segura • Sin impacto a tu crédito
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-[#111111] text-[#00FFFF] border-l-2 border-[#00FFFF] p-3 rounded flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 bg-[#00FFFF] rounded-full animate-bounce" />
                  <span className="w-2 h-2 bg-[#00FFFF] rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 bg-[#00FFFF] rounded-full animate-bounce [animation-delay:0.4s]" />
                  <span className="ml-1.5 text-[#AAAAAA] text-xs font-bold">Shakira está verificando inventario...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <div className="px-3 py-2 bg-[#000000] border-t border-[#333333] flex gap-2 overflow-x-auto no-scrollbar">
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(prompt)}
                disabled={isLoading}
                className="whitespace-nowrap bg-[#000000] hover:bg-[#111111] text-[#CCCCCC] hover:text-[#00FFFF] border border-[#333333] hover:border-[#00FFFF] px-3 py-1.5 rounded text-xs transition-all cursor-pointer font-bold"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Area */}
          <div className="p-3 bg-[#000000] border-t border-[#333333]">
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="flex gap-2.5"
            >
              <input 
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Escribe tu consulta o pide una cita..."
                disabled={isLoading}
                className="flex-1 bg-[#000000] border border-[#333333] text-white text-sm px-3.5 py-2.5 rounded focus:outline-none focus:border-[#00FFFF] transition-colors placeholder:text-[#666666]"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="bg-[#00FFFF] text-black px-4 py-2.5 rounded hover:bg-[#55FFFF] disabled:opacity-40 transition-colors cursor-pointer flex items-center justify-center font-bold"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </>
      )}
        </div>
      )}
    </>
  );
}
