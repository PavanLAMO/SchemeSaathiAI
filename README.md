# SchemeSaathi AI (योजना साथी) 🇮🇳🤖

> **Bridging the Bharat Information Gap with Voice-First Multilingual AI for Government Welfare Schemes.**

SchemeSaathi AI is an intelligent, voice-first welfare discovery platform designed to empower every Indian citizen—regardless of literacy level, language proficiency, or digital familiarity—to discover, evaluate eligibility for, and access Central and State Government schemes.

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)](https://html.spec.whatwg.org/)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)](https://developer.mozilla.org/)
[![Web Speech API](https://img.shields.io/badge/Speech%20AI-Web%20Speech%20API-4285F4?style=flat&logo=google)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)

---

## 🌟 Key Features

### 1. 🎙️ Multilingual Voice AI Agent (15+ Indian Languages)
- **Two-way Voice Interaction:** Citizens can simply speak in their mother tongue (e.g., *"मैं 45 वर्ष की किसान महिला हूँ, गाँव में रहती हूँ, आय 1 लाख है"* or *"నా వయస్సు 25 సంవత్సరాలు, నిరుద్యోగి"*).
- **Supported Languages:** Hindi, Telugu, Tamil, Kannada, Malayalam, Marathi, Bengali, Gujarati, Punjabi, Odia, Urdu, Assamese, and Indian English.
- **Natural Language Slot Filling:** Automatically extracts age, gender, occupation, caste category, residence (rural/urban), and income brackets from natural conversational sentences.

### 2. 📋 6-Step Guided Citizen Profile Wizard
- Step 1: Basic Demographics (Age, Gender)
- Step 2: Location & Residence (State/UT, Rural vs Urban)
- Step 3: Social Category & Background (General, OBC, SC, ST, EWS, Minority)
- Step 4: Occupation & Employment (Farmer, Student, Unemployed, Self-Employed, etc.)
- Step 5: Annual Household Income
- Step 6: Special Criteria & Qualifications (Disability, BPL status, Land ownership)

### 3. 🎯 Intelligent Scheme Matching Algorithm
- Evaluates Central and State Government welfare criteria across **26+ major schemes** (PM-KISAN, Ayushman Bharat, PM Awas Yojana, Sukanya Samriddhi, Mudra Yojana, PM-KMY, etc.).
- Calculates real-time eligibility scores (High Match 80–100%, Medium Match 50–79%) and highlights specific qualifications.

### 4. 🔄 Ongoing vs. Expired Schemes & Dynamic Filtering
- **Status Badges:** Clearly tags schemes as `🟢 Ongoing` with active deadlines or `🔴 Expired / Closed`.
- **Category Filter Tabs:** Instant client-side filtering between **All Schemes**, **Ongoing**, and **Expired**.
- **Expired Scheme Cards:** Display scheme overview, last active dates, and a direct `🔔 Notify When Back` action.

### 5. 🔔 Smart Reopening & Alert Notification System
- **Detailed Scheme View:** Full modal displaying scheme overview, benefits, eligibility checklist, required documents, and previous application dates.
- **Reopening Subscriptions:** For expired schemes, users can register for reopening alerts through their preferred channel:
  - 💬 **WhatsApp** (Direct instant messaging alert)
  - 📱 **SMS** (Standard cellular message alert)
  - 📧 **Email** (Newsletter/formal notification alert)
  - 🔔 **Browser Push** (Instant desktop/mobile web alert)
- **Strict Channel-Specific Contact Validation:**
  - Email mode requires RFC-compliant email formats (`name@domain.ext`) and strictly rejects raw numbers or phone digits.
  - WhatsApp & SMS modes enforce valid 10-digit Indian mobile numbers.
- **Unsubscribe & State Persistence:** Users can unsubscribe anytime with one click, and preferences persist in `localStorage`.

### 6. 🔊 Audio Scheme Explanations (Text-to-Speech)
- Each matched scheme card features an **"Explain Scheme"** voice button that reads out eligibility details and application procedures in the citizen's chosen language.

---

## 🛠️ Architecture & Tech Stack

SchemeSaathi AI is built with a lightweight, high-performance, zero-bloat architecture:

| Layer | Technologies Used | Description |
|---|---|---|
| **Frontend UI** | HTML5, Modern CSS3, JavaScript (ES6+) | Fully responsive single-page application (SPA) with CSS Grid, Flexbox, and purple-themed glassmorphism design. |
| **Speech-to-Text (STT)** | `webkitSpeechRecognition` / `SpeechRecognition` API | In-browser zero-latency speech capture and multilingual transcription. |
| **Text-to-Speech (TTS)** | `window.speechSynthesis` API | Native browser synthesis for voice responses in 15+ Indian locales. |
| **NLP & Entity Extraction** | Client-Side Regex + Heuristic NLP Parser | Parses age, gender, occupation, income, caste, and location directly in the browser with zero cloud latency. |
| **State & Persistence** | Browser `localStorage` & `sessionStorage` | Persists user profile, form state, and scheme notification subscriptions locally. |
| **Icons & Assets** | Scalable Vector Graphics (SVG) | Custom lightweight inline SVGs for fast rendering without external CDN overhead. |
| **Deployment** | GitHub Pages / Static Web Hosting | Fully static zero-server footprint. |

---

## 🚀 Getting Started

No build tools, npm packages, or server installations are required!

### Run Locally:
1. Clone this repository:
   ```bash
   git clone https://github.com/PavanLAMO/SchemeSaathi-AI.git
   cd SchemeSaathi-AI
   ```
2. Open `index.html` in any modern web browser (Google Chrome, Microsoft Edge, Brave, or Firefox recommended for Web Speech API support).
   - Alternatively, start a simple local server:
   ```bash
   # Python 3
   python -m http.server 8000
   ```
   Then visit `http://localhost:8000`.

---

## 📱 Browser Compatibility

- **Google Chrome** (v80+ recommended for full SpeechRecognition + SpeechSynthesis)
- **Microsoft Edge** (Chromium-based, v80+)
- **Brave / Opera** (Chromium-based)
- **Safari / Firefox** (Supports UI, Wizard, and Text-to-Speech; fallback to text input for Voice Recognition)

---

## 🤝 Contributing

Contributions, scheme additions, and localization improvements are welcome!
1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/NewScheme`)
3. Commit your Changes (`git commit -m 'Add New Scheme: XYZ Yojana'`)
4. Push to the Branch (`git push origin feature/NewScheme`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
