import { DeviceContext } from "@/context/DeviceContext";
import React from "react";

const useDevice = () => {
  const context = React.useContext(DeviceContext);
  if (context === undefined) {
    throw new Error("useDevice must be used within a DeviceProvider");
  }
  return { ...context, isMobile: context.deviceType === "mobile" };
};

export default useDevice;
