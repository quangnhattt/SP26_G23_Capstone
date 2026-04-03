import styled from "styled-components";
import { HiSearch, HiPlus, HiPencil } from "react-icons/hi";
import { useEffect, useState } from "react";
import { Pagination } from "antd";
import {
  userService,
  type IUser,
  type IUserRequest,
} from "@/services/admin/userService";
import { validateStrongPassword } from "@/utils/validation";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import UserModal from "./UserModal";

const UserPage = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState<IUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<IUser | null>(null);
  const [formData, setFormData] = useState<
    IUserRequest & { password?: string; confirmPassword?: string }
  >({
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
  const [confirmPasswordError, setConfirmPasswordError] = useState<
    string | null
  >(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const pageSize = 10;

  const normalizeText = (value: string | null | undefined) =>
    (value ?? "").toLowerCase();

  const getDisplayText = (value: string | null | undefined) =>
    value?.trim() ? value : t("notAvailable");

  async function fetchUsers() {
    try {
      const data = await userService.getUsers();
      setUsers(data);
      setError(null);
    } catch (err) {
      setError(t("cannotLoadUsers"));
      console.error("Error fetching users:", err);
    }
  }

  useEffect(() => {
    Promise.resolve().then(() => {
      void fetchUsers();
    });
  }, []);

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
      gender: user.gender ?? "Other",
      dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split("T")[0] : "",
      image: user.image ?? "",
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
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
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
    if (
      formData.confirmPassword &&
      formData.password !== formData.confirmPassword
    ) {
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
        await userService.updateUser(
          editingUser.userID,
          submitData as IUserRequest,
        );
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

  const getRoleColor = (roleName: string | null | undefined) => {
    switch (normalizeText(roleName)) {
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

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) {
      return t("notAvailable");
    }

    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
      return t("notAvailable");
    }

    return date.toLocaleDateString("vi-VN");
  };

  const getRoleLabel = (roleName: string | null | undefined) => {
    switch (normalizeText(roleName)) {
      case "admin":
        return t("admin");
      case "serviceadvisor":
        return t("serviceAdvisor");
      case "technician":
        return t("technician");
      case "customer":
        return t("customer");
      default:
        return getDisplayText(roleName);
    }
  };

  const getGenderLabel = (gender: string | null | undefined) => {
    switch (normalizeText(gender)) {
      case "male":
        return t("male");
      case "female":
        return t("female");
      case "other":
        return t("other");
      default:
        return t("notAvailable");
    }
  };

  const filteredUsers = users.filter((user) => {
    const normalized = normalizeText(searchTerm);
    return (
      normalizeText(user.fullName).includes(normalized) ||
      normalizeText(user.userCode).includes(normalized) ||
      normalizeText(user.username).includes(normalized) ||
      normalizeText(user.email).includes(normalized) ||
      normalizeText(user.phone).includes(normalized)
    );
  });

  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const activeUsers = users.filter((user) => user.isActive);
  const roleStats = users.reduce(
    (acc, user) => {
      const roleName = user.roleName ?? "Unknown";
      acc[roleName] = (acc[roleName] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <Container>
      <Header>
        <div>
          <Title>{t("userManagement")}</Title>
          <Subtitle>{t("userManagementSubtitle")}</Subtitle>
        </div>
        <AddButton onClick={handleOpenCreateModal}>
          <HiPlus size={18} />
          {t("addUser")}
        </AddButton>
      </Header>

      {error && <ErrorBox>{error}</ErrorBox>}

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

      <Toolbar>
        <SearchWrapper>
          <HiSearch size={16} color="#9ca3af" />
          <SearchInput
            type="text"
            placeholder={t("searchUsersPlaceholder")}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </SearchWrapper>
      </Toolbar>

      <TableCard>
        <TableSection>
          <TableTitle>{t("userList")}</TableTitle>
          <TableSubtitle>
            {t("showingUsers", { count: filteredUsers.length })}
          </TableSubtitle>

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
                {paginatedUsers.map((user) => (
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
                      <Username>{getDisplayText(user.username)}</Username>
                    </Td>
                    <Td>
                      <ContactInfo>
                        <div>{getDisplayText(user.phone)}</div>
                        <div>{getDisplayText(user.email)}</div>
                      </ContactInfo>
                    </Td>
                    <Td>{getGenderLabel(user.gender)}</Td>
                    <Td>{formatDate(user.dateOfBirth)}</Td>
                    <Td>
                      <RankBadgeTable color={getRoleColor(user.roleName)}>
                        {getRoleLabel(user.roleName)}
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
                      </ActionButtons>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableWrapper>
          <PaginationWrapper>
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={filteredUsers.length}
              showSizeChanger={false}
              onChange={(page: number) => setCurrentPage(page)}
            />
          </PaginationWrapper>
        </TableSection>
      </TableCard>

      <UserModal
        isOpen={isModalOpen}
        editingUser={editingUser}
        formData={formData}
        passwordError={passwordError}
        confirmPasswordError={confirmPasswordError}
        showPassword={showPassword}
        showConfirmPassword={showConfirmPassword}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        onInputChange={handleInputChange}
        onPasswordBlur={handlePasswordBlur}
        onConfirmPasswordBlur={handleConfirmPasswordBlur}
        onTogglePassword={() => setShowPassword(!showPassword)}
        onToggleConfirmPassword={() =>
          setShowConfirmPassword(!showConfirmPassword)
        }
      />
    </Container>
  );
};

export default UserPage;

const Container = styled.div`
  padding: 24px;
  background: #f9fafb;
  min-height: 100%;
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
  margin-bottom: 24px;
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

const Title = styled.h1`
  font-size: 22px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 4px 0;

  @media (max-width: 1024px) {
    font-size: 1.25rem;
  }
`;

const Subtitle = styled.p`
  font-size: 14px;
  color: #6b7280;
  margin: 0;

  @media (max-width: 1024px) {
    font-size: 0.8125rem;
  }
`;

const AddButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  background: #3b82f6;
  color: white;
  border: none;
  padding: 8px 20px;
  border-radius: 8px;
  font-size: 14px;
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

const ErrorBox = styled.div`
  padding: 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #991b1b;
  font-size: 14px;
  margin-bottom: 16px;
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

const Toolbar = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  align-items: center;
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
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
`;

const SearchWrapper = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #fff;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  flex: 1;
  max-width: 360px;
  min-width: 220px;
  min-width: 0;
  cursor: text;

  @media (max-width: 1024px) {
    max-width: 280px;
  }

  &:focus-within {
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
  }
`;

const SearchInput = styled.input`
  border: none;
  background: transparent;
  outline: none;
  flex: 1;
  font-size: 14px;
  color: #111827;

  &::placeholder {
    color: #9ca3af;
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

const PaginationWrapper = styled.div`
  display: flex;
  justify-content: flex-end;
  padding: 16px 0 0;
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

const ActionButtons = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: center;
`;

const ActionButton = styled.button`
  background: transparent;
  border: none;
  padding: 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  color: #3b82f6;
  transition: all 0.2s;

  &:hover {
    background: #eff6ff;
  }
`;
