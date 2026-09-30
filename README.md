# CivicPulse AI – Multilingual Citizen Infrastructure Intelligence Platform

**CivicPulse AI** is an explainable civic infrastructure intelligence and decision-support platform designed for governments and citizens. It consolidates multilingual citizen feedback (in English, Hindi, Tamil, Telugu, and Bengali), synthesizes baseline municipal infrastructure and demographic datasets, pinpoints geographic demand hotspots and infrastructure deficits, computes explainable 0–100 priority scores, delivers AI-driven project recommendations with duplicate investment detection, and provides interactive budget what-if simulations.

---

## 🏛️ Problem Statement & Architecture

Governments struggle to consolidate fragmented citizen petitions across diverse languages and prioritize municipal capital expenditures. CivicPulse AI closes this loop through:

```
Citizen Feedback (Text / Voice in 5 Languages)
   ↓
Gemini AI (Language Detection + English Translation + Severity & Demand Extraction)
   ↓
Deduplication & Issue Clustering (Semantic Clustering)
   ↓
Government Demographic & Utility Capacity Integration (Regional Baselines)
   ↓
Demand vs Infrastructure Gap Analysis (Deficit Calculation)
   ↓
Interactive GIS Hotspot Detection (Leaflet + OpenStreetMap)
   ↓
Auditable 0–100 Priority Scoring (Demand, Severity, Gap, Population, Equity, National Priority)
   ↓
AI Project Recommendations & Duplicate Investment Detection (Expansion vs New Project)
   ↓
Budget What-If Simulation (₹100 Crore Envelope with Real-Time Impact Forecasts)
   ↓
Policymaker Dashboard & Project Tracking (Before vs After Public Impact Metrics)
   ↓
Citizen Feedback Loop (7-Stage Status Timeline & Real-Time Alerts)
```

---

## 🔒 Security Architecture & Threat Model

### Five Threat Zones & Countermeasures

| Threat Zone | Identified Risk | Countermeasure |
| :--- | :--- | :--- |
| **Input Surfaces** | Prompt injection in citizen petitions, malformed payloads, oversized text. | Strict regex sanitization, schema boundaries (`maxLength: 2000`), parameterization. Inputs treated as plain data. |
| **Planning & Reasoning** | Prompt injection attempting to game priority scores or hallucinate schemes. | Structured JSON schema validation, resilient Gemini fallback ladder, ground-truth corroboration. |
| **Tool Execution** | API credential leakage, SSRF. | Server-side Express proxy (`/api/*`), Secret Manager integration, no client exposure of keys. |
| **Memory & State** | Cross-tenant data leaks, unauthorized role elevation in Firestore. | Attribute-Based Access Control (`isOwner()`, `isPolicymaker()`), terminal state locking, no blanket reads. |
| **Inter-System Communication** | Token leakage during multi-cloud transit. | JWT authentication via Firebase Auth, scoped IAM roles, HTTPS only. |

---

## 🚀 Google Cloud Run & Secret Manager Setup Guide

### 1. Prerequisites & API Enablement

Ensure you have the Google Cloud SDK (`gcloud`) installed and your project selected:

```bash
# Set your active Google Cloud project
export PROJECT_ID="YOUR_GCP_PROJECT_ID"
export REGION="asia-southeast1" # Or us-central1
gcloud config set project $PROJECT_ID

# Enable required Google Cloud APIs
gcloud services enable \
  run.googleapis.com \
  secretmanager.googleapis.com \
  firestore.googleapis.com \
  cloudbuild.googleapis.com
```

### 2. Secret Management Setup (Zero-Hardcoding Hygiene)

Create and bind your `GEMINI_API_KEY` in Google Cloud Secret Manager:

```bash
# Create and populate the secret
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_GEMINI_API_KEY_HERE" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# Retrieve project number
export PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")

# Grant the default Cloud Run service account access to read the secret
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### 3. Cloud Firestore Security Rules Configuration

Deploy the production security rules supporting owner-bound isolation and role-based access:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;
    }

    function isSignedIn() { return request.auth != null; }
    function isOwner(userId) { return isSignedIn() && request.auth.uid == userId; }
    function isPolicymaker() {
      return isSignedIn() && (
        exists(/databases/$(database)/documents/policymakers/$(request.auth.uid)) ||
        request.auth.token.email == 'vtharunofficial57@gmail.com'
      );
    }

    match /users/{userId} {
      allow get: if isOwner(userId) || isPolicymaker();
      allow list: if isPolicymaker();
      allow create, update: if isOwner(userId);
    }

    match /citizenRequests/{requestId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn() && request.resource.data.userId == request.auth.uid;
      allow update: if isPolicymaker() || (isOwner(resource.data.userId) && resource.data.status == 'Submitted');
      allow delete: if isPolicymaker();
    }

    match /projects/{projectId} {
      allow read: if isSignedIn();
      allow write: if isPolicymaker();
    }

    match /recommendations/{recId} {
      allow read: if isSignedIn();
      allow write: if isPolicymaker();
    }

    match /governmentData/{areaId} {
      allow read: if isSignedIn();
      allow write: if isPolicymaker();
    }
  }
}
```

Deploy the rules via CLI:

```bash
firebase deploy --only firestore:rules
```

### 4. Cloud Run Deployment Flow

Build and deploy the application container to Cloud Run:

```bash
gcloud run deploy civicpulse-ai \
  --source . \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --set-secrets="GEMINI_API_KEY=GEMINI_API_KEY:latest" \
  --set-env-vars="NODE_ENV=production,PORT=3000"
```

### 5. Required Campaign Verification Binding

Apply the mandatory resource label to register the service for automated challenge verification:

```bash
gcloud run services update civicpulse-ai \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=$REGION
```

---

## 🧪 Functional Walkthrough & Test Suite

Every interaction and pipeline stage has been verified:

### Test Case 1: Multilingual Citizen Submission & Real-Time AI Analysis
- **Action**: In Citizen Portal, click "தமிழ் (Tamil Water Issue)" preset chip or type feedback in Hindi/Tamil/Telugu/Bengali.
- **Expected Outcome**:
  - AI Instant Preview card displays identified language (e.g., Tamil).
  - English translation rendered: *"In our area, drinking water supply has completely ceased for the past two weeks..."*
  - Severity auto-classified as **High**; Infrastructure type identified as **Drinking Water Pipeline**.
  - On submit, unique tracking ID `REQ-XXXX` is generated and persisted in Firestore.

### Test Case 2: Voice Input & Geolocation Capture
- **Action**: Click "Voice Input" button or "Detect Current Location".
- **Expected Outcome**: Web Speech API initiates listening with speech-to-text transcript; GPS coordinates populate automatically.

### Test Case 3: 7-Stage Request Lifecycle Tracking
- **Action**: Open "My Requests & Tracker" tab and select any petition.
- **Expected Outcome**: Stepper displays interactive progression: *Submitted → Under Review → Verified → Prioritized → Project Planned → In Progress → Completed* with timestamped government action remarks.

### Test Case 4: Policymaker GIS Hotspot & Deficit Map
- **Action**: Navigate to Policymaker Dashboard → "Demand & GIS Hotspots".
- **Expected Outcome**: Interactive Leaflet map renders with custom markers for Critical Requests (red), High Severity (orange), Projects in Progress (cyan), Completed (emerald), and Hotspot Clusters (pulsing red circles). Clicking any marker opens the detailed inspector panel.

### Test Case 5: 0–100 Explainable Priority Scoring
- **Action**: Open "0–100 Priority Scoring" tab.
- **Expected Outcome**: Deconstructs overall score into 6 auditable factors: Citizen Demand (25 pts), Severity (20 pts), Infrastructure Deficit (20 pts), Population Impact (15 pts), Equity Factor (10 pts), and National Priority Alignment (10 pts).

### Test Case 6: AI Recommendations & Duplicate Investment Detection
- **Action**: Open "AI Recommendations & Deduplication" tab.
- **Expected Outcome**:
  - For areas with overlapping ongoing works (e.g., Varanasi East CHC), flags: *"⚠️ Potential Duplicate Investment Detected: Project PRJ-102 is currently 42% complete. Recommending budgetary expansion rather than floating a redundant tender."*
  - Clicking "Approve as Scheme" converts recommendation into an active project in Cloud Firestore.

### Test Case 7: Budget What-If Simulation
- **Action**: Open "Budget What-If Simulation" tab and adjust sectoral sliders (Water, Healthcare, Roads, Education, Sanitation, Digital).
- **Expected Outcome**: Computes dynamic beneficiaries reached, deficit hotspots resolved, and priority coverage percentage with explicit *"Estimated / Simulated"* decision-support watermark.

### Test Case 8: Automatic Citizen Notification on Project Progress
- **Action**: In "Project Tracking" tab, advance a scheme to "In Progress" or "Completed".
- **Expected Outcome**: Automatically generates and stores a citizen notification alert in Firestore and updates the citizen bell icon badge.
