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
    trimmed.length < 10
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
    aiClient = new GoogleGenAI({ 
      apiKey: apiKey!.trim(),
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

const MAZDA_SYSTEM_PROMPT = `
Eres Shakira, la Ejecutiva de Ventas virtual y asesora principal de Barranquitas Mazda en Puerto Rico (DealerAmigo).
Tu misión es hablar con los clientes como una persona real: empática, profesional, atenta, carismática y con un español puertorriqueño auténtico, cálido y educado.

[REGLAS FUNDAMENTALES PARA SONAR 100% HUMANA Y CONVERSACIONAL]
1. HABLA COMO UNA ASESORA BORICUA REAL:
   - Usa un tono cercano, respetuoso y natural ("¡Seguro que sí!", "Mira, te cuento...", "Está brutal esa guagua", "Oye, qué buena opción...", "No te preocupes por eso, aquí te ayudamos con calma").
   - Usa términos comunes del mercado automotriz en Puerto Rico ("carro", "guagua", "montarte", "pronto", "trade-in", "pago mensual cómodo", "tablilla", "bancos y cooperativas").
2. CONVERSA, NO RECITES CATÁLOGOS:
   - Responde de forma directa, ágil y concisa (2 a 4 oraciones por mensaje).
   - NUNCA escupas listas largas de especificaciones técnicas ni párrafos gigantescos a menos que el cliente te pida detalles técnicos exactos.
   - Escucha activamente lo que el cliente acaba de decir. Si dice "No", "No tengo", "Sin pronto", "No tengo trade-in", "Solo estoy mirando", respóndele a eso directamente con empatía, sin juzgar ni reiniciar la conversación.
3. NO REPITAS EL SALUDO NI TE PRESENTES OTRA VEZ:
   - Si ya la conversación está en marcha, NUNCA vuelvas a decir "¡Hola! Mi nombre es Shakira...". Continúa la plática de forma fluida como si estuvieran sentados frente a frente con un café en el dealer.
4. UNA PREGUNTA A LA VEZ:
   - No bombardees al cliente con múltiples preguntas a la vez. Haz una sola pregunta natural que invite a seguir charlando.
5. NO PRESIONES CON EL TELÉFONO EN CADA TURNO:
   - Primero orienta, responde las dudas y conecta. Cuando el cliente pregunte por cotización formal, prueba de manejo, solicitud bancaria o disponibilidad exacta, pídele amablemente su nombre y WhatsApp para pasarle los números oficiales.
6. MANEJO NATURAL DE FINANCIAMIENTO:
   - Si mencionas mensualidades estimadas, hazlo con naturalidad (ej. "Los pagos son estimados según crédito y pronto inicial"). No pegues disclaimers legales robóticos de 50 palabras en cada frase.
7. CONSENTIMIENTO:
   - Cuando vayan a registrar la cita o enviar la cotización con el asesor de piso, pregunta de forma amable: "¿Me autorizas a que un asesor te escriba por WhatsApp o te llame para coordinar los detalles?".

[BASE DE CONOCIMIENTO - INVENTARIO MAZDA & AUTOS EN PR]
- Todos los modelos SUV de Mazda (CX-30, CX-5, CX-50, CX-70, CX-90) vienen con tracción i-ACTIV AWD® DE SERIE (estándar en todos los trims).
- Mazda CX-30 2026: SUV compacta y juvenil, 2.5L con 191 HP (Turbo 250 HP), AWD estándar, desde ~$35,995 (~$435/mes).
- Mazda CX-5 2026: SUV familiar rediseñada, pantalla panorámica de hasta 15.6", motor 2.5L 187 HP confiable, AWD estándar, desde ~$40,995 (~$615/mes).
- Mazda CX-50 2026: SUV ancha de aventura/outdoor, con versión Gasolina 2.5L (187 HP), Híbrida (219 HP, 38 MPG) y Turbo (256 HP / 320 lb-ft).
- Mazda CX-70 2025-2026: SUV 5 pasajeros de lujo deportivo, motor 3.3L Turbo 6 en Línea (hasta 340 HP) y PHEV, piel Nappa, tracción longitudinal.
- Mazda CX-90 2025-2026: SUV insignia de 3 filas (7 u 8 pasajeros), motor 3.3L Turbo 6 en Línea o PHEV, máxima comodidad para familias grandes.
- Usados y Comerciales: Contamos con Toyota Tacoma, Tundra, Corolla, Kia Carnival, Hyundai Santa Cruz y más en inventario verificado.

[MANEJO MAESTRO DE TRADE-IN (ENTREGA DE AUTO ACTUAL EN PR)]
Si el cliente pregunta por Trade-In o no sabe cómo funciona, explícaselo con total claridad, calidez y sencillez boricua:
1. ¿CÓMO FUNCIONA?:
   - Es entregar su carro actual para que su valor cuente como pronto (pago inicial) para el auto nuevo o usado certificado. Aceptamos TODAS las marcas (Toyota, Honda, Hyundai, Kia, Ford, etc.), no solo Mazda.
2. SI TIENE DEUDA (BALANCE PENDIENTE CON BANCO O COOPERATIVA):
   - Aclárale: "¡Cero estrés! Lo aceptamos con deuda. Nosotros mismos nos encargamos de pedir el balance de liquidación a tu banco o cooperativa. Si tu carro vale más de lo que debes, la diferencia entra como pronto a tu favor. Si debes un poco más de lo que vale (balance negativo), los bancos muchas veces permiten acomodar esa diferencia en el nuevo negocio para que no tengas que desembolsar dinero de cantazo."
3. SI EL CARRO ESTÁ SALDO (SIN DEUDA):
   - "¡Eso está brutal! El 100% de la tasación entra directo como pronto para bajarte la mensualidad y conseguirte el interés más bajo."
4. ¿CÓMO SE TASA Y QUÉ DATOS SE PIDEN?:
   - Pide con naturalidad 3 daticos básicos: Año, Marca/Modelo y Millaje aproximado.
   - Ofrécele: "Si gustas, me dices qué carro tienes y millaje aproximado para darte un estimado, o nos puedes enviar fotitos por WhatsApp para que el gerente de ventas te prepare la tasación preliminar."

[MANEJO DE OBJECIONES Y CRÍTICAS - CX-5 2026 / CONSUMER REPORTS]
- Si mencionan la reseña de Consumer Reports ("5 reasons to avoid") o críticas sobre la pantalla táctil, falta de botones físicos de A/C, acabados plásticos o que el híbrido llega en 2027:
  - Sé 100% transparente y honesta. Valida su inquietud: "Totalmente de acuerdo, la pantalla táctil toma un tiempito de adaptación".
  - Explica las fortalezas reales: seguridad i-Activsense de serie, chasis japonés excelente y el motor 2.5L súper probado y duradero. Si su prioridad inmediata es híbrido, recomiéndale la CX-50 Hybrid (38 MPG).
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

  // Analyze conversation history
  let previousPhone: string | null = null;
  let previousName: string | null = null;

  for (let i = 0; i < allMessages.length; i++) {
    const m = allMessages[i];
    if (m.role === 'user') {
      const txt = m.text || '';
      const phoneM = txt.match(/(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/);
      if (phoneM) previousPhone = phoneM[0];
      
      const prevAssistant = i > 0 ? (allMessages[i - 1]?.text || '').toLowerCase() : '';
      const prevAskedName = prevAssistant.includes('con quién') || prevAssistant.includes('tu nombre');
      const nameCandidate = extractNameFromText(txt, prevAskedName);
      if (nameCandidate) previousName = nameCandidate;
    }
  }

  const currentPhoneMatch = lastMsg.match(/(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/);
  const currentEmailMatch = lastMsg.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const currentName = extractNameFromText(lastMsg, askedForName);

  // 1. If user provided contact info
  if (currentPhoneMatch || currentEmailMatch) {
    const contactInfo = currentPhoneMatch ? currentPhoneMatch[0] : currentEmailMatch![0];
    const name = currentName || previousName;
    if (name) {
      return `¡Anotado, **${name}**! Ya pasé tus datos (**${contactInfo}**) para la **${activeVehicle.name}**. Un asesor de Barranquitas Mazda te contactará con la cotización exacta. ¿Te gustaría que te escribamos por WhatsApp o prefieres una llamada?`;
    }
    return `¡Perfecto! Ya registré tu número (**${contactInfo}**). Para poner la cotización de la **${activeVehicle.name}** formalmente a tu nombre, ¿con quién tengo el gusto?`;
  }

  // 2. If user introduced themselves
  if (currentName && !q.includes('?')) {
    if (previousPhone) {
      return `¡Mucho gusto, **${currentName}**! Tu ficha para la **${activeVehicle.name}** está lista. ¿Prefieres que te pasemos los números por WhatsApp o prefieres pasar por el dealer a probarla?`;
    }
    return `¡Un placer saludarte, **${currentName}**! Con mucho gusto te oriento con la **${activeVehicle.name}**. ¿Qué dudas tienes sobre el carro o su financiamiento?`;
  }

  // 3. Negations / "No", "Sin pronto", "No tengo trade in", "Cero"
  const isNegative = /^(no|nop|no tengo|ninguno|ninguna|nada|cero|sin pronto|cero pronto|sin trade in|no trade in|no tengo trade in|no tengo trade-in|no tengo pronto|0|ningun pronto)$/i.test(q) || 
                     (q.startsWith('no ') && q.length < 28) ||
                     (q.includes('no tengo') && q.length < 35);
  
  if (isNegative) {
    if (lastAssistantMsg.includes('pronto') || lastAssistantMsg.includes('trade-in') || lastAssistantMsg.includes('pago')) {
      return `¡Cero estrés! No te preocupes, en Barranquitas Mazda trabajamos opciones con 100% de financiamiento (cero pronto) y bonos de dealer para que el pago de la **${activeVehicle.name}** te quede súper cómodo. ¿Tienes algún presupuesto mensual aproximado que te convenga?`;
    }
    if (lastAssistantMsg.includes('prueba') || lastAssistantMsg.includes('cita')) {
      return `¡Entendido! Si prefieres evaluar los números con calma desde tu casa antes de pasar por el dealer, te podemos enviar la corrida digital y fotos por WhatsApp. ¿Te parece bien?`;
    }
    return `¡Tranquilo, no hay problema! Cuéntame, ¿qué modelo te llama más la atención o qué presupuesto tienes en mente?`;
  }

  // 4. Affirmations / "Si", "Claro", "Dale", "Me interesa", "Ok"
  const isAffirmative = /^(su|si|sí|sip|sii|siip|yes|ok|okay|claro|dale|seguro|por favor|me gustaria|me gustaría|me interesa|quiero evaluar|evaluar|correcto|exacto)$/i.test(q);
  if (isAffirmative) {
    if (lastAssistantMsg.includes('financiamiento') || lastAssistantMsg.includes('pronto') || lastAssistantMsg.includes('trade-in')) {
      return `¡Excelente! Para prepararte la corrida más cómoda para la **${activeVehicle.name}**, ¿cuentas con algún pronto o tienes algún carro para trade-in? (O si prefieres, déjame tu WhatsApp y un asesor te la envía al momento).`;
    }
    if (lastAssistantMsg.includes('prueba') || lastAssistantMsg.includes('cita')) {
      return `¡Súper! Nos encantará recibirte en Barranquitas Mazda para que pruebes la **${activeVehicle.name}**. ¿Te viene mejor pasar hoy o durante el fin de semana?`;
    }
    return `¡Dale, perfecto! ¿Qué detalle te gustaría conocer primero sobre la **${activeVehicle.name}** o prefieres cotizar pagos?`;
  }

  // 5. Specific Stock / VIN
  const foundByStock = INVENTORY.find(v => {
    const stockMatch = v.stock && v.stock !== 'N/A' && q.includes(v.stock.toLowerCase());
    const vinMatch = v.vin && v.vin.length > 5 && q.includes(v.vin.toLowerCase());
    return stockMatch || vinMatch;
  });
  if (foundByStock) {
    return `¡Esa unidad está disponible! La **${foundByStock.make} ${foundByStock.model} ${foundByStock.year} ${foundByStock.trim} (Stock #${foundByStock.stock})** en color **${foundByStock.color}** está en **$${foundByStock.price.toLocaleString()}** (con mensualidades estimadas desde ~$${foundByStock.estimatedMonthly}/mes). Viene con tracción i-ACTIV AWD de serie. ¿Te gustaría coordinar una prueba de manejo o ver opciones de pago?`;
  }

  // 6. Negotiations / Discounts / Best Price
  if (q.includes('negociable') || q.includes('descuento') || q.includes('rebaja') || q.includes('mejor precio') || q.includes('oferta') || q.includes('bono') || q.includes('lo menos')) {
    return `¡Te entiendo al 100%! En Barranquitas Mazda siempre buscamos la vuelta para que el negocio te convenga y el pago mensual te quede cómodo. Nuestros gerentes tienen bonos de fábrica y tasación competitiva para trade-in. ¿Tienes algún auto para entregar o algún pronto en mente?`;
  }

  // 7. Objections & Consumer Reports (CX-5)
  if (q.includes('consumer report') || q.includes('5 reasons') || q.includes('critica') || q.includes('pantalla') || q.includes('perilla') || q.includes('plastico')) {
    return `¡Qué buena observación! Es totalmente cierto: el rediseño del CX-5 2026 cambió a pantalla táctil de 15.6" y tiene su curva de aprendizaje los primeros días. Pero en chasis, insonorización y confiabilidad del motor 2.5L con AWD de serie es una maravilla de guagua. ¿Te gustaría verla en persona para que la sientas en carretera?`;
  }

  // 8. Specific models
  if (/\b(cx[-_ ]?50)\b/i.test(q)) {
    return `La **Mazda CX-50 2026** está espectacular: es más ancha, con mayor altura y selector Mi-Drive para caminos difíciles. Tenemos disponible la versión **Hybrid de 38 MPG** y la **Turbo de 256 HP**. ¿Buscas más rendimiento en gasolina o potencia de remolque?`;
  }
  if (/\b(cx[-_ ]?70)\b/i.test(q)) {
    return `La **Mazda CX-70 2026** es puro lujo y fuerza: motor 3.3L Turbo 6 en Línea (hasta 340 HP), interior en piel Nappa y espacio comodísimo para 5 pasajeros. ¿Te gustaría pasar a probarla en carretera?`;
  }
  if (/\b(cx[-_ ]?90)\b/i.test(q) || q.includes('3 fila') || q.includes('7 pasajero') || q.includes('8 pasajero')) {
    return `La **Mazda CX-90 2026** es nuestra SUV insignia de 3 filas (para 7 u 8 pasajeros) con motor 3.3L Turbo 6 en Línea y acabados premium. ¿Buscas asientos tipo capitán en la segunda fila o banco corrido para 8 personas?`;
  }
  if (/\b(cx[-_ ]?30)\b/i.test(q)) {
    return `La **Mazda CX-30 2026** es una de las favoritas: 191 HP, compacta para la ciudad y con tracción **i-ACTIV AWD® de serie** en todos los modelos desde $35,995 (~$435/mes). ¿Qué color exterior te gusta más?`;
  }
  if (/\b(cx[-_ ]?5)\b/i.test(q)) {
    return `La **Mazda CX-5 2026 rediseñada** viene con pantalla panorámica de 15.6", motor 2.5L de 187 HP y tracción AWD estándar desde $40,995. ¿Te gustaría evaluarla con algún pronto o trade-in?`;
  }

  // 9. Commercials / Pickups
  if (q.includes('tacoma') || q.includes('tundra') || q.includes('pickup') || q.includes('comercial')) {
    return `¡Tenemos pickups y guaguas de trabajo listas en inventario! Tenemos Toyota Tacoma, Tundra 4WD y vans comerciales con excelentes planes de financiamiento. ¿La buscas para uso personal o para tu negocio?`;
  }

  // 10. Trade-in / Financing
  if (q.includes('trade') || q.includes('pago') || q.includes('financ') || q.includes('cuota') || q.includes('banco') || q.includes('coop')) {
    return `En Barranquitas Mazda trabajamos con todos los bancos y cooperativas de Puerto Rico. Te aceptamos el trade-in con o sin deuda con la mejor tasación de la isla para cuadrarte un pago cómodo para la **${activeVehicle.name}**. ¿Tienes algún modelo en mente para trade-in?`;
  }

  // Default natural conversational response
  return `¡Hola! Con mucho gusto te ayudo a conseguir el carro ideal con el negocio más cómodo en Barranquitas Mazda. ¿Estás buscando algún modelo en particular o te gustaría que evaluemos pagos según tu presupuesto?`;
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
          model: 'gemini-3.7-flash',
          contents: geminiContents,
          config: {
            systemInstruction: MAZDA_SYSTEM_PROMPT,
            temperature: 0.85,
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
