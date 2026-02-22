import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createContext, useContext, useMemo, useState } from "react";

interface QueryParamsContextProps {
  referral_code?: string;
  // có thể thêm nhiều case khác trong tương lai
}

const QueryParamsContext = createContext<QueryParamsContextProps | undefined>(
  undefined
);

export const useQueryParams = (): QueryParamsContextProps => {
  const context = useContext(QueryParamsContext);
  if (!context) {
    throw new Error("useQueryParams must be used within a QueryParamsProvider");
  }
  return context;
};

const QueryProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  const queryParams = useMemo(() => {
    const params = new URLSearchParams(window.location.search);

    const referral_code =
      params.get("ref") || params.get("referral_code") || undefined;


    return {
      referral_code,
    };
  }, [window.location.pathname, window.location.search]);

  return (
    <QueryParamsContext.Provider value={queryParams}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </QueryParamsContext.Provider>
  );
};

export default QueryProvider;
