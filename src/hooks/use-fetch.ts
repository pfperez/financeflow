import { useState, useCallback } from "react";
import { toast } from "sonner";

interface UseFetchOptions {
  onSuccess?: () => void;
  successMessage?: string;
}

export function useFetch<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(url);
      if (res.ok) {
        setData(await res.json());
      }
    } catch {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [url]);

  return { data, setData, loading, fetchData };
}

export function useMutation(options?: UseFetchOptions) {
  const [loading, setLoading] = useState(false);

  const mutate = useCallback(
    async (url: string, init?: RequestInit) => {
      setLoading(true);
      try {
        const res = await fetch(url, init);
        const data = await res.json();

        if (!res.ok) {
          toast.error(data.error || "Something went wrong");
          return null;
        }

        if (options?.successMessage) {
          toast.success(options.successMessage);
        }
        options?.onSuccess?.();
        return data;
      } catch {
        toast.error("Something went wrong");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [options]
  );

  return { mutate, loading };
}
