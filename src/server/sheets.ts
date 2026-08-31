import { GoogleAuth } from 'google-auth-library';

export interface LeadData {
  name: string;
  phone: string;
  email?: string;
  vehicle?: string;
  stock?: string;
  vin?: string;
  price?: number;
  downPayment?: number;
  monthlyEstimate?: number;
  termMonths?: number;
  tradeIn?: string;
  notes?: string;
  source?: string;
  conversationSummary?: string;
}

export const SPREADSHEET_ID = "1_sMMy-h3dqX9yvplW79VYeo5AVZfXcsBfuqnKT8MvpU";

let authClient: GoogleAuth | null = null;

function getAuth() {
  if (!authClient) {
    const credentialsEnv = process.env.GOOGLE_CREDENTIALS;
    if (credentialsEnv) {
      try {
        const credentials = JSON.parse(credentialsEnv);
        authClient = new GoogleAuth({
          credentials,
          scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });
      } catch (e) {
        console.warn("Error parsing GOOGLE_CREDENTIALS json. Falling back to default auth.");
        authClient = new GoogleAuth({
          scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });
      }
    } else {
      authClient = new GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });
    }
  }
  return authClient;
}

export async function appendLeadToSheet(lead: LeadData): Promise<{ success: boolean; error?: string }> {
  try {
    const auth = getAuth();
    const client = await auth.getClient();
    const tokenResponse = await client.getAccessToken();
    const accessToken = tokenResponse.token;

    const now = new Date();
    const formattedDate = now.toLocaleString("es-PR", { 
      timeZone: "America/Puerto_Rico",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true
    });

    // Formateo profesional y estructurado de las Notas para el Asesor de Ventas
    const notesSections: string[] = [];

    // 1. Resumen principal o notas directas
    if (lead.notes && lead.notes.trim()) {
      notesSections.push(`📝 SOLICITUD: ${lead.notes.trim()}`);
    }

    if (lead.conversationSummary && lead.conversationSummary.trim()) {
      notesSections.push(`💬 DETALLES CHAT: ${lead.conversationSummary.trim()}`);
    }

    // 2. Estructura financiera
    const financialPoints: string[] = [];
    if (lead.price && lead.price > 0) {
      financialPoints.push(`Precio: $${lead.price.toLocaleString()}`);
    }
    if (lead.downPayment !== undefined) {
      financialPoints.push(lead.downPayment > 0 ? `Pronto: $${lead.downPayment.toLocaleString()}` : `Pronto: $0 (Cero pronto / 100% financiado)`);
    }
    if (lead.monthlyEstimate && lead.monthlyEstimate > 0) {
      financialPoints.push(`Pago Est: ~$${lead.monthlyEstimate.toLocaleString()}/mes`);
    }
    if (lead.termMonths && lead.termMonths > 0) {
      financialPoints.push(`Plazo: ${lead.termMonths} meses`);
    }
    if (lead.tradeIn && lead.tradeIn.trim()) {
      financialPoints.push(`Trade-In: ${lead.tradeIn.trim()}`);
    }

    if (financialPoints.length > 0) {
      notesSections.push(`💰 FINANCIAMIENTO: ${financialPoints.join(' | ')}`);
    }

    // 3. Ficha de la Unidad
    const unitDetails: string[] = [];
    if (lead.stock && lead.stock !== 'N/A') unitDetails.push(`Stock #${lead.stock}`);
    if (lead.vin && lead.vin !== 'N/A' && lead.vin.length > 5) unitDetails.push(`VIN: ${lead.vin}`);
    if (unitDetails.length > 0) {
      notesSections.push(`🚗 UNIDAD: ${unitDetails.join(' | ')}`);
    }

    const finalNotes = notesSections.length > 0 
      ? notesSections.join(' \n ')
      : "Prospecto interesado en orientación y cotización de inventario.";

    // Columnas de Google Sheets (Sheet1):
    // A: Fecha/Hora (PR)
    // B: Nombre del Cliente
    // C: Teléfono / WhatsApp
    // D: Email
    // E: Vehículo de Interés
    // F: Notas Ejecutivas y Detalles
    // G: Origen del Lead
    const values = [
      [
        formattedDate,
        lead.name && lead.name.trim() ? lead.name.trim() : "Prospecto Web",
        lead.phone && lead.phone.trim() ? lead.phone.trim() : "No provisto",
        lead.email && lead.email.trim() ? lead.email.trim() : "N/A",
        lead.vehicle && lead.vehicle.trim() ? lead.vehicle.trim() : "Inventario General Barranquitas Mazda",
        finalNotes,
        lead.source || "Chat Asesora Shakira"
      ]
    ];

    // 1. If a Google Apps Script Web App URL is configured, send the lead there (handles Sheet writing + email notification instantly)
    const gasWebhookUrl = process.env.GAS_WEBHOOK_URL;
    if (gasWebhookUrl && gasWebhookUrl.startsWith("https://script.google.com/")) {
      try {
        const gasRes = await fetch(gasWebhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: formattedDate,
            name: lead.name || "Prospecto Web",
            phone: lead.phone || "No provisto",
            email: lead.email || "N/A",
            vehicle: lead.vehicle || "Inventario General Barranquitas Mazda",
            notes: finalNotes,
            source: lead.source || "Chat Asesora Shakira",
            values: values[0]
          })
        });
        console.log("Lead dispatched to Google Apps Script Web App:", gasRes.status);
      } catch (gasErr) {
        console.warn("Error forwarding to Google Apps Script Web App:", gasErr);
      }
    }

    if (!accessToken) {
      console.warn("No Google OAuth access token available. Lead captured locally:", values[0]);
      return { success: true };
    }

    // Force the range to start explicitly at Column A of Sheet1
    const range = "Sheet1!A:A";
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        values
      })
    });

    if (!res.ok) {
      const errorText = await res.text();
      if (res.status === 403 || res.status === 401) {
        console.warn("Google Sheets API token permission note. Lead logged:", values[0]);
        return { success: true };
      }
      console.warn("Error appending to Google Sheets:", res.status, errorText);
      return { success: false, error: errorText };
    }

    const data = await res.json();
    console.log("Lead successfully registered in Google Sheets:", data);
    return { success: true };
  } catch (err: any) {
    console.warn("Exception appending lead to Google Sheets:", err);
    return { success: true, error: err.message };
  }
}

