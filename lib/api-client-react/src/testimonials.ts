import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { UseQueryOptions } from "@tanstack/react-query";
import { customFetch } from "./custom-fetch";

export interface Testimonial {
  id: number;
  author: string;
  role: string;
  quote: string;
  quoteJa?: string | null;
  quoteZh?: string | null;
  avatarUrl: string;
  rating: number;
  sortOrder: number;
  isActive: boolean;
  source?: string | null;
}

export interface TestimonialInput {
  author: string;
  role?: string;
  quote: string;
  quoteJa?: string | null;
  quoteZh?: string | null;
  avatarUrl?: string;
  rating?: number;
  sortOrder?: number;
  isActive?: boolean;
  source?: string | null;
}

export const getListTestimonialsQueryKey = () => ["/api/testimonials"] as const;

export const listTestimonials = async (): Promise<Testimonial[]> =>
  customFetch<Testimonial[]>("/api/testimonials", { method: "GET" });

export const useListTestimonials = (options?: {
  query?: UseQueryOptions<Testimonial[], Error, Testimonial[]>;
}) => {
  return useQuery<Testimonial[], Error>({
    queryKey: getListTestimonialsQueryKey(),
    queryFn: listTestimonials,
    ...options?.query,
  });
};
