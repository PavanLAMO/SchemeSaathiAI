/**
 * SchemeSaathi AI - Backend REST API Server with Live data.gov.in Integration
 * 
 * Features:
 * - Live data.gov.in multi-dataset querying with API Key support
 * - Dynamic dataset matching based on citizen multi-demographic criteria
 * - Voice NLP Slot-Filling parser
 * - Multi-Channel Notification Subscription (WhatsApp, SMS, Email, Push)
 */

const http = require('http');
const url = require('url');
const path = require('path');
const { DataGovService, DATA_GOV_DATASETS } = require('./services/dataGovService');

const PORT = process.env.PORT || 5000;

// Initialize data.gov.in API Service
const dataGovService = new DataGovService();

// In-Memory Notification Subscriptions Store
const notificationSubscriptions = new Map();

// Helper to send JSON responses with CORS enabled
function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key'
  });
  res.end(JSON.stringify(data));
}

// Helper to parse JSON body
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

// Contact Validator (Strict Email and Phone checks)
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PHONE_REGEX = /^[6-9]\d{9}$/;

function validateContact(channel, contact) {
  const val = (contact || '').trim();
  if (channel === 'email') {
    if (!val) return { valid: false, message: "Email address cannot be empty." };
    if (/^\d+$/.test(val)) return { valid: false, message: "Please enter a valid email address (e.g. name@example.com), not phone numbers." };
    if (!EMAIL_REGEX.test(val)) return { valid: false, message: "Please enter a valid email address with '@' and domain (e.g. user@gmail.com)." };
    return { valid: true, value: val };
  } else if (channel === 'whatsapp' || channel === 'sms') {
    const cleanPhone = val.replace(/\D/g, '').replace(/^91/, '');
    if (!PHONE_REGEX.test(cleanPhone)) {
      return { valid: false, message: `Please enter a valid 10-digit Indian mobile number for ${channel.toUpperCase()} alerts.` };
    }
    return { valid: true, value: cleanPhone };
  } else if (channel === 'browser') {
    return { valid: true, value: 'browser_push_device_token' };
  }
  return { valid: false, message: "Unsupported notification channel." };
}

// Multilingual Voice NLP Slot Extraction Engine
function parseVoiceSpeech(text) {
  const clean = (text || '').toLowerCase();
  const slots = { age: null, gender: null, area: null, cat: null, occ: null, inc: null };

  const ageMatch = clean.match(/(\d{1,2})\s*(?:year|years|yr|yrs|साल|वर्ष|సవంత్సరాల|వయస్సు)/i) || 
                   clean.match(/age\s*(?:is)?\s*(\d{1,2})/i);
  if (ageMatch) slots.age = parseInt(ageMatch[1], 10);

  if (/(?:woman|female|lady|girl|महिला|औरत|స్త్రీ|మహిళ)/i.test(clean)) slots.gender = "F";
  else if (/(?:man|male|boy|पुरुष|आदमी|పురుషుడు)/i.test(clean)) slots.gender = "M";

  if (/(?:village|rural|gram|panchayat|गाँव|ग्राम|పల్లె|గ్రామం)/i.test(clean)) slots.area = "rural";
  else if (/(?:city|urban|town|nagar|शहर|नगर|పట్టణం)/i.test(clean)) slots.area = "urban";

  if (/\b(?:sc|scheduled caste|दलित|షెడ్యూల్డ్ కులం)\b/i.test(clean)) slots.cat = "SC";
  else if (/\b(?:st|scheduled tribe|tribal|आदिवासी|షెడ్యూల్డ్ తెగ)\b/i.test(clean)) slots.cat = "ST";
  else if (/\b(?:obc|other backward|पिछड़ा वर्ग|బీసీ)\b/i.test(clean)) slots.cat = "OBC";
  else if (/\b(?:general|open|सामान्य)\b/i.test(clean)) slots.cat = "Gen";

  if (/(?:farmer|kisan|agriculture|खेती|किसान|రైతు)/i.test(clean)) slots.occ = "Farmer";
  else if (/(?:student|studying|विद्यार्थी|छात्र|విద్యార్థి)/i.test(clean)) slots.occ = "Student";
  else if (/(?:labour|daily wage|मजदूर|श्रमिक|కూలీ)/i.test(clean)) slots.occ = "Labour";
  else if (/(?:unemployed|jobless|बेरोजगार|నిరుద్యోగి)/i.test(clean)) slots.occ = "Unemp";
  else if (/(?:business|shop|व्यापार|दुकान|వ్యాపారం)/i.test(clean)) slots.occ = "Business";

  const incMatch = clean.match(/(\d+(?:\.\d+)?)\s*(?:lakh|lac|लाख|లక్ష)/i);
  if (incMatch) slots.inc = parseFloat(incMatch[1]);

  return slots;
}

// HTTP Server Request Handler
async function requestHandler(req, res) {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;
  const query = parsedUrl.query;

  // Handle CORS Preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key'
    });
    return res.end();
  }

  // 1. GET /api/health
  if (method === 'GET' && pathname === '/api/health') {
    const currentKey = dataGovService.getApiKey();
    const maskedKey = currentKey.length > 8 ? `${currentKey.substring(0, 4)}...${currentKey.substring(currentKey.length - 4)}` : 'SET';
    return sendJSON(res, 200, {
      status: "UP",
      service: "SchemeSaathi AI API with Live data.gov.in Support",
      dataGovApiKeyStatus: maskedKey,
      registeredDatasets: Object.keys(DATA_GOV_DATASETS).length,
      timestamp: new Date().toISOString()
    });
  }

  /* =========================================================================
   * DATA.GOV.IN LIVE API ENDPOINTS
   * ========================================================================= */

  // 2. GET /api/data-gov/datasets - List all registered multi-sector datasets
  if (method === 'GET' && pathname === '/api/data-gov/datasets') {
    return sendJSON(res, 200, {
      success: true,
      totalDatasets: Object.keys(DATA_GOV_DATASETS).length,
      datasets: dataGovService.getRegisteredDatasets()
    });
  }

  // 3. GET /api/data-gov/live-schemes - Fetch records from a live dataset
  if (method === 'GET' && pathname === '/api/data-gov/live-schemes') {
    const datasetKey = query.datasetKey || 'AGRICULTURE_PMKISAN';
    const state = query.state || null;
    const limit = parseInt(query.limit, 10) || 10;

    try {
      const data = await dataGovService.fetchDataset(datasetKey, { state, limit });
      return sendJSON(res, 200, { success: true, data });
    } catch (err) {
      return sendJSON(res, 500, { success: false, message: err.message });
    }
  }

  // 4. POST /api/data-gov/match - Match citizen requirements across multiple datasets
  if (method === 'POST' && pathname === '/api/data-gov/match') {
    try {
      const body = await parseBody(req);
      const profile = body.profile || body;
      const matchedResults = await dataGovService.matchRequirementsAcrossDatasets(profile, { state: profile.state });
      return sendJSON(res, 200, {
        success: true,
        matchedCount: matchedResults.length,
        results: matchedResults
      });
    } catch (err) {
      return sendJSON(res, 400, { success: false, message: "Invalid JSON body: " + err.message });
    }
  }

  // 5. POST /api/data-gov/config - Update the data.gov.in API Key
  if (method === 'POST' && pathname === '/api/data-gov/config') {
    try {
      const body = await parseBody(req);
      if (!body.apiKey) {
        return sendJSON(res, 400, { success: false, message: "Missing apiKey field" });
      }
      dataGovService.setApiKey(body.apiKey);
      return sendJSON(res, 200, {
        success: true,
        message: "data.gov.in API Key successfully updated!",
        keyPreview: `${body.apiKey.substring(0, 4)}...${body.apiKey.substring(body.apiKey.length - 4)}`
      });
    } catch (err) {
      return sendJSON(res, 400, { success: false, message: "Invalid JSON body" });
    }
  }

  // 6. POST /api/voice/parse
  if (method === 'POST' && pathname === '/api/voice/parse') {
    try {
      const body = await parseBody(req);
      const slots = parseVoiceSpeech(body.speechText || '');
      return sendJSON(res, 200, { success: true, input: body.speechText, slots });
    } catch (err) {
      return sendJSON(res, 400, { success: false, message: "Invalid JSON body" });
    }
  }

  // 7. POST /api/notifications/subscribe
  if (method === 'POST' && pathname === '/api/notifications/subscribe') {
    try {
      const body = await parseBody(req);
      const { schemeName, channel, contact } = body;
      const check = validateContact(channel, contact);
      if (!check.valid) {
        return sendJSON(res, 422, { success: false, message: check.message });
      }

      const key = `${schemeName}_${check.value}`;
      notificationSubscriptions.set(key, {
        schemeName,
        channel,
        contact: check.value,
        timestamp: new Date().toISOString()
      });

      return sendJSON(res, 200, {
        success: true,
        message: "You're subscribed! We'll notify you as soon as this scheme is back online.",
        subscription: notificationSubscriptions.get(key)
      });
    } catch (err) {
      return sendJSON(res, 400, { success: false, message: "Invalid JSON body" });
    }
  }

  // 8. POST /api/notifications/unsubscribe
  if (method === 'POST' && pathname === '/api/notifications/unsubscribe') {
    try {
      const body = await parseBody(req);
      const { schemeName, contact } = body;
      const key = `${schemeName}_${(contact || '').trim()}`;
      notificationSubscriptions.delete(key);
      return sendJSON(res, 200, { success: true, message: "Successfully unsubscribed." });
    } catch (err) {
      return sendJSON(res, 400, { success: false, message: "Invalid JSON body" });
    }
  }

  // 404
  return sendJSON(res, 404, { success: false, message: "Endpoint not found" });
}

const server = http.createServer(requestHandler);

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`SchemeSaathi AI Backend Server running at http://localhost:${PORT}`);
    console.log(`data.gov.in Multi-Dataset API connected across ${Object.keys(DATA_GOV_DATASETS).length} sectors.`);
  });
}

module.exports = {
  server,
  requestHandler,
  dataGovService,
  validateContact,
  parseVoiceSpeech
};
