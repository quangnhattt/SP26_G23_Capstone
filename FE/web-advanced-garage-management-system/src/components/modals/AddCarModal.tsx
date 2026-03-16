import { carService } from "@/apis/cars";
import type { ICreateCarPayload } from "@/apis/cars/types";
import { IconX, IconCar } from "@tabler/icons-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import styled from "styled-components";

interface AddCarModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

const AddCarModal = ({ onClose, onSuccess }: AddCarModalProps) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ICreateCarPayload>({
    licensePlate: "",
    brand: "",
    model: "",
    year: new Date().getFullYear(),
    color: "",
    engineNumber: "",
    chassisNumber: "",
    purchaseDate: new Date().toISOString().split("T")[0],
    currentOdometer: 0,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "year" || name === "currentOdometer"
          ? parseInt(value) || 0
          : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.licensePlate.trim()) {
      toast.error(t("licensePlateRequired"));
      return;
    }
    if (!formData.brand.trim()) {
      toast.error(t("brandRequired"));
      return;
    }
    if (!formData.model.trim()) {
      toast.error(t("modelRequired"));
      return;
    }

    setLoading(true);
    try {
      await carService.createCar(formData);
      toast.success(t("addCarSuccess"));
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || t("addCarFailed"));
    } finally {
      setLoading(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 50 }, (_, i) => currentYear - i);

  return (
    <Overlay onClick={onClose}>
      <ModalCard onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <HeaderLeft>
            <IconCar size={24} stroke={2} color="#007bff" />
            <ModalTitle>{t("addNewVehicle")}</ModalTitle>
          </HeaderLeft>
          <CloseButton onClick={onClose}>
            <IconX size={24} />
          </CloseButton>
        </ModalHeader>

        <Form onSubmit={handleSubmit}>
          <FormGrid>
            <FormGroup>
              <Label>
                {t("licensePlate")} <Required>*</Required>
              </Label>
              <Input
                type="text"
                name="licensePlate"
                placeholder={t("licensePlatePlaceholder")}
                value={formData.licensePlate}
                onChange={handleChange}
                autoComplete="off"
                required
              />
            </FormGroup>

            <FormGroup>
              <Label>
                {t("brand")} <Required>*</Required>
              </Label>
              <Input
                type="text"
                name="brand"
                placeholder={t("brandPlaceholder")}
                value={formData.brand}
                onChange={handleChange}
                autoComplete="off"
                required
              />
            </FormGroup>

            <FormGroup>
              <Label>
                {t("model")} <Required>*</Required>
              </Label>
              <Input
                type="text"
                name="model"
                placeholder={t("modelPlaceholder")}
                value={formData.model}
                onChange={handleChange}
                autoComplete="off"
                required
              />
            </FormGroup>

            <FormGroup>
              <Label>{t("year")}</Label>
              <Select name="year" value={formData.year} onChange={handleChange}>
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </Select>
            </FormGroup>

            <FormGroup>
              <Label>{t("color")}</Label>
              <Input
                type="text"
                name="color"
                placeholder={t("colorPlaceholder")}
                value={formData.color}
                onChange={handleChange}
                autoComplete="off"
              />
            </FormGroup>

            <FormGroup>
              <Label>{t("engineNumber")}</Label>
              <Input
                type="text"
                name="engineNumber"
                placeholder={t("engineNumberPlaceholder")}
                value={formData.engineNumber}
                onChange={handleChange}
                autoComplete="off"
              />
            </FormGroup>

            <FormGroup>
              <Label>{t("chassisNumber")}</Label>
              <Input
                type="text"
                name="chassisNumber"
                placeholder={t("chassisNumberPlaceholder")}
                value={formData.chassisNumber}
                onChange={handleChange}
                autoComplete="off"
              />
            </FormGroup>

            <FormGroup>
              <Label>{t("purchaseDate")}</Label>
              <Input
                type="date"
                name="purchaseDate"
                value={formData.purchaseDate}
                onChange={handleChange}
                autoComplete="off"
              />
            </FormGroup>

            <FormGroup>
              <Label>{t("currentOdometer")}</Label>
              <Input
                type="number"
                name="currentOdometer"
                placeholder={t("currentOdometerPlaceholder")}
                value={formData.currentOdometer}
                onChange={handleChange}
                autoComplete="off"
                min="0"
              />
            </FormGroup>
          </FormGrid>

          <ButtonGroup>
            <CancelButton type="button" onClick={onClose}>
              {t("cancel")}
            </CancelButton>
            <SubmitButton type="submit" disabled={loading}>
              {loading ? t("adding") : t("addVehicle")}
            </SubmitButton>
          </ButtonGroup>
        </Form>
      </ModalCard>
    </Overlay>
  );
};

export default AddCarModal;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
  overflow-y: auto;
`;

const ModalCard = styled.div`
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  margin: auto;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #e9ecef;
  position: sticky;
  top: 0;
  background: white;
  z-index: 1;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const ModalTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: #333;
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.2s;

  &:hover {
    background: #f3f4f6;
    color: #333;
  }
`;

const Form = styled.form`
  padding: 2rem;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;

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
  font-size: 0.9rem;
  font-weight: 600;
  color: #374151;
`;

const Required = styled.span`
  color: #dc3545;
`;

const Input = styled.input`
  padding: 0.75rem 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  color: #1f2937 !important;
  background-color: #ffffff !important;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
  }

  &::placeholder {
    color: #9ca3af;
  }

  &:disabled {
    background-color: #f3f4f6 !important;
    color: #6b7280 !important;
    cursor: not-allowed;
  }

  /* Override browser autofill styling */
  &:-webkit-autofill,
  &:-webkit-autofill:hover,
  &:-webkit-autofill:focus,
  &:-webkit-autofill:active {
    -webkit-box-shadow: 0 0 0 30px white inset !important;
    -webkit-text-fill-color: #1f2937 !important;
    box-shadow: 0 0 0 30px white inset !important;
  }
`;

const Select = styled.select`
  padding: 0.75rem 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  color: #1f2937 !important;
  background-color: #ffffff !important;
  cursor: pointer;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
  }

  &:disabled {
    background-color: #f3f4f6 !important;
    color: #6b7280 !important;
    cursor: not-allowed;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding-top: 1rem;
  border-top: 1px solid #e9ecef;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const CancelButton = styled.button`
  padding: 0.75rem 2rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  color: #6b7280;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #d1d5db;
    background: #f9fafb;
  }
`;

const SubmitButton = styled.button`
  padding: 0.75rem 2rem;
  border: none;
  border-radius: 8px;
  background: #007bff;
  color: white;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #0069d9;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;
