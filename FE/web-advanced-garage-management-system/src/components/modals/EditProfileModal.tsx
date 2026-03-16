import { userService } from "@/apis/user";
import useAuth from "@/hooks/useAuth";
import { IconX, IconUser } from "@tabler/icons-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import styled from "styled-components";

interface EditProfileModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

const EditProfileModal = ({ onClose, onSuccess }: EditProfileModalProps) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.fullName || "",
    phoneNumber: user?.msisdn || "",
    gender: user?.gender || "MALE",
    dateOfBirth: user?.dob || "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fullName.trim()) {
      toast.error(t("fullNameRequired"));
      return;
    }

    const payload = {
      fullName: formData.fullName,
      phoneNumber: formData.phoneNumber || undefined,
      gender: formData.gender || undefined,
      dateOfBirth: formData.dateOfBirth || undefined,
    };

    setLoading(true);
    try {
      const result = await userService.updateInfo(payload);
      console.log("Update profile success:", result);
      toast.success(t("updateProfileSuccess"));
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (error) {
      console.error("Update profile error:", error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || t("updateProfileFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Overlay onClick={onClose}>
      <ModalCard onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <HeaderLeft>
            <IconUser size={24} stroke={2} color="#007bff" />
            <ModalTitle>{t("editProfile")}</ModalTitle>
          </HeaderLeft>
          <CloseButton onClick={onClose}>
            <IconX size={24} />
          </CloseButton>
        </ModalHeader>

        <Form onSubmit={handleSubmit}>
          <FormGrid>
            <FormGroup>
              <Label>
                {t("fullName")} <Required>*</Required>
              </Label>
              <Input
                type="text"
                name="fullName"
                placeholder={t("fullNamePlaceholder")}
                value={formData.fullName}
                onChange={handleChange}
                autoComplete="off"
                required
              />
            </FormGroup>

            <FormGroup>
              <Label>{t("phoneNumber")}</Label>
              <Input
                type="tel"
                name="phoneNumber"
                placeholder={t("phoneNumberPlaceholder")}
                value={formData.phoneNumber}
                onChange={handleChange}
                autoComplete="off"
              />
            </FormGroup>

            <FormGroup>
              <Label>{t("gender")}</Label>
              <Select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
              >
                <option value="MALE">{t("male")}</option>
                <option value="FEMALE">{t("female")}</option>
              </Select>
            </FormGroup>

            <FormGroup>
              <Label>{t("dateOfBirth")}</Label>
              <Input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                autoComplete="off"
              />
            </FormGroup>
          </FormGrid>

          <ButtonGroup>
            <CancelButton type="button" onClick={onClose}>
              {t("cancel")}
            </CancelButton>
            <SubmitButton type="submit" disabled={loading}>
              {loading ? t("updating") : t("saveChanges")}
            </SubmitButton>
          </ButtonGroup>
        </Form>
      </ModalCard>
    </Overlay>
  );
};

export default EditProfileModal;

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
  max-width: 600px;
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
  grid-template-columns: 1fr;
  gap: 1.5rem;
  margin-bottom: 2rem;
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
