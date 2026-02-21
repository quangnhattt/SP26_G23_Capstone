import { createContext, useContext } from "react";

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
