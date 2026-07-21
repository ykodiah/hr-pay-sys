# Groq API key for ATS AI screening

Recruitment ATS screening uses **Groq** when `GROQ_API_KEY` is set. Without it, the app falls back to heuristic scoring (still works, but not LLM-powered).

## How to get a Groq API key

1. Open [https://console.groq.com](https://console.groq.com) and sign up / sign in (free tier available).
2. Go to **API Keys**: [https://console.groq.com/keys](https://console.groq.com/keys).
3. Click **Create API Key**, name it (e.g. `hr-pay-ats`), and copy the key once.

Treat the key like a password — do not commit it to git.

## Where to enter / set the key

There is **no in-app settings field** for Groq today. Set it as a **server environment variable**:

| Environment | Where |
|-------------|--------|
| Local dev | Create/edit `.env.local` in the project root: `GROQ_API_KEY=gsk_...` then restart `npm run dev` |
| Vercel | Project → **Settings** → **Environment Variables** → add `GROQ_API_KEY` → Redeploy |
| Other hosts | Set `GROQ_API_KEY` in your process/container secrets the same way you set `SUPABASE_SERVICE_ROLE_KEY` |

Example `.env.local` line:

```bash
GROQ_API_KEY=gsk_your_key_here
```

The same key powers chat / template generation APIs in this app (`/api/chat`, employee chat, etc.).

## Verify it works

1. Apply with a text-based PDF/DOCX CV (so resume text extracts).
2. In Recruitment → open a candidate → **Run ATS screen**.
3. If Groq is configured, the model line shows `groq/llama-3.3-70b-versatile`.
4. If not, you see `heuristic-v1` and a hint to set `GROQ_API_KEY`.

## Resume / CV readability for ATS

Run SQL migration **`scripts/087_recruitment_resume_text.sql`** so candidates store extracted CV text (`resume_text`).

On apply, PDF/DOCX uploads are parsed (pdfjs + mammoth) into plain text for screening. Prefer **selectable-text** PDFs/DOCX over scanned image-only files.
