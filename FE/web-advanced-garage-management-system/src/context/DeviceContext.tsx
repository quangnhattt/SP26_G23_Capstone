import React from "react";
import UAParser from "ua-parser-js";

export type DeviceContextType = "mobile" | "tablet" | "desktop";

export const DeviceContext = React.createContext<
  { deviceType: DeviceContextType } | undefined
>(undefined);

interface DeviceProviderProps {
  children: React.ReactNode;
  initialDeviceType: DeviceContextType;
}

export const DeviceProvider = ({
  children,
  initialDeviceType,
}: DeviceProviderProps) => {
  const [deviceType, setDeviceType] =
    React.useState<DeviceContextType>(initialDeviceType);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const parser = new UAParser();
      const result = parser.getResult();
      setDeviceType((result.device.type as DeviceContextType) || "desktop");
    }
  }, []);

  return (
    <DeviceContext.Provider value={{ deviceType: deviceType }}>
      {children}
    </DeviceContext.Provider>
  );
};
