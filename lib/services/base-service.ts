import { createClient as createServerClient } from "@/lib/supabase/server"
import { createClient } from "@/lib/supabase/client"
import type { ServiceError, ServiceResponse } from "./types"

type SupabaseClient = ReturnType<typeof createServerClient> | ReturnType<typeof createClient>

export abstract class BaseService {
  protected isServer: boolean

  constructor(isServer: boolean = true) {
    this.isServer = isServer
  }

  async getClient() {
    if (this.isServer) {
      return await createServerClient()
    }
    return createClient()
  }

  protected createSuccessResponse<T>(data: T): ServiceResponse<T> {
    return {
      data,
      error: null,
      success: true,
    }
  }

  protected createErrorResponse<T>(error: ServiceError): ServiceResponse<T> {
    return {
      data: null,
      error,
      success: false,
    }
  }

  protected createError(code: string, message: string, statusCode?: number): ServiceError {
    return {
      code,
      message,
      statusCode,
    }
  }

  protected async handleRequest<T>(
    fn: (client: any) => Promise<T>,
    errorCode: string = "UNKNOWN_ERROR"
  ): Promise<ServiceResponse<T>> {
    try {
      const client = await this.getClient()
      const data = await fn(client)
      return this.createSuccessResponse(data)
    } catch (error) {
      const message = error instanceof Error ? error.message : "An unknown error occurred"
      return this.createErrorResponse(this.createError(errorCode, message))
    }
  }

  protected async handleListRequest<T>(
    table: string,
    select: string = "*",
    filter?: { column: string; operator: string; value: unknown }[],
    sorting?: { column: string; order: "asc" | "desc" }[],
    pagination?: { page?: number; pageSize?: number }
  ): Promise<
    ServiceResponse<{
      items: T[]
      total: number
      page: number
      pageSize: number
      totalPages: number
    }>
  > {
    try {
      const client = await this.getClient()
      let query = client.from(table).select(select, { count: "exact" })

      if (filter && filter.length > 0) {
        for (const f of filter) {
          if (f.operator === "eq") {
            query = query.eq(f.column, f.value)
          } else if (f.operator === "neq") {
            query = query.neq(f.column, f.value)
          } else if (f.operator === "gt") {
            query = query.gt(f.column, f.value)
          } else if (f.operator === "lt") {
            query = query.lt(f.column, f.value)
          }
        }
      }

      if (sorting && sorting.length > 0) {
        for (const sort of sorting) {
          query = query.order(sort.column, { ascending: sort.order === "asc" })
        }
      }

      const page = pagination?.page || 1
      const pageSize = pagination?.pageSize || 20
      const start = (page - 1) * pageSize
      query = query.range(start, start + pageSize - 1)

      const { data, count, error } = await query

      if (error) {
        throw error
      }

      const totalPages = Math.ceil((count || 0) / pageSize)

      return this.createSuccessResponse({
        items: data as T[],
        total: count || 0,
        page,
        pageSize,
        totalPages,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch list"
      return this.createErrorResponse(this.createError("LIST_ERROR", message))
    }
  }
}
