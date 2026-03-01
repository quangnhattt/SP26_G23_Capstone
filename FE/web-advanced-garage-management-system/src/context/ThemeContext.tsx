import LocalStorage from "@/apis/LocalStorage";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export interface Theme {
  colors: {
    primary: string;
    background: string;
    text: string;
  };
  primaryColor: string;
  backgroundColor: string;
  backgroundColor1: string;
  textColor: string;
  textColor1: string;
  buttonBackgroundColor: string;
  timeBackgroundColor: string;
  buttonTextColor: string;
  n3: string;
  choosedItem: string;
  white: string;
  base2: string;
  line: string;
  hightlai: string;
  greenbae: string;
  black: string;
  green: string;
  red: string;
  border2lai: string;
  iconChoosed: string;
  link: string;
  gradiant1: string;
  gradiant2: string;
  icon: string;
  base2Item: string;
  colorLine: string;
  colorActive: string;
  white1: string;
  textInput: string;
  primaryColor2: string;
  textHighlight: string;
}

export interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isDarkMode: boolean;
}

const themes: { light: Theme; dark: Theme } = {
  light: {
    colors: {
      primary: "#FFFFFF",
      background: "#FFFFFF",
      text: "#192756",
    },
    primaryColor: "#FFFFFF",
    primaryColor2: "#FFFFFF",
    backgroundColor: "#FFFFFF",
    backgroundColor1: "#FFFFFF",
    textColor: "#192756",
    textColor1: "#808080",
    buttonBackgroundColor: "#E0E0E0",
    timeBackgroundColor: "#E8F0FF",
    buttonTextColor: "#000000",
    n3: "#3D404A",
    choosedItem: "#9AA6B8",
    white: "#3D404A",
    base2: "#E4EFFF",
    base2Item: "#FFFFFF",
    line: "#69A9F9",
    hightlai: "#E4EFFF",
    greenbae: "#3DD351",
    black: "#D7DFEE",
    green: "#0A8D43",
    red: "#FF4646",
    border2lai: "#bbd4f6",
    iconChoosed: "#69A9F9",
    link: "#69a9f9",
    gradiant1: "#1DBCDF",
    gradiant2: "#2234E9",
    icon: "#9AA6B8",
    colorLine: "#006FEE",
    colorActive: "#006FEE",
    white1: "#ffffff",
    textInput: "#E5E5E5",
    textHighlight: "#192756",
  },
  dark: {
    colors: {
      primary: "#081930",
      background: "#121212",
      text: "#FFFFFF",
    },
    primaryColor: "#081930",
    primaryColor2: "#0F2255",
    backgroundColor: "#121212",
    backgroundColor1: "#1d377e",
    textColor: "#FFFFFF",
    textColor1: "#cccccc",
    buttonBackgroundColor: "#333333",
    timeBackgroundColor: "#ffffff",
    buttonTextColor: "#FFFFFF",
    n3: "#CCD6E2",
    choosedItem: "#BBD4F6",
    white: "#ffffff",
    base2: "#122745",
    base2Item: "#122745",
    line: "#69A9F9",
    hightlai: "#193761",
    greenbae: "#3DD351",
    black: "#050F1C",
    green: "#0A8D43",
    red: "#FF4646",
    border2lai: "#bbd4f6",
    iconChoosed: "#69A9F9",
    link: "#69a9f9",
    gradiant1: "#1DBCDF",
    gradiant2: "#2234E9",
    icon: "#BBD4F6",
    colorLine: "#ffd700",
    colorActive: "#006FEE",
    white1: "#ffffff",
    textInput: "#E5E5E5",
    textHighlight: "#cccccc",
  },
};

// Create ThemeContext
export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// ThemeProvider component
export const ThemeProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [isDarkMode, setIsDarkMode] = useState(LocalStorage.getThemeMode());

  useEffect(() => {
    LocalStorage.setThemeMode(isDarkMode);
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode((prevMode) => !prevMode);
  const theme = isDarkMode ? themes.dark : themes.light;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use the ThemeContext
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
