import { useState, useEffect, useCallback, useContext } from "react";
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
  assignTechnician,
  cancelRescueRequest,
  markSpamRescueRequest,
  arriveRescue,
  startDiagnosis,
  completeRepair,
  createRescueInvoice,
  sendRescueInvoice,
  dispatchTowing,
  completeTowing,
  confirmRescueDeposit,
  confirmRescuePayment,
  getAvailableTechnicians,
  type IAvailableTechnician,
  type IRescueRequest,
} from "@/apis/rescue";
import { rescueStatusStyle } from "@/pages/appointments/rescueStatusConfig";
import { getUsers } from "@/services/admin/userService";
import { getTechnicians } from "@/apis/technicians";
import { toast } from "react-toastify";
import RescueDetailModal from "./RescueDetailModal";
import ProposalModal from "./ProposalModal";
import EditPartsModal from "./EditPartsModal";
import RescueStepProgress from "./RescueStepProgress";
import { AuthContext } from "@/context/AuthContext";

// ─── Common technician shape ──────────────────────────────────
interface ITechEntry {
  id: number;
  fullName: string;
  phone: string;
}

// ─── Component ───────────────────────────────────────────────
const RescueManagement = () => {
  const { t } = useTranslation();
  const { user } = useContext(AuthContext);
  const isSA = user?.roleID === 2;
  const isTech = user?.roleID === 3;
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
  const [showAssignModal, setShowAssignModal] = useState(false);

  // Technicians (users with roleID = 3)
  const [technicians, setTechnicians] = useState<ITechEntry[]>([]);

  // Available technicians for current rescue (from API)
  const [availableTechs, setAvailableTechs] = useState<IAvailableTechnician[]>([]);
  const [loadingAvailableTechs, setLoadingAvailableTechs] = useState(false);

  // Assign form
  const [estimatedArrival, setEstimatedArrival] = useState("");
  const [selectedTechIds, setSelectedTechIds] = useState<Set<number>>(
    new Set(),
  );

  // Start Diagnosis modal
  const [showStartDiagnosisModal, setShowStartDiagnosisModal] = useState(false);
  const [diagnosisNotes, setDiagnosisNotes] = useState("");
  const [canRepairOnSite, setCanRepairOnSite] = useState<boolean | null>(null);

  // Complete Repair modal
  const [showCompleteRepairModal, setShowCompleteRepairModal] = useState(false);
  const [completionNotes, setCompletionNotes] = useState("");

  // Invoice modal
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [rescueServiceFee, setRescueServiceFee] = useState("");
  const [manualDiscount, setManualDiscount] = useState("0");
  const [invoiceNotes, setInvoiceNotes] = useState("");

  // Dispatch towing modal
  const [showDispatchTowingModal, setShowDispatchTowingModal] = useState(false);
  const [towingNotes, setTowingNotes] = useState("");
  const [towingEstimatedArrival, setTowingEstimatedArrival] = useState("");
  const [towingServiceFee, setTowingServiceFee] = useState("");
  const [dispatchTowingSubmitting, setDispatchTowingSubmitting] =
    useState(false);

  // Complete towing modal
  const [showCompleteTowingModal, setShowCompleteTowingModal] = useState(false);
  const [repairOrderNotes, setRepairOrderNotes] = useState("");
  const [completeTowingSubmitting, setCompleteTowingSubmitting] =
    useState(false);

  // Edit parts modal (chỉnh sửa phụ tùng tại REPAIR_COMPLETE)
  const [showEditPartsModal, setShowEditPartsModal] = useState(false);

  // Proposal modal (Đề xuất)
  const [showProposalModal, setShowProposalModal] = useState(false);

  // Spam / Cancel — nhập lý do trước khi gọi API
  const [reasonModal, setReasonModal] = useState<null | {
    type: "spam" | "cancel";
    rescue: IRescueRequest;
  }>(null);
  const [reasonInput, setReasonInput] = useState("");
  const [reasonSubmitting, setReasonSubmitting] = useState(false);

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
      // Ưu tiên lấy tất cả user có roleID=3
      const data = await getUsers();
      const ktv = data
        .filter((u) => u.roleID === 3)
        .map((u) => ({ id: u.userID, fullName: u.fullName, phone: u.phone }));
      if (ktv.length > 0) {
        setTechnicians(ktv);
        return;
      }
    } catch {
      // fallback nếu SA không có quyền truy cập /api/users
    }
    try {
      const data = await getTechnicians();
      setTechnicians(
        data.map((t) => ({
          id: t.technicianId,
          fullName: t.fullName,
          phone: t.phone,
        })),
      );
    } catch (error) {
      console.error("Error fetching technicians:", error);
      toast.error(t("rescueMgrCannotLoadTechs"));
    }
  }, [t]);

  useEffect(() => {
    fetchRescues();
    fetchTechnicians();
  }, [fetchRescues, fetchTechnicians]);

  // ─── Actions ─────────────────────────────────────────────

  const [assignSubmitting, setAssignSubmitting] = useState(false);

  const handleAssignAllTechs = async () => {
    if (!selectedRescue || !estimatedArrival) return;
    if (availableTechs.length === 0) {
      toast.error(t("rescueMgrNoTechnicians"));
      return;
    }
    setAssignSubmitting(true);
    const isoDate = new Date(estimatedArrival).toISOString();
    const targets =
      selectedTechIds.size > 0
        ? availableTechs.filter((t) => selectedTechIds.has(t.userId))
        : availableTechs;
    let successCount = 0;
    const failedNames: string[] = [];

    for (const tech of targets) {
      try {
        await assignTechnician(selectedRescue.rescueId, {
          technicianId: tech.userId,
          estimatedArrivalDateTime: isoDate,
        });
        successCount++;
      } catch {
        failedNames.push(tech.fullName);
      }
    }

    setAssignSubmitting(false);
    if (successCount > 0) {
      toast.success(
        t("rescueMgrAssignSuccessMsg", {
          count: successCount,
          total: targets.length,
        }),
      );
    }
    if (failedNames.length > 0 && successCount === 0) {
      toast.error(t("rescueMgrAssignFailedMsg"));
    } else if (failedNames.length > 0) {
      toast.warning(
        t("rescueMgrAssignPartialFailMsg", {
          count: failedNames.length,
          names: failedNames.join(", "),
        }),
      );
    }
    setShowAssignModal(false);
    setEstimatedArrival("");
    fetchRescues();
  };

  const handleArrive = async (id: number) => {
    try {
      await arriveRescue(id);
      toast.success(t("rescueMgrArriveSuccess"));
      fetchRescues();
    } catch (error) {
      console.error("Error arriving:", error);
      toast.error(t("rescueMgrArriveError"));
    }
  };

  const handleStartDiagnosis = async () => {
    if (!selectedRescue || canRepairOnSite === null) return;
    try {
      await startDiagnosis(selectedRescue.rescueId, {
        diagnosisNotes: diagnosisNotes.trim(),
        canRepairOnSite,
      });
      toast.success(t("rescueMgrSubmitDiagnosisSuccess"));
      setShowStartDiagnosisModal(false);
      setDiagnosisNotes("");
      setCanRepairOnSite(null);
      fetchRescues();
    } catch (error) {
      console.error("Error starting diagnosis:", error);
      toast.error(t("rescueMgrSubmitDiagnosisError"));
    }
  };

  const handleCompleteRepair = async () => {
    if (!selectedRescue) return;
    try {
      await completeRepair(selectedRescue.rescueId, {
        completionNotes: completionNotes.trim() || undefined,
      });
      toast.success(t("rescueMgrCompleteRepairSuccess"));
      setShowCompleteRepairModal(false);
      setCompletionNotes("");
      fetchRescues();
    } catch (error) {
      console.error("Error completing repair:", error);
      toast.error(t("rescueMgrCompleteRepairError"));
    }
  };

  const handleCreateInvoice = async () => {
    if (!selectedRescue || !rescueServiceFee) return;
    try {
      await createRescueInvoice(selectedRescue.rescueId, {
        rescueServiceFee: Number(rescueServiceFee),
        manualDiscount: Number(manualDiscount) || 0,
        notes: invoiceNotes.trim() || undefined,
      });
      toast.success(t("rescueMgrCreateInvoiceSuccess"));
      setShowInvoiceModal(false);
      setRescueServiceFee("");
      setManualDiscount("0");
      setInvoiceNotes("");
      fetchRescues();
    } catch (error) {
      console.error("Error creating invoice:", error);
      toast.error(t("rescueMgrCreateInvoiceError"));
    }
  };

  const handleSendInvoice = async (id: number) => {
    try {
      await sendRescueInvoice(id);
      toast.success(t("rescueMgrSendInvoiceSuccess"));
      fetchRescues();
    } catch (error) {
      console.error("Error sending invoice:", error);
      toast.error(t("rescueMgrSendInvoiceError"));
    }
  };

  const handleDispatchTowing = async () => {
    if (!selectedRescue) return;
    setDispatchTowingSubmitting(true);
    try {
      await dispatchTowing(selectedRescue.rescueId, {
        towingNotes: towingNotes.trim() || undefined,
        estimatedArrival: towingEstimatedArrival || undefined,
        towingServiceFee: towingServiceFee
          ? Number(towingServiceFee)
          : undefined,
      });
      toast.success(t("rescueMgrDispatchTowingSuccess"));
      setShowDispatchTowingModal(false);
      setTowingNotes("");
      setTowingEstimatedArrival("");
      setTowingServiceFee("");
      fetchRescues();
    } catch (error) {
      console.error("Error dispatching towing:", error);
      toast.error(t("rescueMgrDispatchTowingError"));
    } finally {
      setDispatchTowingSubmitting(false);
    }
  };

  const handleCompleteTowing = async () => {
    if (!selectedRescue) return;
    setCompleteTowingSubmitting(true);
    try {
      await completeTowing(selectedRescue.rescueId, {
        repairOrderNotes: repairOrderNotes.trim() || undefined,
      });
      toast.success(t("rescueMgrCompleteTowingSuccess"));
      setShowCompleteTowingModal(false);
      setRepairOrderNotes("");
      fetchRescues();
    } catch (error) {
      console.error("Error completing towing:", error);
      toast.error(t("rescueMgrCompleteTowingError"));
    } finally {
      setCompleteTowingSubmitting(false);
    }
  };

  const handleConfirmDeposit = async (id: number) => {
    try {
      await confirmRescueDeposit(id);
      toast.success(t("rescueMgrDepositConfirmSuccess"));
      fetchRescues();
    } catch {
      toast.error(t("rescueMgrDepositConfirmError"));
    }
  };

  const handleConfirmPayment = async (id: number) => {
    try {
      await confirmRescuePayment(id);
      toast.success(t("rescueMgrPaymentConfirmSuccess"));
      fetchRescues();
    } catch {
      toast.error(t("rescueMgrPaymentConfirmError"));
    }
  };

  const openAssignModal = async (rescue: IRescueRequest) => {
    setSelectedRescue(rescue);
    setEstimatedArrival("");
    setSelectedTechIds(new Set());
    setAvailableTechs([]);
    setShowAssignModal(true);
    setLoadingAvailableTechs(true);
    try {
      const techs = await getAvailableTechnicians(rescue.rescueId);
      setAvailableTechs(techs);
    } catch {
      toast.error(t("rescueMgrCannotLoadTechs"));
    } finally {
      setLoadingAvailableTechs(false);
    }
  };

  const openReasonModal = (type: "spam" | "cancel", rescue: IRescueRequest) => {
    setReasonModal({ type, rescue });
    setReasonInput("");
  };

  const closeReasonModal = () => {
    setReasonModal(null);
    setReasonInput("");
    setReasonSubmitting(false);
  };

  const handleConfirmReason = async () => {
    const trimmed = reasonInput.trim();
    if (!trimmed) {
      toast.error(t("rescueMgrReasonRequired"));
      return;
    }
    if (!reasonModal) return;
    const { type, rescue } = reasonModal;
    try {
      setReasonSubmitting(true);
      if (type === "spam") {
        await markSpamRescueRequest(rescue.rescueId, trimmed);
      } else {
        await cancelRescueRequest(rescue.rescueId, trimmed);
      }
      toast.success(t("rescueMgrStatusUpdated"));
      closeReasonModal();
      fetchRescues();
    } catch (error) {
      console.error("Error submitting reason:", error);
      toast.error(t("rescueMgrStatusError"));
    } finally {
      setReasonSubmitting(false);
    }
  };

  // ─── Filter & count ──────────────────────────────────────
  const totalCount = rescues.length;
  const pendingCount = rescues.filter((r) => r.status === "PENDING").length;
  const activeCount = rescues.filter((r) =>
    [
      "PROPOSED_ROADSIDE",
      "PROPOSED_TOWING",
      "PROPOSAL_ACCEPTED",
      "EN_ROUTE",
      "ON_SITE",
      "DIAGNOSING",
      "REPAIRING",
      "REPAIR_COMPLETE",
      "INVOICED",
      "INVOICE_SENT",
      "PAYMENT_PENDING",
      "PAYMENT_SUBMITTED",
    ].includes(r.status),
  ).length;
  const towingCount = rescues.filter((r) =>
    ["TOWING_DISPATCHED", "TOWING_ACCEPTED", "TOWED"].includes(r.status),
  ).length;
  const completedCount = rescues.filter((r) =>
    ["COMPLETED"].includes(r.status),
  ).length;
  const cancelledCount = rescues.filter((r) =>
    ["CANCELLED", "SPAM"].includes(r.status),
  ).length;

  const filteredRescues = rescues
    .filter((r) => {
      if (filterStatus === "all") return true;
      if (filterStatus === "ACTIVE")
        return [
          "PROPOSED_ROADSIDE",
          "PROPOSED_TOWING",
          "PROPOSAL_ACCEPTED",
          "EN_ROUTE",
          "ON_SITE",
          "DIAGNOSING",
          "REPAIRING",
          "REPAIR_COMPLETE",
          "INVOICED",
          "INVOICE_SENT",
          "PAYMENT_PENDING",
          "PAYMENT_SUBMITTED",
        ].includes(r.status);
      if (filterStatus === "TOWING")
        return ["TOWING_DISPATCHED", "TOWING_ACCEPTED", "TOWED"].includes(
          r.status,
        );
      if (filterStatus === "DONE") return ["COMPLETED"].includes(r.status);
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

  const getStatusInfo = (status: string) => {
    const style = rescueStatusStyle[status];
    if (style)
      return {
        label: t(style.labelKey),
        color: style.color,
        bg: style.bg,
        border: style.border,
      };
    return {
      label: status,
      color: "#6b7280",
      bg: "#f3f4f6",
      border: "#e5e7eb",
    };
  };

  const currentTechId = Number((user as { id?: number; userID?: number } | null)?.id ?? (user as { id?: number; userID?: number } | null)?.userID);

  const isAssignedToCurrentTech = (rescue: IRescueRequest) => {
    if (!isTech || !Number.isFinite(currentTechId)) return false;

    const r = rescue as IRescueRequest & {
      technicianId?: number | null;
      technicianUserId?: number | null;
      assignedTechnicianId?: number | null;
      technician?: { id?: number; userId?: number; technicianId?: number } | null;
      assignedTechnicians?: Array<number | { id?: number; userId?: number; technicianId?: number }>;
    };

    const candidateIds = new Set<number>();

    if (r.technicianId != null) candidateIds.add(Number(r.technicianId));
    if (r.technicianUserId != null) candidateIds.add(Number(r.technicianUserId));
    if (r.assignedTechnicianId != null) candidateIds.add(Number(r.assignedTechnicianId));

    if (r.technician) {
      if (r.technician.id != null) candidateIds.add(Number(r.technician.id));
      if (r.technician.userId != null) candidateIds.add(Number(r.technician.userId));
      if (r.technician.technicianId != null) {
        candidateIds.add(Number(r.technician.technicianId));
      }
    }

    if (Array.isArray(r.assignedTechnicians)) {
      r.assignedTechnicians.forEach((tech) => {
        if (typeof tech === "number") {
          candidateIds.add(Number(tech));
          return;
        }
        if (tech.id != null) candidateIds.add(Number(tech.id));
        if (tech.userId != null) candidateIds.add(Number(tech.userId));
        if (tech.technicianId != null) candidateIds.add(Number(tech.technicianId));
      });
    }

    return candidateIds.has(currentTechId);
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
      // ═══ SA: Tiếp nhận & đề xuất ═══
      case "PENDING":
        if (isSA) {
          actions.push({
            label: t("rescueMgrProposeSolution"),
            icon: <FaClipboardCheck size={12} />,
            color: "#2563eb",
            onClick: () => {
              setSelectedRescue(rescue);
              setShowProposalModal(true);
            },
          });
          actions.push({
            label: t("rescueMgrMarkSpam"),
            icon: <FaBan size={12} />,
            color: "#6b7280",
            onClick: () => openReasonModal("spam", rescue),
          });
          actions.push({
            label: t("rescueMgrCancel"),
            icon: <FaTimes size={12} />,
            color: "#dc2626",
            onClick: () => openReasonModal("cancel", rescue),
          });
        }
        break;

      // ═══ SA: Chờ khách hàng xác nhận đề xuất ═══
      case "PROPOSED_ROADSIDE":
        if (isSA) {
          // Không điều KTV ở bước này — đợi KH xác nhận trước
          actions.push({
            label: t("rescueMgrCancel"),
            icon: <FaTimes size={12} />,
            color: "#dc2626",
            onClick: () => openReasonModal("cancel", rescue),
          });
        }
        break;

      case "PROPOSED_TOWING":
        if (isSA) {
          actions.push({
            label: t("rescueMgrDispatchTowingAction"),
            icon: <FaTruck size={12} />,
            color: "#0891b2",
            onClick: () => {
              setSelectedRescue(rescue);
              setTowingNotes("");
              setTowingEstimatedArrival("");
              setTowingServiceFee("");
              setShowDispatchTowingModal(true);
            },
          });
          actions.push({
            label: t("rescueMgrCancel"),
            icon: <FaTimes size={12} />,
            color: "#dc2626",
            onClick: () => openReasonModal("cancel", rescue),
          });
        }
        break;

      // ═══ PROPOSAL_ACCEPTED ═══
      // Nhánh 1: Không cần cọc | Cọc đã xác nhận → điều KTV
      // Nhánh 2: Cần cọc, KH đã trả, SA chưa xác nhận → xác nhận cọc
      // Nhánh 3: Cần cọc, KH chưa trả → chờ KH (chỉ hiện huỷ)
      case "PROPOSAL_ACCEPTED":
        if (isSA) {
          const needsDeposit = rescue.requiresDeposit === true || (rescue.depositAmount != null && rescue.depositAmount > 0);
          if (!needsDeposit || rescue.isDepositConfirmed) {
            // Không cần cọc hoặc đã xác nhận cọc → điều KTV
            actions.push({
              label: t("rescueMgrDispatchTech"),
              icon: <FaUserCog size={12} />,
              color: "#0891b2",
              onClick: () => openAssignModal(rescue),
            });
          } else if (rescue.isDepositPaid && !rescue.isDepositConfirmed) {
            // KH đã trả cọc, SA cần xác nhận
            actions.push({
              label: t("rescueMgrConfirmDeposit"),
              icon: <FaMoneyBillWave size={12} />,
              color: "#16a34a",
              onClick: () => handleConfirmDeposit(rescue.rescueId),
            });
          }
          // Nhánh 3: KH chưa trả cọc → SA chỉ chờ, không có action ngoài huỷ
          actions.push({
            label: t("rescueMgrCancel"),
            icon: <FaTimes size={12} />,
            color: "#dc2626",
            onClick: () => openReasonModal("cancel", rescue),
          });
        }
        break;

      // ═══ EN_ROUTE: KTV xác nhận đến nơi ═══
      case "EN_ROUTE":
        if (isTech && isAssignedToCurrentTech(rescue)) {
          actions.push({
            label: t("rescueMgrConfirmArrived"),
            icon: <FaMapMarkerAlt size={12} />,
            color: "#0d9488",
            onClick: () => handleArrive(rescue.rescueId),
          });
        }
        if (isSA) {
          actions.push({
            label: t("rescueMgrCancel"),
            icon: <FaTimes size={12} />,
            color: "#dc2626",
            onClick: () => openReasonModal("cancel", rescue),
          });
        }
        break;

      // ═══ KTV: Tới hiện trường → bắt đầu chẩn đoán ═══
      case "ON_SITE":
        if (isTech && isAssignedToCurrentTech(rescue)) {
          actions.push({
            label: t("rescueMgrStartDiagnosisAction"),
            icon: <FaTools size={12} />,
            color: "#ea580c",
            onClick: () => {
              setSelectedRescue(rescue);
              setDiagnosisNotes("");
              setCanRepairOnSite(null);
              setShowStartDiagnosisModal(true);
            },
          });
        }
        if (isSA) {
          actions.push({
            label: t("rescueMgrCancel"),
            icon: <FaTimes size={12} />,
            color: "#dc2626",
            onClick: () => openReasonModal("cancel", rescue),
          });
        }
        break;

      // ═══ KTV: Ghi nhận vật tư → REPAIRING | SA: điều xe kéo nếu cần ═══
      case "DIAGNOSING":
        if (isTech && isAssignedToCurrentTech(rescue)) {
          actions.push({
            label: t("rescueMgrEditPartsAction"),
            icon: <FaWrench size={12} />,
            color: "#2563eb",
            onClick: () => {
              setSelectedRescue(rescue);
              setShowEditPartsModal(true);
            },
          });
        }
        if (isSA) {
          actions.push({
            label: t("rescueMgrDispatchTowingAction"),
            icon: <FaTruck size={12} />,
            color: "#0891b2",
            onClick: () => {
              setSelectedRescue(rescue);
              setTowingNotes("");
              setTowingEstimatedArrival("");
              setTowingServiceFee("");
              setShowDispatchTowingModal(true);
            },
          });
          actions.push({
            label: t("rescueMgrCancel"),
            icon: <FaTimes size={12} />,
            color: "#dc2626",
            onClick: () => openReasonModal("cancel", rescue),
          });
        }
        break;

      // ═══ KTV: Sửa tại chỗ ═══
      case "REPAIRING":
        if (isTech && isAssignedToCurrentTech(rescue)) {
          actions.push({
            label: t("rescueMgrCompleteRepairAction"),
            icon: <FaWrench size={12} />,
            color: "#16a34a",
            onClick: () => {
              setSelectedRescue(rescue);
              setCompletionNotes("");
              setShowCompleteRepairModal(true);
            },
          });
        }
        if (isSA) {
          actions.push({
            label: t("rescueMgrCancel"),
            icon: <FaTimes size={12} />,
            color: "#dc2626",
            onClick: () => openReasonModal("cancel", rescue),
          });
        }
        break;

      // ═══ SA + KTV: Chỉnh sửa phụ tùng, SA tạo hóa đơn ═══
      case "REPAIR_COMPLETE":
        if (isSA || (isTech && isAssignedToCurrentTech(rescue))) {
          actions.push({
            label: t("rescueMgrEditPartsAction"),
            icon: <FaWrench size={12} />,
            color: "#2563eb",
            onClick: () => {
              setSelectedRescue(rescue);
              setShowEditPartsModal(true);
            },
          });
        }
        if (isSA) {
          actions.push({
            label: t("rescueMgrCreateInvoiceAction"),
            icon: <FaFileInvoiceDollar size={12} />,
            color: "#7c3aed",
            onClick: () => {
              setSelectedRescue(rescue);
              setRescueServiceFee("");
              setManualDiscount("0");
              setInvoiceNotes("");
              setShowInvoiceModal(true);
            },
          });
          actions.push({
            label: t("rescueMgrCancel"),
            icon: <FaTimes size={12} />,
            color: "#dc2626",
            onClick: () => openReasonModal("cancel", rescue),
          });
        }
        break;

      // ═══ Kéo xe flow ═══
      case "TOWING_DISPATCHED":
        // Customer needs to accept-towing; SA only monitors
        if (isSA) {
          actions.push({
            label: t("rescueMgrCancel"),
            icon: <FaTimes size={12} />,
            color: "#dc2626",
            onClick: () => openReasonModal("cancel", rescue),
          });
        }
        break;

      case "TOWING_ACCEPTED":
        if (isSA) {
          actions.push({
            label: t("rescueMgrTowedToGarageAction"),
            icon: <FaTruck size={12} />,
            color: "#0d9488",
            onClick: () => {
              setSelectedRescue(rescue);
              setRepairOrderNotes("");
              setShowCompleteTowingModal(true);
            },
          });
          actions.push({
            label: t("rescueMgrCancel"),
            icon: <FaTimes size={12} />,
            color: "#dc2626",
            onClick: () => openReasonModal("cancel", rescue),
          });
        }
        break;

      case "TOWED":
        if (isSA) {
          actions.push({
            label: t("rescueMgrCreateInvoiceAction"),
            icon: <FaFileInvoiceDollar size={12} />,
            color: "#7c3aed",
            onClick: () => {
              setSelectedRescue(rescue);
              setRescueServiceFee("");
              setManualDiscount("0");
              setInvoiceNotes("");
              setShowInvoiceModal(true);
            },
          });
          actions.push({
            label: t("rescueMgrCancel"),
            icon: <FaTimes size={12} />,
            color: "#dc2626",
            onClick: () => openReasonModal("cancel", rescue),
          });
        }
        break;

      // ═══ SA: Gửi hóa đơn ═══
      case "INVOICED":
        if (isSA) {
          actions.push({
            label: t("rescueMgrSendInvoiceAction"),
            icon: <FaFileInvoiceDollar size={12} />,
            color: "#7c3aed",
            onClick: () => handleSendInvoice(rescue.rescueId),
          });
          actions.push({
            label: t("rescueMgrCancel"),
            icon: <FaTimes size={12} />,
            color: "#dc2626",
            onClick: () => openReasonModal("cancel", rescue),
          });
        }
        break;

      // ═══ SA: Chờ khách hàng thanh toán ═══
      case "INVOICE_SENT":
      case "PAYMENT_PENDING":
        if (isSA) {
          actions.push({
            label: t("rescueMgrCancel"),
            icon: <FaTimes size={12} />,
            color: "#dc2626",
            onClick: () => openReasonModal("cancel", rescue),
          });
        }
        break;

      // ═══ SA: Khách đã thanh toán → xác nhận đã nhận tiền ═══
      case "PAYMENT_SUBMITTED":
        if (isSA) {
          actions.push({
            label: t("rescueMgrConfirmPaymentAction"),
            icon: <FaMoneyBillWave size={12} />,
            color: "#16a34a",
            onClick: () => handleConfirmPayment(rescue.rescueId),
          });
          actions.push({
            label: t("rescueMgrCancel"),
            icon: <FaTimes size={12} />,
            color: "#dc2626",
            onClick: () => openReasonModal("cancel", rescue),
          });
        }
        break;
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
          {Object.keys(rescueStatusStyle).map((key) => (
            <option key={key} value={key}>
              {t(rescueStatusStyle[key].labelKey)}
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
              <RequestCard key={item.rescueId} $borderColor={statusInfo.border}>
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
                        {t("rescueServiceAdvisorLabel")}: {item.serviceAdvisorName}
                      </InfoChip>
                    </CardInfoRow>
                  )}

                  <RescueStepProgress status={item.status} />
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
                <FormLabel>
                  {loadingAvailableTechs
                    ? t("rescueMgrCannotLoadTechs")
                    : selectedTechIds.size > 0
                      ? t("rescueMgrTechSelectedCount", {
                          selected: selectedTechIds.size,
                          total: availableTechs.length,
                        })
                      : t("rescueMgrTechNoSelection", {
                          count: availableTechs.length,
                        })}
                </FormLabel>
                <TechList>
                  {availableTechs.map((tech) => {
                    const isSelected = selectedTechIds.has(tech.userId);
                    return (
                      <TechCard
                        key={tech.userId}
                        $selected={isSelected}
                        onClick={() => {
                          setSelectedTechIds((prev) => {
                            const next = new Set(prev);
                            if (next.has(tech.userId)) next.delete(tech.userId);
                            else next.add(tech.userId);
                            return next;
                          });
                        }}
                      >
                        <TechName>{tech.fullName}</TechName>
                        <TechInfo>{tech.phone}</TechInfo>
                        {tech.skills && <TechInfo>{tech.skills}</TechInfo>}
                        {tech.isOnRescueMission && (
                          <TechInfo style={{ color: "#d97706" }}>
                            {t("rescueMgrTechOnMission", { count: tech.activeJobCount })}
                          </TechInfo>
                        )}
                      </TechCard>
                    );
                  })}
                </TechList>
              </FormGroup>
              <FormGroup>
                <FormLabel>{t("rescueMgrEstimatedArrivalLabel")}</FormLabel>
                <FormInput
                  type="datetime-local"
                  value={estimatedArrival}
                  onChange={(e) => setEstimatedArrival(e.target.value)}
                />
              </FormGroup>
            </ModalBody>
            <ModalFooter>
              <ModalCancelBtn onClick={() => setShowAssignModal(false)}>
                {t("rescueMgrCancel")}
              </ModalCancelBtn>
              <ModalConfirmBtn
                onClick={handleAssignAllTechs}
                disabled={!estimatedArrival || assignSubmitting}
              >
                {assignSubmitting
                  ? t("rescueMgrSending")
                  : selectedTechIds.size > 0
                    ? t("rescueMgrSendToSelected", {
                        count: selectedTechIds.size,
                      })
                    : t("rescueMgrSendToAll", { count: technicians.length })}
              </ModalConfirmBtn>
            </ModalFooter>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* ─── Proposal Modal (Đề xuất) ─── */}
      {showProposalModal && selectedRescue && (
        <ProposalModal
          rescue={selectedRescue}
          onClose={() => setShowProposalModal(false)}
          onSuccess={() => {
            setShowProposalModal(false);
            fetchRescues();
          }}
        />
      )}

      {/* ─── Start Diagnosis Modal ─── */}
      {showStartDiagnosisModal && selectedRescue && (
        <ModalOverlay onClick={() => setShowStartDiagnosisModal(false)}>
          <ModalContent
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "500px" }}
          >
            <ModalHeader>
              <ModalTitle>{t("rescueMgrDiagnosisModalTitle")}</ModalTitle>
              <CloseBtn onClick={() => setShowStartDiagnosisModal(false)}>
                <FaTimes />
              </CloseBtn>
            </ModalHeader>
            <ModalBody>
              <FormGroup>
                <FormLabel>{t("rescueMgrDiagnosisNotesLabel")}</FormLabel>
                <FormTextarea
                  value={diagnosisNotes}
                  onChange={(e) => setDiagnosisNotes(e.target.value)}
                  rows={4}
                  placeholder={t("rescueMgrDiagnosisPlaceholder")}
                />
              </FormGroup>
              <FormGroup>
                <FormLabel>{t("rescueMgrCanRepairOnSiteLabel")}</FormLabel>
                <RadioGroup>
                  <RadioOption
                    $selected={canRepairOnSite === true}
                    onClick={() => setCanRepairOnSite(true)}
                  >
                    <FaCheck size={14} />
                    {t("rescueMgrYesFixOnSite")}
                  </RadioOption>
                  <RadioOption
                    $selected={canRepairOnSite === false}
                    onClick={() => setCanRepairOnSite(false)}
                  >
                    <FaTruck size={14} />
                    {t("rescueMgrNoNeedTow")}
                  </RadioOption>
                </RadioGroup>
              </FormGroup>
            </ModalBody>
            <ModalFooter>
              <ModalCancelBtn onClick={() => setShowStartDiagnosisModal(false)}>
                {t("rescueMgrCancel")}
              </ModalCancelBtn>
              <ModalConfirmBtn
                onClick={handleStartDiagnosis}
                disabled={!diagnosisNotes.trim() || canRepairOnSite === null}
              >
                {t("rescueMgrSubmitDiagnosisBtn")}
              </ModalConfirmBtn>
            </ModalFooter>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* ─── Complete Repair Modal ─── */}
      {showCompleteRepairModal && selectedRescue && (
        <ModalOverlay onClick={() => setShowCompleteRepairModal(false)}>
          <ModalContent
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "500px" }}
          >
            <ModalHeader>
              <ModalTitle>{t("rescueMgrCompleteRepairModalTitle")}</ModalTitle>
              <CloseBtn onClick={() => setShowCompleteRepairModal(false)}>
                <FaTimes />
              </CloseBtn>
            </ModalHeader>
            <ModalBody>
              <FormGroup>
                <FormLabel>{t("rescueMgrCompletionNotesLabel")}</FormLabel>
                <FormTextarea
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  rows={4}
                  placeholder={t("rescueMgrCompletionNotesPlaceholder")}
                />
              </FormGroup>
            </ModalBody>
            <ModalFooter>
              <ModalCancelBtn onClick={() => setShowCompleteRepairModal(false)}>
                {t("rescueMgrCancel")}
              </ModalCancelBtn>
              <ModalConfirmBtn onClick={handleCompleteRepair}>
                {t("rescueMgrConfirmCompleteBtn")}
              </ModalConfirmBtn>
            </ModalFooter>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* ─── Create Invoice Modal ─── */}
      {showInvoiceModal && selectedRescue && (
        <ModalOverlay onClick={() => setShowInvoiceModal(false)}>
          <ModalContent
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "500px" }}
          >
            <ModalHeader>
              <ModalTitle>{t("rescueMgrCreateInvoiceModalTitle")}</ModalTitle>
              <CloseBtn onClick={() => setShowInvoiceModal(false)}>
                <FaTimes />
              </CloseBtn>
            </ModalHeader>
            <ModalBody>
              <FormGroup>
                <FormLabel>{t("rescueMgrServiceFeeLabel")}</FormLabel>
                <FormInput
                  type="number"
                  value={rescueServiceFee}
                  onChange={(e) => setRescueServiceFee(e.target.value)}
                  placeholder={t("rescueMgrServiceFeePlaceholder")}
                />
              </FormGroup>
              <FormGroup>
                <FormLabel>{t("rescueMgrDiscountLabel")}</FormLabel>
                <FormInput
                  type="number"
                  value={manualDiscount}
                  onChange={(e) => setManualDiscount(e.target.value)}
                  placeholder={t("zeroPlaceholder")}
                />
              </FormGroup>
              <FormGroup>
                <FormLabel>{t("rescueMgrNote")}</FormLabel>
                <FormTextarea
                  value={invoiceNotes}
                  onChange={(e) => setInvoiceNotes(e.target.value)}
                  rows={3}
                  placeholder={t("rescueMgrInvoiceNotesPlaceholder")}
                />
              </FormGroup>
            </ModalBody>
            <ModalFooter>
              <ModalCancelBtn onClick={() => setShowInvoiceModal(false)}>
                {t("rescueMgrCancel")}
              </ModalCancelBtn>
              <ModalConfirmBtn
                onClick={handleCreateInvoice}
                disabled={!rescueServiceFee}
              >
                {t("rescueMgrCreateInvoiceBtn")}
              </ModalConfirmBtn>
            </ModalFooter>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* ─── Dispatch Towing Modal ─── */}
      {showDispatchTowingModal && selectedRescue && (
        <ModalOverlay onClick={() => setShowDispatchTowingModal(false)}>
          <ModalContent
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "500px" }}
          >
            <ModalHeader>
              <ModalTitle>{t("rescueMgrDispatchTowingModalTitle")}</ModalTitle>
              <CloseBtn
                onClick={() => setShowDispatchTowingModal(false)}
                disabled={dispatchTowingSubmitting}
              >
                <FaTimes />
              </CloseBtn>
            </ModalHeader>
            <ModalBody>
              <FormGroup>
                <FormLabel>{t("rescueMgrTowingNotesLabel")}</FormLabel>
                <FormTextarea
                  value={towingNotes}
                  onChange={(e) => setTowingNotes(e.target.value)}
                  rows={3}
                  placeholder={t("rescueMgrTowingNotesPlaceholder")}
                  disabled={dispatchTowingSubmitting}
                />
              </FormGroup>
              <FormGroup>
                <FormLabel>{t("rescueMgrEstimatedArrivalOptional")}</FormLabel>
                <FormInput
                  type="datetime-local"
                  value={towingEstimatedArrival}
                  onChange={(e) => setTowingEstimatedArrival(e.target.value)}
                  disabled={dispatchTowingSubmitting}
                />
              </FormGroup>
              <FormGroup>
                <FormLabel>{t("rescueMgrTowingFeeLabel")}</FormLabel>
                <FormInput
                  type="number"
                  value={towingServiceFee}
                  onChange={(e) => setTowingServiceFee(e.target.value)}
                  placeholder={t("rescueMgrTowingFeePlaceholder")}
                  disabled={dispatchTowingSubmitting}
                />
              </FormGroup>
            </ModalBody>
            <ModalFooter>
              <ModalCancelBtn
                onClick={() => setShowDispatchTowingModal(false)}
                disabled={dispatchTowingSubmitting}
              >
                {t("rescueMgrCancel")}
              </ModalCancelBtn>
              <ModalConfirmBtn
                onClick={handleDispatchTowing}
                disabled={dispatchTowingSubmitting}
              >
                {dispatchTowingSubmitting
                  ? t("rescueMgrSending")
                  : t("rescueMgrDispatchTowingBtn")}
              </ModalConfirmBtn>
            </ModalFooter>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* ─── Complete Towing Modal ─── */}
      {showCompleteTowingModal && selectedRescue && (
        <ModalOverlay onClick={() => setShowCompleteTowingModal(false)}>
          <ModalContent
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "500px" }}
          >
            <ModalHeader>
              <ModalTitle>{t("rescueMgrCompleteTowingModalTitle")}</ModalTitle>
              <CloseBtn
                onClick={() => setShowCompleteTowingModal(false)}
                disabled={completeTowingSubmitting}
              >
                <FaTimes />
              </CloseBtn>
            </ModalHeader>
            <ModalBody>
              <FormGroup>
                <FormLabel>{t("rescueMgrRepairOrderNotesLabel")}</FormLabel>
                <FormTextarea
                  value={repairOrderNotes}
                  onChange={(e) => setRepairOrderNotes(e.target.value)}
                  rows={3}
                  placeholder={t("rescueMgrRepairOrderNotesPlaceholder")}
                  disabled={completeTowingSubmitting}
                />
              </FormGroup>
            </ModalBody>
            <ModalFooter>
              <ModalCancelBtn
                onClick={() => setShowCompleteTowingModal(false)}
                disabled={completeTowingSubmitting}
              >
                {t("rescueMgrCancel")}
              </ModalCancelBtn>
              <ModalConfirmBtn
                onClick={handleCompleteTowing}
                disabled={completeTowingSubmitting}
              >
                {completeTowingSubmitting
                  ? t("rescueMgrProcessing")
                  : t("rescueMgrConfirmAtGarageBtn")}
              </ModalConfirmBtn>
            </ModalFooter>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* ─── Edit Parts Modal (DIAGNOSING / REPAIR_COMPLETE — SA & KTV) ─── */}
      {showEditPartsModal && selectedRescue && (
        <EditPartsModal
          rescue={selectedRescue}
          actorId={user?.id ? Number(user.id) : undefined}
          onClose={() => setShowEditPartsModal(false)}
          onSuccess={() => {
            setShowEditPartsModal(false);
            fetchRescues();
          }}
        />
      )}

      {/* ─── Spam / Cancel reason modal ─── */}
      {reasonModal && (
        <ModalOverlay onClick={closeReasonModal}>
          <ModalContent
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "500px" }}
          >
            <ModalHeader>
              <ModalTitle>
                {reasonModal.type === "spam"
                  ? t("rescueMgrSpamReasonModalTitle")
                  : t("rescueMgrCancelRescueModalTitle")}
              </ModalTitle>
              <CloseBtn onClick={closeReasonModal} disabled={reasonSubmitting}>
                <FaTimes />
              </CloseBtn>
            </ModalHeader>
            <ModalBody>
              <FormGroup>
                <FormLabel>
                  {reasonModal.type === "spam"
                    ? t("rescueMgrSpamReasonLabel")
                    : t("rescueMgrCancelReasonLabel")}{" "}
                  *
                </FormLabel>
                <FormTextarea
                  value={reasonInput}
                  onChange={(e) => setReasonInput(e.target.value)}
                  rows={4}
                  placeholder={
                    reasonModal.type === "spam"
                      ? t("rescueMgrSpamReasonPlaceholder")
                      : t("rescueMgrCancelReasonPlaceholder")
                  }
                  disabled={reasonSubmitting}
                />
              </FormGroup>
            </ModalBody>
            <ModalFooter>
              <ModalCancelBtn
                onClick={closeReasonModal}
                disabled={reasonSubmitting}
              >
                {t("rescueMgrCancel")}
              </ModalCancelBtn>
              <ModalConfirmBtn
                onClick={handleConfirmReason}
                disabled={reasonSubmitting}
              >
                {reasonSubmitting ? t("loading") : t("rescueMgrConfirmSubmit")}
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
  color: #111827;
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
  color: #111827;
  background: #ffffff;

  &::placeholder {
    color: #9ca3af;
  }

  &:disabled {
    color: #6b7280;
    background: #f9fafb;
  }

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
  color: #111827;
  background: #ffffff;

  &::placeholder {
    color: #9ca3af;
  }

  &:disabled {
    color: #6b7280;
    background: #f9fafb;
  }

  &:focus {
    border-color: #dc2626;
  }
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
  border: 2px solid ${({ $selected }) => ($selected ? "#2563eb" : "#e5e7eb")};
  border-radius: 8px;
  cursor: pointer;
  background: ${({ $selected }) => ($selected ? "#eff6ff" : "white")};
  transition: all 0.2s;

  &:hover {
    border-color: ${({ $selected }) => ($selected ? "#1d4ed8" : "#d1d5db")};
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
