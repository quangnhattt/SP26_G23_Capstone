import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import styled, { createGlobalStyle } from "styled-components";
import { HiSearch, HiPlus, HiPencil } from "react-icons/hi";
import {
  Table as AntTable,
  Switch,
  ConfigProvider,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  getMembershipRanks,
  createMembershipRank,
  updateMembershipRank,
  updateMembershipRankStatus,
} from "@/services/admin/membershipRankService";
import type { IMembershipRank } from "@/services/admin/membershipRankService";
import { toast } from "react-toastify";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import MembershipRankModal from "./MembershipRankModal";

interface MembershipRankFormData {
  rankName: string;
  minSpending: number | "";
  discountPercent: number | "";
  description: string;
  isActive: boolean;
}

const MembershipRanksManager = () => {
  const { t } = useTranslation();
  const [ranks, setRanks] = useState<IMembershipRank[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRank, setEditingRank] = useState<IMembershipRank | null>(null);
  const [formData, setFormData] = useState<MembershipRankFormData>({
    rankName: "",
    minSpending: "",
    discountPercent: "",
    description: "",
    isActive: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingRankId, setUpdatingRankId] = useState<number | null>(null);

  const fetchRanks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMembershipRanks();
      setRanks(data);
    } catch (err) {
      console.error("Failed to fetch membership ranks:", err);
      setError(t("cannotLoadMembershipRanks"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchRanks();
  }, [fetchRanks]);

  const handleOpenCreateModal = () => {
    setEditingRank(null);
    setFormData({
      rankName: "",
      minSpending: "",
      discountPercent: "",
      description: "",
      isActive: false,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (rank: IMembershipRank) => {
    setEditingRank(rank);
    setFormData({
      rankName: rank.rankName,
      minSpending: rank.minSpending,
      discountPercent: rank.discountPercent,
      description: rank.description || "",
      isActive: rank.isActive,
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRank(null);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : type === "number" && value === ""
            ? ""
          : type === "number"
            ? Number(value)
            : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        minSpending: Number(formData.minSpending),
        discountPercent: Number(formData.discountPercent),
      };

      if (editingRank) {
        await updateMembershipRank(editingRank.rankID, payload);
      } else {
        await createMembershipRank({
          rankName: payload.rankName,
          minSpending: payload.minSpending,
          discountPercent: payload.discountPercent,
          description: payload.description,
        });
      }
      handleCloseModal();
      await fetchRanks();
    } catch (err) {
      console.error("Error saving membership rank:", err);
      toast.error(getApiErrorMessage(err, t("errorSavingMembershipRank")));
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (rankId: number, isActive: boolean) => {
    setUpdatingRankId(rankId);
    try {
      await updateMembershipRankStatus(rankId, isActive);
      await fetchRanks();
    } catch (err) {
      console.error("Error updating membership rank status:", err);
      toast.error(getApiErrorMessage(err, t("errorSavingMembershipRank")));
    } finally {
      setUpdatingRankId(null);
    }
  };

  const filteredRanks = ranks.filter((r) =>
    r.rankName.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const columns: ColumnsType<IMembershipRank> = [
    {
      title: t("rankName"),
      dataIndex: "rankName",
      key: "rankName",
      render: (name: string) => <RankName>{name}</RankName>,
    },
    {
      title: t("minSpending"),
      dataIndex: "minSpending",
      key: "minSpending",
      align: "right",
      render: (val: number) => (
        <span style={{ color: "#1a1d2e" }}>
          {val.toLocaleString("vi-VN")} đ
        </span>
      ),
    },
    {
      title: t("discountPercent"),
      dataIndex: "discountPercent",
      key: "discountPercent",
      align: "center",
      render: (val: number) => (
        <DiscountBadge>{val}%</DiscountBadge>
      ),
    },
    {
      title: t("description"),
      dataIndex: "description",
      key: "description",
      render: (desc: string | null) => (
        <DescriptionText>{desc || "—"}</DescriptionText>
      ),
    },
    {
      title: t("isActive"),
      dataIndex: "isActive",
      key: "isActive",
      align: "center",
      render: (val: boolean, record: IMembershipRank) => (
        <Switch
          checked={val}
          loading={updatingRankId === record.rankID}
          onChange={(checked: boolean) =>
            handleToggleStatus(record.rankID, checked)
          }
        />
      ),
    },
    {
      title: t("action"),
      key: "action",
      align: "center",
      render: (_: unknown, record: IMembershipRank) => (
        <ActionButtons>
          <EditButton onClick={() => handleOpenEditModal(record)} title={t("edit")}>
            <HiPencil size={18} />
          </EditButton>
        </ActionButtons>
      ),
    },
  ];

  return (
    <Container>
      <FilterSelectGlobalStyle />
      <Header>
        <div>
          <Title>{t("membershipRanksManagement")}</Title>
          <Subtitle>{t("membershipRanksManagementSubtitle")}</Subtitle>
        </div>
        <AddButton onClick={handleOpenCreateModal}>
          <HiPlus size={18} />
          {t("createNewMembershipRank")}
        </AddButton>
      </Header>

      {error && <ErrorBox>{error}</ErrorBox>}

      <Toolbar>
        <SearchWrapper>
          <HiSearch size={16} color="#9ca3af" />
          <SearchInput
            placeholder={t("searchByRankName")}
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSearchTerm(e.target.value)
            }
          />
        </SearchWrapper>
      </Toolbar>

      <TableCard>
        <ConfigProvider
          theme={{
            components: {
              Table: {
                headerColor: "#374151",
                headerBg: "#f3f4f6",
                colorText: "#374151",
              },
            },
          }}
        >
          <AntTable
            columns={columns}
            dataSource={filteredRanks}
            rowKey="rankID"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: false,
              showTotal: (total, range) =>
                `${range[0]}–${range[1]} / ${total} ${t("membershipRank")}`,
            }}
            scroll={{ x: "max-content" }}
          />
        </ConfigProvider>
      </TableCard>

      <MembershipRankModal
        isOpen={isModalOpen}
        editingRank={editingRank}
        formData={formData}
        submitting={submitting}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        onInputChange={handleInputChange}
      />
    </Container>
  );
};

export default MembershipRanksManager;

const Container = styled.div`
  padding: 24px;
  background: #f9fafb;
  min-height: 100%;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const Title = styled.h1`
  font-size: 22px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 4px 0;
`;

const Subtitle = styled.p`
  font-size: 14px;
  color: #6b7280;
  margin: 0;
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

const Toolbar = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  align-items: center;
`;

const FilterSelectGlobalStyle = createGlobalStyle``;

const SearchWrapper = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #fff;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  flex: 1;
  min-width: 220px;
  max-width: 360px;
  cursor: text;
  &:focus-within {
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
  }
`;

const SearchInput = styled.input`
  border: none;
  outline: none;
  flex: 1;
  font-size: 14px;
  color: #111827;
  background: transparent;
  &::placeholder {
    color: #9ca3af;
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

const RankName = styled.div`
  font-weight: 600;
  color: #1a1d2e;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const DiscountBadge = styled.span`
  background: #dcfce7;
  color: #166534;
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  display: inline-block;
`;

const DescriptionText = styled.div`
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #6b7590;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: center;
`;

const EditButton = styled.button`
  background: transparent;
  border: none;
  padding: 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  color: #3b82f6;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: #dbeafe;
    color: #2563eb;
  }
`;
