import styled from "styled-components";
import { HiSearch, HiShieldCheck } from "react-icons/hi";
import { useEffect, useState } from "react";
import { Table as AntTable } from "antd";
import type { ColumnsType } from "antd/es/table";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import {
  getRoles,
  getRolePermissionMatrix,
  updateRolePermissions,
  type IRole,
  type IRolePermissionMatrix,
} from "@/services/admin/permissionService";

const RoleTab = () => {
  const { t } = useTranslation();

  const [roles, setRoles] = useState<IRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal state
  const [modalRole, setModalRole] = useState<IRole | null>(null);
  const [matrix, setMatrix] = useState<IRolePermissionMatrix[]>([]);
  const [matrixLoading, setMatrixLoading] = useState(false);
  const [granted, setGranted] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await getRoles();
        setRoles(data);
      } catch {
        toast.error(t("cannotLoad"));
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [t]);

  const openPermissions = async (role: IRole) => {
    setModalRole(role);
    setMatrix([]);
    setGranted(new Set());
    try {
      setMatrixLoading(true);
      const data = await getRolePermissionMatrix(role.roleID);
      setMatrix(data);
      setGranted(
        new Set(
          data.flatMap((g) =>
            g.permissions.filter((p) => p.isGranted).map((p) => p.permissionID),
          ),
        ),
      );
    } catch {
      toast.error(t("rolePermCannotLoad"));
    } finally {
      setMatrixLoading(false);
    }
  };

  const closeModal = () => {
    setModalRole(null);
    setMatrix([]);
    setGranted(new Set());
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
    if (!modalRole) return;
    try {
      setSaving(true);
      await updateRolePermissions(modalRole.roleID, Array.from(granted));
      toast.success(t("rolePermUpdateSuccess"));
      closeModal();
    } catch {
      toast.error(t("errorOccurred"));
    } finally {
      setSaving(false);
    }
  };

  const filtered = roles.filter(
    (r) =>
      r.roleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.description.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const columns: ColumnsType<IRole> = [
    { title: "ID", dataIndex: "roleID", key: "roleID", width: 60, align: "center" },
    { title: t("roleName"), dataIndex: "roleName", key: "roleName" },
    { title: t("description"), dataIndex: "description", key: "description" },
    {
      title: t("status"),
      dataIndex: "isActive",
      key: "isActive",
      width: 130,
      align: "center",
      render: (isActive: boolean) => (
        <StatusBadge $active={isActive}>
          {isActive ? t("active") : t("inactive")}
        </StatusBadge>
      ),
    },
    {
      title: t("action"),
      key: "action",
      align: "center",
      width: 120,
      render: (_: unknown, record: IRole) => (
        <ActionButtons>
          <ActionButton onClick={() => void openPermissions(record)} title={t("managePermissions")}>
            <HiShieldCheck size={16} />
            <span>{t("managePermissions")}</span>
          </ActionButton>
        </ActionButtons>
      ),
    },
  ];

  return (
    <Wrapper>
      <Toolbar>
        <SearchWrapper>
          <HiSearch size={16} color="#9ca3af" />
          <SearchInput
            placeholder={t("roleSearch")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </SearchWrapper>
      </Toolbar>

      <TableCard>
        <AntTable
          columns={columns}
          dataSource={filtered}
          rowKey="roleID"
          loading={loading}
          pagination={{ pageSize: 8, showSizeChanger: false }}
          scroll={{ x: "max-content" }}
        />
      </TableCard>

      {/* ── Permission Matrix Modal ───────────────────────── */}
      {modalRole && (
        <ModalOverlay onClick={closeModal}>
          <ModalBox onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <div>
                <ModalTitle>{t("managePermissions")}</ModalTitle>
                <ModalSubtitle>{modalRole.roleName}</ModalSubtitle>
              </div>
              <CloseBtn onClick={closeModal}>×</CloseBtn>
            </ModalHeader>

            <ModalBody>
              {matrixLoading && (
                <EmptyState>{t("loadingData")}</EmptyState>
              )}

              {!matrixLoading && matrix.length === 0 && (
                <EmptyState>{t("rolePermEmpty")}</EmptyState>
              )}

              {!matrixLoading && matrix.length > 0 && (
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
                            ref={(el) => {
                              if (el) el.indeterminate = someChecked && !allChecked;
                            }}
                            onChange={() => toggleGroup(allIds)}
                          />
                          <GroupName>{group.groupName}</GroupName>
                          <GroupCount>
                            {group.permissions.filter((p) => granted.has(p.permissionID)).length}/
                            {group.permissions.length}
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
                                {perm.description && <PermDesc>{perm.description}</PermDesc>}
                              </PermInfo>
                            </PermItem>
                          ))}
                        </PermList>
                      </GroupCard>
                    );
                  })}
                </MatrixGrid>
              )}
            </ModalBody>

            <ModalFooter>
              <CancelBtn onClick={closeModal}>{t("permCancel")}</CancelBtn>
              <SaveBtn onClick={() => void handleSave()} disabled={saving || matrixLoading}>
                {saving ? t("saving") : t("rolePermSave")}
              </SaveBtn>
            </ModalFooter>
          </ModalBox>
        </ModalOverlay>
      )}
    </Wrapper>
  );
};

export default RoleTab;

// ── Styled components ────────────────────────────────────────────────────────

const Wrapper = styled.div``;

const Toolbar = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  align-items: center;
  flex-wrap: wrap;
`;

const SearchWrapper = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #fff;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  flex: 1;
  max-width: 320px;
  cursor: text;
  &:focus-within {
    border-color: #3b82f6;
  }
`;

const SearchInput = styled.input`
  border: none;
  background: transparent;
  outline: none;
  flex: 1;
  font-size: 14px;
  color: #111827;
  &::placeholder {
    color: #9ca3af;
  }
`;

const TableCard = styled.div`
  background: #fff;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
  padding: 0 8px;
  .ant-table {
    color: #374151;
  }
  .ant-table-thead > tr > th {
    color: #374151 !important;
    background: #f3f4f6 !important;
  }
  .ant-table-tbody > tr > td {
    color: #374151 !important;
  }
  .ant-table-tbody > tr:hover > td {
    background: #f9fafb !important;
  }
`;

const StatusBadge = styled.span<{ $active: boolean }>`
  font-size: 11px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 10px;
  background: ${({ $active }) => ($active ? "#d1fae5" : "#fee2e2")};
  color: ${({ $active }) => ($active ? "#065f46" : "#991b1b")};
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 6px;
  justify-content: center;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 5px;
  background: transparent;
  border: 1px solid #3b82f6;
  padding: 5px 10px;
  border-radius: 6px;
  cursor: pointer;
  color: #3b82f6;
  font-size: 12px;
  font-weight: 500;
  transition: background 0.2s;
  &:hover {
    background: #eff6ff;
  }
`;

// ── Modal ────────────────────────────────────────────────────────────────────

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
`;

const ModalBox = styled.div`
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 780px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 20px 24px 16px;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
`;

const ModalTitle = styled.h3`
  font-size: 17px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 2px;
`;

const ModalSubtitle = styled.div`
  font-size: 13px;
  color: #6b7280;
`;

const CloseBtn = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  color: #6b7280;
  cursor: pointer;
  line-height: 1;
  &:hover {
    color: #111827;
  }
`;

const ModalBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
  flex-shrink: 0;
`;

const CancelBtn = styled.button`
  padding: 8px 18px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: white;
  color: #374151;
  font-size: 14px;
  cursor: pointer;
  &:hover {
    background: #f9fafb;
  }
`;

const SaveBtn = styled.button`
  padding: 8px 20px;
  border: none;
  border-radius: 8px;
  background: #10b981;
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  &:hover {
    background: #059669;
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  color: #9ca3af;
  padding: 48px 0;
  font-size: 15px;
`;

// ── Permission matrix inside modal ───────────────────────────────────────────

const MatrixGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 14px;
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
  padding: 10px 14px;
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
  font-size: 13px;
  color: #111827;
  flex: 1;
`;

const GroupCount = styled.span`
  font-size: 11px;
  color: #6b7280;
  background: #e5e7eb;
  padding: 1px 8px;
  border-radius: 10px;
`;

const PermList = styled.div`
  padding: 6px 0;
`;

const PermItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 7px 14px;
  &:hover {
    background: #f9fafb;
  }
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
  font-size: 12px;
  font-weight: 500;
  color: #374151;
`;

const PermDesc = styled.div`
  font-size: 11px;
  color: #9ca3af;
  margin-top: 1px;
`;
