import { HiX, HiEye, HiEyeOff } from "react-icons/hi";
import { Switch } from "antd";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import type { IUser, IUserRequest } from "@/services/admin/userService";

type UserModalFormData = IUserRequest & {
  password?: string;
  confirmPassword?: string;
};

interface UserModalProps {
  isOpen: boolean;
  editingUser: IUser | null;
  formData: UserModalFormData;
  passwordError: string | null;
  confirmPasswordError: string | null;
  showPassword: boolean;
  showConfirmPassword: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => void;
  onPasswordBlur: () => void;
  onConfirmPasswordBlur: () => void;
  onTogglePassword: () => void;
  onToggleConfirmPassword: () => void;
}

const UserModal = ({
  isOpen,
  editingUser,
  formData,
  passwordError,
  confirmPasswordError,
  showPassword,
  showConfirmPassword,
  onClose,
  onSubmit,
  onInputChange,
  onPasswordBlur,
  onConfirmPasswordBlur,
  onTogglePassword,
  onToggleConfirmPassword,
}: UserModalProps) => {
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
            {editingUser ? t("updateUser") : t("createUser")}
          </ModalTitle>
          <CloseButton onClick={onClose}>
            <HiX size={24} />
          </CloseButton>
        </ModalHeader>

        <ModalBody>
          <Form onSubmit={onSubmit}>
            <FormRow>
              <FormGroup>
                <Label>
                  {t("fullName")} <Required>*</Required>
                </Label>
                <Input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={onInputChange}
                  placeholder={t("fullNamePlaceholder")}
                  required
                />
              </FormGroup>

              <FormGroup>
                <Label>
                  {t("username")} <Required>*</Required>
                </Label>
                <Input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={onInputChange}
                  placeholder={t("usernamePlaceholder")}
                  required
                />
              </FormGroup>
            </FormRow>

            <FormRow>
              <FormGroup>
                <Label>
                  {t("email")} <Required>*</Required>
                </Label>
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={onInputChange}
                  placeholder={t("emailPlaceholder")}
                  required
                />
              </FormGroup>

              <FormGroup>
                <Label>
                  {t("phoneNumber")} <Required>*</Required>
                </Label>
                <Input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={onInputChange}
                  placeholder={t("phonePlaceholder")}
                  required
                />
              </FormGroup>
            </FormRow>

            {!editingUser && (
              <FormRow>
                <FormGroup>
                  <Label>
                    {t("password")} <Required>*</Required>
                  </Label>
                  <PasswordInputWrapper $hasError={!!passwordError}>
                    <Input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password ?? ""}
                      onChange={onInputChange}
                      onBlur={onPasswordBlur}
                      placeholder={t("passwordPlaceholderRegister")}
                      $hasError={!!passwordError}
                      required
                    />
                    <EyeButton
                      type="button"
                      onClick={onTogglePassword}
                      aria-label={
                        showPassword ? t("hidePassword") : t("showPassword")
                      }
                    >
                      {showPassword ? (
                        <HiEyeOff size={20} />
                      ) : (
                        <HiEye size={20} />
                      )}
                    </EyeButton>
                  </PasswordInputWrapper>
                  {passwordError && <FieldError>{t(passwordError)}</FieldError>}
                  <FieldHint>{t("passwordStrongHint")}</FieldHint>
                </FormGroup>

                <FormGroup>
                  <Label>
                    {t("confirmPassword")} <Required>*</Required>
                  </Label>
                  <PasswordInputWrapper $hasError={!!confirmPasswordError}>
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword ?? ""}
                      onChange={onInputChange}
                      onBlur={onConfirmPasswordBlur}
                      placeholder={t("confirmPasswordPlaceholder")}
                      $hasError={!!confirmPasswordError}
                      required
                    />
                    <EyeButton
                      type="button"
                      onClick={onToggleConfirmPassword}
                      aria-label={
                        showConfirmPassword
                          ? t("hidePassword")
                          : t("showPassword")
                      }
                    >
                      {showConfirmPassword ? (
                        <HiEyeOff size={20} />
                      ) : (
                        <HiEye size={20} />
                      )}
                    </EyeButton>
                  </PasswordInputWrapper>
                  {confirmPasswordError && (
                    <FieldError>{t(confirmPasswordError)}</FieldError>
                  )}
                </FormGroup>
              </FormRow>
            )}

            <FormRow>
              <FormGroup>
                <Label>
                  {t("role")} <Required>*</Required>
                </Label>
                <Select
                  name="roleID"
                  value={formData.roleID}
                  onChange={onInputChange}
                  required
                >
                  <option value={1}>{t("admin")}</option>
                  <option value={2}>{t("serviceAdvisor")}</option>
                  <option value={3}>{t("technician")}</option>
                  <option value={4}>{t("customer")}</option>
                </Select>
              </FormGroup>

              <FormGroup>
                <Label>
                  {t("gender")} <Required>*</Required>
                </Label>
                <Select
                  name="gender"
                  value={formData.gender}
                  onChange={onInputChange}
                  required
                >
                  <option value="Male">{t("male")}</option>
                  <option value="Female">{t("female")}</option>
                  <option value="Other">{t("other")}</option>
                </Select>
              </FormGroup>
            </FormRow>

            <FormRow>
              <FormGroup>
                <Label>
                  {t("dateOfBirth")} <Required>*</Required>
                </Label>
                <Input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={onInputChange}
                  required
                />
              </FormGroup>

              <FormGroup>
                <Label>{t("userCode")}</Label>
                <Input
                  type="text"
                  name="userCode"
                  value={formData.userCode}
                  onChange={onInputChange}
                  placeholder={t("userCodePlaceholder")}
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

              <FormGroup>
                <CheckboxWrapper>
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
                  <Label>{t("activate")}</Label>
                </CheckboxWrapper>
              </FormGroup>
            </FormRow>

            <ModalFooter>
              <CancelButton type="button" onClick={onClose}>
                {t("cancel")}
              </CancelButton>
              <SubmitButton type="submit">
                {editingUser ? t("update") : t("create")}
              </SubmitButton>
            </ModalFooter>
          </Form>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default UserModal;

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
  padding: 1rem;

  @media (max-width: 1024px) {
    padding: 0.75rem;
    align-items: flex-start;
    overflow-y: auto;
  }
`;

const ModalOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
`;

const ModalContent = styled.div`
  position: relative;
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  @media (max-width: 1024px) {
    max-height: calc(100vh - 1.5rem);
    margin: auto 0;
  }
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;

  @media (max-width: 1024px) {
    padding: 1rem;
  }
`;

const ModalTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 700;
  color: #1a1d2e;
  margin: 0;

  @media (max-width: 1024px) {
    font-size: 1.125rem;
  }
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  color: #6b7590;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover {
    background: #f3f4f6;
    color: #1a1d2e;
  }
`;

const ModalBody = styled.div`
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;

  @media (max-width: 1024px) {
    padding: 1rem;
  }
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

  @media (max-width: 1024px) {
    gap: 0.875rem;
  }

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
  color: #1a1d2e;
  user-select: none;
`;

const Required = styled.span`
  color: #ef4444;
`;

const Input = styled.input<{ $hasError?: boolean }>`
  padding: 0.75rem;
  border: 1px solid ${(p) => (p.$hasError ? "#ef4444" : "#e5e7eb")};
  border-radius: 8px;
  font-size: 0.875rem;
  color: #000000 !important;
  background: white;
  transition: all 0.2s;
  -webkit-text-fill-color: #000000;

  &::placeholder {
    color: #9ca3bf;
  }

  &:focus {
    outline: none;
    border-color: ${(p) => (p.$hasError ? "#ef4444" : "#3b82f6")};
    box-shadow: 0 0 0 3px
      ${(p) =>
        p.$hasError ? "rgba(239, 68, 68, 0.1)" : "rgba(59, 130, 246, 0.1)"};
  }

  &[type="date"]::-webkit-calendar-picker-indicator {
    cursor: pointer;
  }

  &[type="date"] {
    color: #000000 !important;
    -webkit-text-fill-color: #000000;
  }
`;

const PasswordInputWrapper = styled.div<{ $hasError?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0;
  border: 1px solid ${(p) => (p.$hasError ? "#ef4444" : "#e5e7eb")};
  border-radius: 8px;
  background: white;
  overflow: hidden;

  input {
    border: none !important;
    flex: 1;
    min-width: 0;
  }
`;

const EyeButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem 0.75rem;
  color: #6b7590;
  display: flex;
  align-items: center;

  &:hover {
    color: #1a1d2e;
  }
`;

const FieldError = styled.span`
  font-size: 0.8rem;
  color: #ef4444;
  margin-top: 0.25rem;
`;

const FieldHint = styled.span`
  font-size: 0.75rem;
  color: #6b7590;
  margin-top: 0.25rem;
`;

const Select = styled.select`
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.875rem;
  color: #000000 !important;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  -webkit-text-fill-color: #000000;

  option {
    color: #000000;
    background: white;
  }

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const CheckboxWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1.75rem;
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
  margin-top: 1rem;
`;

const CancelButton = styled.button`
  padding: 0.75rem 1.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  color: #6b7590;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #f3f4f6;
    border-color: #d1d5db;
  }
`;

const SubmitButton = styled.button`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  background: #3b82f6;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #2563eb;
  }
`;
