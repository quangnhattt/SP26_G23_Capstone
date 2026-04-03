import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { HiSearch, HiPlus, HiPencil } from "react-icons/hi";
import { Pagination } from "antd";
import {
  getUnits,
  createUnit,
  updateUnit,
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
  const [currentPage, setCurrentPage] = useState(1);

  const pageSize = 10;

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

  const filteredUnits = units.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const paginatedUnits = filteredUnits.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

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
        <TableSection>
          <TableTitle>{t("unitList")}</TableTitle>
          <TableSubtitle>
            {loading
              ? t("loading")
              : t("unitShowing", { count: filteredUnits.length })}
          </TableSubtitle>

          {loading ? (
            <LoadingMessage>{t("loadingData")}</LoadingMessage>
          ) : (
            <>
              <TableWrapper>
                <Table>
                  <thead>
                    <tr>
                      <Th>{t("id")}</Th>
                      <Th>{t("name")}</Th>
                      <Th>{t("type")}</Th>
                      <Th>{t("description")}</Th>
                      <Th>{t("status")}</Th>
                      <Th>{t("action")}</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedUnits.map((unit) => (
                      <tr key={unit.unitID}>
                        <Td>{unit.unitID}</Td>
                        <Td>
                          <UnitName>{unit.name}</UnitName>
                        </Td>
                        <Td>
                          <TypeBadge $type={unit.type}>
                            {unit.type === "SERVICE"
                              ? t("unitTypeService")
                              : t("unitTypePart")}
                          </TypeBadge>
                        </Td>
                        <Td>
                          <DescriptionText>
                            {unit.description || t("notAvailable")}
                          </DescriptionText>
                        </Td>
                        <Td>
                          <StatusBadge $active={unit.isActive}>
                            {unit.isActive ? t("active") : t("inactive")}
                          </StatusBadge>
                        </Td>
                        <Td>
                          <ActionButtons>
                            <EditButton
                              onClick={() => handleOpenEditModal(unit)}
                              title={t("edit")}
                            >
                              <HiPencil size={18} />
                            </EditButton>
                          </ActionButtons>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </TableWrapper>
              <PaginationWrapper>
                <Pagination
                  current={currentPage}
                  pageSize={pageSize}
                  total={filteredUnits.length}
                  showSizeChanger={false}
                  onChange={(page: number) => setCurrentPage(page)}
                />
              </PaginationWrapper>
            </>
          )}
        </TableSection>
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

// Styled Components
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

const TableSection = styled.div`
  padding: 20px;
`;

const TableTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 4px 0;
`;

const TableSubtitle = styled.p`
  font-size: 14px;
  color: #6b7280;
  margin: 0 0 16px 0;
`;

const LoadingMessage = styled.div`
  padding: 3rem;
  text-align: center;
  color: #6b7590;
`;

const TableWrapper = styled.div`
  overflow-x: auto;
`;

const PaginationWrapper = styled.div`
  display: flex;
  justify-content: flex-end;
  padding: 16px 0 0;
`;

const Table = styled.table`
  width: 100%;
  min-width: max-content;
  border-collapse: collapse;
`;

const Th = styled.th`
  text-align: center;
  padding: 0.75rem 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7590;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid #e5e7eb;
  &:first-child {
    text-align: left;
  }
`;

const Td = styled.td`
  padding: 1rem;
  border-bottom: 1px solid #f3f4f6;
  font-size: 0.875rem;
  color: #1a1d2e;
  text-align: center;
  &:first-child {
    text-align: left;
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

const StatusBadge = styled.span<{ $active: boolean }>`
  background: ${({ $active }) => ($active ? "#dcfce7" : "#fee2e2")};
  color: ${({ $active }) => ($active ? "#16a34a" : "#dc2626")};
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
