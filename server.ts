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
Eres Shakira, la Asesora Virtual de Ventas experta y Ejecutiva de Barranquitas Mazda en Puerto Rico.
Representas la tecnología inteligente de nuestra plataforma.

[PERSONALIDAD Y TONO]
- Eres cálida, empática, profesional, dinámica y conocedora del mercado automotriz en Puerto Rico.
- Hablas en español boricua natural y profesional (términos como "carro", "guagua", "pronto", "trade-in", "pago cómodo", "tablilla").
- Tu objetivo principal es orientar al comprador con transparencia, resolver dudas sobre especificaciones y agendar una cita o prueba de manejo.

[REGLAS CLAVE PERMANENTES DEL ASISTENTE]
1. Saludo inicial: Preséntate como Shakira y haz una pregunta abierta para entender si el cliente busca un pago mensual específico, un modelo en particular o si tiene trade-in.
2. Manejo de pagos: Siempre que se hable de financiamiento o precios mensuales, incluye la nota: "Los pagos mostrados son estimados. El pago final depende del crédito, pronto, plazo, intereses, cargos y aprobación de la institución financiera."
3. Disponibilidad: NUNCA digas simplemente que un vehículo no existe. Pide nombre y teléfono para que un asesor valide en el sistema si la unidad está en inventario o si hay una equivalente recién llegada.
4. Consentimiento: Antes de registrar formalmente el lead, solicita la autorización: "¿Me autorizas a enviar tu información al asesor del dealer para coordinar tu cita o darte seguimiento por WhatsApp/SMS?"
5. Especificaciones y Datos Oficiales Mazda 2025-2026:
   - i-ACTIV AWD® es DE SERIE en TODOS los trims de TODOS los modelos SUV de Mazda (CX-30, CX-5, CX-50, CX-70, CX-90). Nunca es opcional ni hay que cobrarlo aparte.
   - El CX-5 2026 está totalmente rediseñado (pantalla hasta 15.6"), integra los controles de aire acondicionado en su pantalla táctil (NO tiene perillas físicas). IMPORTANTE: CX-5 2026 NO tiene opción turbo; redirigir a CX-50 Turbo si buscan potencia.
   - CX-50 Turbo SIGUE DISPONIBLE para 2026 (256 HP). CX-50 es enfocado a la aventura (Mi-Drive). CX-50 Hybrid entrega hasta 38 MPG combinado.
   - El CX-70 es la SUV de 2 filas Premium. Es de 5 pasajeros fijos (NUNCA lleva asientos capitán, siempre banco). M-Hybrid Boost 48V de serie en gasolina. CX-70 PHEV SÍ ofrece interior Tan Nappa.
   - El CX-90 es el buque insignia de 3 filas (hasta 8 pasajeros), plataforma de tracción trasera, motor longitudinal 6 en línea. IMPORTANTE: CX-90 PHEV NUNCA ofrece interior Tan Nappa (solo negro o blanco/gris).
   - Nombres de trim de Puerto Rico mandan.
   - Ángulos de venta clave: 
     * CX-30: Único en su categoría con AWD de serie en todos los niveles.
     * CX-5: Siente como carro más caro, valora manejo sobre MPG puro (RAV4/CR-V).
     * CX-50: Aventura, opción híbrida superior en MPG (38) a Subaru Outback.
     * CX-70: Poder de CX-90 sin necesitar 3ra fila, remolca 5,000 lbs.
     * CX-90: Manejo y lujo tipo europeo a precio de japonesa.

[RECOMENDACIÓN POR PERFIL]
- Economía + AWD sin pagar extra: CX-30 S
- Estilo moderno, inalámbrico: CX-30 Carbon Edition
- Espacio familiar + tecnología: CX-5 Premium Plus
- Ahorro gasolina + manejo Mazda: CX-50 Hybrid
- Aventura/outdoor con lujo: CX-50 Meridian / Turbo Premium Plus
- Poder SUV grande sin 3ra fila: CX-70
- Familia grande, lujo europeo: CX-90
- Comparando lujo pero preocupado por precio: CX-90 Turbo S Premium Plus
`;

function generateSmartFallback(lastMsg: string, allMessages: any[] = []): string {
  const q = (lastMsg || '').toLowerCase();
  
  // Check if referencing a specific stock number or model in inventory
  const foundByStock = INVENTORY.find(v => {
    const stockMatch = v.stock && v.stock !== 'N/A' && q.includes(v.stock.toLowerCase());
    const vinMatch = v.vin && v.vin.length > 5 && q.includes(v.vin.toLowerCase());
    return stockMatch || vinMatch;
  });
  if (foundByStock) {
    const isMazdaAWD = foundByStock.make.toLowerCase() === 'mazda' && foundByStock.specs.drivetrain.toUpperCase() === 'AWD';
    const displayDrivetrain = isMazdaAWD ? 'i-ACTIV AWD® de serie' : foundByStock.specs.drivetrain;

    return `¡Excelente elección! El vehículo **${foundByStock.make} ${foundByStock.model} ${foundByStock.year} ${foundByStock.trim} (Stock #${foundByStock.stock})** en color **${foundByStock.color}** está disponible en inventario por **$${foundByStock.price.toLocaleString()}** (~$${foundByStock.estimatedMonthly}/mes*).\n\nCuenta con motor ${foundByStock.specs.engine}, **${foundByStock.specs.horsepower}**, tracción **${displayDrivetrain}** y ${foundByStock.mileage === 0 ? '0 millas (nuevo)' : `${foundByStock.mileage.toLocaleString()} millas (Certificado)`}.\n\n*Nota: Los pagos mostrados son estimados. El pago final depende del crédito, pronto, plazo, intereses, cargos y aprobación de la institución financiera.*\n\n¿Me autorizas a enviar tu información al asesor del dealer para coordinar tu cita o darte seguimiento por WhatsApp/SMS?`;
  }

  // Comerciales / Pickups / Guaguas de Trabajo
  if (q.includes('comercial') || q.includes('pickup') || q.includes('pick up') || q.includes('tacoma') || q.includes('tundra') || q.includes('trabajo') || q.includes('camion') || q.includes('carga') || q.includes('carnival') || q.includes('santa cruz')) {
    return `¡Saludos! En inventario contamos con excelentes unidades comerciales y pickups listas para trabajar en Puerto Rico:\n\n- **2022 Toyota Tundra 4WD SR5 (V6 / 4x4)**: Stock #601809 por **$39,995** (~$600/mes*)\n- **2025 Toyota Tacoma 2WD SR**: Stock #616425 por **$35,995** (~$540/mes*)\n- **2024 Toyota Tacoma 2WD SR5**: Stock #607880 por **$42,995** (~$645/mes*)\n- **2022 Toyota Tacoma 2WD SR**: Stock #581673 por **$25,995** (~$390/mes*)\n- **2024 Hyundai Santa Cruz SE**: Stock #607883 por **$32,995** (~$495/mes*)\n- **2024 Kia Carnival LX (Van de Pasajeros/Carga)**: Stock #594410 por **$29,995** (~$450/mes*)\n\n*Nota: Los pagos mostrados son estimados. El pago final depende del crédito, pronto, plazo, intereses, cargos y aprobación de la institución financiera.*\n\n¿Buscas una pickup para uso personal o para cuenta comercial/negocio?`;
  }

  // CX-90 specifically (3 Filas / 7-8 Pasajeros)
  if (q.includes('cx-90') || q.includes('cx90') || q.includes('3 fila') || q.includes('3 filas') || q.includes('tres fila') || q.includes('7 pasajero') || q.includes('8 pasajero') || q.includes('grand highlander') || q.includes('pilot') || q.includes('telluride')) {
    const cx90 = INVENTORY.find(v => v.model === 'CX-90') || { stock: '596193', price: 64995, estimatedMonthly: 975, year: 2026, trim: 'Premium Sport' };
    return `¡Saludos! Tenemos disponible la **Mazda CX-90 2026 Premium Sport (Stock #${cx90.stock})**: nuestro buque insignia de **3 filas de asientos (hasta 8 pasajeros)** equipado con el poderoso motor **3.3L Turbo 6 en Línea**, tracción longitudinal **i-ACTIV AWD® con preferencia trasera** y acabados de lujo artesanal japonés por **$${cx90.price.toLocaleString()}** (~$${cx90.estimatedMonthly}/mes*).\n\n*Los pagos son estimados sujetos a aprobación de crédito y pronto.*\n\n¿Buscas la versión para 7 u 8 pasajeros, o tienes un auto para trade-in?`;
  }

  // Solo Nuevos / Inventario Completo
  if (q.includes('nuevo') && (q.includes('solo') || q.includes('0 milla') || q.includes('cero milla') || q.includes('estrenar') || q.includes('2026'))) {
    return `¡Por supuesto! En nuestra sección de **Solo Nuevos** contamos con modelos 2026 recién llegados como el **CX-5 2026 rediseñado**, la **CX-50 Híbrida (38 MPG)**, la **CX-70 Turbo S (340 HP)**, el buque insignia de 3 filas **CX-90** y las **CX-30 2026** — todas con **i-ACTIV AWD® de serie** y garantía de fábrica completa.\n\n*Los pagos mostrados son estimados sujetos a aprobación de crédito y pronto.*\n\n¿Te gustaría cotizar un modelo nuevo en específico?`;
  }

  // CX-70 specifically
  if (q.includes('cx-70') || q.includes('cx70')) {
    const cx70 = INVENTORY.find(v => v.model === 'CX-70') || INVENTORY[0];
    return `¡Saludos! La **Mazda CX-70 2026 3.3 Turbo S Premium Plus (Stock #${cx70.stock})** es una máquina impresionante: motor **3.3L Turbo 6 en Línea con 340 HP**, tracción trasera con **i-ACTIV AWD® predictivo**, interior en piel Nappa y configuración de 5 pasajeros con baúl gigante por **$${cx70.price.toLocaleString()}** (~$${cx70.estimatedMonthly}/mes*).\n\n*Los pagos son estimados sujetos a aprobación de crédito y pronto.*\n\n¿Tienes algún auto para trade-in o te gustaría agendar una prueba de manejo hoy?`;
  }

  // Híbridos / Mild Hybrids
  if (q.includes('hibrid') || q.includes('hybrid') || q.includes('phev') || q.includes('mhev')) {
    return `¡Excelente pregunta! Mazda cuenta con una innovadora línea electrificada en nuestro inventario:\n\n- **Mazda CX-50 Hybrid**: Excelente economía de combustible de hasta **38 MPG combinado**.\n- **Mazda CX-70 y CX-90 MHEV (Mild Hybrid)**: Equipadas con el sistema *M-Hybrid Boost* y motor 3.3L Turbo, combinando alto desempeño (hasta 340 HP) con un consumo muy eficiente.\n- **Mazda CX-70 y CX-90 PHEV (Plug-in Hybrid)**: Te permiten manejar diariamente en modo 100% eléctrico (aprox. 26 millas) y usar gasolina para viajes largos.\n\nTodos incluyen tracción i-ACTIV AWD de serie.\n\n¿Te interesa un híbrido enfocado en economía extrema (CX-50) o en potencia/lujo con espacio extra (CX-70 / CX-90)?`;
  }

  // CX-50 specifically
  if (q.includes('cx-50') || q.includes('cx50')) {
    const cx50 = INVENTORY.find(v => v.model === 'CX-50') || INVENTORY[1];
    return `¡Hola! Tenemos disponible la **Mazda CX-50 Hybrid Premium Plus (Stock #${cx50.stock})** en color Soul Red Crystal. Ofrece una economía sobresaliente de **38 MPG combinado**, tracción e-AWD inteligente, techo panorámico y acabados premium por **$${cx50.price.toLocaleString()}** (~$${cx50.estimatedMonthly}/mes*).\n\n*Los pagos mostrados son estimados. El pago final depende de la institución financiera y pronto aportado.*\n\n¿Me autorizas a comunicarte con un asesor para agendar tu cita?`;
  }

  // CX-30 / Compact
  if (q.includes('cx-30') || q.includes('cx30') || q.includes('aire edition') || q.includes('corolla') || q.includes('hr-v') || q.includes('hrv')) {
    const cx30 = INVENTORY.find(v => v.model === 'CX-30') || INVENTORY[2];
    return `¡Hola! Te orienta **Shakira**. La **Mazda CX-30 2026 (Stock #${cx30.stock})** es la favorita en Puerto Rico porque incluye **i-ACTIV AWD® de serie en todos los trims**, mientras que el Corolla Cross o HR-V te lo cobran como un paquete adicional o vienen sólo FWD. La tenemos desde **$35,995** (~$435/mes*).\n\n*Pagos estimados sujetos a crédito y pronto inicial.*\n\n¿Te gustaría evaluar tu pago mensual con tu pronto o entregar un trade-in?`;
  }

  // CX-5
  if (q.includes('cx-5') || q.includes('cx5') || q.includes('rav4') || q.includes('cr-v') || q.includes('crv')) {
    return `¡Saludos! El **Mazda CX-5 2026** llega rediseñado con tecnología de punta: pantalla táctil con control de A/C 100% digital integrado, mayor insonorización e **i-ACTIV AWD® estándar** en todos los modelos desde $40,995.\n\n*Los pagos mostrados son estimados.*\n\n¿Buscas la versión Select o prefieres el equipamiento Premium con techo y piel?`;
  }

  // Trade-in / Financiamiento / Pagos / Pronto
  if (q.includes('trade') || q.includes('pago') || q.includes('financ') || q.includes('precalific') || q.includes('cuota') || q.includes('interes') || q.includes('credito') || q.includes('crédito')) {
    return `¡Con gusto te ayudo! En DealerAmigo trabajamos con todas las instituciones bancarias y cooperativas locales en Puerto Rico. Aceptamos tu Trade-In con la mejor tasación del mercado y puedes precalificar aquí mismo sin afectar tu crédito.\n\n*Recuerda: Los pagos mostrados son estimados. El pago final depende del crédito, pronto, plazo, intereses, cargos y aprobación de la institución financiera.*\n\n¿Cuál es el pago mensual ideal que se ajusta a tu presupuesto?`;
  }

  // Cita / Ubicacion / Telefono / WhatsApp / Contacto
  if (q.includes('cita') || q.includes('ubicacion') || q.includes('direcci') || q.includes('dealer') || q.includes('whatsapp') || q.includes('telefono') || q.includes('probar') || q.includes('test drive')) {
    return `¡Excelente! Para coordinar tu cita VIP o prueba de manejo de inmediato, ¿me autorizas a enviar tu información y número de teléfono al asesor de ventas para darte seguimiento por WhatsApp/SMS?`;
  }

  // Detect if user provided a phone number or email
  const phoneMatch = q.match(/(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/);
  const emailMatch = q.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  
  if (phoneMatch || emailMatch) {
    return `¡Gracias! He guardado tu información de contacto de manera segura. Un gerente de ventas de Barranquitas Mazda se comunicará contigo a la brevedad para brindarte un servicio VIP. ¡Que tengas un excelente día!`;
  }

  // Affirmations (Sí, claro, ok, dale)
  if (q === 'si' || q === 'sí' || q === 'ok' || q === 'claro' || q === 'dale' || q === 'seguro' || q === 'yes') {
    return `¡Excelente! Por favor, escríbeme tu número de teléfono (ej. 787-123-4567) para que un asesor te asista de inmediato con las opciones en nuestro sistema.`;
  }

  // Default welcome / general guidance
  // If we already have some history, don't repeat the long welcome.
  if (allMessages.length > 2) {
    return `¡Entendido! Para poder darte el mejor servicio y verificar las opciones exactas en nuestro sistema, ¿me podrías brindar tu número de teléfono para que un asesor te asista de inmediato?`;
  }

  return `¡Hola! 👋 Mi nombre es **Shakira**, tu asesora virtual de ventas en DealerAmigo Puerto Rico.\n\nTenemos inventario físico disponible de **CX-30, CX-5 (2026), CX-50 Híbrida, CX-70 y CX-90 (3 filas)**, todas con **i-ACTIV AWD® de serie**.\n\n¿Estás buscando un modelo específico, un pago mensual cómodo para tu presupuesto o tienes un vehículo para trade-in?`;
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
        const geminiMessages = messages.map((msg: any) => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }]
        }));

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: geminiMessages,
          config: {
            systemInstruction: MAZDA_SYSTEM_PROMPT,
            temperature: 0.7,
          }
        });

        if (response.text) {
          return res.json({ text: response.text });
        }
      } catch (geminiError) {
        // Handled silently with domain-expert fallback
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
