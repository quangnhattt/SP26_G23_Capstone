import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { HiSearch, HiPlus, HiPencil } from "react-icons/hi";
import { Table as AntTable, Switch } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  getUnits,
  createUnit,
  updateUnit,
  updateUnitStatus,
  type IUnit,
} from "@/services/admin/unitService";
import { toast } from "react-toastify";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import UnitModal from "./UnitModal";

interface UnitFormData {
  name: string;
  type: string;
  description: string;
  isActive: boolean;
}

const UnitPage = () => {
  const { t } = useTranslation();
  const [units, setUnits] = useState<IUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<IUnit | null>(null);
  const [formData, setFormData] = useState<UnitFormData>({
    name: "",
    type: "PART",
    description: "",
    isActive: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingUnitId, setUpdatingUnitId] = useState<number | null>(null);

  const fetchUnits = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getUnits();
      setUnits(data);
    } catch (err) {
      console.error("Failed to fetch units:", err);
      setError(t("unitCannotLoad"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchUnits();
  }, [fetchUnits]);

  const handleOpenCreateModal = () => {
    setEditingUnit(null);
    setFormData({ name: "", type: "PART", description: "", isActive: true });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (unit: IUnit) => {
    setEditingUnit(unit);
    setFormData({
      name: unit.name,
      type: unit.type,
      description: unit.description || "",
      isActive: unit.isActive,
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUnit(null);
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingUnit) {
        await updateUnit(editingUnit.unitID, {
          name: formData.name,
          type: formData.type,
          description: formData.description,
          isActive: formData.isActive,
        });
      } else {
        await createUnit({
          name: formData.name,
          type: formData.type,
          description: formData.description,
        });
      }
      handleCloseModal();
      await fetchUnits();
    } catch (err) {
      console.error("Error saving unit:", err);
      toast.error(getApiErrorMessage(err, t("unitErrorSaving")));
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleUnitStatus = async (unitId: number, isActive: boolean) => {
    setUpdatingUnitId(unitId);
    try {
      await updateUnitStatus(unitId, isActive);
      await fetchUnits();
    } catch (err) {
      console.error("Error updating unit status:", err);
      toast.error(getApiErrorMessage(err, t("unitErrorSaving")));
    } finally {
      setUpdatingUnitId(null);
    }
  };

  const filteredUnits = units.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const columns: ColumnsType<IUnit> = [
    {
      title: t("id"),
      dataIndex: "unitID",
      key: "unitID",
      align: "center",
      render: (id: number) => <span style={{ color: "#1a1d2e" }}>{id}</span>,
    },
    {
      title: t("name"),
      dataIndex: "name",
      key: "name",
      render: (name: string) => <UnitName>{name}</UnitName>,
    },
    {
      title: t("type"),
      dataIndex: "type",
      key: "type",
      align: "center",
      render: (type: string) => (
        <TypeBadge $type={type}>
          {type === "SERVICE" ? t("unitTypeService") : t("unitTypePart")}
        </TypeBadge>
      ),
    },
    {
      title: t("description"),
      dataIndex: "description",
      key: "description",
      render: (desc: string | null) => (
        <DescriptionText>{desc || t("notAvailable")}</DescriptionText>
      ),
    },
    {
      title: t("status"),
      dataIndex: "isActive",
      key: "isActive",
      align: "center",
      render: (isActive: boolean, record: IUnit) => (
        <Switch
          checked={isActive}
          loading={updatingUnitId === record.unitID}
          onChange={(checked: boolean) =>
            handleToggleUnitStatus(record.unitID, checked)
          }
        />
      ),
    },
    {
      title: t("action"),
      key: "action",
      align: "center",
      render: (_: unknown, record: IUnit) => (
        <ActionButtons>
          <EditButton
            onClick={() => handleOpenEditModal(record)}
            title={t("edit")}
          >
            <HiPencil size={18} />
          </EditButton>
        </ActionButtons>
      ),
    },
  ];

  return (
    <Container>
      <Header>
        <div>
          <Title>{t("unitManagement")}</Title>
          <Subtitle>{t("unitManagementSubtitle")}</Subtitle>
        </div>
        <AddButton onClick={handleOpenCreateModal}>
          <HiPlus size={18} />
          {t("unitCreateNew")}
        </AddButton>
      </Header>

      {error && <ErrorBox>{error}</ErrorBox>}

      <Toolbar>
        <SearchWrapper>
          <HiSearch size={16} color="#9ca3af" />
          <SearchInput
            type="text"
            placeholder={t("unitSearchPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </SearchWrapper>
      </Toolbar>

      <TableCard>
        <AntTable
          columns={columns}
          dataSource={filteredUnits}
          rowKey="unitID"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            showTotal: (total, range) =>
              `${range[0]}–${range[1]} / ${total} ${t("unit")}`,
          }}
          scroll={{ x: "max-content" }}
        />
      </TableCard>

      <UnitModal
        isOpen={isModalOpen}
        editingUnit={editingUnit}
        formData={formData}
        submitting={submitting}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        onInputChange={handleInputChange}
      />
    </Container>
  );
};

export default UnitPage;

const Container = styled.div`
  padding: 24px;
  background: #f9fafb;
  min-height: 100%;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
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

const AddButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  background: #3b82f6;
  color: white;
  border: none;
  padding: 8px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  &:hover {
    background: #2563eb;
  }
`;

const ErrorBox = styled.div`
  padding: 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #991b1b;
  font-size: 14px;
  margin-bottom: 16px;
`;

const Toolbar = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  align-items: center;
`;

const TableCard = styled.div`
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
  padding: 0 8px;

  .ant-table {
    color: #374151;
  }
  .ant-table-thead > tr > th,
  .ant-table-thead > tr > td {
    color: #374151 !important;
    background: #f3f4f6 !important;
  }
  .ant-table-tbody > tr > td {
    color: #374151 !important;
  }
  .ant-table-tbody > tr:hover > td {
    background: #f9fafb !important;
  }
  .ant-pagination {
    color: #374151;
  }
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
  min-width: 220px;
  max-width: 360px;
  cursor: text;

  &:focus-within {
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
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

const UnitName = styled.div`
  font-weight: 600;
  color: #1a1d2e;
`;

const TypeBadge = styled.span<{ $type: string }>`
  background: ${({ $type }) => ($type === "SERVICE" ? "#dbeafe" : "#e0e7ff")};
  color: ${({ $type }) => ($type === "SERVICE" ? "#2563eb" : "#4338ca")};
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  display: inline-block;
`;


const DescriptionText = styled.div`
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #6b7590;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: center;
`;

const EditButton = styled.button`
  background: transparent;
  border: none;
  padding: 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  color: #3b82f6;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  &:hover {
    background: #dbeafe;
    color: #2563eb;
  }
`;
