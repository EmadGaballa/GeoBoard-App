import axios, { type AxiosInstance, type AxiosError, type AxiosRequestConfig } from 'axios'
import { ApiError } from './types'

// ======================================================
// API CLIENT: Axios Configuration
// ======================================================

class ApiClient {
  private client: AxiosInstance

 constructor() {
  const baseURL =
    import.meta.env.VITE_API_URL ||
    (import.meta.env.DEV ? 'http://localhost:3001' : '')

  this.client = axios.create({
    baseURL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: true,
  })

  this.client.interceptors.response.use(
    response => response,
    error => this.handleError(error)
  )
}

  private handleError(error: AxiosError): Promise<ApiError> {
    const apiError: ApiError = {
      message: error.message,
      status: error.response?.status,
      code: error.code,
    }

    if (error.response?.status === 429) {
      apiError.message = 'Rate limit exceeded. Please try again later.'
    } else if (error.response?.status === 401) {
      apiError.message = 'Unauthorized. Please check your API keys.'
    } else if (error.response?.status === 404) {
      apiError.message = 'Resource not found.'
    } else if (error.response?.status === 500) {
      apiError.message = 'Server error. Please try again later.'
    } else if (!navigator.onLine) {
      apiError.message = 'No internet connection.'
    }

    return Promise.reject(apiError)
  }

  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config)
    return response.data
  }

  public async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config)
    return response.data
  }

  public async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config)
    return response.data
  }

  public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config)
    return response.data
  }
}

export const apiClient = new ApiClient()