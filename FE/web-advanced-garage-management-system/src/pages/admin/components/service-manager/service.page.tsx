import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { HiSearch, HiPlus, HiPencil } from "react-icons/hi";
import { useEffect, useState, useCallback } from "react";
import { Switch, Table as AntTable } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  serviceService,
} from "@/services/admin/serviceService";
import type { IService, IServiceRequest } from "@/services/admin/serviceService";
import { getCategories } from "@/services/admin/categoryService";
import type { ICategory } from "@/services/admin/categoryService";
import { getUnits } from "@/services/admin/unitService";
import type { IUnit } from "@/services/admin/unitService";
import { toast } from "react-toastify";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import ServiceModal from "./ServiceModal";

interface ServiceFormData {
  name: string;
  price: number | "";
  unitId: number;
  categoryID: number;
  estimatedDurationHours: number | "";
  description: string;
  image: string;
  isActive: boolean;
}

const UNIT_SELECT_PAGE_SIZE = 1000;

const normalizeType = (value?: string | null) =>
  value?.trim().replace(/\s+/g, "").toUpperCase() ?? "";

const isServiceType = (value?: string | null) => {
  const normalized = normalizeType(value);
  return normalized === "SERVICE" || normalized === "SERIVCE";
};

const matchesByName = (left?: string | null, right?: string | null) =>
  (left ?? "").trim().toLowerCase() === (right ?? "").trim().toLowerCase();

const ServicePage = () => {
  const { t } = useTranslation();
  const [services, setServices] = useState<IService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<IService | null>(null);
  const [formData, setFormData] = useState<ServiceFormData>({
    name: "",
    price: "",
    unitId: 0,
    categoryID: 0,
    estimatedDurationHours: "",
    description: "",
    image: "",
    isActive: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [units, setUnits] = useState<IUnit[]>([]);
  const [updatingStatusIds, setUpdatingStatusIds] = useState<number[]>([]);

  const fetchCategories = useCallback(async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    }
  }, []);

  const fetchUnits = useCallback(async () => {
    try {
      const data = await getUnits({
        PageIndex: 1,
        PageSize: UNIT_SELECT_PAGE_SIZE,
      });
      setUnits(data.items);
    } catch (err) {
      console.error("Failed to fetch units:", err);
    }
  }, []);

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await serviceService.getServices();
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

  useEffect(() => {
    fetchUnits();
  }, [fetchUnits]);

  const handleOpenCreateModal = async () => {
    setEditingService(null);
    setFormData({
      name: "",
      price: "",
      unitId: 0,
      categoryID: 0,
      estimatedDurationHours: "",
      description: "",
      image: "",
      isActive: false,
    });
    await Promise.all([fetchCategories(), fetchUnits()]);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = async (service: IService) => {
    const [categoryData, unitData] = await Promise.all([
      getCategories(),
      getUnits({
        PageIndex: 1,
        PageSize: UNIT_SELECT_PAGE_SIZE,
      }),
    ]);

    setCategories(categoryData);
    setUnits(unitData.items);

    const matchedCategory = categoryData.find(
      (c) => matchesByName(c.name, service.category) && isServiceType(c.type),
    );
    const matchedUnit = unitData.items.find(
      (u) => matchesByName(u.name, service.unit) && isServiceType(u.type),
    );
    setEditingService(service);
    setFormData({
      name: service.name,
      price: service.price,
      unitId: matchedUnit?.unitID ?? 0,
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
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : name === "unitId" || name === "categoryID"
            ? Number(value)
            : type === "number" && value === ""
              ? ""
              : type === "number"
                ? Number(value)
                : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload: IServiceRequest = {
        ...formData,
        price: Number(formData.price),
        estimatedDurationHours: Number(formData.estimatedDurationHours),
      };

      if (editingService) {
        await serviceService.updateService(editingService.id, payload);
      } else {
        await serviceService.createService(payload);
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

  const handleToggleServiceStatus = async (
    record: IService,
    nextIsActive: boolean,
  ) => {
    if (updatingStatusIds.includes(record.id)) return;

    const matchedUnit = units.find((u) => matchesByName(u.name, record.unit));
    const matchedCategory = categories.find(
      (c) =>
        matchesByName(c.name, record.category) && isServiceType(c.type),
    );

    if (!matchedUnit?.unitID || !matchedCategory?.categoryID) {
      toast.error(t("errorUpdatingServiceStatus"));
      return;
    }

    const payload: IServiceRequest = {
      name: record.name,
      price: record.price,
      unitId: matchedUnit.unitID,
      categoryID: matchedCategory.categoryID,
      estimatedDurationHours: record.estimatedDurationHours,
      description: record.description || "",
      image: record.image || "",
      isActive: nextIsActive,
    };

    setUpdatingStatusIds((prev) => [...prev, record.id]);
    setServices((prev) =>
      prev.map((item) =>
        item.id === record.id ? { ...item, isActive: nextIsActive } : item,
      ),
    );

    try {
      await serviceService.updateServiceStatus(record.id, payload);
    } catch (err) {
      setServices((prev) =>
        prev.map((item) =>
          item.id === record.id ? { ...item, isActive: record.isActive } : item,
        ),
      );
      toast.error(getApiErrorMessage(err, t("errorUpdatingServiceStatus")));
    } finally {
      setUpdatingStatusIds((prev) => prev.filter((id) => id !== record.id));
    }
  };

  const columns: ColumnsType<IService> = [
    {
      title: t("name"),
      key: "name",
      render: (_: unknown, record: IService) => (
        <ServiceInfo>
          <div>
            <ServiceName>{record.name}</ServiceName>
            <ServiceCode>{record.code}</ServiceCode>
          </div>
        </ServiceInfo>
      ),
    },
    {
      title: t("price"),
      dataIndex: "price",
      key: "price",
      align: "center",
      render: (val: number) => <PriceText>{formatPrice(val)}</PriceText>,
    },
    {
      title: t("unit"),
      dataIndex: "unit",
      key: "unit",
      align: "center",
      render: (val: string) => (
        <UnitBadge>{val || t("notAvailable")}</UnitBadge>
      ),
    },
    {
      title: t("category"),
      dataIndex: "category",
      key: "category",
      align: "center",
      render: (val: string) => (
        <CategoryBadge>{val || t("notAvailable")}</CategoryBadge>
      ),
    },
    {
      title: t("estimatedDurationHours"),
      dataIndex: "estimatedDurationHours",
      key: "estimatedDurationHours",
      align: "center",
      render: (val: number) => (
        <span style={{ color: "#1a1d2e" }}>
          {val}
          {t("hoursShort")}
        </span>
      ),
    },
    {
      title: t("status"),
      dataIndex: "isActive",
      key: "isActive",
      align: "center",
      render: (_: boolean, record: IService) => (
        <Switch
          checked={record.isActive}
          loading={updatingStatusIds.includes(record.id)}
          onChange={(checked) => handleToggleServiceStatus(record, checked)}
        />
      ),
    },
    {
      title: t("action"),
      key: "action",
      align: "center",
      render: (_: unknown, record: IService) => (
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
        <AntTable
          columns={columns}
          dataSource={filteredServices}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            showTotal: (total, range) =>
              `${range[0]}–${range[1]} / ${total} ${t("service")}`,
          }}
          scroll={{ x: "max-content" }}
        />
      </TableCard>

      <ServiceModal
        isOpen={isModalOpen}
        editingService={editingService}
        formData={formData}
        categories={categories}
        units={units}
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

const CategoryBadge = styled.span`
  background: #fef3c7;
  color: #b45309;
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
