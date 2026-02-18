const LocalStorage = {
  getToken: () => localStorage.getItem("token"),
  setToken: (token: string) => localStorage.setItem("token", token),
  removeToken: () => localStorage.removeItem("token"),
  saveLanguage: (lang: string) => localStorage.setItem("language", lang),
  getLanguage: () => localStorage.getItem("language"),
  removeLanguage: () => localStorage.removeItem("language"),
  setThemeMode: (mode: boolean) => localStorage.setItem("darkmode", mode + ""),
  getThemeMode: () => {
    const darkMode = localStorage.getItem("darkmode");
    if (darkMode == null) {
      return true;
    }
    return darkMode === "true";
  },
};

export default LocalStorage;
