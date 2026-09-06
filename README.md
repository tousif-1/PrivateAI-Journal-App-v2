# Personal Memory & Reflection System

A private, explainable personal-memory and reflection web application built on Google Cloud Run, Firebase Authentication, Cloud Firestore, and Gemini AI.

Unlike generic chatbot wrappers, this application treats memory as a sacred personal record: raw user-authored text is inviolable and never modified, AI-derived metadata (emotions, people, places, topics, open loops) is separated and user-editable, and historical memory retrieval produces verifiable source citations with zero hallucination.

---

## Architecture & Security Philosophy

```
[ Web Browser Client ]
  ├─ Firebase Google Sign-In (Client-Side Federated Identity)
  ├─ User-Isolated Firestore Path: /users/{userId}/...
  └─ Audio / Geolocation / Media Capture Subsystems
         │
         ▼
[ Google Cloud Run Express Backend ]
  ├─ SSRF-Protected Bookmark & Web Ingestion Engine
  ├─ Defensive Null-Safe Payload Processing
  └─ Gemini AI Interpretation Service (@google/genai)
       ├─ Resilient Fallback Ladder (gemini-3.8-flash / 3.6-flash / 3.1-flash-lite / 3.7-flash)
       ├─ 7 Intentional Reflection Modes (Reflect, Think, Brainstorm, Rewrite, Find Patterns, Plan, Talk)
       └─ Explainable "Ask My Journal" Grounded Memory Engine
```

---

## 1. Prerequisites & GCP API Setup

Ensure you have the [Google Cloud SDK (gcloud CLI)](https://cloud.google.com/sdk/docs/install) installed and authenticated:

```bash
# Authenticate gcloud
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# Enable required Google Cloud APIs
gcloud services enable \
  run.googleapis.com \
  secretmanager.googleapis.com \
  firestore.googleapis.com \
  cloudbuild.googleapis.com
```

---

## 2. Secret Management Setup (Zero-Hardcoding Hygiene)

API keys are retrieved dynamically from Google Cloud Secret Manager or environment variable injection:

```bash
# 1. Create and populate the GEMINI_API_KEY secret
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# 2. Grant Cloud Run compute service account access to read the secret
PROJECT_NUMBER=$(gcloud projects describe YOUR_PROJECT_ID --format="value(projectNumber)")

gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 3. Database Security Configuration (Cloud Firestore)

Deploy the user-isolated Firestore security rules ensuring zero cross-user access:

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User root profile document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      // User-owned subcollections (entries, conversations, media, places, openLoops, bookmarks)
      match /{allSubcollections=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }

    // Default deny for all other paths
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

To deploy rules directly with Firebase CLI:
```bash
firebase deploy --only firestore:rules
```

---

## 4. Cloud Run Deployment Flow

Deploy the full-stack container to Cloud Run with automatic build and Secret Manager integration:

```bash
gcloud run deploy personal-memory-app \
  --source . \
  --region asia-southeast1 \
  --platform managed \
  --allow-unauthenticated \
  --set-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest \
  --set-env-vars NODE_ENV=production
```

---

## 5. Required Campaign Verification Binding

Apply the mandatory challenge verification label to register the service for automated campaign checks:

```bash
gcloud run services update personal-memory-app \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=asia-southeast1
```

---

## 6. Functional Stability & Testing Walkthrough

The application includes an interactive test walkthrough modal (`Test Cases` in the top navigation). The core test matrix includes:

1. **Authentication**: Sign in with Google via client-side federated identity; verify profile sync; verify session termination and token cleansing on Sign Out.
2. **Journal & Persistence**: Guaranteed raw input-to-save persistence to Firestore before AI analysis; decoupled AI execution so user notes are never lost if Gemini is unavailable; user-editable AI metadata tags.
3. **Gemini Reflection Engine**: Multi-turn dialog in 7 intentional modes (`Reflect`, `Think`, `Brainstorm`, `Rewrite`, `Find Patterns`, `Plan`, `Talk`) with automated model fallback ladder.
4. **Ask My Journal**: Grounded retrieval querying exclusively the authenticated user's entries, producing clickable source citations, and refusing to hallucinate when evidence is insufficient.
5. **Life Map**: Geographic memory exploration with coordinate storage and place-based memory aggregation.
6. **Open Loops**: Tracking user intentions (`"I should..."`, `"I want to..."`) through a 4-state lifecycle (`Saved`, `In Progress`, `Completed`, `Dismissed`).
7. **Bookmarks**: SSRF-protected external URL ingestion with emotional resonance reactions.

---

## 7. Firebase API Key & GitHub Secret Scanning Note

If GitHub Secret Scanning flags `"apiKey": "AIza..."` in `firebase-applet-config.json`:

1. **Why it was flagged:**
   - GitHub's scanner checks for generic Google Cloud API key patterns (`AIza...`).
   - For Firebase web apps, **the Firebase API key is not a private secret**—it is a public project identifier that is necessarily exposed to browsers in web client bundles (analogous to a public Google Analytics ID or Firebase App ID).

2. **How Firebase Security Actually Works:**
   - Security is **not** enforced by hiding the web API key.
   - Security is strictly enforced by:
     - **Firestore Security Rules (`firestore.rules`)**: Enforces `request.auth.uid == userId` so no unauthorized reads/writes can occur.
     - **Google Cloud API Key Restrictions**: Restricting the key to your domains (HTTP referrers) and specific APIs in the Google Cloud Console.

3. **Recommended Actions:**
   - **Step A: Apply API Key Restrictions (Best Practice)**:
     - Navigate to [Google Cloud Console > APIs & Services > Credentials](https://console.cloud.google.com/apis/credentials).
     - Select your Firebase Browser Key (`AIza...`).
     - Under **Application restrictions**, select **Websites** and add your authorized domains (`https://*.run.app`, `http://localhost:3000`).
     - Under **API restrictions**, restrict to **Firebase Authentication**, **Cloud Firestore API**, and **Identity Toolkit API**.
   - **Step B: Handle GitHub Alert**:
     - In GitHub under **Security > Secret scanning**, you can mark the alert as **"False positive"** or **"Public client configuration"**.
   - **Step C: Alternative Environment Variable Setup**:
     - If you prefer not to commit `firebase-applet-config.json` to your git repository, add it to `.gitignore` and supply configuration via `.env` variables (`VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_PROJECT_ID`, etc.) as documented in `.env.example`.
