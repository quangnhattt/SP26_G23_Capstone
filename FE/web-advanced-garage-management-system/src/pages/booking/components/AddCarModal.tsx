import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import styled from "styled-components";
import { FaTimes } from "react-icons/fa";
import { createCar } from "@/apis/cars";
import type { ICreateCarPayload } from "@/apis/cars/types";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";

interface AddCarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCarAdded: () => void;
}

export const AddCarModal = ({ isOpen, onClose, onCarAdded }: AddCarModalProps) => {
  const { t } = useTranslation();
  const [isAddingCar, setIsAddingCar] = useState(false);
  const [newCarData, setNewCarData] = useState<ICreateCarPayload>({
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

  const handleAddCar = async () => {
    if (!newCarData.licensePlate || !newCarData.brand || !newCarData.model) {
      toast.warn(t("licensePlateRequired"));
      return;
    }

    try {
      setIsAddingCar(true);
      await createCar(newCarData);
      toast.success(t("addCarSuccess"));
      setNewCarData({
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
      onCarAdded();
      onClose();
    } catch (error) {
      console.error("Error adding car:", error);
      toast.error(getApiErrorMessage(error, t("addCarFailed")));
    } finally {
      setIsAddingCar(false);
    }
  };

  const handleClose = () => {
    setNewCarData({
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
    onClose();
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={handleClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>{t("addNewVehicle")}</ModalTitle>
          <CloseButton onClick={handleClose}>
            <FaTimes size={20} />
          </CloseButton>
        </ModalHeader>

        <ModalBody>
          <FormRow>
            <FormGroup>
              <Label>
                {t("licensePlate")} <Required>*</Required>
              </Label>
              <Input
                type="text"
                placeholder={t("licensePlatePlaceholder")}
                value={newCarData.licensePlate}
                onChange={(e) =>
                  setNewCarData((prev) => ({ ...prev, licensePlate: e.target.value }))
                }
              />
            </FormGroup>
          </FormRow>

          <FormRow>
            <FormGroup>
              <Label>
                {t("brand")} <Required>*</Required>
              </Label>
              <Input
                type="text"
                placeholder={t("brandPlaceholder")}
                value={newCarData.brand}
                onChange={(e) =>
                  setNewCarData((prev) => ({ ...prev, brand: e.target.value }))
                }
              />
            </FormGroup>

            <FormGroup>
              <Label>
                {t("model")} <Required>*</Required>
              </Label>
              <Input
                type="text"
                placeholder={t("modelPlaceholder")}
                value={newCarData.model}
                onChange={(e) =>
                  setNewCarData((prev) => ({ ...prev, model: e.target.value }))
                }
              />
            </FormGroup>
          </FormRow>

          <FormRow>
            <FormGroup>
              <Label>{t("year")}</Label>
              <Input
                type="number"
                value={newCarData.year}
                onChange={(e) =>
                  setNewCarData((prev) => ({ ...prev, year: parseInt(e.target.value) }))
                }
              />
            </FormGroup>

            <FormGroup>
              <Label>{t("color")}</Label>
              <Input
                type="text"
                placeholder={t("colorPlaceholder")}
                value={newCarData.color}
                onChange={(e) =>
                  setNewCarData((prev) => ({ ...prev, color: e.target.value }))
                }
              />
            </FormGroup>
          </FormRow>

          <FormRow>
            <FormGroup>
              <Label>{t("engineNumber")}</Label>
              <Input
                type="text"
                placeholder={t("engineNumberPlaceholder")}
                value={newCarData.engineNumber}
                onChange={(e) =>
                  setNewCarData((prev) => ({ ...prev, engineNumber: e.target.value }))
                }
              />
            </FormGroup>

            <FormGroup>
              <Label>{t("chassisNumber")}</Label>
              <Input
                type="text"
                placeholder={t("chassisNumberPlaceholder")}
                value={newCarData.chassisNumber}
                onChange={(e) =>
                  setNewCarData((prev) => ({ ...prev, chassisNumber: e.target.value }))
                }
              />
            </FormGroup>
          </FormRow>

          <FormRow>
            <FormGroup>
              <Label>{t("purchaseDate")}</Label>
              <Input
                type="date"
                value={newCarData.purchaseDate}
                onChange={(e) =>
                  setNewCarData((prev) => ({ ...prev, purchaseDate: e.target.value }))
                }
              />
            </FormGroup>

            <FormGroup>
              <Label>{t("currentOdometer")}</Label>
              <Input
                type="number"
                placeholder={t("currentOdometerPlaceholder")}
                value={newCarData.currentOdometer}
                onChange={(e) =>
                  setNewCarData((prev) => ({
                    ...prev,
                    currentOdometer: parseInt(e.target.value) || 0,
                  }))
                }
              />
            </FormGroup>
          </FormRow>
        </ModalBody>

        <ModalFooter>
          <CancelButton onClick={handleClose}>{t("cancel")}</CancelButton>
          <AddButton onClick={handleAddCar} disabled={isAddingCar}>
            {isAddingCar ? t("adding") : t("addVehicle")}
          </AddButton>
        </ModalFooter>
      </ModalContent>
    </ModalOverlay>
  );
};

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 720px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #e5e7eb;
`;

const ModalTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  border-radius: 6px;
  transition: all 0.2s;

  &:hover {
    background: #f3f4f6;
    color: #111827;
  }
`;

const ModalBody = styled.div`
  padding: 1.5rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
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
  font-size: 0.9375rem;
  font-weight: 600;
  color: #111827;
`;

const Required = styled.span`
  color: #dc2626;
`;

const Input = styled.input`
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.9375rem;
  color: #111827 !important;
  background: white;
  -webkit-text-fill-color: #111827 !important;

  &:focus {
    outline: none;
    border-color: #1d4ed8;
    box-shadow: 0 0 0 3px rgba(29, 78, 216, 0.1);
  }

  &::placeholder {
    color: #9ca3af;
    -webkit-text-fill-color: #9ca3af;
  }

  &:-webkit-autofill,
  &:-webkit-autofill:hover,
  &:-webkit-autofill:focus {
    -webkit-text-fill-color: #111827 !important;
    -webkit-box-shadow: 0 0 0 1000px white inset !important;
    transition: background-color 5000s ease-in-out 0s;
  }

  &:disabled {
    background: #f3f4f6;
    color: #9ca3af !important;
    -webkit-text-fill-color: #9ca3af !important;
    cursor: not-allowed;
    opacity: 0.7;
  }
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem 2rem;
  border-top: 1px solid #e5e7eb;
`;

const CancelButton = styled.button`
  padding: 0.75rem 1.5rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: white;
  color: #374151;
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #9ca3af;
    background: #f9fafb;
  }
`;

const AddButton = styled.button`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  background: #1d4ed8;
  color: white;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #1e40af;
  }

  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }
`;
