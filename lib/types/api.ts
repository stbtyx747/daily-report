export type ApiMeta = {
  total: number
  page: number
  per_page: number
}

export type ApiResponse<T> = {
  data: T
}

export type ApiListResponse<T> = {
  data: T[]
  meta: ApiMeta
}

export type ApiError = {
  error: {
    code: string
    message: string
    details?: { field: string; message: string }[]
  }
}
