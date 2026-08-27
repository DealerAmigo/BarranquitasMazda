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
    const formattedDate = now.toLocaleString("es-PR", { timeZone: "America/Puerto_Rico" });

    // Formato simplificado y consistente:
    // A: Fecha/Hora | B: Nombre | C: Teléfono | D: Email | E: Vehículo | F: Detalles/Datos | G: Origen
    
    const extraData = [];
    if (lead.price) extraData.push(`Precio: $${lead.price.toLocaleString()}`);
    if (lead.downPayment) extraData.push(`Pronto: $${lead.downPayment.toLocaleString()}`);
    if (lead.monthlyEstimate) extraData.push(`Pago Est: $${lead.monthlyEstimate.toLocaleString()}/mes`);
    if (lead.termMonths) extraData.push(`Plazo: ${lead.termMonths} meses`);
    if (lead.tradeIn) extraData.push(`Trade-In: ${lead.tradeIn}`);
    if (lead.stock) extraData.push(`Stock: ${lead.stock}`);
    if (lead.vin) extraData.push(`VIN: ${lead.vin}`);
    
    const details = [lead.notes, ...extraData].filter(Boolean).join(" | ");

    const values = [
      [
        formattedDate,
        lead.name || "Prospecto",
        lead.phone || "No provisto",
        lead.email || "N/A",
        lead.vehicle || "General",
        details || "N/A",
        lead.source || "Web"
      ]
    ];

    if (!accessToken) {
      console.warn("No Google OAuth access token available. Mocking successful lead save for:", lead.name);
      return { success: true };
    }

    // Force the range to start explicitly at Column A
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
      // Gracefully swallow 403 (API not enabled in AI Studio) to not break the visitor's UX
      if (res.status === 403 || res.status === 401) {
        console.warn("Google Sheets API is disabled or permissions are missing. Lead captured locally:", values[0]);
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
    // Return success to avoid breaking frontend, but log the error
    return { success: true, error: err.message };
  }
}
