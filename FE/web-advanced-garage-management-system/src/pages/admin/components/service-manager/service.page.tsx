import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { HiSearch, HiPlus, HiPencil, HiTrash, HiX } from "react-icons/hi";
import { useEffect, useState, useCallback } from "react";
import {
  getServices,
  createService,
  updateService,
} from "@/services/admin/serviceService";
import type { IService } from "@/services/admin/serviceService";
import { getCategories } from "@/services/admin/categoryService";
import type { ICategory } from "@/services/admin/categoryService";
import { toast } from "react-toastify";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";

interface ServiceFormData {
  code: string;
  name: string;
  price: number;
  unitId: number;
  categoryID: number;
  estimatedDurationHours: number;
  description: string;
  image: string;
  isActive: boolean;
}

const ServicePage = () => {
  const { t } = useTranslation();
  const [services, setServices] = useState<IService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<IService | null>(null);
  const [formData, setFormData] = useState<ServiceFormData>({
    code: "",
    name: "",
    price: 0,
    unitId: 0,
    categoryID: 0,
    estimatedDurationHours: 0,
    description: "",
    image: "",
    isActive: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categories, setCategories] = useState<ICategory[]>([]);

  const fetchCategories = useCallback(async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    }
  }, []);

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getServices();
      setServices(data);
    } catch (err) {
      console.error("Failed to fetch services:", err);
      setError(t("cannotLoadServices"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleOpenCreateModal = async () => {
    setEditingService(null);
    setFormData({
      code: "",
      name: "",
      price: 0,
      unitId: 0,
      categoryID: 0,
      estimatedDurationHours: 0,
      description: "",
      image: "",
      isActive: true,
    });
    await fetchCategories();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = async (service: IService) => {
    const data = await getCategories();
    setCategories(data);
    const matchedCategory = data.find(
      (c) => c.name === service.category && c.type === "Service"
    );
    setEditingService(service);
    setFormData({
      code: service.code,
      name: service.name,
      price: service.price,
      unitId: 0,
      categoryID: matchedCategory?.categoryID ?? 0,
      estimatedDurationHours: service.estimatedDurationHours,
      description: service.description || "",
      image: service.image || "",
      isActive: service.isActive,
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingService(null);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "number"
          ? Number(value)
          : type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : name === "categoryID"
          ? Number(value)
          : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingService) {
        await updateService(editingService.id, formData);
      } else {
        await createService(formData);
      }
      handleCloseModal();
      await fetchServices();
    } catch (err) {
      console.error("Error saving service:", err);
      toast.error(getApiErrorMessage(err, t("errorSavingService")));
    } finally {
      setSubmitting(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const filteredServices = services.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
  <Container>
    <Header>
      <TitleSection>
        <Title>{t("servicesManagement")}</Title>
        <Subtitle>{t("servicesManagementSubtitle")}</Subtitle>
      </TitleSection>
      <AddButton onClick={handleOpenCreateModal}>
        <HiPlus size={18} />
        {t("createNewService")}
      </AddButton>
    </Header>

    <TableCard>
      <TableHeader>
        <SearchBox>
          <HiSearch size={18} />
          <input
            type="text"
            placeholder={t("searchByNameCodeService")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </SearchBox>
      </TableHeader>

      <TableSection>
        <TableTitle>{t("serviceList")}</TableTitle>
        <TableSubtitle>
          {loading
            ? t("loadingServices")
            : t("showingServices", { count: filteredServices.length })}
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
                <Th>{t("price")}</Th>
                <Th>{t("unit")}</Th>
                <Th>{t("category")}</Th>
                <Th>{t("estimatedDurationHours")}</Th>
                <Th>{t("status")}</Th>
                <Th>{t("action")}</Th>
              </tr>
            </thead>
            <tbody>
              {filteredServices.map((service) => (
                <tr key={service.id}>
                  <Td>
                    <ServiceInfo>
                      <div>
                        <ServiceName>{service.name}</ServiceName>
                        <ServiceCode>{service.code}</ServiceCode>
                      </div>
                    </ServiceInfo>
                  </Td>
                  <Td>
                    <PriceText>{formatPrice(service.price)}</PriceText>
                  </Td>
                  <Td>
                    <UnitBadge>{service.unit || "N/A"}</UnitBadge>
                  </Td>
                  <Td>
                    <CategoryBadge $hasData={!!service.category}>
                      {service.category || "N/A"}
                    </CategoryBadge>
                  </Td>
                  <Td>{service.estimatedDurationHours}h</Td>
                  <Td>
                    <StatusBadge $isActive={service.isActive}>
                      {service.isActive ? t("active") : t("inactive")}
                    </StatusBadge>
                  </Td>
                  <Td>
                    <ActionButtons>
                      <EditButton
                        onClick={() => handleOpenEditModal(service)}
                        title="Edit"
                      >
                        <HiPencil size={18} />
                      </EditButton>
                      <DeleteButton
                        onClick={() =>
                          console.log("Delete service:", service.id)
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
              {editingService ? t("updateService") : t("createNewService")}
            </ModalTitle>
            <CloseButton onClick={handleCloseModal}>
              <HiX size={24} />
            </CloseButton>
          </ModalHeader>

          <ModalBody>
              <Form onSubmit={handleSubmit}>
                <FormRow>
                  <FormGroup>
                    <Label>{t("code")} *</Label>
                    <Input
                      type="text"
                      name="code"
                      value={formData.code}
                      onChange={handleInputChange}
                      placeholder="P1161200016"
                      required
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>{t("name")} *</Label>
                    <Input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Test tiền postman"
                      required
                    />
                  </FormGroup>
                </FormRow>

                <FormRow>
                  <FormGroup>
                    <Label>{t("price")} *</Label>
                    <Input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      placeholder="9999999"
                      required
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>{t("unitID")} *</Label>
                    <Input
                      type="number"
                      name="unitId"
                      value={formData.unitId}
                      onChange={handleInputChange}
                      required
                    />
                  </FormGroup>
                </FormRow>

                <FormRow>
                  <FormGroup>
                    <Label>{t("categoryID")} *</Label>
                    <Select
                      name="categoryID"
                      value={formData.categoryID || ""}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">{t("selectCategory")}</option>
                      {categories
                        .filter((c) => c.type === "Service")
                        .map((cat) => (
                          <option key={cat.categoryID} value={cat.categoryID}>
                            {cat.name}
                          </option>
                        ))}
                    </Select>
                  </FormGroup>

                  <FormGroup>
                    <Label>{t("estimatedDurationHours")} *</Label>
                    <Input
                      type="number"
                      name="estimatedDurationHours"
                      value={formData.estimatedDurationHours}
                      onChange={handleInputChange}
                      placeholder="0.5"
                      step="0.1"
                      min="0"
                      required
                    />
                  </FormGroup>
                </FormRow>

                <FormRow>
                  <FormGroup>
                    <Label>{t("imageURL")}</Label>
                    <Input
                      type="text"
                      name="image"
                      value={formData.image}
                      onChange={handleInputChange}
                      placeholder="string"
                    />
                  </FormGroup>
                </FormRow>

                <FormGroup>
                  <Label>{t("description")} *</Label>
                  <TextArea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Test tiền post man cho anh nhất"
                    rows={3}
                    required
                  />
                </FormGroup>

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

                <ModalFooter>
                  <CancelButton type="button" onClick={handleCloseModal}>
                    {t("cancel")}
                  </CancelButton>
                  <SubmitButton type="submit" disabled={submitting}>
                    {submitting
                      ? t("saving")
                      : editingService
                      ? t("updateService")
                      : t("createService")}
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

export default ServicePage;

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

const ServiceInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const ServiceName = styled.div`
  font-weight: 600;
  color: #1a1d2e;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ServiceCode = styled.div`
  font-size: 0.75rem;
  color: #9ca3bf;
  margin-top: 0.125rem;
`;

const PriceText = styled.div`
  font-weight: 600;
  color: #059669;
`;

const UnitBadge = styled.span`
  background: #e0e7ff;
  color: #4338ca;
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  display: inline-block;
`;

const CategoryBadge = styled.span<{ $hasData: boolean }>`
  background: #fef3c7;
  color: #b45309;
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  display: inline-block;
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
  max-width: 800px;
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

const Select = styled.select`
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
