import styled from "styled-components";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import PermissionGroupsTab from "./tabs/PermissionGroupsTab";
import PermissionsTab from "./tabs/PermissionsTab";
import RolePermissionsTab from "./tabs/RolePermissionsTab";

type TabKey = "groups" | "permissions" | "rolePermissions";

const PermissionManager = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabKey>("groups");

  const tabs: { key: TabKey; label: string }[] = [
    { key: "groups", label: t("permTabGroups") },
    { key: "permissions", label: t("permTabPermissions") },
    { key: "rolePermissions", label: t("permTabRolePermissions") },
  ];

  return (
    <Container>
      <Header>
        <div>
          <Title>{t("permManagement")}</Title>
          <Subtitle>{t("permManagementSubtitle")}</Subtitle>
        </div>
      </Header>

      <TabBar>
        {tabs.map((tab) => (
          <TabBtn
            key={tab.key}
            active={activeTab === tab.key}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </TabBtn>
        ))}
      </TabBar>

      <TabContent>
        {activeTab === "groups" && <PermissionGroupsTab />}
        {activeTab === "permissions" && <PermissionsTab />}
        {activeTab === "rolePermissions" && <RolePermissionsTab />}
      </TabContent>
    </Container>
  );
};

export default PermissionManager;

const Container = styled.div`
  padding: 24px;
  background: #f9fafb;
  min-height: 100%;
  min-width: 0;

  @media (max-width: 1024px) { padding: 1rem; }
`;

const Header = styled.div`
  margin-bottom: 20px;
`;

const Title = styled.h1`
  font-size: 22px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 4px 0;
`;

const Subtitle = styled.p`
  font-size: 14px;
  color: #6b7280;
  margin: 0;
`;

const TabBar = styled.div`
  display: flex;
  gap: 4px;
  border-bottom: 2px solid #e5e7eb;
  margin-bottom: 20px;
`;

const TabBtn = styled.button<{ active: boolean }>`
  padding: 10px 20px;
  border: none;
  background: transparent;
  font-size: 14px;
  font-weight: ${(p) => (p.active ? "700" : "500")};
  color: ${(p) => (p.active ? "#3b82f6" : "#6b7280")};
  border-bottom: 2px solid ${(p) => (p.active ? "#3b82f6" : "transparent")};
  margin-bottom: -2px;
  cursor: pointer;
  transition: all 0.2s;
  border-radius: 6px 6px 0 0;

  &:hover {
    color: ${(p) => (p.active ? "#3b82f6" : "#374151")};
    background: #f3f4f6;
  }
`;

const TabContent = styled.div``;
