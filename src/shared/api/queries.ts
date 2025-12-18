import { queryOptions } from "@tanstack/react-query";
import { api } from "./eden";

export const healthQueryOptions = queryOptions({
  queryKey: ["health"],
  queryFn: async () => {
    const { data, error } = await api.health.get();
    if (error) {
      throw error;
    }
    return data;
  },
});

export const meQueryOptions = queryOptions({
  queryKey: ["me"],
  queryFn: async () => {
    const { data, error } = await api.me.get();
    if (error) {
      throw error;
    }
    return data;
  },
});
