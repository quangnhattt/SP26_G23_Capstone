import styled from "styled-components";
import {
  HiChartBar,
  HiClipboardList,
  HiUsers,
  HiCog,
  HiViewGrid,
  HiSupport,
  HiTruck,
  HiShieldExclamation,
  HiArchive,
  HiClipboardCheck,
  HiDocumentText,
  HiBadgeCheck,
  HiCollection,
  HiMenu,
  HiX,
  HiUserGroup,
} from "react-icons/hi";
import { useEffect, useState } from "react";
import { getMenuAccess } from "@/services/admin/menuService";
import type { IMenuGroup } from "@/services/admin/menuService";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";

const AdminDashboard = () => {
  const { t } = useTranslation();
  const [menuGroups, setMenuGroups] = useState<IMenuGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchMenuAccess = async () => {
      try {
        const data = await getMenuAccess();
        setMenuGroups(data);
      } catch (error) {
        console.error("Failed to fetch menu access:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMenuAccess();
  }, []);

  useEffect(() => {
    if (!loading && menuGroups.length > 0 && location.pathname === "/admin") {
      const firstRoute = getRouteForGroup(menuGroups[0].groupName);
      navigate(firstRoute, { replace: true });
    }
  }, [loading, menuGroups, location.pathname, navigate]);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const getIconForGroup = (groupName: string) => {
    const lowerName = groupName.toLowerCase();
    if (lowerName.includes("product")) return <HiClipboardList size={18} />;
    if (lowerName.includes("unit")) return <HiCog size={18} />;
    if (lowerName.includes("user")) return <HiUsers size={18} />;
    if (lowerName.includes("appointment")) return <HiChartBar size={18} />;
    if (lowerName.includes("category")) return <HiViewGrid size={18} />;
    if (lowerName.includes("assigned")) return <HiUserGroup size={18} />;
    if (lowerName.includes("history")) return <HiArchive size={18} />;
    if (lowerName.includes("order")) return <HiDocumentText size={18} />;
    if (lowerName.includes("service")) return <HiSupport size={18} />;
    if (lowerName.includes("supplier")) return <HiTruck size={18} />;
    if (lowerName.includes("rescue")) return <HiShieldExclamation size={18} />;
    if (lowerName.includes("inventory")) return <HiArchive size={18} />;
    if (lowerName.includes("intake")) return <HiClipboardCheck size={18} />;
    if (lowerName.includes("membership")) return <HiBadgeCheck size={18} />;
    if (lowerName.includes("package")) return <HiCollection size={18} />;
    return <HiCog size={18} />;
  };

  const getRouteForGroup = (groupName: string) => {
    const lowerName = groupName.toLowerCase();
    if (lowerName.includes("product")) return "/admin/product";
    if (lowerName.includes("unit")) return "/admin/unit-managerment";
    if (lowerName.includes("user")) return "/admin/user-managerment";
    if (lowerName.includes("appointment"))
      return "/admin/appoinment-managerment";
    if (lowerName.includes("category")) return "/admin/category";
    if (lowerName.includes("assigned")) return "/admin/order-assigned-management";
    if (lowerName.includes("history")) return "/admin/history-transfer-order-management";
    if (lowerName.includes("order")) return "/admin/service-order-management";
    if (lowerName.includes("service")) return "/admin/service";
    if (lowerName.includes("supplier")) return "/admin/supplier";
    if (lowerName.includes("rescue")) return "/admin/rescue-management";
    if (lowerName.includes("inventory")) return "/admin/inventory-management";
    if (lowerName.includes("intake")) return "/admin/intake-management";
    if (lowerName.includes("membership")) return "/admin/membership-ranks-management";
    if (lowerName.includes("package")) return "/admin/maintenance-package-management";
    return "/admin";
  };

  const isActive = (groupName: string) => {
    const route = getRouteForGroup(groupName);
    return location.pathname === route;
  };

  const handleMenuClick = (groupName: string) => {
    const route = getRouteForGroup(groupName);
    navigate(route);
  };

  const sidebarContent = (
    <>
      <SidebarHeader>
        <Logo>
          <LogoIcon>🚗</LogoIcon>
          <LogoText>{t("nameProject")}</LogoText>
        </Logo>
        <CloseButton onClick={() => setSidebarOpen(false)}>
          <HiX size={20} />
        </CloseButton>
      </SidebarHeader>

      {loading ? (
        <LoadingSection>
          <span>{t("loadingMenu")}</span>
        </LoadingSection>
      ) : (
        menuGroups.map((group) => (
          <SidebarSection key={group.groupID}>
            <MenuItem
              $isActive={isActive(group.groupName)}
              onClick={() => handleMenuClick(group.groupName)}
            >
              {getIconForGroup(group.groupName)}
              <span>{group.groupName}</span>
            </MenuItem>
          </SidebarSection>
        ))
      )}
    </>
  );

  return (
    <PageContainer>
      {/* Mobile top bar */}
      <MobileTopBar>
        <HamburgerButton onClick={() => setSidebarOpen(true)}>
          <HiMenu size={22} />
        </HamburgerButton>
        <MobileLogo>
          <span>🚗</span>
          <span>{t("nameProject")}</span>
        </MobileLogo>
      </MobileTopBar>

      {/* Overlay for mobile */}
      {sidebarOpen && <Overlay onClick={() => setSidebarOpen(false)} />}

      {/* Desktop sidebar (always visible) */}
      <Sidebar>{sidebarContent}</Sidebar>

      {/* Mobile drawer */}
      <MobileDrawer $isOpen={sidebarOpen}>{sidebarContent}</MobileDrawer>

      <MainContent>
        <Outlet />
      </MainContent>
    </PageContainer>
  );
};
export default AdminDashboard;

const PageContainer = styled.div`
  display: flex;
  min-height: 100vh;
  background: #f8f9fa;

  @media (max-width: 1024px) {
    flex-direction: column;
  }
`;

const MobileTopBar = styled.header`
  display: none;

  @media (max-width: 1024px) {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    position: sticky;
    top: 0;
    height: 56px;
    background: #1a1d2e;
    padding: 0 1rem;
    z-index: 100;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    flex-shrink: 0;
  }
`;

const HamburgerButton = styled.button`
  background: transparent;
  border: none;
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem;
  border-radius: 6px;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const MobileLogo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #fff;
  font-weight: 700;
  font-size: 1rem;
`;

const Overlay = styled.div`
  display: none;

  @media (max-width: 1024px) {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 150;
  }
`;

const Sidebar = styled.aside`
  width: 260px;
  background: #1a1d2e;
  color: #fff;
  padding: 1rem 0;
  overflow-y: auto;
  position: fixed;
  height: 100vh;
  left: 0;
  top: 0;
  z-index: 50;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 2px;
  }

  @media (max-width: 1024px) {
    display: none;
  }
`;

const MobileDrawer = styled.aside<{ $isOpen: boolean }>`
  display: none;

  @media (max-width: 1024px) {
    display: flex;
    flex-direction: column;
    position: fixed;
    top: 0;
    left: 0;
    width: 260px;
    height: 100vh;
    background: #1a1d2e;
    color: #fff;
    padding: 1rem 0;
    overflow-y: auto;
    z-index: 200;
    transform: ${({ $isOpen }) => ($isOpen ? "translateX(0)" : "translateX(-100%)")};
    transition: transform 0.3s ease;
    box-shadow: 4px 0 16px rgba(0, 0, 0, 0.4);

    &::-webkit-scrollbar {
      width: 4px;
    }
    &::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.2);
      border-radius: 2px;
    }
  }
`;

const SidebarHeader = styled.div`
  padding: 0 1.5rem 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.25rem;
  font-weight: 700;
`;

const LogoIcon = styled.div`
  font-size: 1.5rem;
`;

const LogoText = styled.span`
  color: #fff;
`;

const CloseButton = styled.button`
  display: none;
  background: transparent;
  border: none;
  color: #9ca3bf;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 6px;

  &:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.1);
  }

  @media (max-width: 1024px) {
    display: flex;
    align-items: center;
    justify-content: center;
  }
`;

const SidebarSection = styled.div`
  padding: 0.5rem 0;
`;

const MenuItem = styled.div<{ $isActive: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.5rem;
  margin: 0.125rem 0.75rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  color: ${(props) => (props.$isActive ? "#fff" : "#9ca3bf")};
  background: ${(props) =>
    props.$isActive ? "rgba(59, 130, 246, 0.15)" : "transparent"};
  position: relative;

  &:hover {
    background: ${(props) =>
      props.$isActive
        ? "rgba(59, 130, 246, 0.2)"
        : "rgba(255, 255, 255, 0.05)"};
    color: #fff;
  }

  ${(props) =>
    props.$isActive &&
    `
    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 3px;
      height: 60%;
      background: #3b82f6;
      border-radius: 0 2px 2px 0;
    }
  `}

  span {
    flex: 1;
    font-size: 0.875rem;
    font-weight: 500;
  }
`;

const LoadingSection = styled.div`
  padding: 2rem 1.5rem;
  text-align: center;
  color: #9ca3bf;
  font-size: 0.875rem;
`;

const MainContent = styled.main`
  flex: 1;
  margin-left: 260px;
  display: flex;
  flex-direction: column;
  min-width: 0;

  @media (max-width: 1024px) {
    margin-left: 0;
  }
`;
