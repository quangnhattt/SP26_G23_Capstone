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
  updateRescueStatus,
  assignTechnician,
  sendRescueQuote,
  cancelRescueRequest,
  markSpamRescueRequest,
  acceptRescueJob,
  arriveRescue,
  startDiagnosis,
  completeRepair,
  createRescueInvoice,
  sendRescueInvoice,
  type IRescueRequest,
  type RescueStatus,
} from "@/apis/rescue";
import { getTechnicians, type ITechnician } from "@/apis/technicians";
import { toast } from "react-toastify";
import RescueDetailModal from "./RescueDetailModal";
import ProposalModal from "./ProposalModal";
import RescueStepProgress from "./RescueStepProgress";
import { AuthContext } from "@/context/AuthContext";

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
  EN_ROUTE: {
    label: "KTV đang đến",
    color: "#0891b2",
    bg: "#cffafe",
    border: "#67e8f9",
  },
  ON_SITE: {
    label: "KTV đã đến nơi",
    color: "#0d9488",
    bg: "#ccfbf1",
    border: "#5eead4",
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
  REPAIR_COMPLETED: {
    label: "Sửa xong",
    color: "#16a34a",
    bg: "#dcfce7",
    border: "#86efac",
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
  PROPOSED_ROADSIDE: {
    label: "Đề xuất sửa tại chỗ",
    color: "#2563eb",
    bg: "#dbeafe",
    border: "#93c5fd",
  },
  PROPOSED_TOWING: {
    label: "Đề xuất kéo xe",
    color: "#ea580c",
    bg: "#fff7ed",
    border: "#fdba74",
  },
  INVOICED: {
    label: "Đã xuất hóa đơn",
    color: "#7c3aed",
    bg: "#ede9fe",
    border: "#c4b5fd",
  },
  INVOICE_SENT: {
    label: "Đã gửi hóa đơn",
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
  const [estimatedArrival, setEstimatedArrival] = useState("");

  // Diagnosis form
  const [canFixOnSite, setCanFixOnSite] = useState<boolean | null>(null);
  const [diagnosisNote, setDiagnosisNote] = useState("");

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

  // Proposal modal (Đề xuất)
  const [showProposalModal, setShowProposalModal] = useState(false);

  // Spam / Cancel — nhập lý do trước khi gọi API
  const [reasonModal, setReasonModal] = useState<
    null | { type: "spam" | "cancel"; rescue: IRescueRequest }
  >(null);
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

  const [assignSubmitting, setAssignSubmitting] = useState(false);

  const handleAssignAllTechs = async () => {
    if (!selectedRescue || !estimatedArrival || technicians.length === 0) return;
    setAssignSubmitting(true);
    const isoDate = new Date(estimatedArrival).toISOString();
    const errors: string[] = [];

    const promises = technicians.map((tech) =>
      assignTechnician(selectedRescue.rescueId, {
        technicianId: tech.technicianId,
        estimatedArrivalDateTime: isoDate,
      }).catch(() => {
        errors.push(tech.fullName);
      }),
    );
    await Promise.all(promises);

    setAssignSubmitting(false);
    const successCount = technicians.length - errors.length;
    if (successCount > 0) {
      toast.success(`Đã gửi yêu cầu đến ${successCount} kỹ thuật viên!`);
    }
    if (errors.length > 0 && successCount === 0) {
      toast.error(t("rescueMgrAssignError"));
    }
    setShowAssignModal(false);
    setEstimatedArrival("");
    fetchRescues();
  };

  const handleAcceptJob = async (id: number) => {
    try {
      await acceptRescueJob(id);
      toast.success("KTV đã nhận job!");
      fetchRescues();
    } catch (error) {
      console.error("Error accepting job:", error);
      toast.error("Nhận job thất bại!");
    }
  };

  const handleArrive = async (id: number) => {
    try {
      await arriveRescue(id);
      toast.success("KTV đã xác nhận đến nơi!");
      fetchRescues();
    } catch (error) {
      console.error("Error arriving:", error);
      toast.error("Xác nhận đến nơi thất bại!");
    }
  };

  const handleStartDiagnosis = async () => {
    if (!selectedRescue || canRepairOnSite === null) return;
    try {
      await startDiagnosis(selectedRescue.rescueId, {
        diagnosisNotes: diagnosisNotes.trim(),
        canRepairOnSite,
      });
      toast.success("Đã gửi kết quả chẩn đoán!");
      setShowStartDiagnosisModal(false);
      setDiagnosisNotes("");
      setCanRepairOnSite(null);
      fetchRescues();
    } catch (error) {
      console.error("Error starting diagnosis:", error);
      toast.error("Gửi chẩn đoán thất bại!");
    }
  };

  const handleCompleteRepair = async () => {
    if (!selectedRescue) return;
    try {
      await completeRepair(selectedRescue.rescueId, {
        completionNotes: completionNotes.trim() || undefined,
      });
      toast.success("Đã báo hoàn tất sửa chữa!");
      setShowCompleteRepairModal(false);
      setCompletionNotes("");
      fetchRescues();
    } catch (error) {
      console.error("Error completing repair:", error);
      toast.error("Báo hoàn tất thất bại!");
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
      toast.success("Đã tạo hóa đơn!");
      setShowInvoiceModal(false);
      setRescueServiceFee("");
      setManualDiscount("0");
      setInvoiceNotes("");
      fetchRescues();
    } catch (error) {
      console.error("Error creating invoice:", error);
      toast.error("Tạo hóa đơn thất bại!");
    }
  };

  const handleSendInvoice = async (id: number) => {
    try {
      await sendRescueInvoice(id);
      toast.success("Đã gửi hóa đơn cho khách hàng!");
      fetchRescues();
    } catch (error) {
      console.error("Error sending invoice:", error);
      toast.error("Gửi hóa đơn thất bại!");
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
    ["ACCEPTED", "EVALUATING", "QUOTE_SENT", "PROPOSED_ROADSIDE", "PROPOSED_TOWING", "CUSTOMER_APPROVED", "TECHNICIAN_DISPATCHED", "EN_ROUTE", "ON_SITE", "RESCUE_VEHICLE_DISPATCHED", "DIAGNOSING", "REPAIRING_ON_SITE", "REPAIR_COMPLETED", "INVOICED", "INVOICE_SENT"].includes(r.status),
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
        return ["ACCEPTED", "EVALUATING", "QUOTE_SENT", "PROPOSED_ROADSIDE", "PROPOSED_TOWING", "CUSTOMER_APPROVED", "TECHNICIAN_DISPATCHED", "EN_ROUTE", "ON_SITE", "RESCUE_VEHICLE_DISPATCHED", "DIAGNOSING", "REPAIRING_ON_SITE", "REPAIR_COMPLETED", "INVOICED", "INVOICE_SENT"].includes(r.status);
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
      // ═══ SA-only steps ═══
      case "PENDING":
        if (isSA) {
          actions.push({
            label: "Đề xuất",
            icon: <FaClipboardCheck size={12} />,
            color: "#2563eb",
            onClick: () => { setSelectedRescue(rescue); setShowProposalModal(true); },
          });
          actions.push({
            label: t("rescueMgrMarkSpam"),
            icon: <FaBan size={12} />,
            color: "#6b7280",
            onClick: () => openReasonModal("spam", rescue),
          });
        }
        break;

      case "ACCEPTED":
        if (isSA) {
          actions.push({
            label: t("rescueMgrEvaluate"),
            icon: <FaClipboardCheck size={12} />,
            color: "#2563eb",
            onClick: () => handleUpdateStatus(rescue.rescueId, "EVALUATING"),
          });
        }
        break;

      case "EVALUATING":
        if (isSA) {
          actions.push({
            label: t("rescueMgrSendQuote"),
            icon: <FaFileInvoiceDollar size={12} />,
            color: "#7c3aed",
            onClick: () => { setSelectedRescue(rescue); setDepositRequired(false); setShowQuoteModal(true); },
          });
        }
        break;

      case "PROPOSED_ROADSIDE":
      case "CUSTOMER_APPROVED":
        if (isSA) {
          actions.push({
            label: t("rescueMgrDispatchTech"),
            icon: <FaUserCog size={12} />,
            color: "#0891b2",
            onClick: () => { setSelectedRescue(rescue); setEstimatedArrival(""); setShowAssignModal(true); },
          });
          actions.push({ label: t("rescueMgrCancel"), icon: <FaTimes size={12} />, color: "#dc2626", onClick: () => openReasonModal("cancel", rescue) });
        }
        break;

      // ═══ Technician steps ═══
      case "TECHNICIAN_DISPATCHED":
        if (isTech) {
          actions.push({
            label: "Nhận job",
            icon: <FaCheck size={12} />,
            color: "#0891b2",
            onClick: () => handleAcceptJob(rescue.rescueId),
          });
        }
        if (isSA) {
          actions.push({ label: t("rescueMgrCancel"), icon: <FaTimes size={12} />, color: "#dc2626", onClick: () => openReasonModal("cancel", rescue) });
        }
        break;

      case "EN_ROUTE":
        if (isTech) {
          actions.push({
            label: "Xác nhận đã đến nơi",
            icon: <FaMapMarkerAlt size={12} />,
            color: "#0d9488",
            onClick: () => handleArrive(rescue.rescueId),
          });
        }
        if (isSA) {
          actions.push({ label: t("rescueMgrCancel"), icon: <FaTimes size={12} />, color: "#dc2626", onClick: () => openReasonModal("cancel", rescue) });
        }
        break;

      case "ON_SITE":
      case "DIAGNOSING":
        if (isTech) {
          actions.push({
            label: "Bắt đầu chẩn đoán",
            icon: <FaTools size={12} />,
            color: "#ea580c",
            onClick: () => { setSelectedRescue(rescue); setDiagnosisNotes(""); setCanRepairOnSite(null); setShowStartDiagnosisModal(true); },
          });
        }
        if (isSA) {
          actions.push({ label: t("rescueMgrCancel"), icon: <FaTimes size={12} />, color: "#dc2626", onClick: () => openReasonModal("cancel", rescue) });
        }
        break;

      case "RESCUE_VEHICLE_DISPATCHED":
        if (isTech) {
          actions.push({
            label: t("rescueMgrDiagnose"),
            icon: <FaTools size={12} />,
            color: "#ea580c",
            onClick: () => { setSelectedRescue(rescue); setShowDiagnosisModal(true); },
          });
        }
        if (isSA) {
          actions.push({ label: t("rescueMgrCancel"), icon: <FaTimes size={12} />, color: "#dc2626", onClick: () => openReasonModal("cancel", rescue) });
        }
        break;

      case "REPAIRING_ON_SITE":
        if (isTech) {
          actions.push({
            label: "Hoàn tất sửa chữa",
            icon: <FaWrench size={12} />,
            color: "#16a34a",
            onClick: () => { setSelectedRescue(rescue); setCompletionNotes(""); setShowCompleteRepairModal(true); },
          });
        }
        if (isSA) {
          actions.push({ label: t("rescueMgrCancel"), icon: <FaTimes size={12} />, color: "#dc2626", onClick: () => openReasonModal("cancel", rescue) });
        }
        break;

      // ═══ SA-only steps (invoice flow) ═══
      case "REPAIR_COMPLETED":
        if (isSA) {
          actions.push({
            label: "Tạo hóa đơn",
            icon: <FaFileInvoiceDollar size={12} />,
            color: "#7c3aed",
            onClick: () => { setSelectedRescue(rescue); setRescueServiceFee(""); setManualDiscount("0"); setInvoiceNotes(""); setShowInvoiceModal(true); },
          });
          actions.push({ label: t("rescueMgrCancel"), icon: <FaTimes size={12} />, color: "#dc2626", onClick: () => openReasonModal("cancel", rescue) });
        }
        break;

      case "NEED_TOWING":
        if (isSA) {
          actions.push({ label: t("rescueMgrConfirmTowing"), icon: <FaTruck size={12} />, color: "#16a34a", onClick: () => handleUpdateStatus(rescue.rescueId, "TOWING_CONFIRMED") });
          actions.push({ label: t("rescueMgrRejectTowing"), icon: <FaTimes size={12} />, color: "#dc2626", onClick: () => handleUpdateStatus(rescue.rescueId, "TOWING_REJECTED") });
        }
        break;

      case "TOWING_CONFIRMED":
        if (isSA) {
          actions.push({ label: t("rescueMgrGenerateInvoice"), icon: <FaFileInvoiceDollar size={12} />, color: "#7c3aed", onClick: () => handleUpdateStatus(rescue.rescueId, "INVOICED") });
          actions.push({ label: t("rescueMgrCancel"), icon: <FaTimes size={12} />, color: "#dc2626", onClick: () => openReasonModal("cancel", rescue) });
        }
        break;

      case "INVOICED":
        if (isSA) {
          actions.push({ label: "Gửi hóa đơn", icon: <FaFileInvoiceDollar size={12} />, color: "#7c3aed", onClick: () => handleSendInvoice(rescue.rescueId) });
          actions.push({ label: t("rescueMgrCancel"), icon: <FaTimes size={12} />, color: "#dc2626", onClick: () => openReasonModal("cancel", rescue) });
        }
        break;

      case "INVOICE_SENT":
        if (isSA) {
          actions.push({ label: t("rescueMgrMarkPaid"), icon: <FaMoneyBillWave size={12} />, color: "#16a34a", onClick: () => handleUpdateStatus(rescue.rescueId, "PAID") });
          actions.push({ label: t("rescueMgrCancel"), icon: <FaTimes size={12} />, color: "#dc2626", onClick: () => openReasonModal("cancel", rescue) });
        }
        break;

      case "PAID":
        if (isSA) {
          actions.push({ label: t("rescueMgrComplete"), icon: <FaCheck size={12} />, color: "#16a34a", onClick: () => handleUpdateStatus(rescue.rescueId, "COMPLETED") });
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
                <FormLabel>
                  Gửi đến tất cả {technicians.length} kỹ thuật viên
                </FormLabel>
                <TechList>
                  {technicians.map((tech) => (
                    <TechCard key={tech.technicianId} $selected={false}>
                      <TechName>{tech.fullName}</TechName>
                      <TechInfo>{tech.phone}</TechInfo>
                      {tech.skills && <TechInfo>{tech.skills}</TechInfo>}
                    </TechCard>
                  ))}
                </TechList>
              </FormGroup>
              <FormGroup>
                <FormLabel>Thời gian dự kiến đến *</FormLabel>
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
                  ? "Đang gửi..."
                  : `Gửi cho tất cả KTV (${technicians.length})`}
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
              <ModalTitle>Chẩn đoán lỗi xe</ModalTitle>
              <CloseBtn onClick={() => setShowStartDiagnosisModal(false)}>
                <FaTimes />
              </CloseBtn>
            </ModalHeader>
            <ModalBody>
              <FormGroup>
                <FormLabel>Ghi chú chẩn đoán *</FormLabel>
                <FormTextarea
                  value={diagnosisNotes}
                  onChange={(e) => setDiagnosisNotes(e.target.value)}
                  rows={4}
                  placeholder="Mô tả tình trạng xe sau khi chẩn đoán..."
                />
              </FormGroup>
              <FormGroup>
                <FormLabel>Có thể sửa tại chỗ? *</FormLabel>
                <RadioGroup>
                  <RadioOption
                    $selected={canRepairOnSite === true}
                    onClick={() => setCanRepairOnSite(true)}
                  >
                    <FaCheck size={14} />
                    Sửa tại chỗ
                  </RadioOption>
                  <RadioOption
                    $selected={canRepairOnSite === false}
                    onClick={() => setCanRepairOnSite(false)}
                  >
                    <FaTruck size={14} />
                    Cần kéo xe
                  </RadioOption>
                </RadioGroup>
              </FormGroup>
            </ModalBody>
            <ModalFooter>
              <ModalCancelBtn onClick={() => setShowStartDiagnosisModal(false)}>
                Hủy
              </ModalCancelBtn>
              <ModalConfirmBtn
                onClick={handleStartDiagnosis}
                disabled={!diagnosisNotes.trim() || canRepairOnSite === null}
              >
                Gửi chẩn đoán
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
              <ModalTitle>Hoàn tất sửa chữa</ModalTitle>
              <CloseBtn onClick={() => setShowCompleteRepairModal(false)}>
                <FaTimes />
              </CloseBtn>
            </ModalHeader>
            <ModalBody>
              <FormGroup>
                <FormLabel>Ghi chú hoàn tất</FormLabel>
                <FormTextarea
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  rows={4}
                  placeholder="Mô tả công việc đã thực hiện..."
                />
              </FormGroup>
            </ModalBody>
            <ModalFooter>
              <ModalCancelBtn onClick={() => setShowCompleteRepairModal(false)}>
                Hủy
              </ModalCancelBtn>
              <ModalConfirmBtn onClick={handleCompleteRepair}>
                Xác nhận hoàn tất
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
              <ModalTitle>Tạo hóa đơn</ModalTitle>
              <CloseBtn onClick={() => setShowInvoiceModal(false)}>
                <FaTimes />
              </CloseBtn>
            </ModalHeader>
            <ModalBody>
              <FormGroup>
                <FormLabel>Phí dịch vụ cứu hộ (VND) *</FormLabel>
                <FormInput
                  type="number"
                  value={rescueServiceFee}
                  onChange={(e) => setRescueServiceFee(e.target.value)}
                  placeholder="Nhập phí dịch vụ"
                />
              </FormGroup>
              <FormGroup>
                <FormLabel>Giảm giá (VND)</FormLabel>
                <FormInput
                  type="number"
                  value={manualDiscount}
                  onChange={(e) => setManualDiscount(e.target.value)}
                  placeholder="0"
                />
              </FormGroup>
              <FormGroup>
                <FormLabel>Ghi chú</FormLabel>
                <FormTextarea
                  value={invoiceNotes}
                  onChange={(e) => setInvoiceNotes(e.target.value)}
                  rows={3}
                  placeholder="Ghi chú hóa đơn..."
                />
              </FormGroup>
            </ModalBody>
            <ModalFooter>
              <ModalCancelBtn onClick={() => setShowInvoiceModal(false)}>
                Hủy
              </ModalCancelBtn>
              <ModalConfirmBtn
                onClick={handleCreateInvoice}
                disabled={!rescueServiceFee}
              >
                Tạo hóa đơn
              </ModalConfirmBtn>
            </ModalFooter>
          </ModalContent>
        </ModalOverlay>
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
  color: #000000 !important;
  background: #ffffff !important;

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
  color: #000000 !important;
  background: #ffffff !important;

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
