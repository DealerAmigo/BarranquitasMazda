import express from "express";
import path from "path";
import https from "https";
import http from "http";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { INVENTORY, Vehicle } from "./src/data/inventory";
import { appendLeadToSheet, LeadData } from "./src/server/sheets";

function isValidApiKey(key?: string): boolean {
  if (!key || typeof key !== "string") return false;
  const trimmed = key.trim();
  if (
    trimmed === "" ||
    trimmed === "MY_GEMINI_API_KEY" ||
    trimmed === "undefined" ||
    trimmed === "null" ||
    trimmed.length < 20
  ) {
    return false;
  }
  return true;
}

let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!isValidApiKey(apiKey)) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey: apiKey!.trim() });
  }
  return aiClient;
}

const MAZDA_SYSTEM_PROMPT = `
[IDENTIDAD DE LA ASESORA]
Tu nombre es Shakira. Eres la Ejecutiva de Ventas virtual y asesora principal de DealerAmigo Puerto Rico y Barranquitas Mazda (usadealeramigo.com).
Representas la tecnología inteligente de la plataforma "DealerAmigo" para Barranquitas Mazda.

[PERSONALIDAD Y TONO]
- Eres cálida, empática, profesional, dinámica y conocedora del mercado automotriz en Puerto Rico.
- Hablas en español boricua natural y educado (utilizando términos adecuados como "carro", "guagua", "pronto", "trade-in", "pago cómodo", "tablilla", "montarte").
- Tu objetivo principal es orientar al comprador, resolver dudas con transparencia y agendar una cita o prueba de manejo con el dealer correspondiente.
- NUNCA pierdas el hilo de la conversación. Mantén siempre en mente el vehículo específico que el cliente está evaluando (ej. CX-70, CX-50, CX-5, CX-30, CX-90) y continúa la conversación sobre ese mismo auto.

[REGLAS CLAVE]
1. Saludo inicial: Cuando comiences, preséntate como Shakira y haz una pregunta abierta para entender si el cliente busca un pago mensual específico, un modelo en particular o si tiene trade-in.
2. Manejo de pagos: Siempre que se hable de financiamiento o cuotas mensuales, incluye la nota: "Los pagos mostrados son estimados. El pago final depende del crédito, pronto, plazo, intereses, cargos y aprobación de la institución financiera."
3. Respuestas negativas sobre pronto o trade-in: Si el cliente responde "No", "Sin pronto", "Cero" o "No tengo trade-in", NUNCA reinicies el saludo. Explica que en Barranquitas Mazda se puede financiar al 100% (cero pronto) o con bonos del dealer, y solicita amablemente su nombre y WhatsApp/teléfono para prepararle la corrida detallada de pagos.
4. Disponibilidad: NUNCA digas simplemente que un vehículo no existe. Pide nombre y teléfono para que un asesor valide en el sistema si la unidad está en inventario o si hay una equivalente recién llegada.
5. Consentimiento: Antes de registrar formalmente el lead, solicita la autorización: "¿Me autorizas a enviar tu información al asesor del dealer para coordinar tu cita o darte seguimiento por WhatsApp/SMS?"

[MANEJO DE OBJECIONES Y RESEÑAS REALES: MAZDA CX-5 2026 (CONSUMER REPORTS / CRÍTICAS)]
Consumer Reports publicó en junio 2026 el artículo ("5 Reasons to Avoid the 2026 Mazda CX-5 Now") señalando 4 puntos críticos del nuevo rediseño.
REGLA DE ORO: Si el cliente menciona esta reseña o críticas: NUNCA las ignores ni las niegues. Reconócelas con franqueza, da contexto honesto y redirige hacia las fortalezas reales (seguridad i-Activsense de serie, chasis, confiabilidad del motor 2.5L):
1. Pantalla táctil / Eliminación de perillas físicas de A/C:
   - Reconocimiento: "Totalmente de acuerdo en que la transición a pantalla táctil tiene una curva de aprendizaje importante."
   - Contexto: Pantalla panorámica fluida de hasta 15.6" con comandos de voz rápidos.
2. Materiales del interior / Plásticos:
   - Reconocimiento: "Mazda usó materiales más duraderos y resistentes en ciertas zonas en lugar de tanto acolchado."
   - Redirección: Máxima durabilidad, seguridad y alto valor de reventa.
3. Sonido del motor al acelerar fuerte:
   - Reconocimiento: "El motor Skyactiv-G 2.5L se deja escuchar en altas revoluciones."
   - Redirección: Es un motor súper probado y confiable de 187 HP sin turbos forzados y con transmisión automática tradicional duradera.
4. Sin opción híbrida para 2026 (llega en 2027):
   - Transparencia: "El CX-5 Híbrido llega en el 2027. Si tu prioridad es híbrido hoy mismo, tenemos la **Mazda CX-50 Hybrid (38 MPG combinado)** disponible para entrega inmediata."

[FUENTE DE VERDAD - BASE DE CONOCIMIENTO MAZDA 2025-2026]
Regla de oro: i-ACTIV AWD® es DE SERIE en TODOS los trims de TODOS los modelos SUV de Mazda (CX-30, CX-5, CX-50, CX-70, CX-90). Nunca es opcional ni se cobra aparte.

1. MAZDA CX-30 2026 (SUV Compacta):
   - Motor 2.5L 191 HP (Opción Turbo 250 HP). AWD de serie. Desde $35,995 (~$435/mes*).
2. MAZDA CX-5 2026 (SUV Mediana Rediseñada):
   - Motor Skyactiv-G 2.5L 187 HP. Pantalla hasta 15.6 pulgadas. Desde $40,995 (~$615/mes*).
3. MAZDA CX-50 2026 (SUV Outdoor / Aventura):
   - 3 motores: Gasolina 2.5L (187 HP), Hybrid (219 HP combinados, 38 MPG) y Turbo (256 HP / 320 lb-ft). Stock #601273 / Stock #594411.
4. MAZDA CX-70 2025-2026 (SUV 5 Pasajeros Premium):
   - Motor 3.3L Turbo 6 en Línea (280 HP a 340 HP) y PHEV (323 HP). Piel Nappa, AWD predictivo. Stock #594294 (~$1,005/mes*).
5. MAZDA CX-90 2025-2026 (SUV 3 Filas / 7-8 Pasajeros):
   - Motor 3.3L Turbo 6 en Línea (hasta 340 HP) y PHEV. Stock #596193 (~$975/mes*).

[REGLAS ESTRICTAS SOBRE NOMBRES DE USUARIO]
1. NUNCA asumas ni inventes que palabras cortas, afirmaciones o errores tipográficos (como "Su", "Si", "Sip", "No", "Ok", "Dale", "Pronto", "Trade in", "Financiamiento", "Precio", etc.) son el nombre de la persona.
2. Si el cliente responde "Su", "Si", "Sip", "Claro", "Dale" u otra respuesta afirmativa a tu pregunta anterior sobre financiamiento, pronto, trade-in o prueba de manejo, responde a su confirmación de forma natural, por ejemplo: "¡Excelente! ¿Cuentas con algún pronto inicial en mente o tienes algún vehículo para trade-in?" sin llamarlo por un nombre falso.
3. Solo saluda al cliente por su nombre si este se presentó explícitamente ("Me llamo Pedro", "Soy Juan Pérez") o si respondió a una pregunta directa sobre su nombre con un nombre y apellido claro.

[GUÍA DE RECOMENDACIÓN POR PERFIL DE CLIENTE]
- Economía + AWD sin pagar extra: CX-30 2.5 S (191 HP).
- Estilo moderno, todo inalámbrico: CX-30 Carbon Edition.
- Espacio familiar + tecnología (pantalla 15.6"): CX-5 Premium Plus (187 HP).
- Ahorro de gasolina sin perder manejo: CX-50 Hybrid (38 MPG, 219 HP).
- Aventura/outdoor con potencia y remolque: CX-50 Turbo / Meridian (256 HP).
- Desempeño y presencia sin necesitar 3ra fila: CX-70 (3.3L Turbo 6 en Línea / PHEV).
- Familia grande con lujo artesanal japonés: CX-90 (3 filas, hasta 8 pasajeros).
`;

const COMMON_NON_NAME_WORDS = new Set([
  'su', 'si', 'sí', 'sip', 'no', 'nop', 'ok', 'okay', 'vale', 'dale', 'yo', 'tu', 'tú', 'el', 'él', 'ella', 
  'uno', 'dos', 'tres', 'auto', 'carro', 'guagua', 'mazda', 'toyota', 'ford', 'hyundai', 'kia', 'honda', 'nissan',
  'pronto', 'trade', 'tradein', 'trade-in', 'financiamiento', 'financiar', 'pago', 'pagos', 'cuota', 'cuotas',
  'gracias', 'saludos', 'hola', 'buenas', 'tardes', 'dias', 'días', 'noches', 'nada', 'todo', 'bien', 'mal',
  'aqui', 'aquí', 'alli', 'allí', 'alla', 'allá', 'ahora', 'hoy', 'manana', 'mañana', 'ayer', 'semana', 'mes', 'ano', 'año',
  'color', 'rojo', 'blanco', 'negro', 'gris', 'azul', 'plata', 'verde', 'nuevo', 'usado', 'precio', 'costo', 'cotizacion', 'cotización',
  'donde', 'dónde', 'cuando', 'cuándo', 'cuanto', 'cuánto', 'como', 'cómo', 'por', 'favor', 'porfavor', 'interesa', 'quiero', 'ver',
  'precalificar', 'precalificacion', 'precalificación', 'credito', 'crédito', 'banco', 'coop', 'cooperativa'
]);

function extractNameFromText(text: string, isAnsweringNameQuestion: boolean = false): string | null {
  const cleaned = text.trim();
  if (!cleaned || cleaned.length < 3) return null;

  // 1. Explicit self-introduction: "Me llamo Juan Pérez", "Mi nombre es Carlos", "Soy Pedro Rivera"
  const explicitPattern = /(?:me llamo|mi nombre es|mi nombre:|soy)\s+([A-Za-zÁÉÍÓÚáéíóúñÑ]{2,20}(?:\s+[A-Za-zÁÉÍÓÚáéíóúñÑ]{2,20}){0,2})/i;
  const explicitMatch = cleaned.match(explicitPattern);
  if (explicitMatch && explicitMatch[1]) {
    const candidate = explicitMatch[1].trim();
    const candidateLower = candidate.toLowerCase();
    if (!COMMON_NON_NAME_WORDS.has(candidateLower) && !candidateLower.startsWith('de ') && !candidateLower.startsWith('un ')) {
      return candidate;
    }
  }

  // 2. Only if the assistant explicitly asked "¿Con quién tengo el gusto...?" or "¿Cuál es tu nombre?":
  if (isAnsweringNameQuestion) {
    const namePattern = /^([A-ZÁÉÍÓÚ][a-záéíóúñÑ]{2,15}(?:\s+[A-ZÁÉÍÓÚ][a-záéíóúñÑ]{2,15}){0,2})$/;
    const match = cleaned.match(namePattern);
    if (match && match[1]) {
      const candidate = match[1].trim();
      if (!COMMON_NON_NAME_WORDS.has(candidate.toLowerCase())) {
        return candidate;
      }
    }
  }

  return null;
}

function detectActiveVehicle(allMessages: any[]): { name: string; price?: number; payment?: number; stock?: string } {
  // Scan messages in reverse to find the most recently discussed vehicle
  for (let i = allMessages.length - 1; i >= 0; i--) {
    const text = (allMessages[i].text || '').toLowerCase();
    
    if (/\b(cx[-_ ]?70)\b/i.test(text)) {
      return { name: 'Mazda CX-70 2026 3.3 Turbo S', price: 66995, payment: 1005, stock: '594294' };
    }
    if (/\b(cx[-_ ]?50)\b/i.test(text)) {
      return { name: 'Mazda CX-50 2026 (Híbrida / Turbo)', price: 48995, payment: 735, stock: '601273' };
    }
    if (/\b(cx[-_ ]?90)\b/i.test(text)) {
      return { name: 'Mazda CX-90 2026 Premium Sport (3 Filas)', price: 64995, payment: 975, stock: '596193' };
    }
    if (/\b(cx[-_ ]?5)\b/i.test(text)) {
      return { name: 'Mazda CX-5 2026 Rediseñada', price: 40995, payment: 615, stock: '610595' };
    }
    if (/\b(cx[-_ ]?30)\b/i.test(text)) {
      return { name: 'Mazda CX-30 2026 2.5 S', price: 35995, payment: 435, stock: '601276' };
    }
    if (text.includes('tacoma')) {
      return { name: 'Toyota Tacoma', price: 35995, payment: 540, stock: '616425' };
    }
    if (text.includes('tundra')) {
      return { name: 'Toyota Tundra 4WD', price: 39995, payment: 600, stock: '601809' };
    }
    if (text.includes('corolla')) {
      return { name: 'Toyota Corolla LE', price: 23995, payment: 360, stock: '607879' };
    }
    if (text.includes('mazda3') || text.includes('mazda 3')) {
      return { name: 'Mazda3 Hatchback 2.5 S', price: 31995, payment: 480, stock: '569426' };
    }
  }

  return { name: 'tu Mazda de interés' };
}

function generateSmartFallback(lastMsg: string, allMessages: any[] = []): string {
  const q = (lastMsg || '').trim().toLowerCase();
  const activeVehicle = detectActiveVehicle(allMessages);
  
  // Find last assistant message to understand conversational context
  let lastAssistantMsg = '';
  for (let i = allMessages.length - 1; i >= 0; i--) {
    if (allMessages[i].role === 'model' || allMessages[i].role === 'assistant') {
      lastAssistantMsg = (allMessages[i].text || '').toLowerCase();
      break;
    }
  }

  const askedForName = lastAssistantMsg.includes('con quién tengo el gusto') || 
                         lastAssistantMsg.includes('cuál es tu nombre') || 
                         lastAssistantMsg.includes('a tu nombre');

  // Analyze conversation context
  let previousPhone: string | null = null;
  let previousName: string | null = null;

  for (let i = 0; i < allMessages.length; i++) {
    const m = allMessages[i];
    if (m.role === 'user') {
      const txt = m.text || '';
      const phoneM = txt.match(/(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/);
      if (phoneM) previousPhone = phoneM[0];
      
      const prevAssistant = i > 0 ? (allMessages[i - 1]?.text || '').toLowerCase() : '';
      const prevAskedName = prevAssistant.includes('con quién tengo el gusto') || prevAssistant.includes('cuál es tu nombre');
      const nameCandidate = extractNameFromText(txt, prevAskedName);
      if (nameCandidate) previousName = nameCandidate;
    }
  }

  const currentPhoneMatch = lastMsg.match(/(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/);
  const currentEmailMatch = lastMsg.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const currentName = extractNameFromText(lastMsg, askedForName);

  // If user provided phone number or email
  if (currentPhoneMatch || currentEmailMatch) {
    const contactInfo = currentPhoneMatch ? currentPhoneMatch[0] : currentEmailMatch![0];
    if (previousName || currentName) {
      const name = currentName || previousName;
      return `¡Muchísimas gracias, **${name}**! 📱 He anotado tu contacto (**${contactInfo}**) en la ficha de solicitud para la **${activeVehicle.name}**.\n\nEl asesor de ventas de Barranquitas Mazda te contactará con la corrida exacta y opciones de financiamiento. ¿Me autorizas a enviar tu información al asesor para coordinar tu cita o darte seguimiento por WhatsApp/SMS?`;
    }
    return `¡Excelente! He recibido tu número (**${contactInfo}**) 📱.\n\nPara completar tu ficha de la **${activeVehicle.name}** y que el asesor prepare la cotización formal a tu nombre, **¿con quién tengo el gusto y placer de hablar?**`;
  }

  // If user legitimately provided their name
  if (currentName && !q.includes('?')) {
    if (previousPhone) {
      return `¡Un verdadero placer, **${currentName}**! Ya tu ficha está completa con tu contacto para la **${activeVehicle.name}**. El asesor de ventas te estará escribiendo por WhatsApp o llamando con todos los detalles y ofertas especiales. ¿Me autorizas a coordinar tu cita en Barranquitas Mazda?`;
    }
    return `¡Mucho gusto, **${currentName}**! Un placer atenderte. Para enviarte la cotización detallada de la **${activeVehicle.name}** y coordinar tu cita, ¿a qué número de WhatsApp o teléfono te podemos escribir?`;
  }

  // Negative responses: "no", "nop", "ninguno", "nada", "cero", "sin pronto", "no tengo trade in", "no tengo", etc.
  const isNegative = /^(no|nop|no tengo|ninguno|ninguna|nada|cero|sin pronto|cero pronto|sin trade in|no trade in|no tengo trade in|no tengo trade-in|no tengo pronto|0|ningun pronto)$/i.test(q) || 
                     (q.startsWith('no ') && q.length < 28) ||
                     (q.includes('no tengo') && q.length < 35);
  
  if (isNegative) {
    if (lastAssistantMsg.includes('pronto') || lastAssistantMsg.includes('trade-in') || lastAssistantMsg.includes('financiamiento') || lastAssistantMsg.includes('pago')) {
      return `¡Entendido perfectamente! No te preocupes en lo absoluto. En Barranquitas Mazda trabajamos opciones de financiamiento al 100% (cero pronto) y contamos con bonos especiales de fábrica para que el pago mensual de la **${activeVehicle.name}** te quede lo más cómodo posible.\n\n*Nota: Los pagos mostrados son estimados. El pago final depende del crédito, pronto, plazo, intereses, cargos y aprobación de la institución financiera.*\n\nPara prepararte la corrida bancaria oficial con las mejores tasas de interés, **¿a qué número de WhatsApp o teléfono te podemos enviar la cotización detallada?**`;
    }
    if (lastAssistantMsg.includes('prueba de manejo') || lastAssistantMsg.includes('cita') || lastAssistantMsg.includes('dealer')) {
      return `¡Sin problema! Si prefieres evaluar los números primero desde la comodidad de tu casa, podemos enviarte la propuesta digital y fotos detalladas de la **${activeVehicle.name}** por WhatsApp. ¿A qué número te la podemos enviar?`;
    }
    return `¡Entendido! Cuéntame, ¿hay algún otro modelo de nuestro inventario que te llame la atención o prefieres que evaluemos opciones de financiamiento al 100% para la **${activeVehicle.name}**?`;
  }

  // Affirmations & Typos of "Si" ("su", "si", "sí", "sip", "yes", "claro", "dale", "seguro", "ok", "me gustaria", "me interesa", "por favor")
  const isAffirmative = /^(su|si|sí|sip|sii|siip|yes|ok|okay|claro|dale|seguro|por favor|me gustaria|me gustaría|me interesa|quiero evaluar|evaluar|correcto|exacto)$/i.test(q);
  if (isAffirmative) {
    if (lastAssistantMsg.includes('financiamiento') || lastAssistantMsg.includes('pronto') || lastAssistantMsg.includes('trade-in') || lastAssistantMsg.includes('pago')) {
      return `¡Excelente! 🤝 Para prepararte la corrida y el cálculo de pago mensual más cómodo con el banco o cooperativa para la **${activeVehicle.name}**:\n\n¿Cuentas con algún pronto inicial en mente o tienes algún vehículo que quieras entregar en trade-in? (O si gustas, indícame tu número de WhatsApp o teléfono para que un asesor te pase los números exactos).`;
    }
    if (lastAssistantMsg.includes('prueba de manejo') || lastAssistantMsg.includes('cita') || lastAssistantMsg.includes('dealer')) {
      return `¡Perfecto! Nos encantará recibirte en Barranquitas Mazda para tu prueba de manejo de la **${activeVehicle.name}**. ¿Prefieres pasar hoy o coordinar para el fin de semana? ¿A qué número de WhatsApp o teléfono te podemos contactar para reservarte el espacio?`;
    }
    return `¡Excelente! Para prepararte la mejor propuesta en Barranquitas Mazda para la **${activeVehicle.name}**, ¿a qué número de WhatsApp o teléfono te podemos enviar los números y opciones?`;
  }

  // Specific Stock Number or VIN inquiry
  const foundByStock = INVENTORY.find(v => {
    const stockMatch = v.stock && v.stock !== 'N/A' && q.includes(v.stock.toLowerCase());
    const vinMatch = v.vin && v.vin.length > 5 && q.includes(v.vin.toLowerCase());
    return stockMatch || vinMatch;
  });
  if (foundByStock) {
    const isMazdaAWD = foundByStock.make.toLowerCase() === 'mazda' && foundByStock.specs.drivetrain.toUpperCase() === 'AWD';
    const displayDrivetrain = isMazdaAWD ? 'i-ACTIV AWD® de serie' : foundByStock.specs.drivetrain;
    const hpPart = foundByStock.specs.horsepower && foundByStock.specs.horsepower !== 'N/A' ? `, **${foundByStock.specs.horsepower}**` : '';
    const enginePart = foundByStock.specs.engine && foundByStock.specs.engine !== 'N/A' ? `motor ${foundByStock.specs.engine}` : 'motor verificado';

    return `¡Saludos! Qué gusto saludarte. ¡Excelente máquina! El **${foundByStock.make} ${foundByStock.model} ${foundByStock.year} ${foundByStock.trim} (Stock #${foundByStock.stock})** en color **${foundByStock.color}** está disponible en inventario por **$${foundByStock.price.toLocaleString()}** (~$${foundByStock.estimatedMonthly}/mes*).\n\nCuenta con ${enginePart}${hpPart}, tracción **${displayDrivetrain}** y ${foundByStock.mileage === 0 ? '0 millas (nuevo de paquete)' : `${foundByStock.mileage.toLocaleString()} millas (Certificado)`}.\n\n*Nota: Los pagos mostrados son estimados. El pago final depende del crédito, pronto, plazo, intereses, cargos y aprobación de la institución financiera.*\n\n¿Te gustaría evaluar el financiamiento con algún pronto inicial o tienes algún vehículo que quieras entregar en trade-in?`;
  }

  // Negotiable / Discounts / Best Price / Offers
  if (q.includes('negociable') || q.includes('descuento') || q.includes('rebaja') || q.includes('mejor precio') || q.includes('oferta') || q.includes('bono') || q.includes('menos') || q.includes('cuanto es lo ultimo') || q.includes('lo menos')) {
    return `¡Te entiendo perfectamente! En Barranquitas Mazda siempre buscamos darte la mano para que consigas el mejor negocio posible y un pago que te quede súper cómodo sin apretarte el bolsillo. 🤝\n\nNuestros gerentes de ventas cuentan con flexibilidad en bonos especiales de fábrica, incentivos de temporada y la mejor tasación de Puerto Rico para tu trade-in.\n\nPara que podamos estructurar la mejor propuesta de pago para la **${activeVehicle.name}**, ¿cuentas con algún pronto inicial en mente o tienes un auto para entregar en trade-in?`;
  }

  // Consumer Reports / Críticas / Reseñas / Objeciones específicas del CX-5 2026
  if (q.includes('consumer report') || q.includes('5 reasons to avoid') || q.includes('critica') || q.includes('pantalla') || q.includes('perilla') || q.includes('plastico') || q.includes('ruidoso') || (/\bcx[-_ ]?5\b/i.test(q) && (q.includes('hibrid') || q.includes('hybrid')))) {
    if (q.includes('pantalla') || q.includes('perilla') || q.includes('clima') || q.includes('volumen')) {
      return `¡Qué buena observación y qué bien que lo tocas! Tienes toda la razón: la eliminación de las perillas físicas de clima y volumen para pasar a la pantalla táctil de hasta 15.6" tiene una curva de aprendizaje importante, y Consumer Reports lo señaló con justa razón.\n\nMazda apostó por una interfaz panorámica rápida y comandos por voz para limpiar la consola. Al momento de la prueba de manejo te enseño exactamente cómo configurar los atajos táctiles para que ajustes todo sin distraerte en la carretera.\n\n¿Te gustaría verla en persona para que pruebes los controles tú mismo en el dealer?`;
    }
    if (q.includes('plastico') || q.includes('material') || q.includes('acabado') || q.includes('interior')) {
      return `Tienes toda la razón y es un punto muy honesto: Consumer Reports señaló que el rediseño utiliza plásticos más resistentes en ciertas áreas en lugar del acolchado de generaciones previas.\n\nDonde Mazda no escatimó fue en la ingeniería del chasis, la insonorización de rodaje y la seguridad i-Activsense® de serie en todos los trims. Es un auto diseñado para durabilidad real y alto valor de reventa en la isla.\n\n¿Te gustaría agendar una prueba de manejo para que sientas cómo se maneja en carretera?`;
    }
    if (q.includes('ruidoso') || q.includes('motor') || q.includes('acelerar') || q.includes('fuerza')) {
      return `¡Totalmente de acuerdo! El motor Skyactiv-G 2.5L naturalmente aspirado ciertamente se hace sentir en revoluciones altas cuando se pisa a fondo para rebases.\n\nLa gran ventaja es su probada confiabilidad: no es una plataforma experimental ni un turbo pequeño forzado; es una mecánica duradera, con transmisión automática tradicional de 6 velocidades muy confiable y fácil de mantener en Puerto Rico.\n\n¿Tienes algún auto que quieras entregar en trade-in o prefieres evaluar el pago con pronto?`;
    }
    if (/\bcx[-_ ]?5\b/i.test(q) && (q.includes('hibrid') || q.includes('hybrid'))) {
      return `Es totalmente cierto y te soy 100% transparente: el CX-5 con motor híbrido no llegará hasta el modelo 2027.\n\nSi tu prioridad número 1 es el rendimiento híbrido ya mismo, en inventario tenemos la **Mazda CX-50 Hybrid (38 MPG combinado)** disponible para entrega inmediata. Pero si prefieres el espacio, chasis y confiabilidad del motor probado a gasolina del CX-5 2026, no tienes que esperar.\n\n¿Prefieres evaluar la CX-50 Híbrida de 38 MPG o te llama la atención el nuevo CX-5 a gasolina?`;
    }
    return `¡Te agradezco mucho que lo menciones! En Barranquitas Mazda creemos en la honestidad total. La reseña de Consumer Reports señala puntos reales del CX-5 2026 (como los controles táctiles, acabados y que el híbrido llega en 2027), pero también destaca sus grandes fortalezas: la mejor suspensión de su categoría, un manejo superior y todo el paquete de seguridad activa i-Activsense® de serie.\n\nAdemás, mantiene el motor Skyactiv-G y la transmisión ya probados y súper confiables.\n\n¿Qué aspecto es el más importante para ti a la hora de elegir tu próxima SUV?`;
  }

  // Power / HP / Caballos de fuerza inquiry
  if (/^(hp\??|caballos\??|potencia\??|motores\??|que motor tiene\??)$/i.test(q) || q.includes('caballos de fuerza') || (q.includes('hp') && (q.includes('cuant') || q.includes('tien')))) {
    return `¡Con mucho gusto te detallo la potencia de la línea Mazda 2026! 🏎️\n\n- **Mazda CX-30 2026**: **191 HP** (2.5L Gasolina) / **250 HP** (2.5L Turbo).\n- **Mazda CX-5 2026**: **187 HP** (2.5L Skyactiv-G rediseñado).\n- **Mazda CX-50 2026**:\n  • **187 HP** (2.5L Gasolina Estándar)\n  • **219 HP** (2.5L Híbrida Combinada - 38 MPG)\n  • **227 HP - 256 HP** (2.5L Turbo con hasta 320 lb-ft)\n- **Mazda CX-70 & CX-90**: **280 HP a 340 HP** (3.3L Turbo 6 en Línea) / **323 HP** (PHEV Enchufable).\n\n¿De cuál de estos modelos te gustaría conocer detalles o coordinar una prueba de manejo?`;
  }

  // 1. CX-50 specifically (Adventure / Hybrid / Turbo) - Must be checked BEFORE CX-5
  if (/\b(cx[-_ ]?50)\b/i.test(q)) {
    const cx50 = INVENTORY.find(v => v.model === 'CX-50') || INVENTORY[1];
    return `¡Hola! La **Mazda CX-50 2026** (Stock #${cx50.stock}) es más ancha, robusta y con mayor despeje al suelo que el CX-5, diseñada especialmente para aventura con selector Mi-Drive y 3 motorizaciones:\n\n1. **CX-50 Hybrid**: 2.5L con **219 HP combinados**, tracción e-AWD inteligente y **38 MPG combinado**.\n2. **CX-50 2.5 S**: 2.5L con **187 HP** y modos Off-Road/Sport.\n3. **CX-50 Turbo**: 2.5L Turbo con **256 HP / 320 lb-ft** y arrastre de hasta 3,500 lbs.\n\nTenemos en inventario físico la versión **Hybrid Premium Plus** por **$${cx50.price.toLocaleString()}** (~$${cx50.estimatedMonthly}/mes*).\n\n*Nota: Pagos estimados sujetos a crédito y pronto.*\n\n¿Te interesa más la versión Híbrida de 38 MPG o la Turbo de 256 HP?`;
  }

  // 2. CX-70 specifically (5 Pasajeros Premium / 6 en Línea)
  if (/\b(cx[-_ ]?70)\b/i.test(q)) {
    const cx70 = INVENTORY.find(v => v.model === 'CX-70') || INVENTORY[0];
    return `¡Saludos! La **Mazda CX-70 2026 3.3 Turbo S Premium Plus (Stock #${cx70.stock})** es una máquina impresionante: motor **3.3L Turbo 6 en Línea con 340 HP**, arquitectura de propulsión trasera con **i-ACTIV AWD® predictivo**, interior en piel Nappa y configuración espaciosa de 5 pasajeros por **$${cx70.price.toLocaleString()}** (~$${cx70.estimatedMonthly}/mes*).\n\n*Los pagos son estimados sujetos a aprobación de crédito y pronto.*\n\n¿Te gustaría coordinar una prueba de manejo o evaluar tu pago mensual con trade-in?`;
  }

  // 3. CX-90 specifically (3 Filas / 7-8 Pasajeros)
  if (/\b(cx[-_ ]?90)\b/i.test(q) || q.includes('3 fila') || q.includes('3 filas') || q.includes('tres fila') || q.includes('7 pasajero') || q.includes('8 pasajero') || q.includes('grand highlander') || q.includes('pilot') || q.includes('telluride')) {
    const cx90 = INVENTORY.find(v => v.model === 'CX-90') || { stock: '596193', price: 64995, estimatedMonthly: 975, year: 2026, trim: 'Premium Sport' };
    return `¡Saludos! La **Mazda CX-90 2026 Premium Sport (Stock #${cx90.stock})** es nuestra SUV insignia de **3 filas de asientos (hasta 8 pasajeros)** equipada con motor **3.3L Turbo 6 en Línea (hasta 340 HP)**, tracción longitudinal **i-ACTIV AWD®** y acabados de lujo artesanal por **$${cx90.price.toLocaleString()}** (~$${cx90.estimatedMonthly}/mes*).\n\n*Los pagos son estimados sujetos a aprobación de crédito y pronto.*\n\n¿Buscas la configuración de 7 pasajeros con asientos capitán o de 8 pasajeros en banco?`;
  }

  // 4. CX-30 / Compact
  if (/\b(cx[-_ ]?30)\b/i.test(q) || q.includes('aire edition') || q.includes('corolla') || q.includes('hr-v') || q.includes('hrv')) {
    const cx30 = INVENTORY.find(v => v.model === 'CX-30') || INVENTORY[2];
    return `¡Hola! Te orienta **Shakira**. La **Mazda CX-30 2026 (Stock #${cx30.stock})** viene equipada con motor Skyactiv-G 2.5L de **191 HP @ 6,000 RPM (186 lb-ft)** (con opción Turbo de hasta 250 HP) e **i-ACTIV AWD® de serie en todos los trims** (a diferencia de HR-V o Corolla Cross que son FWD de entrada y tienen menos potencia). La tenemos disponible desde **$35,995** (~$435/mes*).\n\n*Pagos estimados sujetos a crédito y pronto inicial.*\n\n¿Qué color exterior te gusta más o te gustaría ver cómo te queda el pago con algún pronto?`;
  }

  // 5. CX-5 General (Word boundary ensures CX-50, CX-30, etc. never match here)
  if (/\b(cx[-_ ]?5)\b/i.test(q) || q.includes('rav4') || q.includes('cr-v') || q.includes('crv')) {
    return `¡Saludos! El **Mazda CX-5 2026** llega totalmente rediseñado: incorpora el motor Skyactiv-G 2.5L de **187 HP (186 lb-ft)**, pantalla táctil panorámica de hasta 15.6" con control de A/C 100% digital integrado, mayor insonorización e **i-ACTIV AWD® estándar** en todos los modelos desde **$40,995** (~$615/mes*).\n\n*Nota: Los pagos mostrados son estimados. El pago final depende del crédito, pronto, plazo, intereses, cargos y aprobación de la institución financiera.*\n\n¿Buscas la versión Select o prefieres el equipamiento Premium con techo corredizo y asientos en piel?`;
  }

  // Comerciales / Pickups / Guaguas de Trabajo
  if (q.includes('comercial') || q.includes('pickup') || q.includes('pick up') || q.includes('tacoma') || q.includes('tundra') || q.includes('trabajo') || q.includes('camion') || q.includes('carga') || q.includes('carnival') || q.includes('santa cruz')) {
    return `¡Saludos! En inventario contamos con excelentes unidades comerciales y pickups listas para la faena en Puerto Rico:\n\n- **2022 Toyota Tundra 4WD SR5 (V6 / 4x4)**: Stock #601809 por **$39,995** (~$600/mes*)\n- **2025 Toyota Tacoma 2WD SR**: Stock #616425 por **$35,995** (~$540/mes*)\n- **2024 Toyota Tacoma 2WD SR5**: Stock #607880 por **$42,995** (~$645/mes*)\n- **2022 Toyota Tacoma 2WD SR**: Stock #581673 por **$25,995** (~$390/mes*)\n- **2024 Hyundai Santa Cruz SE**: Stock #607883 por **$32,995** (~$495/mes*)\n- **2024 Kia Carnival LX (Van de Pasajeros/Carga)**: Stock #594410 por **$29,995** (~$450/mes*)\n\n*Nota: Los pagos mostrados son estimados.*\n\n¿Buscas la unidad para uso personal o para cuenta comercial/negocio?`;
  }

  // Híbridos / Mild Hybrids
  if (q.includes('hibrid') || q.includes('hybrid') || q.includes('phev') || q.includes('mhev')) {
    return `¡Excelente pregunta! Mazda cuenta con una línea electrificada espectacular:\n\n- **Mazda CX-50 Hybrid**: Rendimiento de hasta **38 MPG combinado**.\n- **Mazda CX-70 y CX-90 MHEV (Mild Hybrid)**: Sistema *M-Hybrid Boost* 3.3L Turbo (hasta 340 HP).\n- **Mazda CX-70 y CX-90 PHEV (Plug-in Hybrid)**: Modo 100% eléctrico (aprox. 26 millas) y gasolina para viajes largos.\n\nTodos vienen con tracción i-ACTIV AWD de serie.\n\n¿Te interesa más la economía en gasolina (CX-50) o la potencia y espacio familiar (CX-70/CX-90)?`;
  }

  // Solo Nuevos / Inventario Completo
  if (q.includes('nuevo') && (q.includes('solo') || q.includes('0 milla') || q.includes('cero milla') || q.includes('estrenar') || q.includes('2026'))) {
    return `¡Por supuesto! En nuestra sección de **Solo Nuevos** contamos con modelos 2026 recién llegados como el **CX-5 2026 rediseñado**, la **CX-50 Híbrida (38 MPG)**, la **CX-70 Turbo S (340 HP)**, el buque insignia de 3 filas **CX-90** y las **CX-30 2026** — todas con **i-ACTIV AWD® de serie** y garantía de fábrica completa.\n\n*Los pagos mostrados son estimados sujetos a aprobación de crédito y pronto.*\n\n¿Hay algún modelo en particular que te llame más la atención?`;
  }

  // Trade-in / Financiamiento / Pagos / Pronto
  if (q.includes('trade') || q.includes('pago') || q.includes('financ') || q.includes('precalific') || q.includes('cuota') || q.includes('interes') || q.includes('credito') || q.includes('crédito') || q.includes('banco') || q.includes('cooperativa')) {
    return `¡Con muchísimo gusto te oriento! En Barranquitas Mazda trabajamos con todos los bancos y cooperativas locales en Puerto Rico. Aceptamos tu Trade-In con o sin deuda con la mejor tasación de la isla para lograr un pago mensual que se adapte a tu presupuesto para la **${activeVehicle.name}**.\n\n*Recuerda: Los pagos mostrados son estimados. El pago final depende del crédito, pronto, plazo, intereses, cargos y aprobación de la institución financiera.*\n\n¿Tienes algún auto en mente para trade-in o qué cuota mensual tienes como meta?`;
  }

  // Cita / Ubicacion / Telefono / WhatsApp / Contacto
  if (q.includes('cita') || q.includes('ubicacion') || q.includes('direcci') || q.includes('dealer') || q.includes('whatsapp') || q.includes('telefono') || q.includes('probar') || q.includes('test drive')) {
    return `¡Excelente! Me encantará coordinar tu cita VIP y prueba de manejo de la **${activeVehicle.name}** en Barranquitas Mazda. Para preparar tu ficha de atención personalizada, **¿con quién tengo el gusto de hablar y a qué número de WhatsApp o teléfono te podemos contactar?**`;
  }

  // Default fallback for general queries
  return `¡Hola! Con mucho gusto te asisto. En Barranquitas Mazda estamos comprometidos en ayudarte a conseguir el mejor carro con el pago más cómodo para ti.\n\n¿Estás buscando un modelo en específico, cotizar un pago mensual o evaluar un trade-in?`;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Proxy for photos from apicdn.inventario360.com to bypass any referrer/CORS issues
  app.get("/api/image-proxy", (req, res) => {
    const rawUrl = req.query.url as string;
    if (!rawUrl) {
      return res.status(400).send("Missing url parameter");
    }

    try {
      const parsed = new URL(rawUrl);
      // Only allow inventario360, unsplash or mazda media domains
      const isAllowed = 
        parsed.hostname.includes("inventario360.com") || 
        parsed.hostname.includes("inv360.me") ||
        parsed.hostname.includes("mazda") ||
        parsed.hostname.includes("unsplash.com") ||
        parsed.hostname.includes("fakeimg.pl");

      if (!isAllowed) {
        return res.status(403).send("Host not allowed for proxy");
      }

      const client = parsed.protocol === "https:" ? https : http;
      const request = client.get(rawUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          "Referer": "https://wilfredoq.inv360.me/",
          "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8"
        }
      }, (proxyRes) => {
        if (proxyRes.statusCode && proxyRes.statusCode >= 300 && proxyRes.statusCode < 400 && proxyRes.headers.location) {
          return res.redirect(proxyRes.headers.location);
        }

        res.setHeader("Content-Type", proxyRes.headers["content-type"] || "image/jpeg");
        res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=86400");
        res.setHeader("Access-Control-Allow-Origin", "*");
        proxyRes.pipe(res);
      });

      request.on("error", (err) => {
        res.status(502).send("Bad gateway fetching image");
      });
    } catch (err: any) {
      res.status(400).send("Invalid URL");
    }
  });

  // Image proxy to bypass hotlinking and cross-origin restrictions
  app.get("/api/image-proxy", async (req, res) => {
    try {
      const rawUrl = req.query.url as string;
      if (!rawUrl || typeof rawUrl !== "string") {
        return res.status(400).send("Missing url parameter");
      }

      const decodedUrl = decodeURIComponent(rawUrl);
      if (!decodedUrl.startsWith("http://") && !decodedUrl.startsWith("https://")) {
        return res.status(400).send("Invalid url");
      }

      const response = await fetch(decodedUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          "Referer": "https://wilfredoq.inv360.me/",
          "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8"
        }
      });

      if (!response.ok) {
        return res.status(response.status).send(`Failed to fetch image: ${response.statusText}`);
      }

      const contentType = response.headers.get("content-type") || "image/jpeg";
      res.setHeader("Content-Type", contentType);
      res.setHeader("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");
      res.setHeader("Access-Control-Allow-Origin", "*");

      const arrayBuffer = await response.arrayBuffer();
      return res.send(Buffer.from(arrayBuffer));
    } catch (err: any) {
      console.warn("Image proxy error:", err);
      return res.status(500).send("Proxy error");
    }
  });

  // Live Inventory endpoint
  app.get("/api/inventory", (req, res) => {
    res.json({ vehicles: INVENTORY });
  });

  const photoCache: { [id: string]: string[] } = {};

  // Endpoint to fetch ALL full-resolution gallery photos for any vehicle dynamically
  app.get("/api/vehicles/:id/photos", async (req, res) => {
    try {
      const { id } = req.params;
      if (photoCache[id] && photoCache[id].length > 0) {
        return res.json({ success: true, photos: photoCache[id], source: "cache" });
      }

      const vehicle = INVENTORY.find(v => v.id === id || v.stock === id || v.vin.toLowerCase().includes(id.toLowerCase()));
      if (!vehicle || !vehicle.url) {
        const fallback = vehicle?.images && vehicle.images.length > 0 ? vehicle.images : (vehicle?.image ? [vehicle.image] : []);
        return res.json({ success: true, photos: fallback, count: fallback.length });
      }

      const response = await fetch(vehicle.url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          "Referer": "https://wilfredoq.inv360.me/",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
        }
      });

      if (!response.ok) {
        const fallback = vehicle.images && vehicle.images.length > 0 ? vehicle.images : [vehicle.image];
        return res.json({ success: true, photos: fallback, count: fallback.length });
      }

      const html = await response.text();
      // Match all media photos from apicdn.inventario360.com
      const matches = html.match(/https:\/\/apicdn\.inventario360\.com\/cdn-cgi\/image\/[^"'\s\)]+\.(?:jpg|jpeg|webp|png)/gi) || [];
      
      // Deduplicate and ensure high resolution format
      const cleanUrls: string[] = [];
      for (const raw of matches) {
        // filter out logos or thumbnails icons
        if (raw.includes('/accounts/') || raw.includes('logo_')) continue;
        const highRes = raw.replace(/width=\d+,height=\d+/, 'width=1024,height=768');
        if (!cleanUrls.includes(highRes)) {
          cleanUrls.push(highRes);
        }
      }

      if (cleanUrls.length > 0) {
        photoCache[id] = cleanUrls;
        vehicle.images = cleanUrls;
        return res.json({ success: true, photos: cleanUrls, count: cleanUrls.length });
      }

      const fallback = vehicle.images && vehicle.images.length > 0 ? vehicle.images : [vehicle.image];
      return res.json({ success: true, photos: fallback, count: fallback.length });
    } catch (err: any) {
      console.warn("Error fetching vehicle photos:", err);
      const vehicle = INVENTORY.find(v => v.id === req.params.id);
      const fallback = vehicle?.images && vehicle.images.length > 0 ? vehicle.images : (vehicle?.image ? [vehicle.image] : []);
      return res.json({ success: true, photos: fallback, count: fallback.length });
    }
  });

  // Google Sheets Lead Capture endpoint
  app.post("/api/leads", async (req, res) => {
    try {
      const lead: LeadData = req.body;
      if (!lead || (!lead.phone && !lead.name)) {
        return res.status(400).json({ success: false, error: "Nombre o teléfono requerido" });
      }

      console.log("Receiving lead for Sheets sync:", lead.name, lead.phone, lead.vehicle);
      const result = await appendLeadToSheet(lead);
      return res.json({ success: result.success, error: result.error });
    } catch (err: any) {
      console.warn("Failed to process lead:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post("/api/chat", async (req, res) => {
    try {
      const { messages } = req.body;
      const lastUserMsg = messages && messages.length > 0 ? messages[messages.length - 1].text : '';

      const ai = getAI();
      if (!ai) {
        // Safe domain expert fallback when no external API key is set
        return res.json({ text: generateSmartFallback(lastUserMsg, messages) });
      }

      try {
        // Ensure Gemini contents start with a user message and alternate roles properly
        const geminiContents: Array<{ role: string; parts: Array<{ text: string }> }> = [];
        
        let startIndex = 0;
        while (startIndex < messages.length && messages[startIndex].role !== 'user') {
          startIndex++;
        }

        for (let i = startIndex; i < messages.length; i++) {
          const msg = messages[i];
          const role = msg.role === 'user' ? 'user' : 'model';
          const text = (msg.text || '').trim();
          if (!text) continue;

          if (geminiContents.length > 0 && geminiContents[geminiContents.length - 1].role === role) {
            geminiContents[geminiContents.length - 1].parts[0].text += `\n\n${text}`;
          } else {
            geminiContents.push({
              role,
              parts: [{ text }]
            });
          }
        }

        if (geminiContents.length === 0) {
          geminiContents.push({
            role: 'user',
            parts: [{ text: lastUserMsg || 'Hola' }]
          });
        }

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: geminiContents,
          config: {
            systemInstruction: MAZDA_SYSTEM_PROMPT,
            temperature: 0.7,
          }
        });

        if (response.text) {
          return res.json({ text: response.text });
        }
      } catch (geminiError: any) {
        console.warn("Gemini API generation error, falling back to smart fallback:", geminiError?.message || geminiError);
      }

      return res.json({ text: generateSmartFallback(lastUserMsg, messages) });
    } catch (error) {
      res.json({ text: generateSmartFallback('') });
    }
  });

  app.get("/robots.txt", (req, res) => {
    const domain = req.headers.host ? `https://${req.headers.host}` : "https://wilfredo.inv360.me";
    res.type("text/plain");
    res.send(`User-agent: *
Allow: /

Sitemap: ${domain}/sitemap.xml
`);
  });

  app.get("/sitemap.xml", (req, res) => {
    const domain = req.headers.host ? `https://${req.headers.host}` : "https://wilfredo.inv360.me";
    res.type("application/xml");
    
    const urls = [
      `${domain}/`,
      ...INVENTORY.map(v => `${domain}/?vehicle=${v.id || v.stock}`)
    ];

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${url}</loc>
    <changefreq>daily</changefreq>
    <priority>${url.includes('?vehicle=') ? '0.8' : '1.0'}</priority>
  </url>`).join('\n')}
</urlset>`;

    res.send(sitemap);
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
