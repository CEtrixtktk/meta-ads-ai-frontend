# Meta Ads Analytics Dashboard with AI-Powered Performance Insights — Frontend

The interface for a platform that turns Meta Ads performance data into plain-English decisions using AI.

⚙️ **Backend repository:** https://github.com/CEtrixtktk/meta-ads-ai-backend

---

## Screenshots

> <img width="490" height="240" alt="0814 (2)" src="https://github.com/user-attachments/assets/e91138ff-7f9a-4a0f-bc8e-5e1005a7731e" />

---

## Stack

Vue 3 (Composition API) · TypeScript · Pinia · Vue Router · PrimeVue · Vite

Deployed on Vercel.

---

## Architecture decisions

### Transparent session handling

The backend issues short-lived access tokens for security, which would otherwise force users to re-authenticate every few minutes. To avoid that, the HTTP client uses interceptors that attach the token to every request and, on an expired-session response, silently refresh it and retry the original request.

The result: token rotation is invisible both to the user and to the rest of the application code.

### API layer separated from views

Backend calls live in their own module (`src/api/`) alongside their TypeScript types. Components don't build HTTP requests — they ask that layer for data. The types act as an explicit contract with the backend, so a change in data shape surfaces at compile time rather than at runtime.

### Route guards

A global navigation guard checks the session before entering any private route and redirects to login when none exists — complementing, never replacing, server-side authorisation.

### Explicit loading states

Every data-consuming screen handles the three possible states separately: loading, error, and ready. The AI analysis maintains its own state, independent of the metrics, because its latency is far higher: the metrics render immediately while the analysis is generated in the background.

---

## Local development

```bash
npm install
npm run dev
```

The backend URL is configured through the `VITE_API_BASE_URL` environment variable — defined in `.env.development` for local work and in the deployment environment for production.

```bash
npm run type-check    # type verification
npm run build         # production build
```

---
