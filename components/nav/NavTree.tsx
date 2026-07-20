"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { ChevronDown, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { AppNavModule, AppNavNode } from "@/lib/navigation/app-nav-tree"
import { pathMatchesHref } from "@/lib/navigation/app-nav-tree"

type Props = {
  modules: AppNavModule[]
  collapsed?: boolean
  themeColor?: string
  onNavigate?: () => void
}

function nodeOrDescendantActive(
  node: AppNavNode,
  pathname: string,
  search: string,
): boolean {
  if (node.href && pathMatchesHref(pathname, search, node.href)) return true
  return Boolean(node.children?.some((c) => nodeOrDescendantActive(c, pathname, search)))
}

function collectActiveAncestors(modules: AppNavModule[], pathname: string, search: string): Set<string> {
  const open = new Set<string>()
  const walk = (nodes: AppNavNode[], ancestors: string[]) => {
    for (const n of nodes) {
      const chain = [...ancestors, n.code]
      if (n.href && pathMatchesHref(pathname, search, n.href)) {
        chain.forEach((c) => open.add(c))
      }
      if (n.children?.length) {
        if (n.children.some((c) => nodeOrDescendantActive(c, pathname, search))) {
          chain.forEach((c) => open.add(c))
        }
        walk(n.children, chain)
      }
    }
  }
  for (const m of modules) {
    if (m.children.some((c) => nodeOrDescendantActive(c, pathname, search))) {
      open.add(m.code)
    }
    walk(m.children, [m.code])
  }
  // Numbered modules start expanded so the tree is discoverable
  for (const m of modules) open.add(m.code)
  return open
}

export function NavTree({ modules, collapsed = false, themeColor, onNavigate }: Props) {
  const pathname = usePathname() || ""
  const searchParams = useSearchParams()
  const search = searchParams?.toString() ? `?${searchParams.toString()}` : ""

  const [expanded, setExpanded] = useState<Set<string>>(() =>
    collectActiveAncestors(modules, pathname, search),
  )
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch("/api/nav/tree-state", { credentials: "include" })
        if (!res.ok) {
          if (!cancelled) setHydrated(true)
          return
        }
        const data = await res.json()
        const ids: string[] = Array.isArray(data?.expanded_codes) ? data.expanded_codes : []
        if (!cancelled && ids.length > 0) {
          setExpanded(new Set(ids))
        }
      } catch {
        /* keep defaults */
      } finally {
        if (!cancelled) setHydrated(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!hydrated) return
    setExpanded((prev) => {
      const next = new Set(prev)
      collectActiveAncestors(modules, pathname, search).forEach((c) => next.add(c))
      return next
    })
  }, [pathname, search, modules, hydrated])

  const persist = useCallback((next: Set<string>) => {
    void fetch("/api/nav/tree-state", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ expanded_codes: Array.from(next) }),
    }).catch(() => {})
  }, [])

  const toggle = useCallback(
    (code: string) => {
      setExpanded((prev) => {
        const next = new Set(prev)
        if (next.has(code)) next.delete(code)
        else next.add(code)
        if (hydrated) persist(next)
        return next
      })
    },
    [hydrated, persist],
  )

  if (!modules.length) return null

  if (collapsed) {
    return (
      <div className="space-y-1 pt-2">
        {modules.map((mod) => {
          const active = mod.children.some((c) => nodeOrDescendantActive(c, pathname, search))
          return (
            <button
              key={mod.code}
              type="button"
              title={mod.title}
              onClick={() => toggle(mod.code)}
              className={cn(
                "flex w-full items-center justify-center rounded-lg px-2 py-2 text-xs font-bold",
                active ? "text-white" : "text-gray-600 hover:bg-gray-100",
              )}
              style={active && themeColor ? { backgroundColor: themeColor } : undefined}
            >
              {mod.number}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-1 pt-2">
      {modules.map((mod) => {
        const isOpen = expanded.has(mod.code)
        const childActive = mod.children.some((c) => nodeOrDescendantActive(c, pathname, search))
        return (
          <div key={mod.code} className="mb-1">
            <button
              type="button"
              onClick={() => toggle(mod.code)}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs font-bold uppercase tracking-wide transition-colors",
                isOpen || childActive
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-800",
              )}
              aria-expanded={isOpen}
            >
              <span
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-bold text-white"
                style={{ backgroundColor: themeColor || "#059669" }}
              >
                {mod.number}
              </span>
              <span className="flex-1 truncate">{mod.title}</span>
              {isOpen ? (
                <ChevronDown className="h-3.5 w-3.5 shrink-0 text-gray-400" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-gray-400" />
              )}
            </button>
            {isOpen ? (
              <div className="ml-2 mt-0.5 space-y-0.5 border-l border-gray-200 pl-2">
                {mod.children.map((child, i) => (
                  <TreeNode
                    key={child.code}
                    node={child}
                    depth={1}
                    letter={String.fromCharCode(97 + i)}
                    pathname={pathname}
                    search={search}
                    expanded={expanded}
                    onToggle={toggle}
                    themeColor={themeColor}
                    onNavigate={onNavigate}
                  />
                ))}
              </div>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

function TreeNode({
  node,
  depth,
  letter,
  pathname,
  search,
  expanded,
  onToggle,
  themeColor,
  onNavigate,
}: {
  node: AppNavNode
  depth: number
  letter?: string
  pathname: string
  search: string
  expanded: Set<string>
  onToggle: (code: string) => void
  themeColor?: string
  onNavigate?: () => void
}) {
  const hasChildren = Boolean(node.children?.length)
  const isOpen = expanded.has(node.code)
  const active = node.href ? pathMatchesHref(pathname, search, node.href) : false
  const childActive = hasChildren && node.children!.some((c) => nodeOrDescendantActive(c, pathname, search))
  const padLeft = Math.max(0, depth - 1) * 6

  if (hasChildren) {
    return (
      <div>
        <button
          type="button"
          onClick={() => onToggle(node.code)}
          style={{ paddingLeft: 8 + padLeft }}
          className={cn(
            "flex w-full items-center gap-1.5 rounded-md py-1.5 pr-2 text-left text-[12px] font-semibold transition-colors",
            isOpen || childActive
              ? "bg-gray-50 text-gray-900"
              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
          )}
          aria-expanded={isOpen}
        >
          {letter ? (
            <span className="w-4 shrink-0 text-[10px] font-bold lowercase text-gray-400">{letter}.</span>
          ) : isOpen ? (
            <ChevronDown className="h-3 w-3 shrink-0 text-gray-400" />
          ) : (
            <ChevronRight className="h-3 w-3 shrink-0 text-gray-400" />
          )}
          <span className="flex-1 truncate">{node.label}</span>
          {letter ? (
            isOpen ? (
              <ChevronDown className="h-3 w-3 shrink-0 text-gray-400" />
            ) : (
              <ChevronRight className="h-3 w-3 shrink-0 text-gray-400" />
            )
          ) : null}
        </button>
        {isOpen ? (
          <div className="space-y-0.5">
            {node.children!.map((child) => (
              <TreeNode
                key={child.code}
                node={child}
                depth={depth + 1}
                pathname={pathname}
                search={search}
                expanded={expanded}
                onToggle={onToggle}
                themeColor={themeColor}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        ) : null}
      </div>
    )
  }

  if (!node.href) return null

  return (
    <Link
      href={node.href}
      onClick={onNavigate}
      style={{
        paddingLeft: 8 + padLeft + (letter ? 0 : 12),
        ...(active && themeColor ? { backgroundColor: themeColor, color: "#fff" } : {}),
      }}
      className={cn(
        "flex items-center gap-1.5 rounded-md py-1.5 pr-2 text-[12px] transition-colors",
        active ? "font-medium text-white" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
      )}
    >
      {letter ? (
        <span className={cn("w-4 shrink-0 text-[10px] font-bold lowercase", active ? "text-white/80" : "text-gray-400")}>
          {letter}.
        </span>
      ) : (
        <span className={cn("h-1 w-1 shrink-0 rounded-full", active ? "bg-white/80" : "bg-gray-300")} />
      )}
      <span className="truncate">{node.label}</span>
    </Link>
  )
}
