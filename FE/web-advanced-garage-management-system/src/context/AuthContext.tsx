import {
  authService,
  type ILoginPayload,
  type ILoginWithEmailPayload,
} from "@/apis/auth";
import LocalStorage from "@/apis/LocalStorage";
import { userService } from "@/apis/user";
import { AppStorageEnum, type IUser } from "@/constants/types";
import useDevice from "@/hooks/useDevice";
import useLoading from "@/hooks/useLoading";
import { ROUTER_PAGE } from "@/routes/contants";
import { setVisibleLogin, setVisibleRegister } from "@/store/slices/appSlice";
import { useAppDispatch } from "@/store/store";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import React from "react";
import { useNavigate } from "react-router-dom";
import i18next from "i18next";
import { toast } from "react-toastify";

interface AuthContextType {
  isAuthenticated: boolean;
  isInitializing: boolean;
  user: IUser | null;
  getUser: () => Promise<void>;
  updateUser: (updated: Partial<IUser>) => void;
  login: (
    e: ILoginPayload,
    isUpdatePhone?: boolean,
    returnUrl?: string
  ) => Promise<void>;
  loginWithEmail: (payload: ILoginWithEmailPayload) => Promise<void>;
  logout: () => Promise<void>;
  setIsInitializing: (isInitializing: boolean) => void;
}

export const AuthContext = React.createContext<AuthContextType>({
  isAuthenticated: false,
  isInitializing: false,
  user: null,
  getUser: async () => {},
  updateUser: () => {},
  login: async () => {},
  loginWithEmail: async () => {},
  logout: async () => {},
  setIsInitializing: () => {},
});

type AuthProviderProps = {
  children: React.ReactNode;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isMobile } = useDevice();
  const { showLoading, hideLoading } = useLoading();
  const [isInitializing, setIsInitializing] = React.useState(true);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [user, setUser] = React.useState<IUser | null>(null);
  const returnUrlRef = React.useRef<string | null>(null);
  const queryClient = useQueryClient();

  const updateUser = React.useCallback((updated: Partial<IUser>) => {
    setUser((prev) => (prev ? { ...prev, ...updated } : prev));
  }, []);

  const { mutateAsync: userMutate } = useMutation({
    mutationKey: ["user-info"],
    mutationFn: userService.userInfo,
    retry: 1,
  });

  const { mutate: loginMutate } = useMutation({
    mutationKey: ["login"],
    mutationFn: authService.login,
  });

  const { mutate: loginWithEmailMutate } = useMutation({
    mutationKey: ["loginWithEmail"],
    mutationFn: authService.loginWithEmail,
  });

  const { mutateAsync: logoutMutate } = useMutation({
    mutationKey: ["logout"],
    mutationFn: authService.logout,
    retry: 1,
  });

  const setLanguageFromUser = (userData: IUser) => {
    if (userData.language && userData.language !== i18next.language) {
      LocalStorage.saveLanguage(userData.language);
      i18next.changeLanguage(userData.language);
    }
  };

  /**
   * ===== TOKEN HANDLER =====
   */
  const setCustomToken = React.useCallback(
    async ({
      token_access,
      token_refresh,
    }: {
      token_access?: string;
      token_refresh?: string;
    }) => {
      if (token_access && token_refresh) {
        setIsAuthenticated(true);
        await LocalStorage.setToken(token_access);
        await localStorage.setItem(AppStorageEnum.REFRESH_TOKEN, token_refresh);
      } else {
        setIsAuthenticated(false);
        await LocalStorage.removeToken();
        await localStorage.removeItem(AppStorageEnum.REFRESH_TOKEN);
      }
    },
    []
  );

  /**
   * ===== STORE AUTH RESULT =====
   */
  const storeAuthResult = React.useCallback(
    async (token_access?: string, token_refresh?: string) => {
      await setCustomToken({ token_access, token_refresh });

      //@ts-ignore
      userMutate(null, {
        onSuccess: (data) => {
          setUser(data);

          setLanguageFromUser(data);
          setIsInitializing(false);
        },
        onError: () => {
          setCustomToken({});
          setUser(null);
          setIsInitializing(false);
        },
      });
    },
    [setCustomToken, userMutate]
  );

  /**
   * ===== INIT AUTH =====
   */
  React.useEffect(() => {
    (async () => {
      const token_access = await LocalStorage.getToken();
      const token_refresh = await localStorage.getItem(
        AppStorageEnum.REFRESH_TOKEN
      );

      // No token
      if (!token_access || !token_refresh) {
        setIsInitializing(false);
        return;
      }

      storeAuthResult(token_access, token_refresh);
    })();
  }, [storeAuthResult]);

  const getUser = async () => {
    //@ts-ignore
    userMutate(null, {
      onSuccess: (data) => {
        setUser(data);
        setLanguageFromUser(data);
      },
      onError: () => {
        setIsInitializing(false);
      },
    });
  };

  /**
   * ===== LOGIN =====
   */
  const login = React.useCallback(
    async (
      { username, password, type }: ILoginPayload,
      isDeposit?: boolean,
      isUpdatePhone?: boolean,
      returnUrlParam?: string
    ) => {
      returnUrlRef.current = returnUrlParam || "";

      showLoading();
      queryClient.removeQueries({ queryKey: ["get-balance"], exact: true });

      loginMutate(
        { username, password, type },
        {
          onSuccess: (data) => {
            setCustomToken({
              token_access: data.accessToken,
              token_refresh: data.refreshToken,
            });

            //@ts-ignore
            userMutate(null, {
              onSuccess: (data) => {
                setUser(data);
                setLanguageFromUser(data);

                hideLoading();

                const targetUrl =
                  returnUrlRef.current && !isDeposit && !isUpdatePhone
                    ? returnUrlRef.current
                    : ROUTER_PAGE.home;

                dispatch(setVisibleLogin(false));
                dispatch(setVisibleRegister(false));

                navigate(targetUrl, { replace: true });
              },
              onError: (error) => {
                hideLoading();
                toast.error(error.response.data.message);
              },
            });
          },
          onError: (e) => {
            hideLoading();
            toast.error(e?.response?.data?.message ?? "Login failed");
          },
        }
      );
    },
    [showLoading, queryClient, loginMutate, setCustomToken, userMutate, setUser, setLanguageFromUser, hideLoading, dispatch, navigate]
  );

  /**
   * ===== LOGIN WITH EMAIL =====
   */
  const loginWithEmail = React.useCallback(
    async (payload: ILoginWithEmailPayload) => {
      showLoading();
      queryClient.removeQueries({ queryKey: ["get-balance"], exact: true });

      loginWithEmailMutate(payload, {
        onSuccess: (tokens) => {
          setCustomToken({
            token_access: tokens.accessToken,
            token_refresh: tokens.refreshToken,
          });

          //@ts-ignore
          userMutate(null, {
            onSuccess: (data) => {
              setUser(data);
              setLanguageFromUser(data);
              hideLoading();
              dispatch(setVisibleLogin(false));
              dispatch(setVisibleRegister(false));
              navigate(ROUTER_PAGE.home, { replace: true });
            },
            onError: (error) => {
              hideLoading();
              toast.error(error?.response?.data?.message ?? "Login failed");
            },
          });
        },
        onError: (e) => {
          hideLoading();
          toast.error(e?.response?.data?.message ?? "Đăng nhập thất bại");
        },
      });
    },
    [
      showLoading,
      queryClient,
      loginWithEmailMutate,
      setCustomToken,
      userMutate,
      hideLoading,
      dispatch,
      navigate,
    ]
  );

  /**
   * ===== LOGOUT =====
   */
  const logout = React.useCallback(async () => {
    const refreshToken = await localStorage.getItem(
      AppStorageEnum.REFRESH_TOKEN
    );
    if (!refreshToken) return;

    setCustomToken({});
    setUser(null);

    logoutMutate({ refreshToken });
    navigate(ROUTER_PAGE.home, { replace: true });
  }, [setCustomToken, setUser, logoutMutate, navigate]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isInitializing,
        user,
        getUser,
        login,
        loginWithEmail,
        updateUser,
        logout,
        setIsInitializing,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
