import type { BaseQueryFn } from "@reduxjs/toolkit/query";
import type { AxiosError, AxiosRequestConfig } from "axios";
import { api } from "./client";
import { HTTP_METHOD } from "../utils/http";

export interface AxiosBaseQueryArgs {
  url: string;
  method?: HTTP_METHOD;
  data?: AxiosRequestConfig["data"];
  params?: AxiosRequestConfig["params"];
}

export interface AxiosBaseQueryError {
  status?: number;
  data: unknown;
}

export const axiosBaseQuery =
  (): BaseQueryFn<AxiosBaseQueryArgs, unknown, AxiosBaseQueryError> =>
  async ({ url, method, data, params }) => {
    try {
      const result = await api.request({ url, method: method ?? HTTP_METHOD.GET, data, params });
      return { data: result.data };
    } catch (err) {
      const axiosError = err as AxiosError;
      return {
        error: {
          status: axiosError.response?.status,
          data: axiosError.response?.data ?? axiosError.message,
        },
      };
    }
  };
