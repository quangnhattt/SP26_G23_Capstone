import { authService } from "@/apis/auth";
import { IconMail, IconKey } from "@tabler/icons-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import styled from "styled-components";

interface ForgotPasswordModalProps {
  onClose: () => void;
  onSuccess?: (email: string) => void;
}

const ForgotPasswordModal = ({ onClose, onSuccess }: ForgotPasswordModalProps) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error(t("emailRequired"));
      return;
    }

    setIsLoading(true);
    try {
      await authService.forgotPassword({ email: email.trim() });
      toast.success(t("forgotPasswordSuccess"));
      if (onSuccess) {
        onSuccess(email.trim());
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || t("forgotPasswordFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Overlay onClick={onClose}>
      <ModalCard onClick={(e) => e.stopPropagation()}>
        <CloseButton onClick={onClose} aria-label="Close">
          ×
        </CloseButton>

        <IconWrapper>
          <IconKey size={40} stroke={1.5} color="#007bff" />
        </IconWrapper>

        <Title>{t("forgotPasswordTitle")}</Title>
        <Subtitle>{t("forgotPasswordSubtitle")}</Subtitle>

        <Form onSubmit={handleSubmit}>
          <FieldGroup>
            <Label>{t("email")}</Label>
            <InputWrapper>
              <IconMail size={20} stroke={1.5} />
              <Input
                type="email"
                placeholder={t("emailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                disabled={isLoading}
              />
            </InputWrapper>
          </FieldGroup>

          <SubmitButton type="submit" disabled={isLoading}>
            {isLoading ? t("sending") : t("sendVerificationCode")}
          </SubmitButton>

          <BackButton type="button" onClick={onClose} disabled={isLoading}>
            {t("backButton")}
          </BackButton>
        </Form>
      </ModalCard>
    </Overlay>
  );
};

export default ForgotPasswordModal;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
  padding: 1rem;
`;

const ModalCard = styled.div`
  position: relative;
  background: #ffffff;
  border-radius: 16px;
  padding: 2rem 2.5rem;
  max-width: 420px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #9ca3af;
  cursor: pointer;
  padding: 0.25rem;
  line-height: 1;

  &:hover {
    color: #333;
  }
`;

const IconWrapper = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #e3f2fd;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
`;

const Title = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: #333;
  text-align: center;
  margin: 0 0 0.5rem;
`;

const Subtitle = styled.p`
  font-size: 0.9rem;
  color: #6b7280;
  text-align: center;
  margin: 0 0 1.5rem;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-size: 0.9rem;
  font-weight: 500;
  color: #374151;
`;

const InputWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;

  svg {
    color: #9ca3af;
    flex-shrink: 0;
  }
`;

const Input = styled.input`
  flex: 1;
  border: none;
  outline: none;
  font-size: 1rem;
  color: #000000 !important;

  &::placeholder {
    color: #9ca3af;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const SubmitButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.875rem 1.5rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;

  &:hover:not(:disabled) {
    background: #0069d9;
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const BackButton = styled.button`
  width: 100%;
  padding: 0.75rem 1.5rem;
  background: transparent;
  color: #6b7280;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #f3f4f6;
    border-color: #d1d5db;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;
