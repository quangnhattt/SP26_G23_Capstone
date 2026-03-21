import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { HiSearch, HiPlus, HiPencil, HiX } from "react-icons/hi";
import { getUnits, createUnit, updateUnit, type IUnit } from "@/services/admin/unitService";
import { toast } from "react-toastify";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";

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
    setFormData({ name: "", type: "part", description: "", isActive: true });
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
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
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
      u.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Container>
      <Header>
        <TitleSection>
          <Title>{t("unitManagement")}</Title>
          <Subtitle>{t("unitManagementSubtitle")}</Subtitle>
        </TitleSection>
        <AddButton onClick={handleOpenCreateModal}>
          <HiPlus size={18} />
          {t("unitCreateNew")}
        </AddButton>
      </Header>

      <TableCard>
        <TableHeader>
          <SearchBox>
            <HiSearch size={18} />
            <input
              type="text"
              placeholder={t("unitSearchPlaceholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </SearchBox>
        </TableHeader>

        <TableSection>
          <TableTitle>{t("unitList")}</TableTitle>
          <TableSubtitle>
            {loading ? t("loading") : t("unitShowing", { count: filteredUnits.length })}
          </TableSubtitle>

          {error && <ErrorMessage>{error}</ErrorMessage>}

          {loading ? (
            <LoadingMessage>{t("loadingData")}</LoadingMessage>
          ) : (
            <TableWrapper>
              <Table>
                <thead>
                  <tr>
                    <Th>ID</Th>
                    <Th>{t("name")}</Th>
                    <Th>{t("type")}</Th>
                    <Th>{t("description")}</Th>
                    <Th>{t("status")}</Th>
                    <Th>{t("action")}</Th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUnits.map((unit) => (
                    <tr key={unit.unitID}>
                      <Td>{unit.unitID}</Td>
                      <Td>
                        <UnitName>{unit.name}</UnitName>
                      </Td>
                      <Td>
                        <TypeBadge $type={unit.type}>{unit.type}</TypeBadge>
                      </Td>
                      <Td>
                        <DescriptionText>{unit.description || "—"}</DescriptionText>
                      </Td>
                      <Td>
                        <StatusBadge $active={unit.isActive}>
                          {unit.isActive ? t("active") : t("inactive")}
                        </StatusBadge>
                      </Td>
                      <Td>
                        <ActionButtons>
                          <EditButton onClick={() => handleOpenEditModal(unit)}>
                            <HiPencil size={18} />
                          </EditButton>
                        </ActionButtons>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableWrapper>
          )}
        </TableSection>
      </TableCard>

      {isModalOpen && (
        <Modal>
          <ModalOverlay onClick={handleCloseModal} />
          <ModalContent>
            <ModalHeader>
              <ModalTitle>
                {editingUnit ? t("unitUpdate") : t("unitCreateNew")}
              </ModalTitle>
              <CloseButton onClick={handleCloseModal}>
                <HiX size={24} />
              </CloseButton>
            </ModalHeader>

            <ModalBody>
              <Form onSubmit={handleSubmit}>
                <FormGroup>
                  <Label>{t("name")} *</Label>
                  <Input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder={t("unitNamePlaceholder")}
                    required
                  />
                </FormGroup>

                <FormGroup>
                  <Label>{t("type")} *</Label>
                  <Select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="part">Part</option>
                    <option value="service">Service</option>
                  </Select>
                </FormGroup>

                <FormGroup>
                  <Label>{t("description")}</Label>
                  <TextArea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder={t("unitDescPlaceholder")}
                    rows={3}
                  />
                </FormGroup>

                {editingUnit && (
                  <FormGroup>
                    <CheckboxRow>
                      <input
                        type="checkbox"
                        name="isActive"
                        checked={formData.isActive}
                        onChange={handleInputChange}
                      />
                      <Label style={{ margin: 0 }}>{t("active")}</Label>
                    </CheckboxRow>
                  </FormGroup>
                )}

                <ModalFooter>
                  <CancelButton type="button" onClick={handleCloseModal}>
                    {t("cancel")}
                  </CancelButton>
                  <SubmitButton type="submit" disabled={submitting}>
                    {submitting ? t("saving") : editingUnit ? t("unitUpdate") : t("create")}
                  </SubmitButton>
                </ModalFooter>
              </Form>
            </ModalBody>
          </ModalContent>
        </Modal>
      )}
    </Container>
  );
};

export default UnitPage;

// Styled Components
const Container = styled.div`
  padding: 2rem;
  background: #f8f9fa;
  min-height: 100vh;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

const TitleSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: 700;
  color: #1a1d2e;
  margin: 0;
`;

const Subtitle = styled.p`
  font-size: 0.875rem;
  color: #6b7590;
  margin: 0;
`;

const AddButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #3b82f6;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  &:hover { background: #2563eb; }
`;

const TableCard = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

const TableHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
`;

const SearchBox = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: #f8f9fa;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  flex: 1;
  max-width: 400px;
  color: #6b7590;
  input {
    border: none;
    background: transparent;
    outline: none;
    flex: 1;
    font-size: 0.875rem;
    color: #1a1d2e;
    &::placeholder { color: #9ca3bf; }
  }
`;

const TableSection = styled.div`
  padding: 1.5rem;
`;

const TableTitle = styled.h2`
  font-size: 1.125rem;
  font-weight: 600;
  color: #1a1d2e;
  margin: 0 0 0.25rem 0;
`;

const TableSubtitle = styled.p`
  font-size: 0.875rem;
  color: #6b7590;
  margin: 0 0 1.5rem 0;
`;

const ErrorMessage = styled.div`
  background: #fee;
  color: #c33;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  text-align: center;
`;

const LoadingMessage = styled.div`
  padding: 3rem;
  text-align: center;
  color: #6b7590;
`;

const TableWrapper = styled.div`
  overflow-x: auto;
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
  &:first-child { text-align: left; }
`;

const Td = styled.td`
  padding: 1rem;
  border-bottom: 1px solid #f3f4f6;
  font-size: 0.875rem;
  color: #1a1d2e;
  text-align: center;
  &:first-child { text-align: left; }
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
  &:hover { background: #dbeafe; color: #2563eb; }
`;

const Modal = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ModalOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
`;

const ModalContent = styled.div`
  position: relative;
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
`;

const ModalTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 700;
  color: #1a1d2e;
  margin: 0;
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  padding: 0.5rem;
  cursor: pointer;
  color: #6b7590;
  display: flex;
  align-items: center;
  justify-content: center;
  &:hover { color: #1a1d2e; }
`;

const ModalBody = styled.div`
  padding: 1.5rem;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.875rem;
  color: #1a1d2e !important;
  background: white !important;
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  &::placeholder { color: #9ca3bf; }
`;

const Select = styled.select`
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.875rem;
  color: #1a1d2e !important;
  background: white !important;
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const TextArea = styled.textarea`
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.875rem;
  color: #1a1d2e !important;
  background: white !important;
  font-family: inherit;
  resize: vertical;
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  &::placeholder { color: #9ca3bf; }
`;

const CheckboxRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
`;

const CancelButton = styled.button`
  padding: 0.75rem 1.5rem;
  border: 1px solid #e5e7eb;
  background: white;
  color: #374151;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  &:hover { background: #f9fafb; }
`;

const SubmitButton = styled.button`
  padding: 0.75rem 1.5rem;
  border: none;
  background: #3b82f6;
  color: white;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  &:hover { background: #2563eb; }
  &:disabled { background: #9ca3bf; cursor: not-allowed; }
`;
