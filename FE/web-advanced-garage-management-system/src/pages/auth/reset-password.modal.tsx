import { authService } from "@/apis/auth";
import { IconLock, IconKey, IconEye, IconEyeOff } from "@tabler/icons-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import styled from "styled-components";

interface ResetPasswordModalProps {
  email: string;
  onClose: () => void;
  onSuccess?: () => void;
}

const ResetPasswordModal = ({ email, onClose, onSuccess }: ResetPasswordModalProps) => {
  const { t } = useTranslation();
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otp.trim()) {
      toast.error(t("otpRequired"));
      return;
    }

    if (!newPassword.trim()) {
      toast.error(t("newPasswordRequired"));
      return;
    }

    if (newPassword.length < 6) {
      toast.error(t("passwordMinLength"));
      return;
    }

    if (!confirmNewPassword.trim()) {
      toast.error(t("confirmNewPasswordRequired"));
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast.error(t("newPasswordMismatch"));
      return;
    }

    setIsLoading(true);
    try {
      await authService.resetPassword({
        email,
        otp: otp.trim(),
        newPassword,
        confirmNewPassword,
      });
      toast.success(t("resetPasswordSuccess"));
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (error) {
      console.error("Reset password error:", error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || t("resetPasswordFailed"));
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

        <Title>{t("confirmOtpTitle")}</Title>
        <Subtitle>{t("confirmOtpSubtitle")}</Subtitle>
        <EmailText>{email}</EmailText>

        <Form onSubmit={handleSubmit}>
          <FieldGroup>
            <Label>{t("otpLabel")}</Label>
            <InputWrapper>
              <IconKey size={20} stroke={1.5} />
              <Input
                type="text"
                placeholder="000000"
                value={otp}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "");
                  if (value.length <= 6) {
                    setOtp(value);
                  }
                }}
                maxLength={6}
                disabled={isLoading}
              />
            </InputWrapper>
          </FieldGroup>

          <FieldGroup>
            <Label>{t("newPassword")}</Label>
            <InputWrapper>
              <IconLock size={20} stroke={1.5} />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder={t("newPasswordPlaceholder")}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isLoading}
              />
              <EyeButton
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <IconEyeOff size={20} stroke={1.5} />
                ) : (
                  <IconEye size={20} stroke={1.5} />
                )}
              </EyeButton>
            </InputWrapper>
          </FieldGroup>

          <FieldGroup>
            <Label>{t("confirmNewPassword")}</Label>
            <InputWrapper>
              <IconLock size={20} stroke={1.5} />
              <Input
                type={showConfirmPassword ? "text" : "password"}
                placeholder={t("confirmNewPasswordPlaceholder")}
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                disabled={isLoading}
              />
              <EyeButton
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? (
                  <IconEyeOff size={20} stroke={1.5} />
                ) : (
                  <IconEye size={20} stroke={1.5} />
                )}
              </EyeButton>
            </InputWrapper>
          </FieldGroup>

          <SubmitButton type="submit" disabled={isLoading}>
            {isLoading ? t("resetting") : t("resetPassword")}
          </SubmitButton>

          <BackButton type="button" onClick={onClose} disabled={isLoading}>
            {t("backButton")}
          </BackButton>
        </Form>
      </ModalCard>
    </Overlay>
  );
};

export default ResetPasswordModal;

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
  margin: 0 0 0.5rem;
`;

const EmailText = styled.p`
  font-size: 0.9rem;
  color: #007bff;
  text-align: center;
  font-weight: 600;
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

const EyeButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  color: #9ca3af;
  display: flex;
  align-items: center;

  &:hover {
    color: #6b7280;
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
