import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { HiSearch, HiPlus, HiPencil } from "react-icons/hi";
import { useEffect, useState, useCallback } from "react";
import { Pagination } from "antd";
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
import ServiceModal from "./ServiceModal";

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
  const [currentPage, setCurrentPage] = useState(1);

  const pageSize = 10;

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
      (c) => c.name === service.category && c.type === "Service",
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
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
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
      s.code.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const paginatedServices = filteredServices.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  return (
    <Container>
      <Header>
        <div>
          <Title>{t("servicesManagement")}</Title>
          <Subtitle>{t("servicesManagementSubtitle")}</Subtitle>
        </div>
        <AddButton onClick={handleOpenCreateModal}>
          <HiPlus size={18} />
          {t("createNewService")}
        </AddButton>
      </Header>

      {error && <ErrorBox>{error}</ErrorBox>}

      <Toolbar>
        <SearchWrapper>
          <HiSearch size={16} color="#9ca3af" />
          <SearchInput
            type="text"
            placeholder={t("searchByNameCodeService")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </SearchWrapper>
      </Toolbar>

      <TableCard>
        <TableSection>
          <TableTitle>{t("serviceList")}</TableTitle>
          <TableSubtitle>
            {loading
              ? t("loadingServices")
              : t("showingServices", { count: filteredServices.length })}
          </TableSubtitle>

          {loading ? (
            <LoadingMessage>{t("loadingData")}</LoadingMessage>
          ) : (
            <>
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
                    {paginatedServices.map((service) => (
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
                          <UnitBadge>
                            {service.unit || t("notAvailable")}
                          </UnitBadge>
                        </Td>
                        <Td>
                          <CategoryBadge $hasData={!!service.category}>
                            {service.category || t("notAvailable")}
                          </CategoryBadge>
                        </Td>
                        <Td>
                          {service.estimatedDurationHours}
                          {t("hoursShort")}
                        </Td>
                        <Td>
                          <StatusBadge $isActive={service.isActive}>
                            {service.isActive ? t("active") : t("inactive")}
                          </StatusBadge>
                        </Td>
                        <Td>
                          <ActionButtons>
                            <EditButton
                              onClick={() => handleOpenEditModal(service)}
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
                  total={filteredServices.length}
                  showSizeChanger={false}
                  onChange={(page: number) => setCurrentPage(page)}
                />
              </PaginationWrapper>
            </>
          )}
        </TableSection>
      </TableCard>

      <ServiceModal
        isOpen={isModalOpen}
        editingService={editingService}
        formData={formData}
        categories={categories}
        submitting={submitting}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        onInputChange={handleInputChange}
      />
    </Container>
  );
};

export default ServicePage;

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
  font-size: 1rem;
`;

const TableWrapper = styled.div`
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
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
