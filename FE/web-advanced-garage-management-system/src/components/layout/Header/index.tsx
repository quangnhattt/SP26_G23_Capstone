import LocalStorage from "@/apis/LocalStorage";
import { images } from "@/assets/imagesAsset";
import { ListLanguage } from "@/constants/data";
import { ROUTER_PAGE } from "@/routes/contants";
import { IconCar, IconUser, IconLogout } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { FaBars, FaTimes } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import LoginModal from "@/pages/auth/login.modal";
import RegisterModal from "@/pages/auth/register.modal";
import useAuth from "@/hooks/useAuth";
import { useAppDispatch, useAppSelector } from "@/store/store";
import { appSelector, setVisibleLogin, setVisibleRegister } from "@/store/slices/appSlice";

const Header = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { visibleLogin, visibleRegister } = useAppSelector(appSelector);
  const { user, isAuthenticated, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("");
  const [lang, setLang] = useState(i18n.language || "en");
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    if (location.pathname !== "/") return;

    const handleScroll = () => {
      const sections = ["services", "pricing", "about", "contact"];
      const scrollPosition = window.scrollY + 200; // Offset for navbar

      for (const sectionId of sections) {
        const element = document.getElementById(sectionId);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (
            scrollPosition >= offsetTop &&
            scrollPosition < offsetTop + offsetHeight
          ) {
            setActiveSection(sectionId);
            return;
          }
        }
      }
      setActiveSection("");
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-user-menu]')) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  const handleLanguageChange = (code: string) => {
    const normalizedCode = code.toLowerCase();
    setLang(normalizedCode);
    i18n.changeLanguage(normalizedCode);
    LocalStorage.saveLanguage(normalizedCode);
  };

  const handleLogout = async () => {
    await logout();
    setShowUserMenu(false);
  };
  
  return (
    <>
      <MainHeader>
        <Nav>
          <LogoSection
            onClick={() => {
              navigate(ROUTER_PAGE.home);
              window.scrollTo({ top: 0, behavior: "smooth" });
              setIsMobileMenuOpen(false);
            }}
          >
            <img
              style={{ height: 50, width: 50 }}
              src={images.logo_app}
              alt="Logo"
            />
            <LogoText>{t("nameProject")}</LogoText>
          </LogoSection>

          <DesktopMenu>
            <MenuItem
              $isActive={location.pathname === "/" && activeSection === ""}
              onClick={() => navigate(ROUTER_PAGE.home)}
            >
              {t("home")}
            </MenuItem>
            <MenuItem
              $isActive={location.pathname === "/services"}
              onClick={() => navigate(ROUTER_PAGE.services)}
            >
              {t("services")}
            </MenuItem>
            <MenuItem
              $isActive={location.pathname === "/pricing"}
              onClick={() => navigate(ROUTER_PAGE.pricing)}
            >
              {t("pricing")}
            </MenuItem>
            <MenuItem
              $isActive={location.pathname === "/about"}
              onClick={() => navigate(ROUTER_PAGE.about)}
            >
              {t("aboutUs")}
            </MenuItem>
            <MenuItem
              $isActive={location.pathname === "/contact"}
              onClick={() => navigate(ROUTER_PAGE.contact)}
            >
              {t("contact")}
            </MenuItem>
          </DesktopMenu>

          <RightSection>
            <LanguageFlags>
              {ListLanguage.map((langItem) => (
                <FlagButton
                  key={langItem.code}
                  onClick={() => handleLanguageChange(langItem.code)}
                  $isActive={lang === langItem.code}
                  title={langItem.code}
                >
                  {langItem.flag}
                </FlagButton>
              ))}
            </LanguageFlags>
            
            {isAuthenticated && user ? (
              <UserMenuWrapper data-user-menu>
                <UserButton onClick={() => setShowUserMenu(!showUserMenu)}>
                  <IconUser size={20} stroke={2} />
                  <span>{user.fullName}</span>
                </UserButton>
                {showUserMenu && (
                  <UserDropdown>
                    <DropdownItem onClick={() => {
                      navigate(ROUTER_PAGE.home);
                      setShowUserMenu(false);
                    }}>
                      <IconUser size={18} />
                      {t("profile")}
                    </DropdownItem>
                    <DropdownItem onClick={handleLogout}>
                      <IconLogout size={18} />
                      {t("logout")}
                    </DropdownItem>
                  </UserDropdown>
                )}
              </UserMenuWrapper>
            ) : (
              <LoginLink onClick={() => dispatch(setVisibleLogin(true))}>
                {t("login")}
              </LoginLink>
            )}
            
            <BookNowButton
              onClick={() => {
                if (!isAuthenticated || !user) {
                  dispatch(setVisibleLogin(true));
                  return;
                }
                navigate(ROUTER_PAGE.home);
                setTimeout(() => {
                  document
                    .getElementById("services")
                    ?.scrollIntoView({ behavior: "smooth" });
                }, 100);
              }}
            >
              <IconCar size={20} stroke={2} />
              {t("bookNow")}
            </BookNowButton>
          </RightSection>
          <MobileMenuButton
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
          </MobileMenuButton>
        </Nav>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <MobileMenu
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <MobileMenuItem
                $isActive={location.pathname === "/" && activeSection === ""}
                onClick={() => {
                  navigate(ROUTER_PAGE.home);
                  setIsMobileMenuOpen(false);
                }}
              >
                {t("home")}
              </MobileMenuItem>
              <MobileMenuItem
                $isActive={location.pathname === "/services"}
                onClick={() => {
                  navigate(ROUTER_PAGE.services);
                  setIsMobileMenuOpen(false);
                }}
              >
                {t("services")}
              </MobileMenuItem>

              <MobileMenuItem
                $isActive={location.pathname === "/pricing"}
                onClick={() => {
                  navigate(ROUTER_PAGE.pricing);
                  setIsMobileMenuOpen(false);
                }}
              >
                {t("pricing")}
              </MobileMenuItem>
              <MobileMenuItem
                $isActive={location.pathname === "/about"}
                onClick={() => {
                  navigate(ROUTER_PAGE.about);
                  setIsMobileMenuOpen(false);
                }}
              >
                {t("aboutUs")}
              </MobileMenuItem>
              <MobileMenuItem
                $isActive={location.pathname === "/contact"}
                onClick={() => {
                  navigate(ROUTER_PAGE.contact);
                  setIsMobileMenuOpen(false);
                }}
              >
                {t("contact")}
              </MobileMenuItem>
              <MobileLanguageSection>
                {ListLanguage.map((langItem) => (
                  <FlagButton
                    key={langItem.code}
                    onClick={() => handleLanguageChange(langItem.code)}
                    $isActive={lang === langItem.code}
                    title={langItem.code}
                  >
                    {langItem.flag}
                  </FlagButton>
                ))}
              </MobileLanguageSection>
              
              {isAuthenticated && user ? (
                <>
                  <MobileUserInfo>
                    <IconUser size={20} />
                    <span>{user.fullName}</span>
                  </MobileUserInfo>
                  <MobileLoginButton onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                  }}>
                    <IconLogout size={20} />
                    {t("logout")}
                  </MobileLoginButton>
                </>
              ) : (
                <MobileLoginButton
                  onClick={() => {
                    dispatch(setVisibleLogin(true));
                    setIsMobileMenuOpen(false);
                  }}
                >
                  {t("login")}
                </MobileLoginButton>
              )}
            </MobileMenu>
          )}
        </AnimatePresence>
      </MainHeader>

      {visibleLogin && (
        <LoginModal
          onClose={() => dispatch(setVisibleLogin(false))}
          onSwitchToRegister={() => {
            dispatch(setVisibleLogin(false));
            dispatch(setVisibleRegister(true));
          }}
        />
      )}
      {visibleRegister && (
        <RegisterModal
          onClose={() => dispatch(setVisibleRegister(false))}
          onSwitchToLogin={() => {
            dispatch(setVisibleRegister(false));
            dispatch(setVisibleLogin(true));
          }}
        />
      )}
    </>
  );
};

export default Header;

const MainHeader = styled.div`
  position: relative;
  width: 100%;
  z-index: 100;
`;

const Nav = styled.nav`
  position: fixed;
  top: 0;
  width: 100%;
  background: #ffffff;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 8rem;
  z-index: 100;
  transition: all 0.3s ease;

  @media (max-width: 1200px) {
    padding: 1rem 4rem;
  }

  @media (max-width: 768px) {
    padding: 1rem 1.5rem;
    position: relative;
  }
`;

const LogoSection = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  flex-shrink: 0;
`;

const LogoText = styled.h1`
  color: #333;
  font-size: 1.25rem;
  font-family: "Playfair Display", serif;
  font-weight: 600;
  margin: 0;
  white-space: nowrap;

  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const DesktopMenu = styled.ul`
  list-style: none;
  display: flex;
  gap: 2rem;
  margin: 0;
  padding: 0;
  align-items: center;
  flex: 1;
  justify-content: center;

  @media (max-width: 768px) {
    display: none;
  }
`;

const MenuItem = styled.li<{ $isActive?: boolean }>`
  cursor: pointer;
  font-weight: 500;
  color: ${({ $isActive }) => ($isActive ? "#007bff" : "#333")};
  transition: color 0.3s;
  font-size: 1rem;
  white-space: nowrap;

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex-shrink: 0;

  @media (max-width: 768px) {
    display: none;
  }
`;

const LanguageFlags = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const FlagButton = styled.button<{ $isActive: boolean }>`
  background: transparent;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.25rem;
  transition: transform 0.2s;
  opacity: ${({ $isActive }) => ($isActive ? 1 : 0.6)};

  &:hover {
    transform: scale(1.1);
    opacity: 1;
  }
`;

const LoginLink = styled.button`
  background: transparent;
  border: none;
  color: #333;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  padding: 0;
  white-space: nowrap;
  transition: color 0.2s;

  &:hover {
    color: #007bff;
  }
`;

const BookNowButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 14px;
  padding: 0.625rem 1.25rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.2s, transform 0.15s;

  &:hover {
    background: #0069d9;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`;

const MobileMenuButton = styled.button`
  display: none;
  background: transparent;
  border: none;
  font-size: 1.5rem;
  color: #333;
  cursor: pointer;
  padding: 0.5rem;

  @media (max-width: 768px) {
    display: flex;
    align-items: center;
    justify-content: center;
  }
`;

const MobileMenu = styled(motion.div)`
  display: none;
  flex-direction: column;
  background: #ffffff;
  width: 100%;
  padding: 1rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 99;
  max-height: calc(100vh - 80px);
  overflow-y: auto;

  @media (max-width: 768px) {
    display: flex;
  }
`;

const MobileMenuItem = styled.div<{ $isActive?: boolean }>`
  padding: 1rem;
  cursor: pointer;
  color: ${({ $isActive }) => ($isActive ? "#007bff" : "#333")};
  font-weight: 500;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: background-color 0.2s, color 0.2s;

  &:hover {
    background-color: #f5f5f5;
    // color: ${({ theme }) => theme.colors.primary || "#007bff"};
  }

  &:last-child {
    border-bottom: none;
  }
`;

const MobileLanguageSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-top: 1px solid #f0f0f0;
  border-bottom: 1px solid #f0f0f0;
  justify-content: center;
`;

const MobileLoginButton = styled.button`
  background: #007bff;
  color: white;
  border: none;
  border-radius: 14px;
  padding: 0.75rem 1.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  margin: 1rem;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  &:hover {
    background: #0069d9;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }
`;

const MobileUserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  margin: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  color: #333;
  font-weight: 500;
`;

const UserMenuWrapper = styled.div`
  position: relative;
`;

const UserButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 0.5rem 1rem;
  font-size: 0.95rem;
  font-weight: 500;
  color: #333;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;

  &:hover {
    background: #e9ecef;
    border-color: #dee2e6;
  }

  span {
    max-width: 150px;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

const UserDropdown = styled.div`
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  min-width: 180px;
  z-index: 1000;
  overflow: hidden;
`;

const DropdownItem = styled.button`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.75rem 1rem;
  background: white;
  border: none;
  color: #333;
  font-size: 0.95rem;
  cursor: pointer;
  transition: background 0.2s;
  text-align: left;

  &:hover {
    background: #f8f9fa;
  }

  &:not(:last-child) {
    border-bottom: 1px solid #f0f0f0;
  }
`;
