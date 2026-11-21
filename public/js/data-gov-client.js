/**
 * SchemeSaathi AI - Frontend data.gov.in API Client
 * Connects directly to data.gov.in resources using user/developer API keys.
 */

class DataGovClient {
  constructor(apiKey = null) {
    this.apiKey = apiKey || localStorage.getItem('DATA_GOV_IN_API_KEY') || "579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b";
    this.baseUrl = "https://api.data.gov.in/resource/";
  }

  setApiKey(key) {
    if (key && key.trim()) {
      this.apiKey = key.trim();
      localStorage.setItem('DATA_GOV_IN_API_KEY', this.apiKey);
      return true;
    }
    return false;
  }

  getApiKey() {
    return this.apiKey;
  }

  async fetchLiveResource(resourceId, options = {}) {
    const limit = options.limit || 10;
    const stateFilter = options.state ? `&filters[state]=${encodeURIComponent(options.state)}` : '';
    const apiUrl = `${this.baseUrl}${resourceId}?api-key=${this.apiKey}&format=json&limit=${limit}${stateFilter}`;

    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      const data = await response.json();
      return {
        success: true,
        total: data.total || 0,
        records: data.records || [],
        title: data.title || ''
      };
    } catch (err) {
      console.warn("Direct data.gov.in fetch failed (falling back to backend API):", err.message);
      // Fallback via local backend server
      const backendRes = await fetch(`/api/data-gov/live-schemes?limit=${limit}`);
      return await backendRes.json();
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = DataGovClient;
}
