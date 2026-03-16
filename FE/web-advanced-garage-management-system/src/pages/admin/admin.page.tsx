import styled from "styled-components";
import { HiChartBar, HiClipboardList, HiUsers, HiCog, HiViewGrid, HiSupport, HiTruck } from "react-icons/hi";
import { useEffect, useState } from "react";
import { getMenuAccess } from "@/services/admin/menuService";
import type { IMenuGroup } from "@/services/admin/menuService";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";

const AdminDashboard = () => {
  const { t } = useTranslation();
  const [menuGroups, setMenuGroups] = useState<IMenuGroup[]>([]);
  const [loading, setLoading] = useState(true);
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

  const getIconForGroup = (groupName: string) => {
    const lowerName = groupName.toLowerCase();
    if (lowerName.includes("product")) return <HiClipboardList size={18} />;
    if (lowerName.includes("unit")) return <HiCog size={18} />;
    if (lowerName.includes("user")) return <HiUsers size={18} />;
    if (lowerName.includes("appointment")) return <HiChartBar size={18} />;
    if (lowerName.includes("category")) return <HiViewGrid size={18} />;
    if (lowerName.includes("service")) return <HiSupport size={18} />;
    if (lowerName.includes("supplier")) return <HiTruck size={18} />;

    return <HiCog size={18} />;
  };

  const getRouteForGroup = (groupName: string) => {
    const lowerName = groupName.toLowerCase();
    if (lowerName.includes("product")) return "/admin/product";
    if (lowerName.includes("unit")) return "/admin/unit-managerment";
    if (lowerName.includes("user")) return "/admin/user-managerment";
    if (lowerName.includes("appointment")) return "/admin/appoinment-managerment";
    if (lowerName.includes("category")) return "/admin/category";
    if (lowerName.includes("service")) return "/admin/service";
    if (lowerName.includes("supplier")) return "/admin/supplier";
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

  return (
    <PageContainer>
      <Sidebar>
        <SidebarHeader>
          <Logo>
            <LogoIcon>🚗</LogoIcon>
            <LogoText>{t("nameProject")}</LogoText>
          </Logo>
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
      </Sidebar>

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

const SidebarHeader = styled.div`
  padding: 0 1.5rem 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
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