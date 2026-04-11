import styled from "styled-components";
import { HiSearch, HiPlus, HiPencil, HiTrash } from "react-icons/hi";
import { useEffect, useState } from "react";
import { Table as AntTable } from "antd";
import type { ColumnsType } from "antd/es/table";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import {
  getPermissionGroups,
  createPermissionGroup,
  updatePermissionGroup,
  deletePermissionGroup,
  type IPermissionGroup,
  type IPermissionGroupRequest,
} from "@/services/admin/permissionService";

const PermissionGroupsTab = () => {
  const { t } = useTranslation();
  const [groups, setGroups] = useState<IPermissionGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<IPermissionGroup | null>(null);
  const [form, setForm] = useState<IPermissionGroupRequest>({ groupName: "", description: "" });
  const [saving, setSaving] = useState(false);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const data = await getPermissionGroups();
      setGroups(data);
    } catch {
      toast.error(t("permGrpCannotLoad"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchGroups();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ groupName: "", description: "" });
    setIsModalOpen(true);
  };

  const openEdit = (record: IPermissionGroup) => {
    setEditing(record);
    setForm({ groupName: record.groupName, description: record.description });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(t("permGrpConfirmDelete"))) return;
    try {
      await deletePermissionGroup(id);
      toast.success(t("permGrpDeleteSuccess"));
      void fetchGroups();
    } catch {
      toast.error(t("errorOccurred"));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.groupName.trim()) return;
    try {
      setSaving(true);
      if (editing) {
        await updatePermissionGroup(editing.groupID, form);
        toast.success(t("permGrpUpdateSuccess"));
      } else {
        await createPermissionGroup(form);
        toast.success(t("permGrpCreateSuccess"));
      }
      setIsModalOpen(false);
      void fetchGroups();
    } catch {
      toast.error(t("errorOccurred"));
    } finally {
      setSaving(false);
    }
  };

  const filtered = groups.filter((g) =>
    g.groupName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns: ColumnsType<IPermissionGroup> = [
    { title: "ID", dataIndex: "groupID", key: "groupID", width: 60, align: "center" },
    { title: t("permGrpName"), dataIndex: "groupName", key: "groupName" },
    { title: t("description"), dataIndex: "description", key: "description" },
    {
      title: t("action"),
      key: "action",
      align: "center",
      width: 100,
      render: (_: unknown, record: IPermissionGroup) => (
        <ActionButtons>
          <ActionButton onClick={() => openEdit(record)}><HiPencil size={16} /></ActionButton>
          <ActionButton danger onClick={() => handleDelete(record.groupID)}><HiTrash size={16} /></ActionButton>
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
            placeholder={t("permGrpSearch")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </SearchWrapper>
        <AddButton onClick={openCreate}>
          <HiPlus size={16} /> {t("permGrpAdd")}
        </AddButton>
      </Toolbar>

      <TableCard>
        <AntTable
          columns={columns}
          dataSource={filtered}
          rowKey="groupID"
          loading={loading}
          pagination={{ pageSize: 8, showSizeChanger: false }}
          scroll={{ x: "max-content" }}
        />
      </TableCard>

      {isModalOpen && (
        <ModalOverlay onClick={() => setIsModalOpen(false)}>
          <ModalBox onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>{editing ? t("permGrpEdit") : t("permGrpAdd")}</ModalTitle>
              <CloseBtn onClick={() => setIsModalOpen(false)}>×</CloseBtn>
            </ModalHeader>
            <form onSubmit={(e) => { void handleSubmit(e); }}>
              <FormGroup>
                <Label>{t("permGrpName")} *</Label>
                <Input
                  value={form.groupName}
                  onChange={(e) => setForm((f) => ({ ...f, groupName: e.target.value }))}
                  placeholder={t("permGrpNamePlaceholder")}
                  required
                />
              </FormGroup>
              <FormGroup>
                <Label>{t("description")}</Label>
                <Input
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder={t("permGrpDescPlaceholder")}
                />
              </FormGroup>
              <ModalFooter>
                <CancelBtn type="button" onClick={() => setIsModalOpen(false)}>{t("permCancel")}</CancelBtn>
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

export default PermissionGroupsTab;

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

const AddButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  background: #3b82f6;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  &:hover { background: #2563eb; }
`;

const TableCard = styled.div`
  background: #fff;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
  padding: 0 8px;
  .ant-table { color: #374151; }
  .ant-table-thead > tr > th { color: #374151 !important; background: #f3f4f6 !important; }
  .ant-table-tbody > tr > td { color: #374151 !important; }
  .ant-table-tbody > tr:hover > td { background: #f9fafb !important; }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 6px;
  justify-content: center;
`;

const ActionButton = styled.button<{ danger?: boolean }>`
  background: transparent;
  border: none;
  padding: 6px;
  border-radius: 6px;
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
  align-items: center;
  margin-bottom: 20px;
`;

const ModalTitle = styled.h3`
  font-size: 18px;
  font-weight: 700;
  color: #111827;
  margin: 0;
`;

const CloseBtn = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  color: #6b7280;
  cursor: pointer;
  line-height: 1;
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
