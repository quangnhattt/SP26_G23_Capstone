import { images } from "@/assets/imagesAsset";
import { authService } from "@/apis/auth";
import { ROUTER_PAGE } from "@/routes/contants";
import {
  IconMail,
  IconLock,
  IconUser,
  IconPhone,
  IconEye,
  IconEyeOff,
  IconShieldCheck,
  IconArrowRight,
} from "@tabler/icons-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import styled from "styled-components";

interface RegisterModalProps {
  onClose?: () => void;
  onSwitchToLogin?: () => void;
}

const RegisterModal = ({ onClose, onSwitchToLogin }: RegisterModalProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"login" | "register">("register");
  const [currentStep, setCurrentStep] = useState<"register" | "otp">("register");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isVerifyingOTP, setIsVerifyingOTP] = useState(false);


  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      navigate(ROUTER_PAGE.home);
    }
  };

  const handleSwitchToLogin = () => {
    if (onSwitchToLogin) {
      onSwitchToLogin();
    } else {
      setActiveTab("login");
      navigate(ROUTER_PAGE.auth.login);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      toast.error(t("fullNameRequired"));
      return;
    }
    if (!email.trim()) {
      toast.error(t("emailRequired"));
      return;
    }
    if (!phoneNumber.trim()) {
      toast.error(t("phoneRequired"));
      return;
    }
    if (!password.trim()) {
      toast.error(t("passwordRequired"));
      return;
    }
    if (password.length < 6) {
      toast.error(t("passwordMinLength"));
      return;
    }
    if (!confirmPassword.trim()) {
      toast.error(t("confirmPasswordRequired"));
      return;
    }
    if (password !== confirmPassword) {
      toast.error(t("passwordMismatch"));
      return;
    }
    if (!agreeTerms) {
      toast.error(t("agreeTermsRequired"));
      return;
    }

    setIsSubmitting(true);
    try {
      await authService.register({
        fullName: fullName.trim(),
        email: email.trim(),
        phoneNumber: phoneNumber.trim(),
        password,
        confirmPassword,
      });
      toast.success(t("registerSuccess"));
      setCurrentStep("otp");
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string; Message?: string } };
      };
      const message =
        err?.response?.data?.message ??
        err?.response?.data?.Message ??
        "Đăng ký thất bại";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOTPChange = (index: number, value: string) => {
    
    if (value.length > 1) {
      if (value.length === 6 && /^\d{6}$/.test(value)) {
        const newOtp = value.split("");
        setOtp(newOtp);
        const lastInput = document.getElementById(`otp-5`);
        lastInput?.focus();
        return;
      }
      value = value.slice(-1);
    }
    
    if (value !== "" && !/^\d$/.test(value)) {
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value !== "" && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOTPKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0) {
        const prevInput = document.getElementById(`otp-${index - 1}`);
        prevInput?.focus();
      }
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpValue = otp.join("");
    if (otpValue.length !== 6) {
      toast.error(t("otpRequired"));
      return;
    }

    setIsVerifyingOTP(true);
    try {
      await authService.verifyOTP({
        email: email.trim(),
        otp: otpValue,
      });
      toast.success(t("otpVerifySuccess"));
      if (onSwitchToLogin) {
        onSwitchToLogin();
      } else {
        navigate(ROUTER_PAGE.auth.login, { replace: true });
      }
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string; Message?: string } };
      };
      const message =
        err?.response?.data?.message ??
        err?.response?.data?.Message ??
        t("otpVerifyFailed");
      toast.error(message);
    } finally {
      setIsVerifyingOTP(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      await authService.register({
        fullName: fullName.trim(),
        email: email.trim(),
        phoneNumber: phoneNumber.trim(),
        password,
        confirmPassword,
      });
      toast.success(t("otpResendSuccess"));
      setOtp(["", "", "", "", "", ""]);
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string; Message?: string } };
      };
      const message =
        err?.response?.data?.message ??
        err?.response?.data?.Message ??
        t("otpResendFailed");
      toast.error(message);
    }
  };

  return (
    <Overlay onClick={handleClose}>
      <ModalCard onClick={(e) => e.stopPropagation()}>
        {currentStep === "otp" && (
          <BackHeaderButton
            onClick={() => setCurrentStep("register")}
            aria-label="Back"
          >
            ← {t("backButton")}
          </BackHeaderButton>
        )}
        
        <CloseButton onClick={handleClose} aria-label="Close">
          ×
        </CloseButton>

        {currentStep === "register" ? (
          <>
            <IconWrapper>
              <img
                style={{ height: 75, width: 75 }}
                src={images.logo_app}
                alt="Logo"
              />
            </IconWrapper>
            <Title>{t("createAccount")}</Title>
            <Subtitle>{t("registerSubtitle")}</Subtitle>

            <TabGroup>
              <Tab $active={activeTab === "login"} onClick={handleSwitchToLogin}>
                {t("login")}
              </Tab>
              <Tab $active={activeTab === "register"}>{t("register")}</Tab>
            </TabGroup>

            <Form onSubmit={handleSubmit}>
              <FieldGroup>
                <Label>{t("fullName")}</Label>
                <InputWrapper>
                  <IconUser size={20} stroke={1.5} />
                  <Input
                    type="text"
                    placeholder={t("fullNamePlaceholder")}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    autoComplete="name"
                  />
                </InputWrapper>
              </FieldGroup>

              <Row2>
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
                  <Label>{t("phoneNumber")}</Label>
                  <InputWrapper>
                    <IconPhone size={20} stroke={1.5} />
                    <Input
                      type="tel"
                      placeholder={t("phoneNumberPlaceholder")}
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      autoComplete="tel"
                    />
                  </InputWrapper>
                </FieldGroup>
              </Row2>

              <FieldGroup>
                <Label>{t("password")}</Label>
                <InputWrapper>
                  <IconLock size={20} stroke={1.5} />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder={t("passwordPlaceholderRegister")}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
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
                <Label>{t("confirmPassword")}</Label>
                <InputWrapper>
                  <IconLock size={20} stroke={1.5} />
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder={t("confirmPasswordPlaceholder")}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                  <EyeButton
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={
                      showConfirmPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showConfirmPassword ? (
                      <IconEyeOff size={20} stroke={1.5} />
                    ) : (
                      <IconEye size={20} stroke={1.5} />
                    )}
                  </EyeButton>
                </InputWrapper>
              </FieldGroup>

              <CheckboxRow>
                <Checkbox
                  type="checkbox"
                  id="agreeTerms"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                />
                <CheckboxLabel htmlFor="agreeTerms">
                  {t("agreeTerms")}{" "}
                  <TermsLink href="#" onClick={(e) => e.preventDefault()}>
                    {t("termsOfService")}
                  </TermsLink>{" "}
                  {t("and")}{" "}
                  <TermsLink href="#" onClick={(e) => e.preventDefault()}>
                    {t("privacyPolicy")}
                  </TermsLink>
                </CheckboxLabel>
              </CheckboxRow>

              <SubmitButton type="submit" disabled={isSubmitting}>
                {t("createAccountButton")}
              </SubmitButton>
            </Form>
          </>
        ) : (
          <>
            <OTPIconWrapper>
              <IconShieldCheck size={48} stroke={1.5} />
            </OTPIconWrapper>

            <Title>{t("otpTitle")}</Title>
            <OTPSubtitle>
              {t("otpSubtitle")} <EmailHighlight>{email}</EmailHighlight>
            </OTPSubtitle>

            <Form onSubmit={handleVerifyOTP}>
              <OTPLabel>{t("otpLabel")}</OTPLabel>
              <OTPContainer>
                {otp.map((digit, index) => (
                  <OTPInput
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => {
                      handleOTPChange(index, e.target.value);
                    }}
                    onInput={() => {
                    }}
                    onKeyDown={(e) => handleOTPKeyDown(index, e)}
                    autoFocus={index === 0}
                    autoComplete="off"
                  />
                ))}
              </OTPContainer>

              <ResendWrapper>
                {t("didntReceiveCode")}{" "}
                <ResendLink onClick={handleResendOTP}>
                  {t("resendCode")}
                </ResendLink>
              </ResendWrapper>

              <SubmitButton type="submit" disabled={isVerifyingOTP}>
                {t("verifyButton")}
                <IconArrowRight size={20} stroke={2} />
              </SubmitButton>
            </Form>
          </>
        )}
      </ModalCard>
    </Overlay>
  );
};

export default RegisterModal;

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
  max-width: 600px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  max-height: 90vh;
  overflow-y: auto;
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

const BackHeaderButton = styled.button`
  position: absolute;
  top: 1rem;
  left: 1rem;
  background: none;
  border: none;
  font-size: 0.9rem;
  color: #6b7280;
  cursor: pointer;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-weight: 500;

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

const Row2 = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
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
  background: #f9fafb;
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
  background: transparent;
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
  align-items: flex-start;
  gap: 0.5rem;
`;

const Checkbox = styled.input`
  width: 18px;
  height: 18px;
  margin-top: 2px;
  accent-color: #007bff;
  cursor: pointer;
  flex-shrink: 0;
`;

const CheckboxLabel = styled.label`
  font-size: 0.9rem;
  color: #6b7280;
  cursor: pointer;
  line-height: 1.4;
`;

const TermsLink = styled.a`
  color: #007bff;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
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

const OTPIconWrapper = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #e3f2fd;
  color: #007bff;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
`;

const OTPSubtitle = styled.p`
  font-size: 0.9rem;
  color: #6b7280;
  text-align: center;
  margin: 0 0 2rem;
  line-height: 1.5;
`;

const EmailHighlight = styled.span`
  color: #007bff;
  font-weight: 500;
`;

const OTPLabel = styled.label`
  font-size: 0.9rem;
  font-weight: 500;
  color: #374151;
  text-align: center;
  display: block;
  margin-bottom: 1rem;
`;

const OTPContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  margin-bottom: 1.5rem;
`;

const OTPInput = styled.input`
  width: 48px;
  height: 48px;
  text-align: center;
  font-size: 1.25rem;
  font-weight: 600;
  color: #000000 !important;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  outline: none;
  transition: all 0.2s;
  background: #ffffff;
  -webkit-appearance: none;
  -moz-appearance: textfield;

  &:focus {
    border-color: #007bff;
    box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
  }

  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  
  &::placeholder {
    color: #9ca3af;
  }
`;

const ResendWrapper = styled.div`
  text-align: center;
  font-size: 0.9rem;
  color: #6b7280;
  margin-bottom: 1.5rem;
`;

const ResendLink = styled.button`
  background: none;
  border: none;
  color: #007bff;
  font-weight: 500;
  cursor: pointer;
  padding: 0;
  font-size: 0.9rem;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;
