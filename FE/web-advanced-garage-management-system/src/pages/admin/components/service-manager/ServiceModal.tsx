import { HiX } from "react-icons/hi";
import { Switch } from "antd";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import type { ICategory } from "@/services/admin/categoryService";
import type { IService } from "@/services/admin/serviceService";
import type { IUnit } from "@/services/admin/unitService";

interface ServiceModalFormData {
  name: string;
  price: number | "";
  unitId: number;
  categoryID: number;
  estimatedDurationHours: number | "";
  description: string;
  image: string;
  isActive: boolean;
}

interface ServiceModalProps {
  isOpen: boolean;
  editingService: IService | null;
  formData: ServiceModalFormData;
  categories: ICategory[];
  units: IUnit[];
  submitting: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onInputChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => void;
}

const ServiceModal = ({
  isOpen,
  editingService,
  formData,
  categories,
  units,
  submitting,
  onClose,
  onSubmit,
  onInputChange,
}: ServiceModalProps) => {
  const { t } = useTranslation();

  if (!isOpen) {
    return null;
  }

  return (
    <Modal>
      <ModalOverlay onClick={onClose} />
      <ModalContent>
        <ModalHeader>
          <ModalTitle>
            {editingService ? t("updateService") : t("createNewService")}
          </ModalTitle>
          <CloseButton onClick={onClose}>
            <HiX size={24} />
          </CloseButton>
        </ModalHeader>

        <ModalBody>
          <Form onSubmit={onSubmit}>
            <FormRow>
              <FormGroup>
                <Label>{t("name")} *</Label>
                <Input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={onInputChange}
                  placeholder={t("serviceNamePlaceholder")}
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
                  onChange={onInputChange}
                  placeholder={t("servicePricePlaceholder")}
                  required
                />
              </FormGroup>

              <FormGroup>
                <Label>{t("unitID")} *</Label>
                <Select
                  name="unitId"
                  value={formData.unitId || ""}
                  onChange={onInputChange}
                  required
                >
                  <option value="">{t("selectUnit")}</option>
                  {units
                    .filter((unit) => unit.type === "SERVICE")
                    .map((unit) => (
                      <option key={unit.unitID} value={unit.unitID}>
                        {unit.name}
                      </option>
                    ))}
                </Select>
              </FormGroup>
            </FormRow>

            <FormRow>
              <FormGroup>
                <Label>{t("categoryID")} *</Label>
                <Select
                  name="categoryID"
                  value={formData.categoryID || ""}
                  onChange={onInputChange}
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
                  onChange={onInputChange}
                  placeholder={t("serviceEstimatedDurationPlaceholder")}
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
                  onChange={onInputChange}
                  placeholder={t("imageUrlPlaceholder")}
                />
              </FormGroup>
            </FormRow>

            <FormGroup>
              <Label>{t("description")} *</Label>
              <TextArea
                name="description"
                value={formData.description}
                onChange={onInputChange}
                placeholder={t("serviceDescriptionPlaceholder")}
                rows={3}
                required
              />
            </FormGroup>

            <FormGroup>
              <CheckboxLabel>
                <Switch
                  checked={formData.isActive}
                  onChange={(checked) =>
                    onInputChange({
                      target: {
                        name: "isActive",
                        type: "checkbox",
                        checked,
                      } as HTMLInputElement,
                    } as React.ChangeEvent<HTMLInputElement>)
                  }
                />
                <span>{t("active")}</span>
              </CheckboxLabel>
            </FormGroup>

            <ModalFooter>
              <CancelButton type="button" onClick={onClose}>
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
  );
};

export default ServiceModal;

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
