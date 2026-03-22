import styled from "styled-components";
import { HiSearch, HiPlus, HiX, HiPencil, HiTrash, HiEye, HiEyeOff } from "react-icons/hi";
import { useEffect, useState } from "react";
import { userService, type IUser, type IUserRequest } from "@/services/admin/userService";
import { validateStrongPassword } from "@/utils/validation";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { AxiosError } from "axios";

const UserPage = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<IUser | null>(null);
  const [formData, setFormData] = useState<IUserRequest & { password?: string; confirmPassword?: string }>({
    userCode: "",
    fullName: "",
    username: "",
    email: "",
    phone: "",
    gender: "Male",
    dateOfBirth: "",
    image: "",
    roleID: 2,
    isActive: true,
  });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const getApiErrorMessage = (error: unknown): string => {
    const err = error as AxiosError<{
      message?: string;
      Message?: string;
      errors?: Record<string, string[]>;
      title?: string;
    }>;

    const data = err.response?.data;

    if (data?.message) return data.message;
    if (data?.Message) return data.Message;

    const firstValidationError = data?.errors
      ? Object.values(data.errors).flat().find(Boolean)
      : undefined;

    if (firstValidationError && typeof firstValidationError === 'string') return firstValidationError;
    if (data?.title) return data.title;

    return t("errorOccurred");
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.getUsers();
      setUsers(data);
      setError(null);
    } catch (err) {
      setError(t("cannotLoadUsers"));
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingUser(null);
    setFormData({
      userCode: "",
      fullName: "",
      username: "",
      email: "",
      phone: "",
      gender: "Male",
      dateOfBirth: "",
      image: "",
      roleID: 2,
      isActive: true,
      password: "",
      confirmPassword: "",
    });
    setPasswordError(null);
    setConfirmPasswordError(null);
    setShowPassword(false);
    setShowConfirmPassword(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user: IUser) => {
    setEditingUser(user);
    setFormData({
      userCode: user.userCode,
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      phone: user.phone,
      gender: user.gender,
      dateOfBirth: user.dateOfBirth.split("T")[0],
      image: user.image,
      roleID: user.roleID,
      isActive: user.isActive,
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : type === "number"
          ? Number(value)
          : value,
    }));
    if (name === "password") {
      if (value) {
        setPasswordError(validateStrongPassword(value));
      } else {
        setPasswordError(null);
      }
      if (formData.confirmPassword && value !== formData.confirmPassword) {
        setConfirmPasswordError("passwordMismatch");
      } else {
        setConfirmPasswordError(null);
      }
    }
    if (name === "confirmPassword") {
      if (value && formData.password !== value) {
        setConfirmPasswordError("passwordMismatch");
      } else {
        setConfirmPasswordError(null);
      }
    }
  };

  const handlePasswordBlur = () => {
    if (formData.password) {
      setPasswordError(validateStrongPassword(formData.password));
    }
  };

  const handleConfirmPasswordBlur = () => {
    if (formData.confirmPassword && formData.password !== formData.confirmPassword) {
      setConfirmPasswordError("passwordMismatch");
    } else {
      setConfirmPasswordError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!editingUser) {
        const password = formData.password ?? "";
        const confirmPassword = formData.confirmPassword ?? "";
        if (!password.trim()) {
          toast.error(t("passwordRequired"));
          return;
        }
        const passwordValidationError = validateStrongPassword(password);
        if (passwordValidationError) {
          toast.error(t(passwordValidationError));
          setPasswordError(passwordValidationError);
          return;
        }
        if (!confirmPassword.trim()) {
          toast.error(t("confirmPasswordRequired"));
          return;
        }
        if (password !== confirmPassword) {
          toast.error(t("passwordMismatch"));
          setConfirmPasswordError("passwordMismatch");
          return;
        }
      }

      const submitData: Partial<IUserRequest> & Record<string, unknown> = {
        fullName: formData.fullName,
        username: formData.username,
        email: formData.email,
        phoneNumber: formData.phone,
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth,
        image: formData.image || "string",
        roleID: formData.roleID,
        isActive: formData.isActive,
      };

      if (editingUser) {
        submitData.userCode = formData.userCode;
        await userService.updateUser(editingUser.userID, submitData as IUserRequest);
        toast.success(t("updateUserSuccess"));
      } else {
        submitData.password = formData.password;
        submitData.confirmPassword = formData.confirmPassword;
        await userService.createUser(submitData as IUserRequest);
        toast.success(t("createUserSuccess"));
      }
      handleCloseModal();
      fetchUsers();
    } catch (err) {
      toast.error(t("errorOccurred"));
      console.error("Error saving user:", err);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm(t("confirmDeleteUser"))) {
      try {
        await userService.deleteUser(id);
        toast.success(t("deleteUserSuccess"));
        fetchUsers();
      } catch (err) {
        toast.error(getApiErrorMessage(err));
        console.error("Error deleting user:", err);
      }
    }
  };

  const getRoleColor = (roleName: string) => {
    switch (roleName.toLowerCase()) {
      case "admin":
        return "#ef4444";
      case "serviceadvisor":
        return "#3b82f6";
      case "technician":
        return "#10b981";
      case "customer":
        return "#f59e0b";
      default:
        return "#6b7280";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN");
  };

  if (loading) {
    return (
      <Container>
        <LoadingMessage>{t("loadingData")}</LoadingMessage>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <ErrorMessage>{error}</ErrorMessage>
      </Container>
    );
  }

  const activeUsers = users.filter(user => user.isActive);
  const roleStats = users.reduce((acc, user) => {
    acc[user.roleName] = (acc[user.roleName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <Container>
      <Header>
        <TitleSection>
          <div>
            <Title>{t("userManagement")}</Title>
            <Subtitle>{t("userManagementSubtitle")}</Subtitle>
          </div>
        </TitleSection>
        <AddButton onClick={handleOpenCreateModal}>
          <HiPlus size={18} />
          {t("addUser")}
        </AddButton>
      </Header>

      <StatsGrid>
        <StatCard>
          <StatNumber>{users.length}</StatNumber>
          <StatLabel>{t("totalUsers")}</StatLabel>
        </StatCard>
        <StatCard>
          <StatNumber>{activeUsers.length}</StatNumber>
          <StatLabel>{t("activeUsers")}</StatLabel>
        </StatCard>
        <StatCard>
          <StatNumber>{roleStats.Admin || 0}</StatNumber>
          <StatLabel>
            <RankBadge color="#ef4444">👨‍💼 {t("admin")}</RankBadge>
          </StatLabel>
        </StatCard>
        <StatCard>
          <StatNumber>{roleStats.ServiceAdvisor || 0}</StatNumber>
          <StatLabel>
            <RankBadge color="#3b82f6">💼 {t("serviceAdvisor")}</RankBadge>
          </StatLabel>
        </StatCard>
        <StatCard>
          <StatNumber>{roleStats.Technician || 0}</StatNumber>
          <StatLabel>
            <RankBadge color="#10b981">🔧 {t("technician")}</RankBadge>
          </StatLabel>
        </StatCard>
      </StatsGrid>

      <TableCard>
        <TableHeader>
          <SearchBox>
            <HiSearch size={18} />
            <input type="text" placeholder={t("searchByNameCode")} />
          </SearchBox>
        </TableHeader>

        <TableSection>
          <TableTitle>{t("userList")}</TableTitle>
          <TableSubtitle>{t("showingUsers", { count: users.length })}</TableSubtitle>

          <TableWrapper>
          <Table>
            <thead>
              <tr>
                <ThLeft>{t("user")}</ThLeft>
                <Th>{t("username")}</Th>
                <Th>{t("contactInfo")}</Th>
                <Th>{t("gender")}</Th>
                <Th>{t("dateOfBirth")}</Th>
                <Th>{t("role")}</Th>
                <Th>{t("status")}</Th>
                <Th>{t("createDate")}</Th>
                <Th>{t("action")}</Th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.userID}>
                  <TdLeft>
                    <CustomerInfo>
                      <div>
                        <CustomerName>{user.fullName}</CustomerName>
                        <CustomerId>{user.userCode}</CustomerId>
                      </div>
                    </CustomerInfo>
                  </TdLeft>
                  <Td>
                    <Username>{user.username}</Username>
                  </Td>
                  <Td>
                    <ContactInfo>
                      <div>{user.phone}</div>
                      <div>{user.email}</div>
                    </ContactInfo>
                  </Td>
                  <Td>{user.gender}</Td>
                  <Td>{formatDate(user.dateOfBirth)}</Td>
                  <Td>
                    <RankBadgeTable color={getRoleColor(user.roleName)}>
                      {user.roleName}
                    </RankBadgeTable>
                  </Td>
                  <Td>
                    <StatusBadge $isActive={user.isActive}>
                      {user.isActive ? t("active") : t("inactive")}
                    </StatusBadge>
                  </Td>
                  <Td>{formatDate(user.createdDate)}</Td>
                  <Td>
                    <ActionButtons>
                      <ActionButton onClick={() => handleOpenEditModal(user)}>
                        <HiPencil size={18} />
                      </ActionButton>
                      <ActionButton
                        onClick={() => handleDelete(user.userID)}
                        $isDelete
                      >
                        <HiTrash size={18} />
                      </ActionButton>
                    </ActionButtons>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
          </TableWrapper>
        </TableSection>
      </TableCard>

      {isModalOpen && (
        <Modal>
          <ModalOverlay onClick={handleCloseModal} />
          <ModalContent>
            <ModalHeader>
              <ModalTitle>
                {editingUser ? t("updateUser") : t("createUser")}
              </ModalTitle>
              <CloseButton onClick={handleCloseModal}>
                <HiX size={24} />
              </CloseButton>
            </ModalHeader>

            <ModalBody>
              <Form onSubmit={handleSubmit}>
                <FormRow>
                  <FormGroup>
                    <Label>
                      {t("fullName")} <Required>*</Required>
                    </Label>
                    <Input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
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
                      onChange={handleInputChange}
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
                      onChange={handleInputChange}
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
                      onChange={handleInputChange}
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
                          onChange={handleInputChange}
                          onBlur={handlePasswordBlur}
                          placeholder={t("passwordPlaceholderRegister")}
                          $hasError={!!passwordError}
                          required
                        />
                        <EyeButton
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? (
                            <HiEyeOff size={20} />
                          ) : (
                            <HiEye size={20} />
                          )}
                        </EyeButton>
                      </PasswordInputWrapper>
                      {passwordError && (
                        <FieldError>{t(passwordError)}</FieldError>
                      )}
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
                          onChange={handleInputChange}
                          onBlur={handleConfirmPasswordBlur}
                          placeholder={t("confirmPasswordPlaceholder")}
                          $hasError={!!confirmPasswordError}
                          required
                        />
                        <EyeButton
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          aria-label={showConfirmPassword ? "Hide password" : "Show password"}
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
                      onChange={handleInputChange}
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
                      onChange={handleInputChange}
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
                      onChange={handleInputChange}
                      required
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>{t("userCode")}</Label>
                    <Input
                      type="text"
                      name="userCode"
                      value={formData.userCode}
                      onChange={handleInputChange}
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
                      onChange={handleInputChange}
                      placeholder={t("imageUrlPlaceholder")}
                    />
                  </FormGroup>

                  <FormGroup>
                    <CheckboxWrapper>
                      <Checkbox
                        type="checkbox"
                        name="isActive"
                        checked={formData.isActive}
                        onChange={handleInputChange}
                      />
                      <Label>{t("activate")}</Label>
                    </CheckboxWrapper>
                  </FormGroup>
                </FormRow>

                <ModalFooter>
                  <CancelButton type="button" onClick={handleCloseModal}>
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
      )}
    </Container>
  );
};

export default UserPage;

const Container = styled.div`
  padding: 2rem;
  background: #f8f9fa;
  min-height: 100vh;
  min-width: 0;

  @media (max-width: 1280px) {
    padding: 1.5rem;
  }

  @media (max-width: 1024px) {
    padding: 1rem;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;

  @media (max-width: 1024px) {
    margin-bottom: 1.5rem;
  }

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const TitleSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: 700;
  color: #1a1d2e;
  margin: 0;

  @media (max-width: 1024px) {
    font-size: 1.25rem;
  }
`;

const Subtitle = styled.p`
  font-size: 0.875rem;
  color: #6b7590;
  margin: 0.25rem 0 0 0;

  @media (max-width: 1024px) {
    font-size: 0.8125rem;
  }
`;

const AddButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #3b82f6;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;

  @media (max-width: 1024px) {
    padding: 0.625rem 1.25rem;
    font-size: 0.875rem;
  }

  &:hover {
    background: #2563eb;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;

  @media (max-width: 1280px) {
    grid-template-columns: repeat(4, 1fr);
    gap: 0.875rem;
    margin-bottom: 1.5rem;
  }

  @media (max-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
    gap: 0.75rem;
    margin-bottom: 1.25rem;
  }

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const StatCard = styled.div`
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;

  @media (max-width: 1024px) {
    padding: 1rem;
    border-radius: 10px;
  }
`;

const StatNumber = styled.div`
  font-size: 1.75rem;
  font-weight: 700;
  color: #1a1d2e;
  margin-bottom: 0.5rem;

  @media (max-width: 1024px) {
    font-size: 1.5rem;
  }
`;

const StatLabel = styled.div`
  font-size: 0.875rem;
  color: #6b7590;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const RankBadge = styled.span<{ color: string }>`
  background: ${(props) => props.color}15;
  color: ${(props) => props.color};
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;

  @media (max-width: 1024px) {
    padding: 0.2rem 0.5rem;
    font-size: 0.6875rem;
  }
`;

const TableCard = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

const TableHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;

  @media (max-width: 1024px) {
    padding: 1rem;
  }
`;

const SearchBox = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: #f8f9fa;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  flex: 1;
  max-width: 400px;
  min-width: 0;
  color: #6b7590;

  @media (max-width: 1024px) {
    max-width: 280px;
    padding: 0.625rem 0.875rem;
  }

  input {
    border: none;
    background: transparent;
    outline: none;
    flex: 1;
    font-size: 0.875rem;
    color: #1a1d2e;

    &::placeholder {
      color: #9ca3bf;
    }
  }
`;

const TableSection = styled.div`
  padding: 1.5rem;

  @media (max-width: 1024px) {
    padding: 1rem;
  }
`;

const TableWrapper = styled.div`
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  width: 100%;
  min-width: 0;

  &::-webkit-scrollbar {
    height: 8px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
`;

const TableTitle = styled.h2`
  font-size: 1.125rem;
  font-weight: 600;
  color: #1a1d2e;
  margin: 0 0 0.25rem 0;
`;

const TableSubtitle = styled.p`
  font-size: 0.875rem;
  color: #6b7590;
  margin: 0 0 1.5rem 0;
`;

const Table = styled.table`
  width: 100%;
  min-width: 900px;
  border-collapse: collapse;
`;

const Th = styled.th`
  text-align: center;
  padding: 0.75rem 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7590;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid #e5e7eb;
  white-space: nowrap;

  @media (max-width: 1024px) {
    padding: 0.625rem 0.75rem;
    font-size: 0.6875rem;
  }
`;

const ThLeft = styled.th`
  text-align: left;
  padding: 0.75rem 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7590;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid #e5e7eb;
  white-space: nowrap;

  @media (max-width: 1024px) {
    padding: 0.625rem 0.75rem;
    font-size: 0.6875rem;
  }
`;

const Td = styled.td`
  padding: 1rem;
  border-bottom: 1px solid #f3f4f6;
  font-size: 0.875rem;
  color: #1a1d2e;
  text-align: center;
  vertical-align: middle;

  @media (max-width: 1024px) {
    padding: 0.75rem;
    font-size: 0.8125rem;
  }
`;

const TdLeft = styled.td`
  padding: 1rem;
  border-bottom: 1px solid #f3f4f6;
  font-size: 0.875rem;
  color: #1a1d2e;
  text-align: left;
  vertical-align: middle;

  @media (max-width: 1024px) {
    padding: 0.75rem;
    font-size: 0.8125rem;
  }
`;

const CustomerInfo = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 0.75rem;
`;

const CustomerName = styled.div`
  font-weight: 600;
  color: #1a1d2e;
`;

const CustomerId = styled.div`
  font-size: 0.75rem;
  color: #9ca3bf;
  margin-top: 0.125rem;
`;

const Username = styled.div`
  font-weight: 500;
  color: #1a1d2e;
`;

const ContactInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  
  div:first-child {
    font-weight: 500;
  }
  div:last-child {
    font-size: 0.75rem;
    color: #6b7590;
    margin-top: 0.125rem;
  }
`;

const RankBadgeTable = styled.span<{ color: string }>`
  background: ${(props) => props.color};
  color: white;
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  display: inline-block;

  @media (max-width: 1024px) {
    padding: 0.25rem 0.5rem;
    font-size: 0.6875rem;
  }
`;

const StatusBadge = styled.span<{ $isActive: boolean }>`
  background: ${(props) => (props.$isActive ? "#10b981" : "#ef4444")};
  color: white;
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  display: inline-block;

  @media (max-width: 1024px) {
    padding: 0.25rem 0.5rem;
    font-size: 0.6875rem;
  }
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 2rem;
  font-size: 1.125rem;
  color: #6b7590;
`;

const ErrorMessage = styled.div`
  text-align: center;
  padding: 2rem;
  font-size: 1.125rem;
  color: #ef4444;
  background: #fee;
  border-radius: 8px;
  margin: 2rem;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: center;
`;

const ActionButton = styled.button<{ $isDelete?: boolean }>`
  background: transparent;
  border: none;
  padding: 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  color: ${(props) => (props.$isDelete ? "#ef4444" : "#3b82f6")};
  transition: all 0.2s;

  &:hover {
    background: ${(props) => (props.$isDelete ? "#fee" : "#eff6ff")};
  }
`;

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
    box-shadow: 0 0 0 3px ${(p) => (p.$hasError ? "rgba(239, 68, 68, 0.1)" : "rgba(59, 130, 246, 0.1)")};
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

const Checkbox = styled.input`
  width: 18px;
  height: 18px;
  cursor: pointer;
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
