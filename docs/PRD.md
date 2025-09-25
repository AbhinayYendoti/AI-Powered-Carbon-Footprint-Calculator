# Product Requirements Document (PRD)

**Product Name**: Carbon Wise AI Friend
**Platforms**: Android (Kotlin + Jetpack Compose) [Primary], Backend (Node.js/Express). Web (React/TS) optional companion
**Version**: v1.0
**Prepared by**: Yendoti Abhinay
**Date**: Sept 2025

## 1. Overview
Goal: Enable users to measure, understand, and reduce their carbon footprint via a scientific calculator, ML-powered insights, AI chat, interactive charts, and professional PDF/CSV reporting. Optional email delivery via Gmail SMTP. Primary client is a Kotlin Android app.

## 2. Objectives & KPIs
- Accurate calculations using stated emission factors
- Personalized AI recommendations with fallback rules
- Interactive charts and 12‑month predictions
- Export and email reports
- KPIs: ≥60% completion, ≥40% chat usage, API P95 < 300–400 ms, Lighthouse ≥95

## 3. Personas
- Learner, Planner, Tracker/Professional

## 4. User Stories (Acceptance)
- Calculate footprint and see category breakdown (kg CO2/year)
- View charts (pie/line/bar) and 12‑month trend
- Get 5–7 recommendations with impact, difficulty, cost, timeframe
- Ask AI chat; receive concise practical guidance (<200 words)
- Download PDF/CSV; optionally email report
- Save and retrieve sessions

## 5. Scope
- MVP: Calculator, AI chat (OpenAI/Gemini), recommendations, analysis, predictions, charts, report download, email send, session endpoints
- Next: Auth + DB, localization, deeper ML, privacy controls, push notifications (mobile)

## 6. Out of Scope (v1.0)
- iOS app, photo-based estimation, enterprise admin, deep-learning beyond prompts

## 7. Functional Requirements
Inputs: transport (carKm, publicTransport/publicKm, flightHours/planeHours), home (electricity, gas/naturalGas, heating), diet (dietType, meatServings), shopping (clothing, electronics)
APIs:
- POST /api/calculate
- POST /api/chat
- POST /api/save-session
- GET  /api/session/:sessionId
- GET  /api/actionplan/:userid
- GET  /api/report/:userid?format=pdf|csv
- POST /api/send-report (email via Gmail SMTP)

Responses include: emissions breakdown, recommendations, analysis, predictions, comparison.

## 8. Non‑Functional
- Performance: P95 < 300–400 ms, load < 2s
- Reliability: graceful fallbacks if AI/SMTP fail
- Security: env‑based keys, HTTPS, no PII stored
- Accessibility: WCAG 2.1, keyboard navigable

## 9. Tech Stack
Android: Kotlin, Jetpack Compose UI, Retrofit (API), MPAndroidChart (charts), PdfDocument/iText (PDF)
Frontend (optional web): React 18, TypeScript, Vite, Tailwind, shadcn/ui, Recharts, Framer Motion, Axios
Backend: Node.js, Express, OpenAI SDK, @google/generative‑ai (Gemini), pdfkit, json2csv, nodemailer, dotenv, cors, uuid
Deployment: Frontend (Vercel/Netlify), Backend (Railway/Render/AWS)

## 10. Risks
- AI provider limits → fallback rules
- SMTP quotas → alternative mailers
- Accuracy scrutiny → transparent factors and units
- Privacy → anonymized sessions, future DSR endpoints

## 11. Milestones
M1 Calculator + compute; M2 Chat + recs; M3 Predictions + sessions; M4 Reports; M5 Email; M6 QA/deploy

## 12. Env Config (Backend)
- AI_PROVIDER=openai|gemini
- OPENAI_API_KEY=...
- OPENAI_MODEL=gpt-3.5-turbo
- GEMINI_API_KEY=...
- GEMINI_MODEL=gemini-1.5-flash
- GMAIL_USER=yendotiabhi602@gmail.com
- GMAIL_PASS=your_app_password  # Use Gmail App Password
- PORT=3002

Notes:
- Map UI fields to API: publicTransport → publicKm, flightHours → planeHours, gas → naturalGas, diet.type → dietType.
- Android app (primary): Kotlin/Compose, Retrofit, MPAndroidChart, PdfDocument/iText. Use backend `/api/send-report` with Gmail SMTP; default email is yendotiabhi602@gmail.com (override via request `to`).
