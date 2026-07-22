import axios, { type AxiosError, type AxiosResponse } from "axios";
import { ApiRequestError, type ApiResponse } from "@/types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: "application/json",
  },
});

function handleApiError(error: unknown): never {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiResponse<unknown>>;
    const message =
      axiosError.response?.data &&
      typeof axiosError.response.data === "object" &&
      "message" in axiosError.response.data &&
      typeof axiosError.response.data.message === "string"
        ? axiosError.response.data.message
        : "Request failed";
    const statusCode = axiosError.response?.status ?? 500;
    throw new ApiRequestError(statusCode, message);
  }

  throw new ApiRequestError(500, "Request failed");
}

function unwrapResponse<T>(response: AxiosResponse<ApiResponse<T>>): T {
  const body = response.data;

  if (!body.success) {
    throw new ApiRequestError(response.status, body.message);
  }

  return body.data;
}

export async function apiGet<T>(path: string): Promise<T> {
  try {
    const response = await apiClient.get<ApiResponse<T>>(path);
    return unwrapResponse(response);
  } catch (error) {
    if (error instanceof ApiRequestError) {
      throw error;
    }
    handleApiError(error);
  }
}

export async function apiPost<T, P = unknown>(
  path: string,
  payload?: P
): Promise<T> {
  try {
    const response = await apiClient.post<ApiResponse<T>>(path, payload);
    return unwrapResponse(response);
  } catch (error) {
    if (error instanceof ApiRequestError) {
      throw error;
    }
    handleApiError(error);
  }
}

export async function apiPatch<T, P = unknown>(
  path: string,
  payload?: P
): Promise<T> {
  try {
    const response = await apiClient.patch<ApiResponse<T>>(path, payload);
    return unwrapResponse(response);
  } catch (error) {
    if (error instanceof ApiRequestError) {
      throw error;
    }
    handleApiError(error);
  }
}

export async function apiDelete<T>(path: string): Promise<T> {
  try {
    const response = await apiClient.delete<ApiResponse<T>>(path);
    return unwrapResponse(response);
  } catch (error) {
    if (error instanceof ApiRequestError) {
      throw error;
    }
    handleApiError(error);
  }
}
