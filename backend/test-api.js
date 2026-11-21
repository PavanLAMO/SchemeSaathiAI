/**
 * Backend API & Algorithmic Unit Tests
 */

const assert = require('assert');
const { validateContact, parseVoiceSpeech, calculateEligibility } = require('./server');

console.log("--> Testing SchemeSaathi API Engine...");

// Test 1: NLP Entity Extraction
const sampleVoice = "I am a 45 year old woman, farmer, SC category, living in a village, income 1 lakh.";
const slots = parseVoiceSpeech(sampleVoice);

assert.strictEqual(slots.age, 45, "Age extraction failed");
assert.strictEqual(slots.gender, "F", "Gender extraction failed");
assert.strictEqual(slots.occ, "Farmer", "Occupation extraction failed");
assert.strictEqual(slots.cat, "SC", "Category extraction failed");
assert.strictEqual(slots.area, "rural", "Area extraction failed");
assert.strictEqual(slots.inc, 1.0, "Income extraction failed");
console.log("✓ Test 1: Multilingual Voice NLP extraction passed!");

// Test 2: Contact Validation
const testDigitEmail = validateContact('email', '9876543210');
assert.strictEqual(testDigitEmail.valid, false, "Digit-only input must fail email validation");

const testValidEmail = validateContact('email', 'citizen@example.com');
assert.strictEqual(testValidEmail.valid, true, "Valid email must pass");

const testPhone = validateContact('whatsapp', '9876543210');
assert.strictEqual(testPhone.valid, true, "Valid 10-digit Indian phone must pass");

const testShortPhone = validateContact('sms', '12345');
assert.strictEqual(testShortPhone.valid, false, "Short phone number must fail");
console.log("✓ Test 2: Channel-specific contact validation passed!");

// Test 3: Eligibility Scoring
const testSchemes = [
  {
    name: "PM-KISAN",
    criteria: [
      { label: "Occupation is Farmer", rule: "occ", values: ["Farmer"] },
      { label: "Income under 2 Lakh", rule: "income", max: 2.0 }
    ]
  }
];

const matchResults = calculateEligibility({ occ: "Farmer", inc: 1.0 }, testSchemes);
assert.strictEqual(matchResults[0].matchScore, 100, "PM-KISAN should be 100% match for farmer with 1L income");
console.log("✓ Test 3: Eligibility scoring engine passed!");

console.log("All unit tests passed successfully!");
