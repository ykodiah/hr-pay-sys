import { NextRequest, NextResponse } from "next/server"
import { getSuperadminDb } from "@/lib/superadmin/db"
import {
  ensureSeedSuperadmin,
  SEED_SUPERADMIN_EMAIL,
  SEED_SUPERADMIN_PASSWORD,
} from "@/lib/superadmin/ensure-seed"
import { verifySuperAdminToken } from "@/lib/superadmin/auth"

/**
 * Ensure / reset the seed superadmin account.
 *
 * Allowed when:
 * - No superadmin users exist yet, OR
 * - SUPERADMIN_BOOTSTRAP_SECRET matches body.bootstrap_secret, OR
 * - Caller is already an authenticated superadmin
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const client = getSuperadminDb()

    const { count } = await client
      .from("superadmin_users")
      .select("id", { count: "exact", head: true })

    const noUsers = !count || count === 0
    const secret = process.env.SUPERADMIN_BOOTSTRAP_SECRET || ""
    const providedSecret = String(body.bootstrap_secret || "")
    const secretOk = Boolean(secret) && providedSecret === secret
    const auth = await verifySuperAdminToken(req)
    const authed = Boolean(auth?.valid)

    if (!noUsers && !secretOk && !authed) {
      return NextResponse.json(
        {
          error:
            "Bootstrap locked. Sign in if you can, or set SUPERADMIN_BOOTSTRAP_SECRET and pass bootstrap_secret.",
        },
        { status: 403 },
      )
    }

    const email = String(body.email || SEED_SUPERADMIN_EMAIL).trim().toLowerCase()
    const password = String(body.password || SEED_SUPERADMIN_PASSWORD)
    const resetPassword = body.reset_password !== false || noUsers || secretOk

    const result = await ensureSeedSuperadmin(client, {
      email,
      password,
      resetPassword,
    })

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      email: result.email,
      created: result.created,
      reset: result.reset,
      message: result.created
        ? `Created superadmin ${result.email}`
        : result.reset
          ? `Reset password for ${result.email}`
          : `Superadmin ${result.email} already exists`,
      hint: `Login with ${result.email} / ${password === SEED_SUPERADMIN_PASSWORD ? SEED_SUPERADMIN_PASSWORD : "(your password)"}`,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Bootstrap failed" }, { status: 500 })
  }
}
