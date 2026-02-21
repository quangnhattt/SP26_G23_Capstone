import { LoadingContext } from "@/context/LoadingContent";
import React from "react";

const useLoading = () => {
  const context = React.useContext(LoadingContext);
  if (!context) {
    throw new Error("useLoading must be used within a LoadingProvider");
  }
  return context;
};

export default useLoading;
