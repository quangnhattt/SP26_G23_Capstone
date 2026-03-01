import { images } from "@/assets/imagesAsset";
import useAuth from "@/hooks/useAuth";
import { ROUTER_PAGE } from "@/routes/contants";
import {
  IconMail,
  IconLock,
  IconEye,
  IconEyeOff,
} from "@tabler/icons-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import styled from "styled-components";

interface LoginModalProps {
  onClose?: () => void;
  onSwitchToRegister?: () => void;
}

const LoginModal = ({ onClose, onSwitchToRegister }: LoginModalProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { loginWithEmail } = useAuth();
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      navigate(ROUTER_PAGE.home);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error(t("emailRequired"));
      return;
    }
    if (!password.trim()) {
      toast.error(t("passwordRequired"));
      return;
    }
    loginWithEmail({ email: email.trim(), password });
  };

  const handleSwitchToRegister = () => {
    if (onSwitchToRegister) {
      onSwitchToRegister();
    } else {
      setActiveTab("register");
      navigate(ROUTER_PAGE.auth.register);
    }
  };

  const handleForgotPassword = () => {
    navigate(ROUTER_PAGE.auth.forgotPassword);
  };

  return (
    <Overlay onClick={handleClose}>
      <ModalCard onClick={(e) => e.stopPropagation()}>
        <CloseButton onClick={handleClose} aria-label="Close">
          ×
        </CloseButton>

        <IconWrapper>
          <img
            style={{ height: 75, width: 75}}
            src={images.logo_app}
            alt="Logo"
          />
        </IconWrapper>

        <Title>{t("welcomeBack")}</Title>
        <Subtitle>{t("loginSubtitle")}</Subtitle>

        <TabGroup>
          <Tab $active={activeTab === "login"}>{t("login")}</Tab>
          <Tab
            $active={activeTab === "register"}
            onClick={handleSwitchToRegister}
          >
            {t("register")}
          </Tab>
        </TabGroup>

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
              />
            </InputWrapper>
          </FieldGroup>

          <FieldGroup>
            <LabelRow>
              <Label>{t("password")}</Label>
              
            </LabelRow>
            <InputWrapper>
              <IconLock size={20} stroke={1.5} />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder={t("passwordPlaceholder")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
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
            <ForgotButton type="button" onClick={handleForgotPassword}>
                {t("forgotPassword")}
              </ForgotButton>
          </FieldGroup>

          <CheckboxRow>
            <Checkbox
              type="checkbox"
              id="remember"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <CheckboxLabel htmlFor="remember">
              {t("rememberLogin")}
            </CheckboxLabel>
          </CheckboxRow>

          <SubmitButton type="submit">
            {t("login")}
          </SubmitButton>
        </Form>

      </ModalCard>
    </Overlay>
  );
};

export default LoginModal;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
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
  width: 56px;
  height: 56px;
  border-radius: 12px;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
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

const TabGroup = styled.div`
  display: flex;
  background: #f3f4f6;
  border-radius: 10px;
  padding: 4px;
  margin-bottom: 1.5rem;
`;

const Tab = styled.button<{ $active?: boolean }>`
  flex: 1;
  padding: 0.6rem 1rem;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  background: ${({ $active }) => ($active ? "#ffffff" : "transparent")};
  color: ${({ $active }) => ($active ? "#333" : "#6b7280")};
  box-shadow: ${({ $active }) =>
    $active ? "0 1px 3px rgba(0,0,0,0.08)" : "none"};
  transition: all 0.2s;
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

const LabelRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Label = styled.label`
  font-size: 0.9rem;
  font-weight: 500;
  color: #374151;
`;

const ForgotButton = styled.button`
  font-size: 0.85rem;
  color: #007bff;
  background: none;
  border: none;
  cursor: pointer;
  font-family: inherit;
  padding: 0;
  margin-left: auto;

  &:hover {
    text-decoration: underline;
  }
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

const CheckboxRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Checkbox = styled.input`
  width: 18px;
  height: 18px;
  accent-color: #007bff;
  cursor: pointer;
`;

const CheckboxLabel = styled.label`
  font-size: 0.9rem;
  color: #6b7280;
  cursor: pointer;
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
