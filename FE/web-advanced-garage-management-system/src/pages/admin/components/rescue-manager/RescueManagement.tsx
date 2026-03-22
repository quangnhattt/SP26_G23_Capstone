import { useState, useEffect, useCallback } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import {
  FaSearch,
  FaEye,
  FaCheck,
  FaTimes,
  FaUser,
  FaCar,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaWrench,
  FaTruck,
  FaFileInvoiceDollar,
  FaBan,
  FaUserCog,
  FaClipboardCheck,
  FaTools,
  FaMoneyBillWave,
} from "react-icons/fa";
import {
  getRescueRequests,
  updateRescueStatus,
  assignTechnician,
  sendRescueQuote,
  type IRescueRequest,
  type RescueStatus,
} from "@/apis/rescue";
import { getTechnicians, type ITechnician } from "@/apis/technicians";
import { toast } from "react-toastify";
import RescueDetailModal from "./RescueDetailModal";

// ─── Status config ───────────────────────────────────────────
const rescueStatusConfig: Record<
  string,
  { label: string; color: string; bg: string; border: string }
> = {
  PENDING: {
    label: "Chờ kiểm tra",
    color: "#d97706",
    bg: "#fef3c7",
    border: "#fcd34d",
  },
  ACCEPTED: {
    label: "Đã chấp nhận",
    color: "#16a34a",
    bg: "#dcfce7",
    border: "#86efac",
  },
  EVALUATING: {
    label: "Đang đánh giá",
    color: "#2563eb",
    bg: "#dbeafe",
    border: "#93c5fd",
  },
  QUOTE_SENT: {
    label: "Đã gửi báo giá",
    color: "#7c3aed",
    bg: "#ede9fe",
    border: "#c4b5fd",
  },
  CUSTOMER_APPROVED: {
    label: "KH đồng ý",
    color: "#16a34a",
    bg: "#dcfce7",
    border: "#86efac",
  },
  CUSTOMER_REJECTED: {
    label: "KH từ chối",
    color: "#dc2626",
    bg: "#fee2e2",
    border: "#fca5a5",
  },
  TECHNICIAN_DISPATCHED: {
    label: "Đã điều KTV",
    color: "#0891b2",
    bg: "#cffafe",
    border: "#67e8f9",
  },
  RESCUE_VEHICLE_DISPATCHED: {
    label: "Đã điều xe cứu hộ",
    color: "#0891b2",
    bg: "#cffafe",
    border: "#67e8f9",
  },
  DIAGNOSING: {
    label: "Đang chẩn đoán",
    color: "#ea580c",
    bg: "#fff7ed",
    border: "#fdba74",
  },
  REPAIRING_ON_SITE: {
    label: "Đang sửa tại chỗ",
    color: "#2563eb",
    bg: "#dbeafe",
    border: "#93c5fd",
  },
  NEED_TOWING: {
    label: "Cần kéo xe",
    color: "#dc2626",
    bg: "#fee2e2",
    border: "#fca5a5",
  },
  TOWING_CONFIRMED: {
    label: "KH đồng ý kéo xe",
    color: "#16a34a",
    bg: "#dcfce7",
    border: "#86efac",
  },
  TOWING_REJECTED: {
    label: "KH từ chối kéo xe",
    color: "#dc2626",
    bg: "#fee2e2",
    border: "#fca5a5",
  },
  INVOICED: {
    label: "Đã xuất hóa đơn",
    color: "#7c3aed",
    bg: "#ede9fe",
    border: "#c4b5fd",
  },
  PAID: {
    label: "Đã thanh toán",
    color: "#16a34a",
    bg: "#dcfce7",
    border: "#86efac",
  },
  COMPLETED: {
    label: "Hoàn thành",
    color: "#16a34a",
    bg: "#dcfce7",
    border: "#86efac",
  },
  CANCELLED: {
    label: "Đã hủy",
    color: "#6b7280",
    bg: "#f3f4f6",
    border: "#e5e7eb",
  },
  SPAM: {
    label: "Thư rác",
    color: "#6b7280",
    bg: "#f3f4f6",
    border: "#e5e7eb",
  },
};

// ─── Component ───────────────────────────────────────────────
const RescueManagement = () => {
  const { t } = useTranslation();
  const [rescues, setRescues] = useState<IRescueRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Detail modal
  const [selectedRescue, setSelectedRescue] = useState<IRescueRequest | null>(
    null,
  );
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Action modals
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showDiagnosisModal, setShowDiagnosisModal] = useState(false);

  // Technicians
  const [technicians, setTechnicians] = useState<ITechnician[]>([]);

  // Quote form
  const [quoteAmount, setQuoteAmount] = useState("");
  const [depositRequired, setDepositRequired] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [quoteNote, setQuoteNote] = useState("");

  // Assign form
  const [selectedTechId, setSelectedTechId] = useState<number | null>(null);

  // Diagnosis form
  const [canFixOnSite, setCanFixOnSite] = useState<boolean | null>(null);
  const [diagnosisNote, setDiagnosisNote] = useState("");

  const fetchRescues = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getRescueRequests();
      setRescues(data);
    } catch (error) {
      console.error("Error fetching rescue requests:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTechnicians = useCallback(async () => {
    try {
      const data = await getTechnicians();
      setTechnicians(data);
    } catch (error) {
      console.error("Error fetching technicians:", error);
    }
  }, []);

  useEffect(() => {
    fetchRescues();
    fetchTechnicians();
  }, [fetchRescues, fetchTechnicians]);

  // ─── Actions ─────────────────────────────────────────────
  const handleUpdateStatus = async (id: number, status: RescueStatus, note?: string) => {
    try {
      await updateRescueStatus(id, { status, note });
      toast.success(t("rescueMgrStatusUpdated"));
      fetchRescues();
      setShowDetailModal(false);
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error(t("rescueMgrStatusError"));
    }
  };

  const handleAssignTech = async () => {
    if (!selectedRescue || !selectedTechId) return;
    try {
      await assignTechnician(selectedRescue.rescueId, {
        technicianId: selectedTechId,
      });
      toast.success(t("rescueMgrTechAssigned"));
      setShowAssignModal(false);
      setSelectedTechId(null);
      fetchRescues();
    } catch (error) {
      console.error("Error assigning technician:", error);
      toast.error(t("rescueMgrAssignError"));
    }
  };

  const handleSendQuote = async () => {
    if (!selectedRescue || !quoteAmount) return;
    try {
      await sendRescueQuote(selectedRescue.rescueId, {
        quoteAmount: Number(quoteAmount),
        depositRequired,
        depositAmount: depositRequired ? Number(depositAmount) : undefined,
        note: quoteNote || undefined,
      });
      toast.success(t("rescueMgrQuoteSent"));
      setShowQuoteModal(false);
      resetQuoteForm();
      fetchRescues();
    } catch (error) {
      console.error("Error sending quote:", error);
      toast.error(t("rescueMgrQuoteError"));
    }
  };

  const handleDiagnosisSubmit = async () => {
    if (!selectedRescue || canFixOnSite === null) return;
    try {
      await updateRescueStatus(selectedRescue.rescueId, {
        status: canFixOnSite ? "REPAIRING_ON_SITE" : "NEED_TOWING",
        note: diagnosisNote,
      });
      toast.success(t("rescueMgrDiagnosisSaved"));
      setShowDiagnosisModal(false);
      resetDiagnosisForm();
      fetchRescues();
    } catch (error) {
      console.error("Error saving diagnosis:", error);
      toast.error(t("rescueMgrDiagnosisError"));
    }
  };

  const resetQuoteForm = () => {
    setQuoteAmount("");
    setDepositRequired(false);
    setDepositAmount("");
    setQuoteNote("");
  };

  const resetDiagnosisForm = () => {
    setCanFixOnSite(null);
    setDiagnosisNote("");
  };

  // ─── Filter & count ──────────────────────────────────────
  const totalCount = rescues.length;
  const pendingCount = rescues.filter((r) => r.status === "PENDING").length;
  const activeCount = rescues.filter((r) =>
    ["ACCEPTED", "EVALUATING", "QUOTE_SENT", "CUSTOMER_APPROVED", "TECHNICIAN_DISPATCHED", "RESCUE_VEHICLE_DISPATCHED", "DIAGNOSING", "REPAIRING_ON_SITE"].includes(r.status),
  ).length;
  const towingCount = rescues.filter((r) =>
    ["NEED_TOWING", "TOWING_CONFIRMED"].includes(r.status),
  ).length;
  const completedCount = rescues.filter((r) =>
    ["COMPLETED", "PAID"].includes(r.status),
  ).length;
  const cancelledCount = rescues.filter((r) =>
    ["CANCELLED", "SPAM"].includes(r.status),
  ).length;

  const filteredRescues = rescues
    .filter((r) => {
      if (filterStatus === "all") return true;
      if (filterStatus === "ACTIVE")
        return ["ACCEPTED", "EVALUATING", "QUOTE_SENT", "CUSTOMER_APPROVED", "TECHNICIAN_DISPATCHED", "RESCUE_VEHICLE_DISPATCHED", "DIAGNOSING", "REPAIRING_ON_SITE"].includes(r.status);
      if (filterStatus === "TOWING")
        return ["NEED_TOWING", "TOWING_CONFIRMED"].includes(r.status);
      if (filterStatus === "DONE")
        return ["COMPLETED", "PAID"].includes(r.status);
      if (filterStatus === "CLOSED")
        return ["CANCELLED", "SPAM"].includes(r.status);
      return r.status === filterStatus;
    })
    .filter((r) => {
      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase();
      return (
        r.customerName?.toLowerCase().includes(q) ||
        r.licensePlate?.toLowerCase().includes(q) ||
        r.customerPhone?.toLowerCase().includes(q) ||
        r.currentAddress?.toLowerCase().includes(q) ||
        r.problemDescription?.toLowerCase().includes(q) ||
        `rescue-${r.rescueId}`.includes(q)
      );
    });

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      const time = d.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      });
      const date = d.toLocaleDateString("vi-VN");
      return `${time} ${date}`;
    } catch {
      return dateStr;
    }
  };

  const getStatusInfo = (status: string) =>
    rescueStatusConfig[status] || {
      label: status,
      color: "#6b7280",
      bg: "#f3f4f6",
      border: "#e5e7eb",
    };

  // ─── Which actions are available per status (SA workflow) ─
  const getAvailableActions = (rescue: IRescueRequest) => {
    const actions: {
      label: string;
      icon: React.ReactNode;
      color: string;
      onClick: () => void;
    }[] = [];

    switch (rescue.status) {
      case "PENDING":
        // SA: Kiểm tra yêu cầu → Chấp nhận / Đánh dấu spam
        actions.push({
          label: t("rescueMgrAccept"),
          icon: <FaCheck size={12} />,
          color: "#16a34a",
          onClick: () => handleUpdateStatus(rescue.rescueId, "ACCEPTED"),
        });
        actions.push({
          label: t("rescueMgrMarkSpam"),
          icon: <FaBan size={12} />,
          color: "#6b7280",
          onClick: () => handleUpdateStatus(rescue.rescueId, "SPAM"),
        });
        break;

      case "ACCEPTED":
        // SA: Đánh giá năng lực xưởng → Gửi báo giá
        actions.push({
          label: t("rescueMgrEvaluate"),
          icon: <FaClipboardCheck size={12} />,
          color: "#2563eb",
          onClick: () =>
            handleUpdateStatus(rescue.rescueId, "EVALUATING"),
        });
        break;

      case "EVALUATING":
        // SA: Gửi báo giá
        actions.push({
          label: t("rescueMgrSendQuote"),
          icon: <FaFileInvoiceDollar size={12} />,
          color: "#7c3aed",
          onClick: () => {
            setSelectedRescue(rescue);
            setDepositRequired(false);
            setShowQuoteModal(true);
          },
        });
        break;

      case "CUSTOMER_APPROVED":
        // SA: Điều động kỹ thuật viên
        actions.push({
          label: t("rescueMgrDispatchTech"),
          icon: <FaUserCog size={12} />,
          color: "#0891b2",
          onClick: () => {
            setSelectedRescue(rescue);
            setShowAssignModal(true);
          },
        });
        break;

      case "TECHNICIAN_DISPATCHED":
        // SA: Điều xe cứu hộ
        actions.push({
          label: t("rescueMgrDispatchVehicle"),
          icon: <FaTruck size={12} />,
          color: "#0891b2",
          onClick: () =>
            handleUpdateStatus(
              rescue.rescueId,
              "RESCUE_VEHICLE_DISPATCHED",
            ),
        });
        break;

      case "RESCUE_VEHICLE_DISPATCHED":
        // KTV: Chẩn đoán tại chỗ
        actions.push({
          label: t("rescueMgrDiagnose"),
          icon: <FaTools size={12} />,
          color: "#ea580c",
          onClick: () => {
            setSelectedRescue(rescue);
            setShowDiagnosisModal(true);
          },
        });
        break;

      case "REPAIRING_ON_SITE":
        // KTV: Hoàn tất sửa chữa → Báo cáo SA → Xuất hóa đơn
        actions.push({
          label: t("rescueMgrCompleteRepair"),
          icon: <FaWrench size={12} />,
          color: "#16a34a",
          onClick: () =>
            handleUpdateStatus(rescue.rescueId, "INVOICED"),
        });
        break;

      case "NEED_TOWING":
        // SA: Gửi phương án cứu hộ → Khách đồng ý kéo xe?
        actions.push({
          label: t("rescueMgrConfirmTowing"),
          icon: <FaTruck size={12} />,
          color: "#16a34a",
          onClick: () =>
            handleUpdateStatus(rescue.rescueId, "TOWING_CONFIRMED"),
        });
        actions.push({
          label: t("rescueMgrRejectTowing"),
          icon: <FaTimes size={12} />,
          color: "#dc2626",
          onClick: () =>
            handleUpdateStatus(rescue.rescueId, "TOWING_REJECTED"),
        });
        break;

      case "TOWING_CONFIRMED":
        // Kích hoạt tiếp nhận dịch vụ → Xuất hóa đơn
        actions.push({
          label: t("rescueMgrGenerateInvoice"),
          icon: <FaFileInvoiceDollar size={12} />,
          color: "#7c3aed",
          onClick: () =>
            handleUpdateStatus(rescue.rescueId, "INVOICED"),
        });
        break;

      case "INVOICED":
        // Thanh toán thành công
        actions.push({
          label: t("rescueMgrMarkPaid"),
          icon: <FaMoneyBillWave size={12} />,
          color: "#16a34a",
          onClick: () =>
            handleUpdateStatus(rescue.rescueId, "PAID"),
        });
        break;

      case "PAID":
        // Hoàn thành
        actions.push({
          label: t("rescueMgrComplete"),
          icon: <FaCheck size={12} />,
          color: "#16a34a",
          onClick: () =>
            handleUpdateStatus(rescue.rescueId, "COMPLETED"),
        });
        break;
    }

    // Cancel always available for non-terminal states
    if (
      !["COMPLETED", "CANCELLED", "SPAM", "PAID"].includes(rescue.status)
    ) {
      actions.push({
        label: t("rescueMgrCancel"),
        icon: <FaTimes size={12} />,
        color: "#dc2626",
        onClick: () =>
          handleUpdateStatus(rescue.rescueId, "CANCELLED"),
      });
    }

    return actions;
  };

  // ─── Render ──────────────────────────────────────────────
  return (
    <PageWrapper>
      {/* Header */}
      <Header>
        <HeaderLeft>
          <FaTruck size={24} color="#dc2626" />
          <div>
            <HeaderTitle>{t("rescueMgrTitle")}</HeaderTitle>
            <HeaderSubtitle>{t("rescueMgrSubtitle")}</HeaderSubtitle>
          </div>
        </HeaderLeft>
      </Header>

      {/* Stats */}
      <StatsRow>
        <StatCard $borderColor="#e5e7eb" onClick={() => setFilterStatus("all")}>
          <StatNumber $color="#111827">{totalCount}</StatNumber>
          <StatLabel>{t("rescueMgrTotal")}</StatLabel>
        </StatCard>
        <StatCard
          $borderColor="#fcd34d"
          onClick={() => setFilterStatus("PENDING")}
        >
          <StatNumber $color="#d97706">{pendingCount}</StatNumber>
          <StatLabel>{t("rescueMgrPending")}</StatLabel>
        </StatCard>
        <StatCard
          $borderColor="#93c5fd"
          onClick={() => setFilterStatus("ACTIVE")}
        >
          <StatNumber $color="#2563eb">{activeCount}</StatNumber>
          <StatLabel>{t("rescueMgrActive")}</StatLabel>
        </StatCard>
        <StatCard
          $borderColor="#fdba74"
          onClick={() => setFilterStatus("TOWING")}
        >
          <StatNumber $color="#ea580c">{towingCount}</StatNumber>
          <StatLabel>{t("rescueMgrTowing")}</StatLabel>
        </StatCard>
        <StatCard
          $borderColor="#86efac"
          onClick={() => setFilterStatus("DONE")}
        >
          <StatNumber $color="#16a34a">{completedCount}</StatNumber>
          <StatLabel>{t("rescueMgrCompleted")}</StatLabel>
        </StatCard>
        <StatCard
          $borderColor="#fca5a5"
          onClick={() => setFilterStatus("CLOSED")}
        >
          <StatNumber $color="#dc2626">{cancelledCount}</StatNumber>
          <StatLabel>{t("rescueMgrCancelled")}</StatLabel>
        </StatCard>
      </StatsRow>

      {/* Filters */}
      <FilterRow>
        <SearchBox>
          <FaSearch size={14} color="#9ca3af" />
          <SearchInput
            placeholder={t("rescueMgrSearchPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </SearchBox>
        <FilterSelect
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">{t("appointmentsAll")}</option>
          {Object.entries(rescueStatusConfig).map(([key, val]) => (
            <option key={key} value={key}>
              {val.label}
            </option>
          ))}
        </FilterSelect>
      </FilterRow>

      {/* List */}
      <ListSection>
        {loading ? (
          <LoadingMessage>{t("loading")}</LoadingMessage>
        ) : filteredRescues.length === 0 ? (
          <EmptyMessage>{t("rescueMgrEmpty")}</EmptyMessage>
        ) : (
          filteredRescues.map((item) => {
            const statusInfo = getStatusInfo(item.status);
            const carName = `${item.brand} ${item.model}`;
            const actions = getAvailableActions(item);

            return (
              <RequestCard
                key={item.rescueId}
                $borderColor={statusInfo.border}
              >
                <CardLeft>
                  <CardTopRow>
                    <RequestCode>RESCUE-{item.rescueId}</RequestCode>
                    <BadgeGroup>
                      <Badge $color={statusInfo.color} $bg={statusInfo.bg}>
                        {statusInfo.label}
                      </Badge>
                    </BadgeGroup>
                  </CardTopRow>

                  <CardTitle>{item.problemDescription}</CardTitle>

                  <CardInfoRow>
                    <InfoChip>
                      <FaUser size={12} />
                      {item.customerName}
                    </InfoChip>
                    <InfoChip>
                      <FaPhoneAlt size={12} />
                      {item.customerPhone}
                    </InfoChip>
                    <InfoChip>
                      <FaCar size={12} />
                      {carName} ({item.licensePlate})
                    </InfoChip>
                    <InfoChip>
                      <FaMapMarkerAlt size={12} />
                      {item.currentAddress}
                    </InfoChip>
                  </CardInfoRow>

                  {item.serviceAdvisorName && (
                    <CardInfoRow>
                      <InfoChip>
                        <FaWrench size={12} />
                        SA: {item.serviceAdvisorName}
                      </InfoChip>
                    </CardInfoRow>
                  )}
                </CardLeft>

                <CardRight>
                  <DateText>{formatDateTime(item.createdDate)}</DateText>
                  <ActionButton
                    onClick={() => {
                      setSelectedRescue(item);
                      setShowDetailModal(true);
                    }}
                  >
                    <FaEye size={14} />
                    {t("appointmentsViewDetail")}
                  </ActionButton>
                  {actions.map((action, idx) => (
                    <ActionBtn
                      key={idx}
                      $color={action.color}
                      onClick={action.onClick}
                    >
                      {action.icon}
                      {action.label}
                    </ActionBtn>
                  ))}
                </CardRight>
              </RequestCard>
            );
          })
        )}
      </ListSection>

      {/* ─── Detail Modal ─── */}
      {showDetailModal && selectedRescue && (
        <RescueDetailModal
          rescue={selectedRescue}
          onClose={() => setShowDetailModal(false)}
        />
      )}

      {/* ─── Quote Modal ─── */}
      {showQuoteModal && selectedRescue && (
        <ModalOverlay onClick={() => setShowQuoteModal(false)}>
          <ModalContent
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "500px" }}
          >
            <ModalHeader>
              <ModalTitle>{t("rescueMgrSendQuote")}</ModalTitle>
              <CloseBtn onClick={() => setShowQuoteModal(false)}>
                <FaTimes />
              </CloseBtn>
            </ModalHeader>
            <ModalBody>
              <FormGroup>
                <FormLabel>{t("rescueMgrQuoteAmount")} *</FormLabel>
                <FormInput
                  type="number"
                  value={quoteAmount}
                  onChange={(e) => setQuoteAmount(e.target.value)}
                  placeholder="VND"
                />
              </FormGroup>
              <FormGroup>
                <CheckboxRow>
                  <input
                    type="checkbox"
                    checked={depositRequired}
                    onChange={(e) => setDepositRequired(e.target.checked)}
                  />
                  <FormLabel style={{ margin: 0 }}>
                    {t("rescueMgrRequireDeposit")}
                  </FormLabel>
                </CheckboxRow>
              </FormGroup>
              {depositRequired && (
                <FormGroup>
                  <FormLabel>{t("rescueMgrDepositAmount")} *</FormLabel>
                  <FormInput
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="VND"
                  />
                </FormGroup>
              )}
              <FormGroup>
                <FormLabel>{t("rescueMgrNote")}</FormLabel>
                <FormTextarea
                  value={quoteNote}
                  onChange={(e) => setQuoteNote(e.target.value)}
                  rows={3}
                />
              </FormGroup>
            </ModalBody>
            <ModalFooter>
              <ModalCancelBtn onClick={() => setShowQuoteModal(false)}>
                {t("rescueMgrCancel")}
              </ModalCancelBtn>
              <ModalConfirmBtn onClick={handleSendQuote}>
                {t("rescueMgrSendQuote")}
              </ModalConfirmBtn>
            </ModalFooter>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* ─── Assign Technician Modal ─── */}
      {showAssignModal && selectedRescue && (
        <ModalOverlay onClick={() => setShowAssignModal(false)}>
          <ModalContent
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "500px" }}
          >
            <ModalHeader>
              <ModalTitle>{t("rescueMgrDispatchTech")}</ModalTitle>
              <CloseBtn onClick={() => setShowAssignModal(false)}>
                <FaTimes />
              </CloseBtn>
            </ModalHeader>
            <ModalBody>
              <FormGroup>
                <FormLabel>{t("rescueMgrSelectTech")} *</FormLabel>
                <TechList>
                  {technicians.map((tech) => (
                    <TechCard
                      key={tech.technicianId}
                      $selected={selectedTechId === tech.technicianId}
                      onClick={() => setSelectedTechId(tech.technicianId)}
                    >
                      <TechName>{tech.fullName}</TechName>
                      <TechInfo>{tech.phone}</TechInfo>
                      {tech.skills && <TechInfo>{tech.skills}</TechInfo>}
                    </TechCard>
                  ))}
                </TechList>
              </FormGroup>
            </ModalBody>
            <ModalFooter>
              <ModalCancelBtn onClick={() => setShowAssignModal(false)}>
                {t("rescueMgrCancel")}
              </ModalCancelBtn>
              <ModalConfirmBtn
                onClick={handleAssignTech}
                disabled={!selectedTechId}
              >
                {t("rescueMgrAssign")}
              </ModalConfirmBtn>
            </ModalFooter>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* ─── Diagnosis Modal ─── */}
      {showDiagnosisModal && selectedRescue && (
        <ModalOverlay onClick={() => setShowDiagnosisModal(false)}>
          <ModalContent
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "500px" }}
          >
            <ModalHeader>
              <ModalTitle>{t("rescueMgrDiagnose")}</ModalTitle>
              <CloseBtn onClick={() => setShowDiagnosisModal(false)}>
                <FaTimes />
              </CloseBtn>
            </ModalHeader>
            <ModalBody>
              <FormGroup>
                <FormLabel>{t("rescueMgrCanFixOnSite")} *</FormLabel>
                <RadioGroup>
                  <RadioOption
                    $selected={canFixOnSite === true}
                    onClick={() => setCanFixOnSite(true)}
                  >
                    <FaCheck size={14} />
                    {t("rescueMgrYesFixOnSite")}
                  </RadioOption>
                  <RadioOption
                    $selected={canFixOnSite === false}
                    onClick={() => setCanFixOnSite(false)}
                  >
                    <FaTruck size={14} />
                    {t("rescueMgrNoNeedTow")}
                  </RadioOption>
                </RadioGroup>
              </FormGroup>
              <FormGroup>
                <FormLabel>{t("rescueMgrDiagnosisNote")}</FormLabel>
                <FormTextarea
                  value={diagnosisNote}
                  onChange={(e) => setDiagnosisNote(e.target.value)}
                  rows={4}
                  placeholder={t("rescueMgrDiagnosisPlaceholder")}
                />
              </FormGroup>
            </ModalBody>
            <ModalFooter>
              <ModalCancelBtn onClick={() => setShowDiagnosisModal(false)}>
                {t("rescueMgrCancel")}
              </ModalCancelBtn>
              <ModalConfirmBtn
                onClick={handleDiagnosisSubmit}
                disabled={canFixOnSite === null}
              >
                {t("rescueMgrSaveDiagnosis")}
              </ModalConfirmBtn>
            </ModalFooter>
          </ModalContent>
        </ModalOverlay>
      )}
    </PageWrapper>
  );
};

export default RescueManagement;

// ─── Styled Components ───────────────────────────────────────
const PageWrapper = styled.div`
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const HeaderTitle = styled.h1`
  font-size: 1.5rem;
  font-weight: 800;
  color: #111827;
  margin: 0;
`;

const HeaderSubtitle = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0.25rem 0 0;
`;

const StatsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
`;

const StatCard = styled.div<{ $borderColor: string }>`
  background: white;
  border: 1px solid ${({ $borderColor }) => $borderColor};
  border-radius: 12px;
  padding: 1rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    transform: translateY(-1px);
  }
`;

const StatNumber = styled.div<{ $color: string }>`
  font-size: 1.75rem;
  font-weight: 800;
  color: ${({ $color }) => $color};
`;

const StatLabel = styled.div`
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.25rem;
`;

const FilterRow = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
`;

const SearchBox = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 0.5rem 1rem;
  flex: 1;
  min-width: 200px;
`;

const SearchInput = styled.input`
  border: none;
  outline: none;
  font-size: 0.875rem;
  flex: 1;
  color: #111827;

  &::placeholder {
    color: #9ca3af;
  }
`;

const FilterSelect = styled.select`
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  color: #374151;
  background: white;
  cursor: pointer;
  outline: none;

  &:focus {
    border-color: #dc2626;
  }
`;

const ListSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 3rem;
  color: #6b7280;
`;

const EmptyMessage = styled.div`
  text-align: center;
  padding: 3rem;
  color: #6b7280;
`;

const RequestCard = styled.div<{ $borderColor: string }>`
  background: white;
  border: 1px solid ${({ $borderColor }) => $borderColor};
  border-left: 4px solid ${({ $borderColor }) => $borderColor};
  border-radius: 12px;
  padding: 1.25rem;
  display: flex;
  gap: 1rem;
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  }

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const CardLeft = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 0;
`;

const CardTopRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
`;

const RequestCode = styled.span`
  font-weight: 700;
  font-size: 0.875rem;
  color: #dc2626;
`;

const BadgeGroup = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const Badge = styled.span<{ $color: string; $bg: string }>`
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  color: ${({ $color }) => $color};
  background: ${({ $bg }) => $bg};
  white-space: nowrap;
`;

const CardTitle = styled.div`
  font-weight: 600;
  font-size: 1rem;
  color: #111827;
`;


const CardInfoRow = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
`;

const InfoChip = styled.span`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.8125rem;
  color: #6b7280;
`;

const CardRight = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
  flex-shrink: 0;

  @media (max-width: 768px) {
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
  }
`;

const DateText = styled.span`
  font-size: 0.75rem;
  color: #9ca3af;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: white;
  color: #374151;
  font-size: 0.8125rem;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;

  &:hover {
    background: #f9fafb;
    border-color: #d1d5db;
  }
`;

const ActionBtn = styled.button<{ $color: string }>`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  border: 1px solid ${({ $color }) => $color}40;
  border-radius: 6px;
  background: ${({ $color }) => $color}10;
  color: ${({ $color }) => $color};
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;

  &:hover {
    background: ${({ $color }) => $color}20;
    border-color: ${({ $color }) => $color}60;
  }
`;

// ─── Modals ──────────────────────────────────────────────────
const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 16px;
  max-width: 700px;
  width: 100%;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
`;

const ModalTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
`;

const CloseBtn = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #6b7280;
  padding: 0.25rem;

  &:hover {
    color: #111827;
  }
`;

const ModalBody = styled.div`
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #e5e7eb;
  align-items: center;
`;

const ModalCloseBtn = styled.button`
  padding: 0.5rem 1.25rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  color: #374151;
  font-size: 0.875rem;
  cursor: pointer;

  &:hover {
    background: #f9fafb;
  }
`;

const ModalCancelBtn = styled(ModalCloseBtn)``;

const ModalConfirmBtn = styled.button`
  padding: 0.5rem 1.25rem;
  border: none;
  border-radius: 8px;
  background: #dc2626;
  color: white;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: #b91c1c;
  }

  &:disabled {
    background: #d1d5db;
    cursor: not-allowed;
  }
`;

// ─── Form elements in modals ─────────────────────────────────
const FormGroup = styled.div`
  margin-bottom: 1rem;
`;

const FormLabel = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.375rem;
`;

const FormInput = styled.input`
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.875rem;
  outline: none;
  box-sizing: border-box;

  &:focus {
    border-color: #dc2626;
  }
`;

const FormTextarea = styled.textarea`
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.875rem;
  outline: none;
  resize: vertical;
  box-sizing: border-box;

  &:focus {
    border-color: #dc2626;
  }
`;

const CheckboxRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;


// ─── Technician selection ────────────────────────────────────
const TechList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 300px;
  overflow-y: auto;
`;

const TechCard = styled.div<{ $selected: boolean }>`
  padding: 0.75rem 1rem;
  border: 2px solid ${({ $selected }) => ($selected ? "#dc2626" : "#e5e7eb")};
  border-radius: 8px;
  cursor: pointer;
  background: ${({ $selected }) => ($selected ? "#fef2f2" : "white")};
  transition: all 0.2s;

  &:hover {
    border-color: ${({ $selected }) => ($selected ? "#dc2626" : "#d1d5db")};
  }
`;

const TechName = styled.div`
  font-weight: 600;
  font-size: 0.875rem;
  color: #111827;
`;

const TechInfo = styled.div`
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.125rem;
`;

// ─── Diagnosis ───────────────────────────────────────────────
const RadioGroup = styled.div`
  display: flex;
  gap: 0.75rem;
`;

const RadioOption = styled.div<{ $selected: boolean }>`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border: 2px solid ${({ $selected }) => ($selected ? "#dc2626" : "#e5e7eb")};
  border-radius: 8px;
  cursor: pointer;
  background: ${({ $selected }) => ($selected ? "#fef2f2" : "white")};
  color: ${({ $selected }) => ($selected ? "#dc2626" : "#374151")};
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;

  &:hover {
    border-color: ${({ $selected }) => ($selected ? "#dc2626" : "#d1d5db")};
  }
`;
