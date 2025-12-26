import { queryOptions } from "@tanstack/react-query";
import { api } from "./eden";

/**
 * Query options for health check endpoint
 * Can be used with useQuery or as an auto-fetching queryOptions object
 */
export const healthQueryOptions = queryOptions({
  queryKey: ["health"],
  queryFn: async () => {
    const res = await api.health.get();
    if (res.error) {
      throw res.error;
    }
    return res.data;
  },
});

/**
 * Query options for current user session endpoint
 * Can be used with useQuery or as an auto-fetching queryOptions object
 */
export const meQueryOptions = queryOptions({
  queryKey: ["me"],
  queryFn: async () => {
    const res = await api.me.get();
    if (res.error) {
      throw res.error;
    }
    return res.data;
  },
});
