const VARIABLE_PATTERN = /{{\s*([a-zA-Z0-9_.-]+)\s*}}/g

export type TemplateChannel = "email" | "sms" | "whatsapp" | "push" | "teams" | "slack" | "webhook"

export interface TemplateVariableDefinition {
  key: string
  label?: string
  description?: string
  required?: boolean
  dataType?: "string" | "number" | "date" | "boolean" | "currency" | string
  example?: string
  source?: string
}

export interface TemplateVersionPayload {
  id?: string
  template_id?: string
  version_number?: number
  subject?: string | null
  content_text?: string | null
  content_html?: string | null
  preview_json?: Record<string, unknown> | null
  variables?: TemplateVariableDefinition[] | null
  metadata?: Record<string, unknown> | null
  status?: "draft" | "published" | "archived"
  created_at?: string
  published_at?: string | null
}

export interface TemplateRenderScopes {
  /**
   * Default variable bag. `{{first_name}}` resolves against this object using dot-notation.
   */
  variables?: Record<string, unknown>
  /**
   * Additional named scopes accessed via `{{scope.key}}` syntax.
   * Example: `{ employee: {...}, company: {...} }` allows `{{employee.first_name}}`.
   */
  scopes?: Record<string, Record<string, unknown>>
  /**
   * Optional order override for resolving fallback scopes when a token doesn't specify a namespace.
   */
  fallbackScopeOrder?: string[]
  /**
   * Custom fallback resolver invoked when a token cannot be resolved from provided scopes.
   */
  fallback?: (token: string) => unknown
  /**
   * When true, unresolved tokens remain intact (e.g. `{{first_name}}`) rather than being replaced with an empty string.
   */
  preserveUnresolved?: boolean
}

export interface TemplateRenderResult {
  subject: string | null
  text: string | null
  html: string | null
  /** Variables referenced during rendering (deduplicated). */
  referencedVariables: string[]
  /** Required variables (from definitions) that were missing or empty. */
  missingRequired: string[]
  /** Optional variables referenced but unresolved. */
  missingOptional: string[]
  /** Provided variable keys that were not referenced in any template field. */
  unusedSuppliedKeys: string[]
}

function deepGet(source: unknown, path: string[]): unknown {
  if (!source || typeof source !== "object") return undefined
  let cursor: any = source
  for (const segment of path) {
    if (cursor == null || typeof cursor !== "object" || !(segment in cursor)) {
      return undefined
    }
    cursor = cursor[segment]
  }
  return cursor
}

function normaliseToString(value: unknown): string {
  if (value === null || value === undefined) return ""
  if (typeof value === "string") return value
  if (typeof value === "number" || typeof value === "boolean") return String(value)
  if (value instanceof Date) return value.toISOString()
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

function listSuppliedKeysFromObject(source: Record<string, unknown> | undefined, prefix = ""): string[] {
  if (!source) return []
  const keys: string[] = []
  for (const [key, value] of Object.entries(source)) {
    const qualified = prefix ? `${prefix}.${key}` : key
    keys.push(qualified)
    if (value && typeof value === "object" && !Array.isArray(value)) {
      keys.push(...listSuppliedKeysFromObject(value as Record<string, unknown>, qualified))
    }
  }
  return keys
}

function resolveToken(token: string, scopes: TemplateRenderScopes): unknown {
  const trimmed = token.trim()
  if (!trimmed) return undefined

  const path = trimmed.split(".")
  const primaryScopes = scopes.scopes ?? {}
  const defaultVariables = scopes.variables ?? {}
  const fallbackScopesOrder = scopes.fallbackScopeOrder ?? Object.keys(primaryScopes)

  if (path.length > 1) {
    const [root, ...rest] = path
    if (primaryScopes[root]) {
      const scopedValue = deepGet(primaryScopes[root], rest)
      if (scopedValue !== undefined) return scopedValue
    }
  }

  const directFromVariables = deepGet(defaultVariables, path)
  if (directFromVariables !== undefined) {
    return directFromVariables
  }

  for (const scopeKey of fallbackScopesOrder) {
    const scope = primaryScopes[scopeKey]
    if (!scope) continue
    const scopedValue = deepGet(scope, path)
    if (scopedValue !== undefined) {
      return scopedValue
    }
  }

  if (typeof scopes.fallback === "function") {
    return scopes.fallback(trimmed)
  }

  return undefined
}

function extractTokensFromText(input?: string | null): string[] {
  if (!input) return []
  const tokens = new Set<string>()
  for (const match of input.matchAll(VARIABLE_PATTERN)) {
    const token = match[1]?.trim()
    if (token) {
      tokens.add(token)
    }
  }
  return Array.from(tokens)
}

interface RenderFieldOutcome {
  rendered: string | null
  referenced: Set<string>
  unresolved: Set<string>
}

function renderField(input: string | null | undefined, scopes: TemplateRenderScopes): RenderFieldOutcome {
  if (input == null) {
    return { rendered: null, referenced: new Set(), unresolved: new Set() }
  }

  const referenced = new Set<string>()
  const unresolved = new Set<string>()

  const rendered = input.replace(VARIABLE_PATTERN, (_match, tokenRaw: string) => {
    const token = tokenRaw.trim()
    referenced.add(token)
    const value = resolveToken(token, scopes)
    if (value === undefined || value === null || value === "") {
      unresolved.add(token)
      return scopes.preserveUnresolved ? `{{${token}}}` : ""
    }
    return normaliseToString(value)
  })

  return { rendered, referenced, unresolved }
}

export function collectTemplateTokens(version: TemplateVersionPayload): string[] {
  const tokens = new Set<string>()
  extractTokensFromText(version.subject).forEach((token) => tokens.add(token))
  extractTokensFromText(version.content_text).forEach((token) => tokens.add(token))
  extractTokensFromText(version.content_html).forEach((token) => tokens.add(token))
  return Array.from(tokens)
}

export function renderTemplate(
  version: TemplateVersionPayload,
  scopes: TemplateRenderScopes
): TemplateRenderResult {
  const definitions = new Map<string, TemplateVariableDefinition>()
  for (const definition of version.variables ?? []) {
    if (!definition?.key) continue
    definitions.set(definition.key, definition)
  }

  const referencedTokens = new Set<string>()
  const unresolvedTokens = new Set<string>()

  const subjectOutcome = renderField(version.subject ?? null, scopes)
  const textOutcome = renderField(version.content_text ?? null, scopes)
  const htmlOutcome = renderField(version.content_html ?? null, scopes)

  subjectOutcome.referenced.forEach((token) => referencedTokens.add(token))
  textOutcome.referenced.forEach((token) => referencedTokens.add(token))
  htmlOutcome.referenced.forEach((token) => referencedTokens.add(token))

  subjectOutcome.unresolved.forEach((token) => unresolvedTokens.add(token))
  textOutcome.unresolved.forEach((token) => unresolvedTokens.add(token))
  htmlOutcome.unresolved.forEach((token) => unresolvedTokens.add(token))

  const missingRequired = new Set<string>()
  const missingOptional = new Set<string>()

  const allCandidates = new Set<string>([...referencedTokens, ...definitions.keys()])

  for (const token of allCandidates) {
    const definition = definitions.get(token)
    const value = resolveToken(token, scopes)
    const isMissing = value === undefined || value === null || (typeof value === "string" && value.trim().length === 0)

    if (definition?.required) {
      if (isMissing) {
        missingRequired.add(token)
      }
    } else if (unresolvedTokens.has(token) && isMissing) {
      missingOptional.add(token)
    }
  }

  const suppliedKeys = new Set<string>()
  listSuppliedKeysFromObject(scopes.variables).forEach((key) => suppliedKeys.add(key))
  if (scopes.scopes) {
    for (const [scopeKey, scopeValue] of Object.entries(scopes.scopes)) {
      listSuppliedKeysFromObject(scopeValue, scopeKey).forEach((key) => suppliedKeys.add(key))
    }
  }

  const unusedSuppliedKeys = Array.from(suppliedKeys).filter((key) => {
    return !Array.from(referencedTokens).some((token) => token === key || token.startsWith(`${key}.`) || key.startsWith(`${token}.`))
  })

  return {
    subject: subjectOutcome.rendered,
    text: textOutcome.rendered,
    html: htmlOutcome.rendered,
    referencedVariables: Array.from(referencedTokens).sort(),
    missingRequired: Array.from(missingRequired).sort(),
    missingOptional: Array.from(missingOptional).sort(),
    unusedSuppliedKeys: unusedSuppliedKeys.sort(),
  }
}

export function validateTemplateVariables(
  version: TemplateVersionPayload,
  definitions: TemplateVariableDefinition[] | null | undefined
): {
  missingDefinitions: string[]
  unusedDefinitions: string[]
} {
  const provided = new Map<string, TemplateVariableDefinition>()
  for (const definition of definitions ?? []) {
    if (!definition?.key) continue
    provided.set(definition.key, definition)
  }

  const referencedTokens = collectTemplateTokens(version)
  const missingDefinitions = referencedTokens.filter((token) => !provided.has(token))
  const unusedDefinitions = Array.from(provided.keys()).filter((key) => !referencedTokens.includes(key))

  return {
    missingDefinitions: Array.from(new Set(missingDefinitions)).sort(),
    unusedDefinitions: Array.from(new Set(unusedDefinitions)).sort(),
  }
}
