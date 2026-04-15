import styled, { createGlobalStyle } from "styled-components";
import {  useState } from "react";
import { ConfigProvider, Select as AntSelect } from "antd";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import useSelectTextColorFix from "@/hooks/useSelectTextColorFix";
import {
  getRolePermissionMatrix,
  updateRolePermissions,
  type IRolePermissionMatrix,
} from "@/services/admin/permissionService";

const DropdownGlobalStyle = createGlobalStyle`
  .role-perm-dropdown .ant-select-item,
  .role-perm-dropdown .ant-select-item-option-content {
    color: #111827 !important;
  }
`;

const StyledSelect = styled(AntSelect)`
  &&& .ant-select-selector,
  &&& .ant-select-selector .ant-select-selection-item,
  &&& .ant-select-selector .ant-select-selection-placeholder {
    color: #111827 !important;
    -webkit-text-fill-color: #111827 !important;
  }
` as typeof AntSelect;

const ROLES = [
  { roleID: 1, roleName: "Admin" },
  { roleID: 2, roleName: "Service Advisor" },
  { roleID: 3, roleName: "Technician" },
  { roleID: 4, roleName: "Customer" },
  { roleID: 5, roleName: "Manager" },
];

const RolePermissionsTab = () => {
  const { t } = useTranslation();
  const [selectedRole, setSelectedRole] = useState<number | null>(null);
  const [matrix, setMatrix] = useState<IRolePermissionMatrix[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [granted, setGranted] = useState<Set<number>>(new Set());
  const selectFix = useSelectTextColorFix({ key: "role-perm" });

  // no useEffect needed — roles are static


  const fetchMatrix = async (roleId: number) => {
    try {
      setLoading(true);
      const data = await getRolePermissionMatrix(roleId);
      setMatrix(data);
      setGranted(
        new Set(data.flatMap((g) => g.permissions.filter((p) => p.isGranted).map((p) => p.permissionID)))
      );
    } catch {
      toast.error(t("rolePermCannotLoad"));
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (roleId: number) => {
    setSelectedRole(roleId);
    void fetchMatrix(roleId);
  };

  const togglePermission = (id: number) => {
    setGranted((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleGroup = (allIds: number[]) => {
    const allGranted = allIds.every((id) => granted.has(id));
    setGranted((prev) => {
      const next = new Set(prev);
      allIds.forEach((id) => {
        if (allGranted) next.delete(id);
        else next.add(id);
      });
      return next;
    });
  };

  const handleSave = async () => {
    if (!selectedRole) return;
    try {
      setSaving(true);
      await updateRolePermissions(selectedRole, Array.from(granted));
      toast.success(t("rolePermUpdateSuccess"));
    } catch {
      toast.error(t("errorOccurred"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Wrapper>
      <DropdownGlobalStyle />
      <TopBar>
        <ConfigProvider theme={selectFix.configProviderTheme}>
          <StyledSelect
            className={selectFix.selectClassName}
            popupClassName={selectFix.popupClassName}
            getPopupContainer={selectFix.getPopupContainer}
            style={{ width: 220 }}
            placeholder={t("rolePermSelectRole")}
            value={selectedRole ?? undefined}
            onChange={(v) => handleRoleChange(v as number)}
            options={ROLES.map((r) => ({ value: r.roleID, label: r.roleName }))}
          />
        </ConfigProvider>
        {selectedRole && (
          <SaveBtn onClick={() => void handleSave()} disabled={saving}>
            {saving ? t("saving") : t("rolePermSave")}
          </SaveBtn>
        )}
      </TopBar>

      {!selectedRole && (
        <EmptyState>{t("rolePermSelectHint")}</EmptyState>
      )}

      {selectedRole && loading && (
        <EmptyState>{t("loadingData")}</EmptyState>
      )}

      {selectedRole && !loading && matrix.length === 0 && (
        <EmptyState>{t("rolePermEmpty")}</EmptyState>
      )}

      {selectedRole && !loading && matrix.length > 0 && (
        <MatrixGrid>
          {matrix.map((group) => {
            const allIds = group.permissions.map((p) => p.permissionID);
            const allChecked = allIds.every((id) => granted.has(id));
            const someChecked = allIds.some((id) => granted.has(id));

            return (
              <GroupCard key={group.groupID}>
                <GroupHeader>
                  <GroupCheckbox
                    type="checkbox"
                    checked={allChecked}
                    ref={(el) => { if (el) el.indeterminate = someChecked && !allChecked; }}
                    onChange={() => toggleGroup(allIds)}
                  />
                  <GroupName>{group.groupName}</GroupName>
                  <GroupCount>
                    {group.permissions.filter((p) => granted.has(p.permissionID)).length}/{group.permissions.length}
                  </GroupCount>
                </GroupHeader>
                <PermList>
                  {group.permissions.map((perm) => (
                    <PermItem key={perm.permissionID}>
                      <PermCheckbox
                        type="checkbox"
                        checked={granted.has(perm.permissionID)}
                        onChange={() => togglePermission(perm.permissionID)}
                      />
                      <PermInfo>
                        <PermName>{perm.name}</PermName>
                        {perm.description && <PermUrl>{perm.description}</PermUrl>}
                      </PermInfo>
                    </PermItem>
                  ))}
                </PermList>
              </GroupCard>
            );
          })}
        </MatrixGrid>
      )}
    </Wrapper>
  );
};

export default RolePermissionsTab;

const Wrapper = styled.div``;

const TopBar = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
`;

const SaveBtn = styled.button`
  padding: 8px 20px;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  &:hover { background: #059669; }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
`;

const EmptyState = styled.div`
  text-align: center;
  color: #9ca3af;
  padding: 48px 0;
  font-size: 15px;
`;

const MatrixGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
`;

const GroupCard = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  overflow: hidden;
`;

const GroupHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: #f3f4f6;
  border-bottom: 1px solid #e5e7eb;
`;

const GroupCheckbox = styled.input`
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: #3b82f6;
`;

const GroupName = styled.span`
  font-weight: 600;
  font-size: 14px;
  color: #111827;
  flex: 1;
`;

const GroupCount = styled.span`
  font-size: 12px;
  color: #6b7280;
  background: #e5e7eb;
  padding: 1px 8px;
  border-radius: 10px;
`;

const PermList = styled.div`
  padding: 8px 0;
`;

const PermItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px 16px;
  &:hover { background: #f9fafb; }
`;

const PermCheckbox = styled.input`
  width: 15px;
  height: 15px;
  margin-top: 2px;
  cursor: pointer;
  accent-color: #3b82f6;
  flex-shrink: 0;
`;

const PermInfo = styled.div`
  flex: 1;
`;

const PermName = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: #374151;
`;

const PermUrl = styled.div`
  font-size: 11px;
  color: #9ca3af;
  margin-top: 2px;
  font-family: monospace;
`;
