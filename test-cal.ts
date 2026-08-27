import { GoogleAuth } from 'google-auth-library';
import fetch from 'node-fetch';

async function test() {
  const auth = new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/calendar']
  });
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  
  const calId = "4b88a04ce85c4b7cfe9e0bd55f29cd3bcdc79ce0148d6846e03c54ac32faca0c@group.calendar.google.com";
  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calId)}/events`;
  
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token.token}` }
  });
  console.log(res.status);
  const data = await res.json();
  console.log(data);
}
test().catch(console.error);
