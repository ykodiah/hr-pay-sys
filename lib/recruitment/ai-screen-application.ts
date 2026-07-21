/**
 * AI / heuristic screening of an application against job requirements.
 * Prefer Groq when GROQ_API_KEY is set; otherwise fall back to deterministic scoring.
 */

import { generateText } from "ai"

export type ScreenInput = {
  jobTitle: string
  jobDescription?: string | null
  requirements?: unknown
  department?: string | null
  candidateName: string
  skills?: unknown
  experienceText?: string | null
  education?: string | null
  previousCompany?: string | null
  coverLetter?: string | null
  resumeFilename?: string | null
  resumeContent?: string | null
}

export type ScreenResult = {
  ai_score: number
  recommendation: "strong_yes" | "yes" | "maybe" | "no" | "strong_no"
  strengths: string[]
  gaps: string[]
  criteria_scores: Record<string, number>
  summary: string
  model_used: string
  resume_excerpt: string
  cover_letter_excerpt: string
  job_requirements_snapshot: string[]
}

function asList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter((s) => s.trim())
  if (typeof value === "string" && value.trim()) {
    return value
      .split(/[\n,;]/)
      .map((s) => s.trim())
      .filter(Boolean)
  }
  return []
}

function clampScore(n: number) {
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.min(100, Math.round(n * 10) / 10))
}

function recommendationFromScore(score: number): ScreenResult["recommendation"] {
  if (score >= 85) return "strong_yes"
  if (score >= 70) return "yes"
  if (score >= 55) return "maybe"
  if (score >= 40) return "no"
  return "strong_no"
}

function extractReadableResume(resumeContent?: string | null, max = 6000) {
  if (!resumeContent) return ""
  const raw = String(resumeContent)
  if (raw.startsWith("data:text")) {
    try {
      const b64 = raw.split(",")[1] || ""
      return Buffer.from(b64, "base64").toString("utf8").slice(0, max)
    } catch {
      return ""
    }
  }
  if (raw.startsWith("data:")) {
    // Binary (PDF/DOC) — not usable as plain text for LLM in this pipeline
    return ""
  }
  return raw.slice(0, max)
}

function heuristicScreen(input: ScreenInput): ScreenResult {
  const requirements = asList(input.requirements)
  const skills = asList(input.skills).map((s) => s.toLowerCase())
  const blob = [
    input.experienceText,
    input.education,
    input.coverLetter,
    input.previousCompany,
    skills.join(" "),
    extractReadableResume(input.resumeContent),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()

  let matched = 0
  const strengths: string[] = []
  const gaps: string[] = []
  for (const req of requirements.slice(0, 20)) {
    const token = req.toLowerCase()
    const hit =
      blob.includes(token) ||
      token.split(/\s+/).some((w) => w.length > 3 && (blob.includes(w) || skills.some((s) => s.includes(w))))
    if (hit) {
      matched += 1
      strengths.push(`Matches requirement: ${req}`)
    } else {
      gaps.push(`Not clearly evidenced: ${req}`)
    }
  }

  const reqScore = requirements.length ? (matched / requirements.length) * 70 : 45
  const profileBonus =
    (input.coverLetter ? 8 : 0) +
    (input.experienceText ? 8 : 0) +
    (input.education ? 5 : 0) +
    (input.resumeFilename || input.resumeContent ? 9 : 0)
  const ai_score = clampScore(reqScore + profileBonus)

  return {
    ai_score,
    recommendation: recommendationFromScore(ai_score),
    strengths: strengths.slice(0, 6),
    gaps: gaps.slice(0, 6),
    criteria_scores: {
      requirements_match: clampScore(requirements.length ? (matched / requirements.length) * 100 : 50),
      experience_signal: input.experienceText ? 70 : 35,
      cover_letter: input.coverLetter ? 75 : 30,
      education: input.education ? 70 : 40,
      resume_present: input.resumeFilename || input.resumeContent ? 90 : 20,
    },
    summary: `Heuristic screen scored ${ai_score}/100 for ${input.candidateName} against ${input.jobTitle}. ${matched}/${requirements.length || 0} listed requirements appear evidenced in the application materials.`,
    model_used: "heuristic-v1",
    resume_excerpt: extractReadableResume(input.resumeContent, 1200) || (input.resumeFilename ? `[File: ${input.resumeFilename}]` : ""),
    cover_letter_excerpt: String(input.coverLetter || "").slice(0, 1200),
    job_requirements_snapshot: requirements,
  }
}

export async function screenApplicationAgainstJob(input: ScreenInput): Promise<ScreenResult> {
  const requirements = asList(input.requirements)
  const skills = asList(input.skills)
  const resumeText = extractReadableResume(input.resumeContent, 5000)
  const fallback = heuristicScreen(input)

  if (!process.env.GROQ_API_KEY) return fallback

  const prompt = `You are an ATS screening assistant for Ghana HR hiring.
Score this candidate for the role. Return STRICT JSON only with keys:
ai_score (0-100 number), recommendation (strong_yes|yes|maybe|no|strong_no),
strengths (string[] max 6), gaps (string[] max 6),
criteria_scores (object of criterion->0-100), summary (2-4 sentences).

Job title: ${input.jobTitle}
Department: ${input.department || "n/a"}
Job description:
${String(input.jobDescription || "").slice(0, 2500)}

Requirements:
${requirements.map((r) => `- ${r}`).join("\n") || "- (none listed)"}

Candidate: ${input.candidateName}
Skills: ${skills.join(", ") || "n/a"}
Education: ${input.education || "n/a"}
Previous company: ${input.previousCompany || "n/a"}
Experience:
${String(input.experienceText || "").slice(0, 2000)}

Cover letter:
${String(input.coverLetter || "").slice(0, 2000)}

Resume text (may be empty if only a binary file was uploaded named "${input.resumeFilename || "n/a"}"):
${resumeText || "(no extractable resume text — score using profile + cover letter)"}`

  try {
    const result = await Promise.race([
      generateText({
        model: "groq/llama-3.3-70b-versatile",
        system:
          "You screen job applications objectively. Prefer evidence from the materials. Never invent credentials. JSON only.",
        prompt,
        temperature: 0.2,
        maxOutputTokens: 1200,
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error("AI screening timeout")), 28000)),
    ])

    const text = String((result as any).text || "")
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return { ...fallback, model_used: "heuristic-v1+ai-parse-failed" }

    const parsed = JSON.parse(jsonMatch[0])
    const ai_score = clampScore(Number(parsed.ai_score))
    const recommendation = (
      ["strong_yes", "yes", "maybe", "no", "strong_no"].includes(parsed.recommendation)
        ? parsed.recommendation
        : recommendationFromScore(ai_score)
    ) as ScreenResult["recommendation"]

    return {
      ai_score,
      recommendation,
      strengths: asList(parsed.strengths).slice(0, 6),
      gaps: asList(parsed.gaps).slice(0, 6),
      criteria_scores:
        parsed.criteria_scores && typeof parsed.criteria_scores === "object"
          ? Object.fromEntries(
              Object.entries(parsed.criteria_scores).map(([k, v]) => [k, clampScore(Number(v))]),
            )
          : fallback.criteria_scores,
      summary: String(parsed.summary || fallback.summary).slice(0, 2000),
      model_used: "groq/llama-3.3-70b-versatile",
      resume_excerpt: resumeText.slice(0, 1200) || (input.resumeFilename ? `[File: ${input.resumeFilename}]` : ""),
      cover_letter_excerpt: String(input.coverLetter || "").slice(0, 1200),
      job_requirements_snapshot: requirements,
    }
  } catch (err) {
    console.warn("[ai-screen] falling back to heuristic", err)
    return { ...fallback, model_used: "heuristic-v1+ai-fallback" }
  }
}
