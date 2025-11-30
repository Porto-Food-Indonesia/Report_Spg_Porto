// Utility for consistent API response handling

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export async function handleApiResponse<T>(response: Response): Promise<ApiResponse<T>> {
  try {
    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      return {
        success: false,
        error: error.message || `HTTP Error: ${response.status}`,
      }
    }

    const data = await response.json()
    return {
      success: true,
      data: data,
      message: "Success",
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

export function createSuccessResponse<T>(data: T, message = "Success"): ApiResponse<T> {
  return { success: true, data, message }
}

export function createErrorResponse(error: string): ApiResponse {
  return { success: false, error }
}
