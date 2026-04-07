import { useEffect, useState } from "react";
import { HiX } from "react-icons/hi";
import { Switch } from "antd";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { Select as AntSelect, ConfigProvider, Spin } from "antd";
import type { IPackageProduct } from "@/services/admin/packageService";
import { getProducts } from "@/services/admin/productService";
import { getServices } from "@/services/admin/serviceService";

export interface DetailFormData {
  productId: number | null;
  quantity: number | "";
  isRequired: boolean;
  displayOrder: number | "";
  notes: string;
}

interface ProductOption {
  value: number;
  label: string;
  type: string;
}

interface PackageDetailModalProps {
  isOpen: boolean;
  editingDetail: IPackageProduct | null;
  formData: DetailFormData;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onFormDataChange: (data: Partial<DetailFormData>) => void;
}

const PackageDetailModal = ({
  isOpen,
  editingDetail,
  formData,
  submitting,
  onClose,
  onSubmit,
  onFormDataChange,
}: PackageDetailModalProps) => {
  const { t } = useTranslation();
  const [productOptions, setProductOptions] = useState<ProductOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoadingOptions(true);
    Promise.all([
      getProducts({ pageSize: 500 }).catch(() => ({ items: [] })),
      getServices().catch(() => []),
    ]).then(([partsRes, services]) => {
      const parts = partsRes.items.map((p) => ({
        value: p.id,
        label: `[${t("categoryTypePart")}] ${p.name}`,
        type: "Part",
      }));
      const svcs = services.map((s) => ({
        value: s.id,
        label: `[${t("categoryTypeService")}] ${s.name}`,
        type: "Service",
      }));
      setProductOptions([...svcs, ...parts]);
    }).finally(() => setLoadingOptions(false));
  }, [isOpen, t]);

  if (!isOpen) return null;

  const handleNumberInput = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: keyof DetailFormData,
  ) => {
    const val = e.target.value;
    onFormDataChange({ [field]: val === "" ? "" : Number(val) });
  };

  return (
    <Modal>
      <ModalOverlay onClick={onClose} />
      <ModalContent>
        <ModalHeader>
          <ModalTitle>
            {editingDetail ? t("updatePackageDetail") : t("addPackageDetail")}
          </ModalTitle>
          <CloseButton onClick={onClose}>
            <HiX size={24} />
          </CloseButton>
        </ModalHeader>

        <ModalBody>
          <Form onSubmit={onSubmit}>
            <FormGroup>
              <Label>{t("selectProduct")} *</Label>
              {loadingOptions ? (
                <SpinWrapper>
                  <Spin size="small" />
                </SpinWrapper>
              ) : (
                <ConfigProvider
                  theme={{
                    token: { colorText: "#1a1d2e", colorTextPlaceholder: "#9ca3bf" },
                    components: {
                      Select: {
                        colorText: "#1a1d2e",
                        colorBgContainer: "#fff",
                        colorTextPlaceholder: "#9ca3bf",
                      },
                    },
                  }}
                >
                  <AntSelect
                    showSearch
                    style={{ width: "100%" }}
                    value={formData.productId}
                    placeholder={t("selectProduct")}
                    filterOption={(input, option) =>
                      String(option?.label ?? "")
                        .toLowerCase()
                        .includes(input.toLowerCase())
                    }
                    options={productOptions}
                    onChange={(val: number) =>
                      onFormDataChange({ productId: val })
                    }
                    disabled={!!editingDetail}
                  />
                </ConfigProvider>
              )}
            </FormGroup>

            <FormRow>
              <FormGroup>
                <Label>{t("quantity")} *</Label>
                <Input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => handleNumberInput(e, "quantity")}
                  min="1"
                  step="1"
                  placeholder={t("quantity")}
                  required
                />
              </FormGroup>
              <FormGroup>
                <Label>{t("displayOrder")}</Label>
                <Input
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) => handleNumberInput(e, "displayOrder")}
                  min="0"
                  placeholder={t("displayOrderPlaceholder")}
                />
              </FormGroup>
            </FormRow>

            <FormGroup>
              <Label>{t("notes")}</Label>
              <Input
                type="text"
                value={formData.notes}
                onChange={(e) => onFormDataChange({ notes: e.target.value })}
                placeholder={t("notes")}
              />
            </FormGroup>

            <FormGroup>
              <CheckboxLabel>
                <Switch
                  checked={formData.isRequired}
                  onChange={(checked) => onFormDataChange({ isRequired: checked })}
                />
                <span>{t("isRequired")}</span>
              </CheckboxLabel>
            </FormGroup>

            <ModalFooter>
              <CancelButton type="button" onClick={onClose}>
                {t("cancel")}
              </CancelButton>
              <SubmitButton
                type="submit"
                disabled={submitting || !formData.productId}
              >
                {submitting
                  ? t("saving")
                  : editingDetail
                    ? t("updatePackageDetail")
                    : t("addPackageDetail")}
              </SubmitButton>
            </ModalFooter>
          </Form>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default PackageDetailModal;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1100;
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
  max-width: 480px;
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
  font-size: 1.125rem;
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
  gap: 1.25rem;
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
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

const SpinWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;

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
