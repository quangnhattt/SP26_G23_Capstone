import { userService } from "@/apis/user";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import { IconX, IconLock } from "@tabler/icons-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import styled from "styled-components";

interface ChangePasswordModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

const ChangePasswordModal = ({ onClose, onSuccess }: ChangePasswordModalProps) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.currentPassword) {
      toast.error(t("currentPasswordRequired"));
      return;
    }

    if (formData.newPassword.length < 6) {
      toast.error(t("passwordMinLengthStrong"));
      return;
    }

    if (formData.newPassword !== formData.confirmNewPassword) {
      toast.error(t("newPasswordMismatch"));
      return;
    }

    setLoading(true);
    try {
      await userService.changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
        confirmNewPassword: formData.confirmNewPassword,
      });
      toast.success(t("changePasswordSuccess"));
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("changePasswordFailed")));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Overlay onClick={onClose}>
      <ModalCard onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <HeaderLeft>
            <IconLock size={24} stroke={2} color="#007bff" />
            <ModalTitle>{t("changePassword")}</ModalTitle>
          </HeaderLeft>
          <CloseButton onClick={onClose}>
            <IconX size={24} />
          </CloseButton>
        </ModalHeader>

        <Form onSubmit={handleSubmit}>
          <FormGrid>
            <FormGroup>
              <Label>{t("currentPassword")} <Required>*</Required></Label>
              <Input
                type="password"
                name="currentPassword"
                placeholder={t("currentPasswordPlaceholder")}
                value={formData.currentPassword}
                onChange={handleChange}
                required
              />
            </FormGroup>

            <FormGroup>
              <Label>{t("newPassword")} <Required>*</Required></Label>
              <Input
                type="password"
                name="newPassword"
                placeholder={t("newPasswordPlaceholder")}
                value={formData.newPassword}
                onChange={handleChange}
                required
              />
              <Hint>{t("passwordStrongHint")}</Hint>
            </FormGroup>

            <FormGroup>
              <Label>{t("confirmNewPassword")} <Required>*</Required></Label>
              <Input
                type="password"
                name="confirmNewPassword"
                placeholder={t("confirmNewPasswordPlaceholder")}
                value={formData.confirmNewPassword}
                onChange={handleChange}
                required
              />
            </FormGroup>
          </FormGrid>

          <ButtonGroup>
            <CancelButton type="button" onClick={onClose}>
              {t("cancel")}
            </CancelButton>
            <SubmitButton type="submit" disabled={loading}>
              {loading ? t("processing") : t("saveChanges")}
            </SubmitButton>
          </ButtonGroup>
        </Form>
      </ModalCard>
    </Overlay>
  );
};

export default ChangePasswordModal;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
`;

const ModalCard = styled.div`
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #e9ecef;
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
  border-radius: 8px;
  transition: all 0.2s;
  &:hover { background: #f3f4f6; color: #333; }
`;

const Form = styled.form`
  padding: 2rem;
`;

const FormGrid = styled.div`
  display: flex;
  flex-direction: column;
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
  transition: all 0.2s;
  &:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
  }
`;

const Hint = styled.p`
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding-top: 1rem;
  border-top: 1px solid #e9ecef;
`;

const CancelButton = styled.button`
  padding: 0.75rem 2rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  color: #6b7280;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  &:hover { background: #f9fafb; border-color: #d1d5db; }
`;

const SubmitButton = styled.button`
  padding: 0.75rem 2rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  &:hover:not(:disabled) { background: #0069d9; }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
`;
