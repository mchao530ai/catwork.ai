import { useQuery } from "@tanstack/react-query";
import type { UseQueryOptions } from "@tanstack/react-query";
import { customFetch } from "./custom-fetch";

export interface TransportInfo {
  id: number;
  type: string;
  title: string;
  description: string;
  note: string;
  titleJa?: string | null;
  descriptionJa?: string | null;
  noteJa?: string | null;
  titleZh?: string | null;
  descriptionZh?: string | null;
  noteZh?: string | null;
  sortOrder: number;
}

export interface TransportInfoInput {
  type: string;
  title: string;
  description: string;
  note?: string;
  titleJa?: string | null;
  descriptionJa?: string | null;
  noteJa?: string | null;
  titleZh?: string | null;
  descriptionZh?: string | null;
  noteZh?: string | null;
  sortOrder?: number;
}

export interface NearbyLandmark {
  id: number;
  name: string;
  distance: string;
  nameJa?: string | null;
  nameZh?: string | null;
  sortOrder: number;
}

export interface NearbyLandmarkInput {
  name: string;
  distance: string;
  nameJa?: string | null;
  nameZh?: string | null;
  sortOrder?: number;
}

export const getListTransportInfoQueryKey = () => ["/api/site-config/transport"] as const;
export const getListNearbyLandmarksQueryKey = () => ["/api/site-config/landmarks"] as const;

export const listTransportInfo = async (): Promise<TransportInfo[]> =>
  customFetch<TransportInfo[]>("/api/site-config/transport", { method: "GET" });

export const listNearbyLandmarks = async (): Promise<NearbyLandmark[]> =>
  customFetch<NearbyLandmark[]>("/api/site-config/landmarks", { method: "GET" });

export const useListTransportInfo = (options?: {
  query?: UseQueryOptions<TransportInfo[], Error, TransportInfo[]>;
}) => {
  return useQuery<TransportInfo[], Error>({
    queryKey: getListTransportInfoQueryKey(),
    queryFn: listTransportInfo,
    ...options?.query,
  });
};

export const useListNearbyLandmarks = (options?: {
  query?: UseQueryOptions<NearbyLandmark[], Error, NearbyLandmark[]>;
}) => {
  return useQuery<NearbyLandmark[], Error>({
    queryKey: getListNearbyLandmarksQueryKey(),
    queryFn: listNearbyLandmarks,
    ...options?.query,
  });
};
