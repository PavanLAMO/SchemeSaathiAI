/**
 * SchemeSaathi AI - Open Government Data (data.gov.in) Multi-Dataset API Service
 * 
 * Fetches real-time welfare scheme records from data.gov.in APIs using API keys
 * instead of relying on hardcoded URLs or static redirects.
 */

const https = require('https');
const url = require('url');

// Multi-Sector Dataset Registry on data.gov.in
const DATA_GOV_DATASETS = {
  AGRICULTURE_PMKISAN: {
    id: "9a22a518-5a33-4bab-8d12-1a3c3e6f5c8e",
    name: "PM-KISAN Samman Nidhi Scheme",
    ministry: "Ministry of Agriculture & Farmers Welfare",
    sector: "Agriculture & Allied",
    targetGroup: ["Farmer"],
    defaultBenefits: "₹6,000 per year direct income support in three equal installments to small & marginal farmer families.",
    officialPortal: "https://pmkisan.gov.in"
  },
  RURAL_HOUSING_PMAYG: {
    id: "ee380e71-de37-43e8-9860-2ff01c60b571",
    name: "Pradhan Mantri Awaas Yojana - Gramin (PMAY-G)",
    ministry: "Ministry of Rural Development",
    sector: "Rural Housing",
    targetGroup: ["BPL", "Rural", "SC", "ST", "Homeless"],
    defaultBenefits: "Financial grant of ₹1.20 Lakh in plain areas and ₹1.30 Lakh in hilly/difficult areas for pucca house construction.",
    officialPortal: "https://pmayg.nic.in"
  },
  HEALTH_AYUSHMAN: {
    id: "60127e2a-7bf4-4f0e-b7d5-d069e208c967",
    name: "Ayushman Bharat - PM Jan Arogya Yojana (PM-JAY)",
    ministry: "Ministry of Health and Family Welfare",
    sector: "Health & Healthcare",
    targetGroup: ["All", "BPL", "Low Income"],
    defaultBenefits: "Health cover of ₹5 Lakh per family per year for secondary and tertiary care hospitalization across public & private empanelled hospitals.",
    officialPortal: "https://nha.gov.in"
  },
  EMPLOYMENT_MGNREGA: {
    id: "3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69",
    name: "Mahatma Gandhi National Rural Employment Guarantee (MGNREGA)",
    ministry: "Ministry of Rural Development",
    sector: "Livelihood & Employment",
    targetGroup: ["Rural", "Labour", "Unemployed"],
    defaultBenefits: "Statutory guarantee of 100 days of wage employment per financial year to every rural household whose adult members volunteer to do unskilled manual work.",
    officialPortal: "https://nrega.nic.in"
  },
  TRIBAL_WELFARE_EMRS: {
    id: "43bb22f8-9a48-43d9-9524-814bfb2f567b",
    name: "Eklavya Model Residential Schools (EMRS)",
    ministry: "Ministry of Tribal Affairs",
    sector: "Tribal Welfare & Education",
    targetGroup: ["ST", "Student"],
    defaultBenefits: "100% free quality education with residential hostel accommodation, uniforms, books, and scholarship stipends for Scheduled Tribe students (Classes VI to XII).",
    officialPortal: "https://tribal.nic.in"
  },
  WOMEN_CHILD_PMMVY: {
    id: "5c58a8a6-8968-450b-9273-0663673c683b",
    name: "Pradhan Mantri Matru Vandana Yojana (PMMVY)",
    ministry: "Ministry of Women & Child Development",
    sector: "Women & Child Development",
    targetGroup: ["Woman", "Mother"],
    defaultBenefits: "Maternity benefit of ₹5,000 in direct cash transfer to pregnant women and lactating mothers for health nutrition support.",
    officialPortal: "https://pmmvy.wcd.gov.in"
  },
  MSME_PMEGP: {
    id: "15f9394b-483d-4c31-97b7-6f7c9e1f5791",
    name: "Prime Minister's Employment Generation Programme (PMEGP)",
    ministry: "Ministry of Micro, Small & Medium Enterprises",
    sector: "Entrepreneurship & Small Business",
    targetGroup: ["Business", "Self-Employed", "Artisan", "Unemployed"],
    defaultBenefits: "Credit-linked subsidy of 15% to 35% on bank loans up to ₹50 Lakh for manufacturing units and ₹20 Lakh for service enterprises.",
    officialPortal: "https://www.kviconline.gov.in"
  },
  SCHOLARSHIP_POSTMATRIC: {
    id: "72ea9825-f76c-48c2-9e22-e3e9d8e78299",
    name: "Post Matric Scholarship Scheme for SC/ST/OBC Students",
    ministry: "Ministry of Social Justice and Empowerment",
    sector: "Higher Education & Scholarships",
    targetGroup: ["Student", "SC", "ST", "OBC"],
    defaultBenefits: "Complete academic fee reimbursement plus monthly maintenance allowance for students pursuing post-matriculation courses.",
    officialPortal: "https://scholarships.gov.in"
  }
};

class DataGovService {
  constructor(apiKey = null) {
    // Read from process environment or fallback to developer key
    this.apiKey = apiKey || process.env.DATA_GOV_IN_API_KEY || "579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b";
    this.baseUrl = "https://api.data.gov.in/resource/";
    this.cache = new Map();
    this.cacheTTL = 15 * 60 * 1000; // 15 minutes in-memory cache
  }

  setApiKey(key) {
    if (key && key.trim()) {
      this.apiKey = key.trim();
      this.cache.clear(); // Invalidate cache on key change
      return true;
    }
    return false;
  }

  getApiKey() {
    return this.apiKey;
  }

  getRegisteredDatasets() {
    return Object.keys(DATA_GOV_DATASETS).map(key => ({
      key,
      resourceId: DATA_GOV_DATASETS[key].id,
      name: DATA_GOV_DATASETS[key].name,
      ministry: DATA_GOV_DATASETS[key].ministry,
      sector: DATA_GOV_DATASETS[key].sector,
      targetGroup: DATA_GOV_DATASETS[key].targetGroup
    }));
  }

  /**
   * Fetches data from a specific data.gov.in resource endpoint
   */
  async fetchDataset(datasetKey, options = {}) {
    const dataset = DATA_GOV_DATASETS[datasetKey];
    if (!dataset) {
      throw new Error(`Dataset key "${datasetKey}" not found in registry.`);
    }

    const limit = options.limit || 10;
    const offset = options.offset || 0;
    const stateFilter = options.state ? `&filters[state]=${encodeURIComponent(options.state)}` : '';

    const cacheKey = `${datasetKey}_${options.state || 'all'}_${limit}_${offset}`;
    const cached = this.cache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < this.cacheTTL)) {
      return cached.data;
    }

    const apiUrl = `${this.baseUrl}${dataset.id}?api-key=${this.apiKey}&format=json&limit=${limit}&offset=${offset}${stateFilter}`;

    return new Promise((resolve) => {
      const parsedUrl = new URL(apiUrl);

      const req = https.get(parsedUrl, { timeout: 8000 }, (res) => {
        let body = '';
        res.on('data', chunk => { body += chunk; });
        res.on('end', () => {
          try {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              const parsed = JSON.parse(body);
              const records = parsed.records || [];
              const normalized = {
                success: true,
                isLive: true,
                datasetKey,
                name: dataset.name,
                ministry: dataset.ministry,
                sector: dataset.sector,
                portal: dataset.officialPortal,
                totalRecords: parsed.total || records.length,
                benefits: dataset.defaultBenefits,
                liveData: records.slice(0, 5), // Include snippet of live data
                timestamp: new Date().toISOString()
              };

              this.cache.set(cacheKey, { timestamp: Date.now(), data: normalized });
              resolve(normalized);
            } else {
              // Graceful fallback with dataset metadata
              resolve(this.getFallbackData(datasetKey, `Live API returned status ${res.statusCode}`));
            }
          } catch (e) {
            resolve(this.getFallbackData(datasetKey, `JSON parse error: ${e.message}`));
          }
        });
      });

      req.on('error', (err) => {
        resolve(this.getFallbackData(datasetKey, `Network error: ${err.message}`));
      });

      req.on('timeout', () => {
        req.destroy();
        resolve(this.getFallbackData(datasetKey, "API Request timed out"));
      });
    });
  }

  /**
   * Evaluates citizen profile requirements against multiple data.gov.in datasets in parallel
   */
  async matchRequirementsAcrossDatasets(profile = {}, options = {}) {
    const keysToQuery = [];

    // Map profile requirements to relevant data.gov.in datasets
    if (profile.occupation === 'Farmer' || profile.occ === 'Farmer') {
      keysToQuery.push('AGRICULTURE_PMKISAN');
    }
    if (profile.area === 'rural' || profile.bpl) {
      keysToQuery.push('RURAL_HOUSING_PMAYG', 'EMPLOYMENT_MGNREGA');
    }
    if (profile.gender === 'Female' || profile.gender === 'F') {
      keysToQuery.push('WOMEN_CHILD_PMMVY');
    }
    if (profile.category === 'ST' || profile.cat === 'ST') {
      keysToQuery.push('TRIBAL_WELFARE_EMRS');
    }
    if (profile.occupation === 'Student' || profile.occ === 'Student') {
      keysToQuery.push('SCHOLARSHIP_POSTMATRIC');
    }
    if (profile.occupation === 'Business' || profile.occupation === 'Artisan' || profile.occ === 'Business') {
      keysToQuery.push('MSME_PMEGP');
    }

    // Always include national healthcare
    keysToQuery.push('HEALTH_AYUSHMAN');

    // Remove duplicates
    const uniqueKeys = Array.from(new Set(keysToQuery));

    // Parallel fetch from data.gov.in
    const queryPromises = uniqueKeys.map(k => this.fetchDataset(k, { state: profile.state, limit: 5 }));
    const results = await Promise.all(queryPromises);

    return results.map(res => {
      const matchScore = this.calculateRequirementMatch(profile, res.datasetKey);
      return {
        ...res,
        matchScore,
        matchGrade: matchScore >= 80 ? 'High' : (matchScore >= 50 ? 'Medium' : 'General'),
        apiSource: `data.gov.in (Resource ID: ${DATA_GOV_DATASETS[res.datasetKey]?.id || 'N/A'})`
      };
    }).sort((a, b) => b.matchScore - a.matchScore);
  }

  calculateRequirementMatch(profile, datasetKey) {
    const meta = DATA_GOV_DATASETS[datasetKey];
    if (!meta) return 70;

    let score = 50;
    const tg = meta.targetGroup;

    if (profile.occ && tg.includes(profile.occ)) score += 30;
    if (profile.occupation && tg.includes(profile.occupation)) score += 30;
    if (profile.gender === 'F' && (tg.includes('Woman') || tg.includes('Mother'))) score += 20;
    if (profile.cat && tg.includes(profile.cat)) score += 20;
    if (profile.area === 'rural' && tg.includes('Rural')) score += 15;
    if (profile.bpl && tg.includes('BPL')) score += 15;

    return Math.min(100, score);
  }

  getFallbackData(datasetKey, reason) {
    const dataset = DATA_GOV_DATASETS[datasetKey] || {};
    return {
      success: true,
      isLive: false,
      fallbackNotice: `Using cached scheme metadata (${reason})`,
      datasetKey,
      name: dataset.name || "Government Welfare Program",
      ministry: dataset.ministry || "Government of India",
      sector: dataset.sector || "Social Welfare",
      portal: dataset.officialPortal || "https://data.gov.in",
      benefits: dataset.defaultBenefits || "Direct citizen welfare transfers and statutory provisions.",
      totalRecords: 1,
      liveData: [{ note: "Live data will stream when data.gov.in responds to API key." }],
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = {
  DataGovService,
  DATA_GOV_DATASETS
};
