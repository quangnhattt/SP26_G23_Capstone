import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { HiPlus, HiPencil, HiSearch, HiTrash, HiX } from "react-icons/hi";
import {
  getSuppliers,
  createSupplier,
  updateSupplier,
  type ISupplier,
  type ISupplierCreateRequest,
  type ISupplierUpdateRequest,
} from "@/services/admin/supplierService";
import { toast } from "react-toastify";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";

interface SupplierFormData {
  name: string;
  address: string;
  phone: string;
  email: string;
  description: string;
  isActive: boolean;
}

const SupplierPage = () => {
  const { t } = useTranslation();
  const [suppliers, setSuppliers] = useState<ISupplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<ISupplier | null>(null);
  const [formData, setFormData] = useState<SupplierFormData>({
    name: "",
    address: "",
    phone: "",
    email: "",
    description: "",
    isActive: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchSuppliers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getSuppliers();
      setSuppliers(response.items || []);
    } catch (err) {
      console.error("Failed to fetch suppliers:", err);
      setError(t("cannotLoadSuppliers"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const handleOpenCreateModal = () => {
    setEditingSupplier(null);
    setFormData({
      name: "",
      address: "",
      phone: "",
      email: "",
      description: "",
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (supplier: ISupplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      address: supplier.address || "",
      phone: supplier.phone || "",
      email: supplier.email || "",
      description: supplier.description || "",
      isActive: supplier.isActive,
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSupplier(null);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingSupplier) {
        const updatePayload: ISupplierUpdateRequest = {
          name: formData.name,
          address: formData.address,
          phone: formData.phone,
          email: formData.email,
          description: formData.description,
          isActive: formData.isActive,
        };
        await updateSupplier(editingSupplier.supplierID, updatePayload);
      } else {
        const createPayload: ISupplierCreateRequest = {
          name: formData.name,
          address: formData.address,
          phone: formData.phone,
          email: formData.email,
          description: formData.description || undefined,
        };
        await createSupplier(createPayload);
      }
      handleCloseModal();
      await fetchSuppliers();
    } catch (err) {
      console.error("Error saving supplier:", err);
      toast.error(getApiErrorMessage(err, t("errorSavingSupplier")));
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.email && s.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.phone && s.phone.includes(searchTerm))
  );

  return (
    <Container>
      <Header>
        <TitleSection>
          <Title>{t("suppliersManagement")}</Title>
          <Subtitle>{t("suppliersManagementSubtitle")}</Subtitle>
        </TitleSection>
        <AddButton onClick={handleOpenCreateModal}>
          <HiPlus size={18} />
          {t("createNewSupplier")}
        </AddButton>
      </Header>

      <TableCard>
        <TableHeader>
          <SearchBox>
            <HiSearch size={18} />
            <input
              type="text"
              placeholder={t("searchByNameEmailSupplier")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </SearchBox>
        </TableHeader>

        <TableSection>
          <TableTitle>{t("supplierList")}</TableTitle>
          <TableSubtitle>
            {loading
              ? t("loadingSuppliers")
              : t("showingSuppliers", { count: filteredSuppliers.length })}
          </TableSubtitle>

          {error && <ErrorMessage>{error}</ErrorMessage>}

          {loading ? (
            <LoadingMessage>{t("loadingData")}</LoadingMessage>
          ) : (
            <TableWrapper>
            <Table>
              <thead>
                <tr>
                  <Th>{t("name")}</Th>
                  <Th>{t("address")}</Th>
                  <Th>{t("phone")}</Th>
                  <Th>{t("email")}</Th>
                  <Th>{t("description")}</Th>
                  <Th>{t("status")}</Th>
                  <Th>{t("createDate")}</Th>
                  <Th>{t("action")}</Th>
                </tr>
              </thead>
              <tbody>
                {filteredSuppliers.map((supplier) => (
                  <tr key={supplier.supplierID}>
                    <Td>
                      <SupplierName>{supplier.name}</SupplierName>
                    </Td>
                    <Td>
                      <TextEllipsis title={supplier.address}>
                        {supplier.address || "N/A"}
                      </TextEllipsis>
                    </Td>
                    <Td>{supplier.phone || "N/A"}</Td>
                    <Td>{supplier.email || "N/A"}</Td>
                    <Td>
                      <TextEllipsis title={supplier.description}>
                        {supplier.description || "N/A"}
                      </TextEllipsis>
                    </Td>
                    <Td>
                      <StatusBadge $isActive={supplier.isActive}>
                        {supplier.isActive ? t("active") : t("inactive")}
                      </StatusBadge>
                    </Td>
                    <Td>{formatDate(supplier.createdDate)}</Td>
                    <Td>
                      <ActionButtons>
                        <EditButton
                          onClick={() => handleOpenEditModal(supplier)}
                          title="Edit"
                        >
                          <HiPencil size={18} />
                        </EditButton>
                        <DeleteButton
                          onClick={() =>
                            console.log("Delete supplier:", supplier.supplierID)
                          }
                          title="Delete"
                        >
                          <HiTrash size={18} />
                        </DeleteButton>
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
                {editingSupplier
                  ? t("updateSupplier")
                  : t("createNewSupplier")}
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
                    placeholder={t("supplierNamePlaceholder")}
                    required
                  />
                </FormGroup>

                <FormGroup>
                  <Label>{t("address")} *</Label>
                  <Input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder={t("addressPlaceholder")}
                    required
                  />
                </FormGroup>

                <FormRow>
                  <FormGroup>
                    <Label>{t("phone")} *</Label>
                    <Input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder={t("phonePlaceholder")}
                      required
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>{t("email")} *</Label>
                    <Input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="contact@example.com"
                      required
                    />
                  </FormGroup>
                </FormRow>

                <FormGroup>
                  <Label>{t("description")}</Label>
                  <TextArea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder={t("supplierDescriptionPlaceholder")}
                    rows={3}
                  />
                </FormGroup>

                {editingSupplier && (
                  <FormGroup>
                    <CheckboxLabel>
                      <input
                        type="checkbox"
                        name="isActive"
                        checked={formData.isActive}
                        onChange={handleInputChange}
                      />
                      <span>{t("active")}</span>
                    </CheckboxLabel>
                  </FormGroup>
                )}

                <ModalFooter>
                  <CancelButton type="button" onClick={handleCloseModal}>
                    {t("cancel")}
                  </CancelButton>
                  <SubmitButton type="submit" disabled={submitting}>
                    {submitting
                      ? t("saving")
                      : editingSupplier
                        ? t("updateSupplier")
                        : t("createSupplier")}
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

export default SupplierPage;

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

  &:hover {
    background: #2563eb;
  }
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

    &::placeholder {
      color: #9ca3bf;
    }
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
  font-size: 1rem;
`;

const TableWrapper = styled.div`
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
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

const SupplierName = styled.div`
  font-weight: 600;
  color: #1a1d2e;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const TextEllipsis = styled.span`
  max-width: 150px;
  display: inline-block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StatusBadge = styled.span<{ $isActive: boolean }>`
  background: ${(props) => (props.$isActive ? "#dcfce7" : "#f3f4f6")};
  color: ${(props) => (props.$isActive ? "#16a34a" : "#6b7280")};
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  display: inline-block;
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
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: #dbeafe;
    color: #2563eb;
  }
`;

const DeleteButton = styled.button`
  background: transparent;
  border: none;
  padding: 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  color: #ef4444;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: #fee2e2;
    color: #dc2626;
  }
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ModalOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
`;

const ModalContent = styled.div`
  position: relative;
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
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
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: #1a1d2e;
  }
`;

const ModalBody = styled.div`
  padding: 1.5rem;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
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
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  &::placeholder {
    color: #9ca3bf;
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
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  &::placeholder {
    color: #9ca3bf;
  }
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;

  input[type="checkbox"] {
    width: 18px;
    height: 18px;
    cursor: pointer;
  }

  span {
    font-size: 0.875rem;
    color: #374151;
  }
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
  transition: all 0.2s;

  &:hover {
    background: #f9fafb;
  }
`;

const SubmitButton = styled.button`
  padding: 0.75rem 1.5rem;
  border: none;
  background: #3b82f6;
  color: white;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #2563eb;
  }

  &:disabled {
    background: #9ca3bf;
    cursor: not-allowed;
  }
`;
