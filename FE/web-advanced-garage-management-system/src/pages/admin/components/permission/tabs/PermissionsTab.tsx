import styled from "styled-components";
import { HiSearch, HiPlus, HiPencil, HiTrash } from "react-icons/hi";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import {
  getPermissions,
  createPermission,
  updatePermission,
  deletePermission,
  getPermissionGroups,
  type IPermission,
  type IPermissionRequest,
  type IPermissionGroup,
} from "@/services/admin/permissionService";

const emptyForm = (groupID = 0): IPermissionRequest => ({
  groupID,
  name: "",
  url: "",
  description: "",
});

const PermissionsTab = () => {
  const { t } = useTranslation();
  const [permissions, setPermissions] = useState<IPermission[]>([]);
  const [groups, setGroups] = useState<IPermissionGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<IPermission | null>(null);
  const [form, setForm] = useState<IPermissionRequest>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [modalGroupName, setModalGroupName] = useState("");

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [perms, grps] = await Promise.all([getPermissions(), getPermissionGroups()]);
      setPermissions(perms);
      setGroups(grps);
    } catch {
      toast.error(t("permCannotLoad"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchAll();
  }, []);

  const openCreate = (group: IPermissionGroup) => {
    setEditing(null);
    setForm(emptyForm(group.groupID));
    setModalGroupName(group.groupName);
    setIsModalOpen(true);
  };

  const openEdit = (record: IPermission, groupName: string) => {
    setEditing(record);
    setForm({
      groupID: record.groupID,
      name: record.name,
      url: record.url,
      description: record.description,
    });
    setModalGroupName(groupName);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(t("permConfirmDelete"))) return;
    try {
      await deletePermission(id);
      toast.success(t("permDeleteSuccess"));
      void fetchAll();
    } catch {
      toast.error(t("errorOccurred"));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    try {
      setSaving(true);
      if (editing) {
        await updatePermission(editing.permissionID, form);
        toast.success(t("permUpdateSuccess"));
      } else {
        await createPermission(form);
        toast.success(t("permCreateSuccess"));
      }
      setIsModalOpen(false);
      void fetchAll();
    } catch {
      toast.error(t("errorOccurred"));
    } finally {
      setSaving(false);
    }
  };

  // Group permissions by groupID
  const groupedPermissions = permissions.reduce<Record<number, IPermission[]>>((acc, p) => {
    if (!acc[p.groupID]) acc[p.groupID] = [];
    acc[p.groupID].push(p);
    return acc;
  }, {});

  const normalized = searchTerm.toLowerCase();

  return (
    <Wrapper>
      <Toolbar>
        <SearchWrapper>
          <HiSearch size={16} color="#9ca3af" />
          <SearchInput
            placeholder={t("permSearch")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </SearchWrapper>
      </Toolbar>

      {loading && <EmptyState>{t("loadingData")}</EmptyState>}

      {!loading && groups.length === 0 && (
        <EmptyState>{t("permGrpCannotLoad")}</EmptyState>
      )}

      <CardGrid>
        {groups.map((group) => {
          const perms = (groupedPermissions[group.groupID] ?? []).filter(
            (p) =>
              !normalized ||
              p.name.toLowerCase().includes(normalized) ||
              p.url.toLowerCase().includes(normalized)
          );

          // Hide group card entirely if searching and no match
          if (normalized && perms.length === 0) return null;

          return (
            <GroupCard key={group.groupID}>
              <GroupHeader>
                <GroupName>{group.groupName}</GroupName>
                <GroupMeta>
                  <GroupCount>{perms.length} {t("permTabPermissions").toLowerCase()}</GroupCount>
                  <AddPermBtn onClick={() => openCreate(group)}>
                    <HiPlus size={14} /> {t("permAdd")}
                  </AddPermBtn>
                </GroupMeta>
              </GroupHeader>

              {perms.length === 0 ? (
                <EmptyGroup>{t("permGroupEmpty")}</EmptyGroup>
              ) : (
                <PermList>
                  {perms.map((perm) => (
                    <PermRow key={perm.permissionID}>
                      <PermInfo>
                        <PermName>{perm.name}</PermName>
                        {perm.url && <PermUrl>{perm.url}</PermUrl>}
                        {perm.description && <PermDesc>{perm.description}</PermDesc>}
                      </PermInfo>
                      <PermActions>
                        <ActionBtn onClick={() => openEdit(perm, group.groupName)}>
                          <HiPencil size={15} />
                        </ActionBtn>
                        <ActionBtn danger onClick={() => handleDelete(perm.permissionID)}>
                          <HiTrash size={15} />
                        </ActionBtn>
                      </PermActions>
                    </PermRow>
                  ))}
                </PermList>
              )}
            </GroupCard>
          );
        })}
      </CardGrid>

      {isModalOpen && (
        <ModalOverlay onClick={() => setIsModalOpen(false)}>
          <ModalBox onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <div>
                <ModalTitle>{editing ? t("permEdit") : t("permAdd")}</ModalTitle>
                <ModalSubtitle>{t("permGroup")}: <b>{modalGroupName}</b></ModalSubtitle>
              </div>
              <CloseBtn onClick={() => setIsModalOpen(false)}>×</CloseBtn>
            </ModalHeader>
            <form onSubmit={(e) => { void handleSubmit(e); }}>
              <FormGroup>
                <Label>{t("permName")} *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder={t("permNamePlaceholder")}
                  required
                />
              </FormGroup>
              <FormGroup>
                <Label>{t("permUrl")}</Label>
                <Input
                  value={form.url}
                  onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                  placeholder={t("permUrlPlaceholder")}
                />
              </FormGroup>
              <FormGroup>
                <Label>{t("description")}</Label>
                <Input
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder={t("permDescPlaceholder")}
                />
              </FormGroup>
              <ModalFooter>
                <CancelBtn type="button" onClick={() => setIsModalOpen(false)}>
                  {t("permCancel")}
                </CancelBtn>
                <SubmitBtn type="submit" disabled={saving}>
                  {saving ? t("saving") : editing ? t("update") : t("create")}
                </SubmitBtn>
              </ModalFooter>
            </form>
          </ModalBox>
        </ModalOverlay>
      )}
    </Wrapper>
  );
};

export default PermissionsTab;

const Wrapper = styled.div``;

const Toolbar = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  align-items: center;
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
  &:focus-within { border-color: #3b82f6; }
`;

const SearchInput = styled.input`
  border: none;
  background: transparent;
  outline: none;
  flex: 1;
  font-size: 14px;
  color: #111827;
  &::placeholder { color: #9ca3af; }
`;

const EmptyState = styled.div`
  text-align: center;
  color: #9ca3af;
  padding: 40px 0;
  font-size: 15px;
`;

const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
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
  justify-content: space-between;
  padding: 12px 16px;
  background: #f3f4f6;
  border-bottom: 1px solid #e5e7eb;
  gap: 8px;
  flex-wrap: wrap;
`;

const GroupName = styled.span`
  font-weight: 700;
  font-size: 14px;
  color: #111827;
`;

const GroupMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const GroupCount = styled.span`
  font-size: 12px;
  color: #6b7280;
  background: #e5e7eb;
  padding: 2px 8px;
  border-radius: 10px;
`;

const AddPermBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  background: #3b82f6;
  color: white;
  border: none;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  &:hover { background: #2563eb; }
`;

const EmptyGroup = styled.div`
  padding: 16px;
  color: #9ca3af;
  font-size: 13px;
  text-align: center;
`;

const PermList = styled.div`
  padding: 4px 0;
`;

const PermRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 16px;
  border-bottom: 1px solid #f3f4f6;
  &:last-child { border-bottom: none; }
  &:hover { background: #f9fafb; }
`;

const PermInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const PermName = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: #111827;
`;

const PermUrl = styled.div`
  font-size: 11px;
  color: #9ca3af;
  margin-top: 2px;
  font-family: monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const PermDesc = styled.div`
  font-size: 11px;
  color: #6b7280;
  margin-top: 2px;
`;

const PermActions = styled.div`
  display: flex;
  gap: 4px;
  flex-shrink: 0;
`;

const ActionBtn = styled.button<{ danger?: boolean }>`
  background: transparent;
  border: none;
  padding: 5px;
  border-radius: 5px;
  cursor: pointer;
  color: ${(p) => (p.danger ? "#ef4444" : "#3b82f6")};
  transition: background 0.2s;
  &:hover { background: ${(p) => (p.danger ? "#fef2f2" : "#eff6ff")}; }
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalBox = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  width: 100%;
  max-width: 440px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.15);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
`;

const ModalTitle = styled.h3`
  font-size: 17px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 2px 0;
`;

const ModalSubtitle = styled.p`
  font-size: 13px;
  color: #6b7280;
  margin: 0;
`;

const CloseBtn = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  color: #6b7280;
  cursor: pointer;
  line-height: 1;
  flex-shrink: 0;
  &:hover { color: #111827; }
`;

const FormGroup = styled.div`
  margin-bottom: 16px;
`;

const Label = styled.label`
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 6px;
`;

const Input = styled.input`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  color: #111827;
  outline: none;
  box-sizing: border-box;
  &:focus { border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59,130,246,0.15); }
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
`;

const CancelBtn = styled.button`
  padding: 8px 18px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: white;
  color: #374151;
  font-size: 14px;
  cursor: pointer;
  &:hover { background: #f9fafb; }
`;

const SubmitBtn = styled.button`
  padding: 8px 18px;
  border: none;
  border-radius: 8px;
  background: #3b82f6;
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  &:hover { background: #2563eb; }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
`;
