/**
 * AI + ML insights for HR formula category reports.
 * ML layer: rule/ensemble scoring from live metrics (always available).
 * AI layer: narrative brief via LLM when available; graceful fallback otherwise.
 */

import type { CategoryReport, MetricResult } from "@/lib/services/hr-formula-reports"
import { formatMetricValue } from "@/lib/services/hr-formula-reports"

export type InsightSeverity = "positive" | "watch" | "critical" | "info"

export type AiMlInsightBlock = {
  id: string
  title: string
  summary: string
  severity: InsightSeverity
  confidence: number
  signals: string[]
  recommendations: string[]
  relatedMetricIds: string[]
}

export type CategoryAiMlPackage = {
  categoryId: string
  categoryTitle: string
  periodStart: string
  periodEnd: string
  healthScore: number
  healthLabel: string
  executiveBrief: string
  narrative: string
  blocks: AiMlInsightBlock[]
  mlModel: string
  aiModel: string | null
  source: "ml+ai" | "ml"
  generatedAt: string
}

function metricMap(category: CategoryReport): Record<string, MetricResult> {
  return Object.fromEntries(category.metrics.map((m) => [m.id, m]))
}

function val(m?: MetricResult): number | null {
  if (!m || m.value == null || Number.isNaN(m.value)) return null
  return Number(m.value)
}

function clamp(n: number, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, n))
}

function healthLabel(score: number): string {
  if (score >= 80) return "Strong"
  if (score >= 65) return "Healthy"
  if (score >= 45) return "Needs attention"
  return "At risk"
}

/** Benchmark-aware ML scoring per category */
function scoreCategory(category: CategoryReport): {
  healthScore: number
  blocks: AiMlInsightBlock[]
} {
  const m = metricMap(category)
  const blocks: AiMlInsightBlock[] = []
  let score = 70

  const push = (block: AiMlInsightBlock, delta: number) => {
    blocks.push(block)
    score += delta
  }

  switch (category.id) {
    case "workforce": {
      const turnover = val(m.turnover_rate)
      const retention = val(m.retention_rate)
      const growth = val(m.workforce_growth)
      const absent = val(m.absenteeism_rate)

      if (turnover != null) {
        if (turnover > 20) {
          push(
            {
              id: "wf-turnover-high",
              title: "Elevated turnover pressure",
              summary: `Turnover is ${turnover.toFixed(1)}%, above a healthy band of under 15%. Sustained exits raise replacement cost and disrupt team continuity.`,
              severity: "critical",
              confidence: 88,
              signals: [`Turnover ${turnover.toFixed(1)}%`, `Employees left: ${m.turnover_rate?.inputs?.employeesLeft ?? "—"}`],
              recommendations: [
                "Run stay interviews for roles with the highest exit concentration.",
                "Review compensation and workload in departments driving exits.",
              ],
              relatedMetricIds: ["turnover_rate"],
            },
            -18,
          )
        } else if (turnover > 12) {
          push(
            {
              id: "wf-turnover-watch",
              title: "Turnover trending toward caution",
              summary: `Turnover at ${turnover.toFixed(1)}% is manageable but warrants monitoring against last quarter and peer norms.`,
              severity: "watch",
              confidence: 82,
              signals: [`Turnover ${turnover.toFixed(1)}%`],
              recommendations: ["Track exits by department and tenure band monthly."],
              relatedMetricIds: ["turnover_rate"],
            },
            -6,
          )
        } else {
          push(
            {
              id: "wf-turnover-ok",
              title: "Turnover within healthy range",
              summary: `Turnover of ${turnover.toFixed(1)}% indicates workforce stability for the selected period.`,
              severity: "positive",
              confidence: 85,
              signals: [`Turnover ${turnover.toFixed(1)}%`],
              recommendations: ["Maintain recognition and career-path programmes that support retention."],
              relatedMetricIds: ["turnover_rate"],
            },
            6,
          )
        }
      }

      if (retention != null) {
        if (retention < 80) {
          push(
            {
              id: "wf-retention-low",
              title: "Retention below target",
              summary: `Retention is ${retention.toFixed(1)}%. A large share of the starting headcount did not carry through the period after adjusting for joiners.`,
              severity: "watch",
              confidence: 80,
              signals: [`Retention ${retention.toFixed(1)}%`],
              recommendations: ["Prioritise onboarding quality for new joiners and first-year employees."],
              relatedMetricIds: ["retention_rate"],
            },
            -8,
          )
        } else {
          push(
            {
              id: "wf-retention-ok",
              title: "Solid retention signal",
              summary: `Retention of ${retention.toFixed(1)}% shows the organisation is holding core headcount through the period.`,
              severity: "positive",
              confidence: 78,
              signals: [`Retention ${retention.toFixed(1)}%`],
              recommendations: ["Document what is working and replicate across weaker teams."],
              relatedMetricIds: ["retention_rate"],
            },
            4,
          )
        }
      }

      if (absent != null && absent > 8) {
        push(
          {
            id: "wf-absent",
            title: "Absenteeism affecting capacity",
            summary: `Absenteeism at ${absent.toFixed(1)}% of working days reduces available capacity and can foreshadow engagement or wellbeing issues.`,
            severity: absent > 12 ? "critical" : "watch",
            confidence: 84,
            signals: [`Absenteeism ${absent.toFixed(1)}%`],
            recommendations: [
              "Correlate absence spikes with leave types and departments.",
              "Reinforce attendance coaching where patterns are chronic.",
            ],
            relatedMetricIds: ["absenteeism_rate"],
          },
          absent > 12 ? -12 : -5,
        )
      }

      if (growth != null) {
        push(
          {
            id: "wf-growth",
            title: growth >= 0 ? "Headcount expansion" : "Headcount contraction",
            summary:
              growth >= 0
                ? `Workforce grew ${growth.toFixed(1)}% in the period. Ensure hiring capacity, managers, and onboarding scale with growth.`
                : `Workforce contracted ${Math.abs(growth).toFixed(1)}%. Confirm whether this is planned restructuring or unplanned attrition.`,
            severity: growth < -5 ? "watch" : "info",
            confidence: 76,
            signals: [`Growth ${growth.toFixed(1)}%`],
            recommendations:
              growth >= 0
                ? ["Align recruitment pipeline and manager span of control with growth."]
                : ["Review exit reasons and freeze/backfill policy by critical role."],
            relatedMetricIds: ["workforce_growth"],
          },
          growth < -5 ? -4 : 2,
        )
      }
      break
    }

    case "attendance": {
      const att = val(m.attendance_pct)
      const punct = val(m.punctuality_rate)
      const leaveUtil = val(m.leave_utilization)
      if (att != null) {
        if (att < 85) {
          push(
            {
              id: "att-low",
              title: "Attendance below operational target",
              summary: `Attendance sits at ${att.toFixed(1)}%. Below 90% typically signals process, wellbeing, or scheduling friction.`,
              severity: att < 75 ? "critical" : "watch",
              confidence: 86,
              signals: [`Attendance ${att.toFixed(1)}%`],
              recommendations: ["Audit clock-in compliance and shift coverage by site."],
              relatedMetricIds: ["attendance_pct"],
            },
            att < 75 ? -16 : -8,
          )
        } else {
          push(
            {
              id: "att-ok",
              title: "Attendance supports delivery",
              summary: `Attendance of ${att.toFixed(1)}% is within a productive operating band for the period.`,
              severity: "positive",
              confidence: 82,
              signals: [`Attendance ${att.toFixed(1)}%`],
              recommendations: ["Keep reinforcing clear shift expectations and recognition for reliability."],
              relatedMetricIds: ["attendance_pct"],
            },
            5,
          )
        }
      }
      if (punct != null && punct < 80) {
        push(
          {
            id: "att-punct",
            title: "Punctuality gap",
            summary: `On-time arrivals are ${punct.toFixed(1)}% of working days. Latness compounds overtime and service delays.`,
            severity: "watch",
            confidence: 80,
            signals: [`Punctuality ${punct.toFixed(1)}%`],
            recommendations: ["Review transport, shift start times, and grace-period settings."],
            relatedMetricIds: ["punctuality_rate"],
          },
          -6,
        )
      }
      if (leaveUtil != null) {
        push(
          {
            id: "att-leave",
            title: leaveUtil > 90 ? "Leave nearly exhausted" : "Leave utilisation pattern",
            summary: `Leave utilisation is ${leaveUtil.toFixed(1)}% of entitlement. ${
              leaveUtil > 90
                ? "High usage can create coverage risk later in the year."
                : leaveUtil < 30
                  ? "Very low usage may indicate burnout risk or leave-hoarding culture."
                  : "Utilisation appears balanced for the period."
            }`,
            severity: leaveUtil > 90 || leaveUtil < 30 ? "watch" : "info",
            confidence: 74,
            signals: [`Leave utilisation ${leaveUtil.toFixed(1)}%`],
            recommendations: ["Encourage planned leave calendars by team to avoid year-end pile-ups."],
            relatedMetricIds: ["leave_utilization"],
          },
          leaveUtil > 90 || leaveUtil < 30 ? -4 : 2,
        )
      }
      break
    }

    case "recruitment": {
      const ttf = val(m.time_to_fill)
      const oar = val(m.offer_acceptance)
      const cph = val(m.cost_per_hire)
      if (ttf != null) {
        push(
          {
            id: "rec-ttf",
            title: ttf > 45 ? "Slow time-to-fill" : "Time-to-fill performance",
            summary: `Average time to fill is ${ttf.toFixed(1)} days. ${
              ttf > 45
                ? "Long cycles increase vacancy cost and candidate drop-off."
                : "Hiring cycle length is competitive for most professional roles."
            }`,
            severity: ttf > 60 ? "critical" : ttf > 45 ? "watch" : "positive",
            confidence: 83,
            signals: [`Time to fill ${ttf.toFixed(1)} days`],
            recommendations:
              ttf > 45
                ? ["Tighten screening SLAs and interview panel availability."]
                : ["Protect current process quality while scaling volume."],
            relatedMetricIds: ["time_to_fill"],
          },
          ttf > 60 ? -14 : ttf > 45 ? -6 : 5,
        )
      }
      if (oar != null) {
        push(
          {
            id: "rec-oar",
            title: oar < 70 ? "Offer acceptance weakness" : "Offer acceptance strength",
            summary: `Offer acceptance is ${oar.toFixed(1)}%. ${
              oar < 70
                ? "Candidates are declining after investment in the funnel — often pay, speed, or competitor offers."
                : "Candidates are converting well from offer to accept."
            }`,
            severity: oar < 60 ? "critical" : oar < 70 ? "watch" : "positive",
            confidence: 85,
            signals: [`Acceptance ${oar.toFixed(1)}%`],
            recommendations:
              oar < 70
                ? ["Benchmark offer packages and shorten offer turnaround."]
                : ["Capture accepting candidates’ reasons to reinforce winning offers."],
            relatedMetricIds: ["offer_acceptance"],
          },
          oar < 60 ? -12 : oar < 70 ? -5 : 5,
        )
      }
      if (cph != null) {
        push(
          {
            id: "rec-cph",
            title: "Cost-per-hire visibility",
            summary: `Cost per hire is GHS ${cph.toLocaleString("en-GH")}. Use this as a baseline when comparing agency vs inbound channels.`,
            severity: "info",
            confidence: 70,
            signals: [`Cost per hire GHS ${cph.toLocaleString("en-GH")}`],
            recommendations: ["Attribute recruitment_costs by channel to improve source ROI."],
            relatedMetricIds: ["cost_per_hire"],
          },
          1,
        )
      }
      break
    }

    case "compensation": {
      const avg = val(m.average_salary)
      const ctc = val(m.payroll_ctc_pct)
      const ratio = val(m.fixed_variable_ratio)
      if (avg != null) {
        push(
          {
            id: "comp-avg",
            title: "Average pay level",
            summary: `Average salary paid is GHS ${avg.toLocaleString("en-GH")}. Compare against market bands for critical roles before the next review cycle.`,
            severity: "info",
            confidence: 72,
            signals: [`Average salary GHS ${avg.toLocaleString("en-GH")}`],
            recommendations: ["Segment averages by grade and department for fairness checks."],
            relatedMetricIds: ["average_salary"],
          },
          2,
        )
      }
      if (ctc != null) {
        push(
          {
            id: "comp-ctc",
            title: ctc > 40 ? "High payroll-to-revenue load" : "Payroll cost ratio",
            summary: `Payroll cost to company is ${ctc.toFixed(1)}% of revenue. ${
              ctc > 40
                ? "This is elevated for many service organisations and may constrain investment capacity."
                : "The ratio is within a controllable planning band for the period."
            }`,
            severity: ctc > 50 ? "critical" : ctc > 40 ? "watch" : "positive",
            confidence: 80,
            signals: [`CTC ${ctc.toFixed(1)}%`],
            recommendations:
              ctc > 40
                ? ["Model headcount scenarios against revenue forecast before further hiring."]
                : ["Keep monitoring as revenue and overtime fluctuate."],
            relatedMetricIds: ["payroll_ctc_pct"],
          },
          ctc > 50 ? -14 : ctc > 40 ? -6 : 4,
        )
      }
      if (ratio != null) {
        push(
          {
            id: "comp-mix",
            title: "Fixed vs variable pay mix",
            summary: `Fixed-to-variable ratio is ${ratio.toFixed(2)}. ${
              ratio > 10
                ? "Pay is heavily fixed — limited leverage for performance incentives."
                : "Variable components give room to reward outcomes."
            }`,
            severity: ratio > 15 ? "watch" : "info",
            confidence: 68,
            signals: [`Ratio ${ratio.toFixed(2)}`],
            recommendations: ["Align bonus design with measurable team outcomes."],
            relatedMetricIds: ["fixed_variable_ratio"],
          },
          ratio > 15 ? -3 : 1,
        )
      }
      break
    }

    case "performance": {
      const completion = val(m.perf_completion)
      const high = val(m.high_performer_ratio)
      const low = val(m.low_performer_ratio)
      if (completion != null) {
        push(
          {
            id: "perf-complete",
            title: completion < 70 ? "Appraisal completion lag" : "Appraisal coverage",
            summary: `Performance completion is ${completion.toFixed(1)}%. Incomplete cycles weaken calibration and promotion decisions.`,
            severity: completion < 50 ? "critical" : completion < 70 ? "watch" : "positive",
            confidence: 87,
            signals: [`Completion ${completion.toFixed(1)}%`],
            recommendations:
              completion < 70
                ? ["Send manager reminders and lock a calendar deadline for outstanding reviews."]
                : ["Proceed to calibration once remaining reviews close."],
            relatedMetricIds: ["perf_completion"],
          },
          completion < 50 ? -14 : completion < 70 ? -6 : 5,
        )
      }
      if (high != null && low != null) {
        push(
          {
            id: "perf-dist",
            title: "Performance distribution",
            summary: `High performers ${high.toFixed(1)}% vs low performers ${low.toFixed(1)}%. A healthy bell curve usually keeps high performers above low by a clear margin.`,
            severity: low > high ? "watch" : "info",
            confidence: 75,
            signals: [`High ${high.toFixed(1)}%`, `Low ${low.toFixed(1)}%`],
            recommendations: ["Pair low performers with focused improvement plans; retain high performers with growth paths."],
            relatedMetricIds: ["high_performer_ratio", "low_performer_ratio"],
          },
          low > high ? -5 : 3,
        )
      }
      break
    }

    case "engagement": {
      const score = val(m.engagement_score)
      const enps = val(m.enps)
      if (score != null) {
        push(
          {
            id: "eng-score",
            title: score < 60 ? "Engagement below healthy band" : "Engagement standing",
            summary: `Engagement score is ${score.toFixed(1)}%. ${
              score < 60
                ? "Scores under 60 often precede voluntary exits within two quarters."
                : "Employees are signalling a workable engagement baseline."
            }`,
            severity: score < 50 ? "critical" : score < 60 ? "watch" : "positive",
            confidence: 81,
            signals: [`Engagement ${score.toFixed(1)}%`],
            recommendations:
              score < 60
                ? ["Focus listening sessions on the lowest-scoring departments."]
                : ["Share wins and close the feedback loop on prior survey themes."],
            relatedMetricIds: ["engagement_score"],
          },
          score < 50 ? -14 : score < 60 ? -6 : 5,
        )
      }
      if (enps != null) {
        push(
          {
            id: "eng-enps",
            title: "eNPS reading",
            summary: `eNPS is ${enps}. ${
              enps < 0
                ? "Detractors outweigh promoters — advocacy and referral hiring will suffer."
                : enps < 20
                  ? "Neutral-to-modest advocacy; room to convert passives."
                  : "Promoters dominate — a strong cultural asset."
            }`,
            severity: enps < 0 ? "critical" : enps < 20 ? "watch" : "positive",
            confidence: 79,
            signals: [`eNPS ${enps}`],
            recommendations: ["Segment promoters/detractors by tenure and manager."],
            relatedMetricIds: ["enps"],
          },
          enps < 0 ? -10 : enps < 20 ? -3 : 4,
        )
      }
      break
    }

    case "training": {
      const hours = val(m.training_hours_per_emp)
      const eff = val(m.training_effectiveness)
      const roi = val(m.training_roi)
      if (hours != null) {
        push(
          {
            id: "tr-hours",
            title: hours < 2 ? "Low learning intensity" : "Training hours footprint",
            summary: `Training hours per employee are ${hours.toFixed(1)}. Sustained capability building usually needs a planned quarterly cadence.`,
            severity: hours < 2 ? "watch" : "info",
            confidence: 70,
            signals: [`${hours.toFixed(1)} hrs / employee`],
            recommendations: ["Map critical skill gaps to mandatory learning paths."],
            relatedMetricIds: ["training_hours_per_emp"],
          },
          hours < 2 ? -5 : 2,
        )
      }
      if (eff != null) {
        push(
          {
            id: "tr-eff",
            title: "Training effectiveness",
            summary: `Post vs pre score lift averages ${eff.toFixed(1)}%. ${
              eff < 10 ? "Limited learning transfer — revisit content design." : "Learners are demonstrating measurable improvement."
            }`,
            severity: eff < 10 ? "watch" : "positive",
            confidence: 77,
            signals: [`Effectiveness ${eff.toFixed(1)}%`],
            recommendations: ["Require managers to reinforce learning on the job within 30 days."],
            relatedMetricIds: ["training_effectiveness"],
          },
          eff < 10 ? -4 : 4,
        )
      }
      if (roi != null) {
        push(
          {
            id: "tr-roi",
            title: "Training ROI",
            summary: `Training ROI is ${roi.toFixed(1)}%. Keep logging benefit_amount on enrollments to refine this signal.`,
            severity: roi < 0 ? "watch" : "info",
            confidence: 65,
            signals: [`ROI ${roi.toFixed(1)}%`],
            recommendations: ["Tie training outcomes to productivity or quality KPIs where possible."],
            relatedMetricIds: ["training_roi"],
          },
          roi < 0 ? -4 : 2,
        )
      }
      break
    }

    case "relations": {
      const gRate = val(m.grievance_rate)
      const gRes = val(m.grievance_resolution)
      const dRate = val(m.disciplinary_rate)
      if (gRate != null && gRate > 5) {
        push(
          {
            id: "rel-griev",
            title: "Grievance volume elevated",
            summary: `Grievance rate is ${gRate.toFixed(1)}% of headcount. Rising caseloads often mirror trust or fairness concerns.`,
            severity: "watch",
            confidence: 78,
            signals: [`Grievance rate ${gRate.toFixed(1)}%`],
            recommendations: ["Publish case SLAs and ensure confidential reporting channels are clear."],
            relatedMetricIds: ["grievance_rate"],
          },
          -6,
        )
      }
      if (gRes != null && gRes < 70) {
        push(
          {
            id: "rel-resolve",
            title: "Slow grievance resolution",
            summary: `Only ${gRes.toFixed(1)}% of filed grievances are resolved. Prolonged cases increase legal and cultural risk.`,
            severity: "critical",
            confidence: 84,
            signals: [`Resolution ${gRes.toFixed(1)}%`],
            recommendations: ["Assign owners and weekly review of open cases older than 14 days."],
            relatedMetricIds: ["grievance_resolution"],
          },
          -10,
        )
      }
      if (dRate != null) {
        push(
          {
            id: "rel-disc",
            title: "Disciplinary activity",
            summary: `Disciplinary action rate is ${dRate.toFixed(1)}%. Use this with grievance trends to detect climate issues early.`,
            severity: dRate > 8 ? "watch" : "info",
            confidence: 72,
            signals: [`Disciplinary rate ${dRate.toFixed(1)}%`],
            recommendations: ["Ensure progressive discipline policy is applied consistently."],
            relatedMetricIds: ["disciplinary_rate"],
          },
          dRate > 8 ? -4 : 1,
        )
      }
      break
    }

    case "safety": {
      const ir = val(m.incident_rate)
      const ltifr = val(m.ltifr)
      const illness = val(m.illness_absence)
      if (ir != null && ir > 0) {
        push(
          {
            id: "safe-ir",
            title: "Incident rate signal",
            summary: `Incident rate is ${ir.toLocaleString("en-GH")} per million man-hours. Any non-zero trend deserves root-cause review.`,
            severity: ir > 5 ? "critical" : "watch",
            confidence: 80,
            signals: [`IR ${ir}`],
            recommendations: ["Investigate recent incidents and close corrective actions with owners."],
            relatedMetricIds: ["incident_rate"],
          },
          ir > 5 ? -12 : -5,
        )
      } else {
        push(
          {
            id: "safe-clear",
            title: "No recorded incidents",
            summary: "No safety incidents were recorded for the period. Continue proactive toolbox talks and near-miss reporting.",
            severity: "positive",
            confidence: 70,
            signals: ["Incidents: 0"],
            recommendations: ["Encourage near-miss logging so leading indicators stay visible."],
            relatedMetricIds: ["incident_rate"],
          },
          4,
        )
      }
      if (ltifr != null && ltifr > 0) {
        push(
          {
            id: "safe-ltifr",
            title: "Lost-time injuries present",
            summary: `LTIFR is ${ltifr.toLocaleString("en-GH")}. Lost-time events require formal investigation and return-to-work planning.`,
            severity: "critical",
            confidence: 86,
            signals: [`LTIFR ${ltifr}`],
            recommendations: ["Complete investigation packs and review PPE / process controls."],
            relatedMetricIds: ["ltifr"],
          },
          -12,
        )
      }
      if (illness != null && illness > 5) {
        push(
          {
            id: "safe-illness",
            title: "Illness-related absence",
            summary: `Absence due to illness is ${illness.toFixed(1)}% of working days.`,
            severity: "watch",
            confidence: 74,
            signals: [`Illness absence ${illness.toFixed(1)}%`],
            recommendations: ["Check seasonal patterns and occupational health support access."],
            relatedMetricIds: ["illness_absence"],
          },
          -4,
        )
      }
      break
    }

    case "general": {
      const span = val(m.span_of_control)
      const prod = val(m.employee_productivity)
      const hrCost = val(m.hr_cost_per_employee)
      if (span != null) {
        push(
          {
            id: "gen-span",
            title: "Span of control",
            summary: `Average span of control is ${span.toFixed(2)} subordinates per manager. ${
              span > 12
                ? "Very wide spans can dilute coaching quality."
                : span < 3
                  ? "Narrow spans may indicate management layers that can be streamlined."
                  : "Span looks structurally balanced."
            }`,
            severity: span > 12 || span < 3 ? "watch" : "positive",
            confidence: 73,
            signals: [`Span ${span.toFixed(2)}`],
            recommendations: ["Review manager load in the widest teams first."],
            relatedMetricIds: ["span_of_control"],
          },
          span > 12 || span < 3 ? -4 : 3,
        )
      }
      if (prod != null) {
        push(
          {
            id: "gen-prod",
            title: "Productivity reading",
            summary: `Output per employee is ${prod.toLocaleString("en-GH")}. Treat this as a directional KPI against prior periods.`,
            severity: "info",
            confidence: 66,
            signals: [`Productivity ${prod}`],
            recommendations: ["Keep company_financials.output_units current each month."],
            relatedMetricIds: ["employee_productivity"],
          },
          1,
        )
      }
      if (hrCost != null) {
        push(
          {
            id: "gen-hr-cost",
            title: "HR cost efficiency",
            summary: `HR cost per employee is GHS ${hrCost.toLocaleString("en-GH")}.`,
            severity: "info",
            confidence: 68,
            signals: [`HR cost / employee GHS ${hrCost.toLocaleString("en-GH")}`],
            recommendations: ["Benchmark against headcount growth and automation of HR ops."],
            relatedMetricIds: ["hr_cost_per_employee"],
          },
          1,
        )
      }
      break
    }

    default: {
      for (const metric of category.metrics.slice(0, 3)) {
        if (metric.value == null) continue
        push(
          {
            id: `generic-${metric.id}`,
            title: metric.name,
            summary: `${metric.name} is currently ${formatMetricValue(metric)} using ${metric.formula}.`,
            severity: "info",
            confidence: 60,
            signals: [formatMetricValue(metric)],
            recommendations: ["Review trend vs the previous period for context."],
            relatedMetricIds: [metric.id],
          },
          0,
        )
      }
    }
  }

  // Data completeness penalty
  const missing = category.metrics.filter((x) => x.dataStatus === "no_data").length
  if (missing > 0) {
    blocks.push({
      id: "data-gaps",
      title: "Data completeness notice",
      summary: `${missing} metric${missing > 1 ? "s" : ""} lack source data for this period. Insights for those items are limited until the underlying tables are populated.`,
      severity: "info",
      confidence: 90,
      signals: category.metrics.filter((x) => x.dataStatus === "no_data").map((x) => x.name),
      recommendations: ["Populate supporting tables noted on each metric card (e.g. company_financials, recruitment_costs)."],
      relatedMetricIds: category.metrics.filter((x) => x.dataStatus === "no_data").map((x) => x.id),
    })
    score -= missing * 2
  }

  if (!blocks.length) {
    blocks.push({
      id: "baseline",
      title: "Baseline observation",
      summary: "Insufficient numeric signals to form a strong ML reading. Refresh after more period data lands.",
      severity: "info",
      confidence: 55,
      signals: [],
      recommendations: ["Ensure attendance, payroll, and people records are synced for the selected dates."],
      relatedMetricIds: [],
    })
  }

  return { healthScore: clamp(Math.round(score)), blocks }
}

function buildExecutiveBrief(category: CategoryReport, healthScore: number, blocks: AiMlInsightBlock[]): string {
  const critical = blocks.filter((b) => b.severity === "critical")
  const positive = blocks.filter((b) => b.severity === "positive")
  const topMetrics = category.metrics
    .filter((m) => m.value != null)
    .slice(0, 3)
    .map((m) => `${m.name}: ${formatMetricValue(m)}`)
    .join("; ")

  const tone =
    healthScore >= 65
      ? "Overall the period looks manageable with more strengths than risks."
      : "The period shows material risks that deserve management attention."

  return [
    `${category.title} health score is ${healthScore}/100 (${healthLabel(healthScore)}). ${tone}`,
    topMetrics ? `Key readings — ${topMetrics}.` : "",
    critical.length
      ? `Priority focus: ${critical.map((c) => c.title.toLowerCase()).join("; ")}.`
      : positive.length
        ? `Notable strengths: ${positive
            .slice(0, 2)
            .map((p) => p.title.toLowerCase())
            .join("; ")}.`
        : "",
  ]
    .filter(Boolean)
    .join(" ")
}

function fallbackNarrative(pkg: Omit<CategoryAiMlPackage, "narrative" | "aiModel" | "source" | "generatedAt">): string {
  const lines = [
    `Professional briefing for ${pkg.categoryTitle} (${pkg.periodStart} to ${pkg.periodEnd}).`,
    pkg.executiveBrief,
    "",
    "Structured findings:",
    ...pkg.blocks.map(
      (b, i) =>
        `${i + 1}. ${b.title} (${b.severity}, confidence ${b.confidence}%). ${b.summary} Recommended: ${b.recommendations[0] || "Monitor."}`,
    ),
  ]
  return lines.join("\n")
}

async function generateAiNarrative(input: {
  category: CategoryReport
  healthScore: number
  executiveBrief: string
  blocks: AiMlInsightBlock[]
  periodStart: string
  periodEnd: string
}): Promise<{ text: string; model: string } | null> {
  try {
    const { generateText } = await import("ai")
    const metricLines = input.category.metrics
      .map((m) => `- ${m.name}: ${formatMetricValue(m)} [${m.dataStatus}] (${m.formula})`)
      .join("\n")
    const blockLines = input.blocks
      .map((b) => `- ${b.title} [${b.severity}/${b.confidence}%]: ${b.summary}`)
      .join("\n")

    const prompt = `You are a senior HR analytics advisor for a Ghanaian employer using AkwaabaHRPay.
Write a clear, professional briefing (3 short paragraphs + 3 bullet recommendations) for the "${input.category.title}" report covering ${input.periodStart} to ${input.periodEnd}.
Do not invent numbers. Use only the metrics and ML findings provided.
Tone: board-ready, calm, actionable. No slang. No markdown headings with #. Use plain paragraphs and simple bullets with "•".

Health score: ${input.healthScore}/100
Executive brief: ${input.executiveBrief}

Metrics:
${metricLines}

ML findings:
${blockLines}`

    const { text } = await generateText({
      model: "groq/llama-3.3-70b-versatile",
      prompt,
      maxOutputTokens: 900,
      temperature: 0.4,
    })

    if (!text?.trim()) return null
    return { text: text.trim(), model: "groq/llama-3.3-70b-versatile" }
  } catch (err) {
    console.warn("[hr-formula-ai] narrative fallback:", err)
    return null
  }
}

export async function buildCategoryAiMlInsights(input: {
  category: CategoryReport
  periodStart: string
  periodEnd: string
  includeAi?: boolean
}): Promise<CategoryAiMlPackage> {
  const { healthScore, blocks } = scoreCategory(input.category)
  const executiveBrief = buildExecutiveBrief(input.category, healthScore, blocks)

  const base = {
    categoryId: input.category.id,
    categoryTitle: input.category.title,
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    healthScore,
    healthLabel: healthLabel(healthScore),
    executiveBrief,
    blocks,
    mlModel: "hr-formula-ensemble-v1",
  }

  let narrative = fallbackNarrative(base)
  let aiModel: string | null = null
  let source: "ml+ai" | "ml" = "ml"

  if (input.includeAi !== false) {
    const ai = await generateAiNarrative({
      category: input.category,
      healthScore,
      executiveBrief,
      blocks,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
    })
    if (ai) {
      narrative = ai.text
      aiModel = ai.model
      source = "ml+ai"
    }
  }

  return {
    ...base,
    narrative,
    aiModel,
    source,
    generatedAt: new Date().toISOString(),
  }
}
