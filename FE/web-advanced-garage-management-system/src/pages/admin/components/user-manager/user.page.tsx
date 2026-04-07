import styled from "styled-components";
import { HiSearch, HiPlus, HiPencil } from "react-icons/hi";
import { useEffect, useState } from "react";
import { Table as AntTable, Switch } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  userService,
  updateUserStatus,
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
  const [loading, setLoading] = useState(true);
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
    isActive: false,
  });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<
    string | null
  >(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState<number | null>(null);

  const normalizeText = (value: string | null | undefined) =>
    (value ?? "").toLowerCase();

  const getDisplayText = (value: string | null | undefined) =>
    value?.trim() ? value : t("notAvailable");

  async function fetchUsers() {
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
      isActive: false,
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
    if (!dateString) return t("notAvailable");
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return t("notAvailable");
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

  const handleToggleUserStatus = async (userId: number, isActive: boolean) => {
    setUpdatingUserId(userId);
    try {
      await updateUserStatus(userId, isActive);
      await fetchUsers();
    } catch (err) {
      console.error("Error updating user status:", err);
      toast.error(t("errorOccurred"));
    } finally {
      setUpdatingUserId(null);
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

  const activeUsers = users.filter((user) => user.isActive);
  const roleStats = users.reduce(
    (acc, user) => {
      const roleName = user.roleName ?? "Unknown";
      acc[roleName] = (acc[roleName] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const columns: ColumnsType<IUser> = [
    {
      title: t("user"),
      key: "user",
      render: (_: unknown, record: IUser) => (
        <CustomerInfo>
          <div>
            <CustomerName>{record.fullName}</CustomerName>
            <CustomerId>{record.userCode}</CustomerId>
          </div>
        </CustomerInfo>
      ),
    },
    {
      title: t("username"),
      dataIndex: "username",
      key: "username",
      align: "center",
      render: (val: string) => <Username>{getDisplayText(val)}</Username>,
    },
    {
      title: t("contactInfo"),
      key: "contactInfo",
      align: "center",
      render: (_: unknown, record: IUser) => (
        <ContactInfo>
          <div>{getDisplayText(record.phone)}</div>
          <div>{getDisplayText(record.email)}</div>
        </ContactInfo>
      ),
    },
    {
      title: t("gender"),
      dataIndex: "gender",
      key: "gender",
      align: "center",
      render: (val: string) => getGenderLabel(val),
    },
    {
      title: t("dateOfBirth"),
      dataIndex: "dateOfBirth",
      key: "dateOfBirth",
      align: "center",
      render: (val: string) => formatDate(val),
    },
    {
      title: t("role"),
      dataIndex: "roleName",
      key: "roleName",
      align: "center",
      render: (val: string) => (
        <RankBadgeTable color={getRoleColor(val)}>
          {getRoleLabel(val)}
        </RankBadgeTable>
      ),
    },
    {
      title: t("status"),
      dataIndex: "isActive",
      key: "isActive",
      align: "center",
      render: (isActive: boolean, record: IUser) => (
        <Switch
          checked={isActive}
          loading={updatingUserId === record.userID}
          onChange={(checked: boolean) =>
            handleToggleUserStatus(record.userID, checked)
          }
        />
      ),
    },
    {
      title: t("createDate"),
      dataIndex: "createdDate",
      key: "createdDate",
      align: "center",
      render: (val: string) => formatDate(val),
    },
    {
      title: t("action"),
      key: "action",
      align: "center",
      render: (_: unknown, record: IUser) => (
        <ActionButtons>
          <ActionButton onClick={() => handleOpenEditModal(record)}>
            <HiPencil size={18} />
          </ActionButton>
        </ActionButtons>
      ),
    },
  ];

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
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </SearchWrapper>
      </Toolbar>

      <TableCard>
        <AntTable
          columns={columns}
          dataSource={filteredUsers}
          rowKey="userID"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            showTotal: (total, range) =>
              `${range[0]}–${range[1]} / ${total} ${t("user")}`,
          }}
          scroll={{ x: "max-content" }}
        />
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
  padding: 0 8px;

  .ant-table {
    color: #374151;
  }
  .ant-table-thead > tr > th,
  .ant-table-thead > tr > td {
    color: #374151 !important;
    background: #f3f4f6 !important;
  }
  .ant-table-tbody > tr > td {
    color: #374151 !important;
  }
  .ant-table-tbody > tr:hover > td {
    background: #f9fafb !important;
  }
  .ant-pagination {
    color: #374151;
  }
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

const CustomerInfo = styled.div`
  display: flex;
  align-items: center;
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
