const assert = require('assert');
const { DataGovService, DATA_GOV_DATASETS } = require('./services/dataGovService');

console.log("--> Testing data.gov.in Multi-Dataset API Service...");

const service = new DataGovService("sample_test_key_12345");

// 1. Verify API Key Setter / Getter
assert.strictEqual(service.getApiKey(), "sample_test_key_12345", "API key getter mismatch");
service.setApiKey("data_gov_live_key_99999");
assert.strictEqual(service.getApiKey(), "data_gov_live_key_99999", "API key update failed");
console.log("✓ Test 1: data.gov.in API Key configuration passed!");

// 2. Verify Dataset Registry
const datasets = service.getRegisteredDatasets();
assert.strictEqual(datasets.length >= 7, true, "Should have registered at least 7 multi-sector datasets");
assert.strictEqual(datasets.some(d => d.key === 'AGRICULTURE_PMKISAN'), true, "PM-KISAN dataset missing");
assert.strictEqual(datasets.some(d => d.key === 'HEALTH_AYUSHMAN'), true, "Ayushman Bharat dataset missing");
assert.strictEqual(datasets.some(d => d.key === 'RURAL_HOUSING_PMAYG'), true, "PMAY-G dataset missing");
console.log("✓ Test 2: Multi-sector dataset registry verified (Agriculture, Housing, Health, Tribal, Women, MSME, Scholarships)!");

// 3. Test Multi-Requirement Matching
async function testMatching() {
  const citizenProfile = {
    occ: "Farmer",
    gender: "F",
    area: "rural",
    cat: "SC",
    state: "Uttar Pradesh"
  };

  const matches = await service.matchRequirementsAcrossDatasets(citizenProfile);
  assert.strictEqual(matches.length > 0, true, "Should produce matched datasets for profile");
  
  // Top match for farmer woman in rural should be Agriculture (PM-KISAN) or Women/Child (PMMVY)
  const topKeys = matches.slice(0, 3).map(m => m.datasetKey);
  console.log("Top matched datasets for Farmer + Woman + Rural:", topKeys);
  assert.strictEqual(topKeys.includes('AGRICULTURE_PMKISAN') || topKeys.includes('WOMEN_CHILD_PMMVY'), true, "Failed to prioritize relevant datasets");

  console.log("✓ Test 3: Multi-requirement dataset matching verified!");
}

testMatching().then(() => {
  console.log("All data.gov.in service tests passed successfully!");
});
