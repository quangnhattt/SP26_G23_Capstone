import { useTranslation } from "react-i18next";
import styled from "styled-components";
import {
  FaClipboardCheck,
  FaUserCog,
  FaUserCheck,
  FaMapMarkerAlt,
  FaTools,
  FaWrench,
  FaCheckCircle,
  FaFileInvoiceDollar,
  FaPaperPlane,
  FaMoneyBillWave,
  FaFlag,
  FaHandHoldingUsd,
  FaCheckDouble,
  FaTruck,
} from "react-icons/fa";
import type { RescueStatus } from "@/apis/rescue";

type Step = {
  key: string;
  labelKey: string;
  icon: React.ReactNode;
  statuses: RescueStatus[];
};

// ─── Roadside (Sửa tại chỗ) flow ─────────────────────────────
const ON_SITE_STEPS: Step[] = [
  {
    key: "propose",
    labelKey: "rescueStepPropose",
    icon: <FaClipboardCheck size={14} />,
    statuses: ["PENDING"],
  },
  {
    key: "customer_confirm",
    labelKey: "rescueStepCustomerConfirm",
    icon: <FaUserCheck size={14} />,
    statuses: ["PROPOSED_ROADSIDE"],
  },
  {
    key: "deposit",
    labelKey: "rescueStepDeposit",
    icon: <FaHandHoldingUsd size={14} />,
    statuses: ["PROPOSAL_ACCEPTED"],
  },
  {
    key: "assign",
    labelKey: "rescueStepAssign",
    icon: <FaUserCog size={14} />,
    statuses: ["EN_ROUTE"],
  },
  {
    key: "arrive",
    labelKey: "rescueStepArrive",
    icon: <FaMapMarkerAlt size={14} />,
    statuses: ["ON_SITE"],
  },
  {
    key: "diagnose",
    labelKey: "rescueStepDiagnose",
    icon: <FaTools size={14} />,
    statuses: ["DIAGNOSING"],
  },
  {
    key: "repair",
    labelKey: "rescueStepRepair",
    icon: <FaWrench size={14} />,
    statuses: ["REPAIRING"],
  },
  {
    key: "complete",
    labelKey: "rescueStepComplete",
    icon: <FaCheckCircle size={14} />,
    statuses: ["REPAIR_COMPLETE"],
  },
  {
    key: "invoice",
    labelKey: "rescueStepInvoice",
    icon: <FaFileInvoiceDollar size={14} />,
    statuses: ["INVOICED"],
  },
  {
    key: "send",
    labelKey: "rescueStepSend",
    icon: <FaPaperPlane size={14} />,
    statuses: ["INVOICE_SENT"],
  },
  {
    key: "paid",
    labelKey: "rescueStepPaid",
    icon: <FaMoneyBillWave size={14} />,
    statuses: ["PAYMENT_PENDING"],
  },
  {
    key: "payment_submitted",
    labelKey: "rescueStepPaymentSubmitted",
    icon: <FaCheckDouble size={14} />,
    statuses: ["PAYMENT_SUBMITTED"],
  },
  {
    key: "done",
    labelKey: "rescueStepDone",
    icon: <FaFlag size={14} />,
    statuses: ["COMPLETED"],
  },
];

// ─── Towing (Kéo xe về gara) flow ────────────────────────────
// Flow: Đề xuất kéo xe → KH xác nhận (+ đặt cọc nếu cần) → SA điều kéo xe
//       → Xe kéo đến nơi → Bắt đầu kéo → Kéo về hoàn tất
//       → (dùng chung từ chẩn đoán trở đi như sửa tại chỗ)
const TOWING_STEPS: Step[] = [
  {
    key: "propose",
    labelKey: "rescueStepPropose",
    icon: <FaClipboardCheck size={14} />,
    statuses: ["PENDING", "PROPOSED_TOWING"],
  },
  {
    key: "customer_confirm",
    labelKey: "rescueStepCustomerConfirm",
    icon: <FaUserCheck size={14} />,
    statuses: ["PROPOSAL_ACCEPTED"],
  },
  {
    key: "towing_dispatch",
    labelKey: "rescueStepTowingDispatch",
    icon: <FaTruck size={14} />,
    statuses: ["TOWING_DISPATCHED", "EN_ROUTE"],
  },
  {
    key: "towing_arrive",
    labelKey: "rescueStepTowingArrive",
    icon: <FaMapMarkerAlt size={14} />,
    statuses: ["TOWING_ACCEPTED"],
  },
  {
    key: "towing_start",
    labelKey: "rescueStepTowingStart",
    icon: <FaTruck size={14} />,
    statuses: ["ON_SITE"],
  },
  {
    key: "towing_complete",
    labelKey: "rescueStepTowingComplete",
    icon: <FaCheckCircle size={14} />,
    statuses: ["TOWED"],
  },
  {
    key: "diagnose",
    labelKey: "rescueStepDiagnose",
    icon: <FaTools size={14} />,
    statuses: ["DIAGNOSING"],
  },
  {
    key: "repair",
    labelKey: "rescueStepRepair",
    icon: <FaWrench size={14} />,
    statuses: ["REPAIRING"],
  },
  {
    key: "complete",
    labelKey: "rescueStepComplete",
    icon: <FaCheckCircle size={14} />,
    statuses: ["REPAIR_COMPLETE"],
  },
  {
    key: "invoice",
    labelKey: "rescueStepInvoice",
    icon: <FaFileInvoiceDollar size={14} />,
    statuses: ["INVOICED"],
  },
  {
    key: "send",
    labelKey: "rescueStepSend",
    icon: <FaPaperPlane size={14} />,
    statuses: ["INVOICE_SENT"],
  },
  {
    key: "paid",
    labelKey: "rescueStepPaid",
    icon: <FaMoneyBillWave size={14} />,
    statuses: ["PAYMENT_PENDING"],
  },
  {
    key: "payment_submitted",
    labelKey: "rescueStepPaymentSubmitted",
    icon: <FaCheckDouble size={14} />,
    statuses: ["PAYMENT_SUBMITTED"],
  },
  {
    key: "done",
    labelKey: "rescueStepDone",
    icon: <FaFlag size={14} />,
    statuses: ["COMPLETED"],
  },
];

// Terminal / non-flow statuses
const TERMINAL_STATUSES: RescueStatus[] = ["CANCELLED", "SPAM"];

// Statuses that unambiguously belong to the towing flow
const TOWING_INDICATOR_STATUSES: RescueStatus[] = [
  "PROPOSED_TOWING",
  "TOWING_DISPATCHED",
  "TOWING_ACCEPTED",
  "TOWED",
];

function getActiveStepIndex(steps: Step[], status: RescueStatus): number {
  for (let i = steps.length - 1; i >= 0; i--) {
    if ((steps[i].statuses as string[]).includes(status)) return i;
  }
  return -1;
}

interface Props {
  status: RescueStatus;
  rescueType?: string | null;
}

const RescueStepProgress = ({ status, rescueType }: Props) => {
  const { t } = useTranslation();
  if (TERMINAL_STATUSES.includes(status)) return null;

  const isTowing =
    rescueType === "TOWING" || TOWING_INDICATOR_STATUSES.includes(status);
  const steps = isTowing ? TOWING_STEPS : ON_SITE_STEPS;
  const activeIdx = getActiveStepIndex(steps, status);

  return (
    <StepperWrapper>
      {steps.map((step, idx) => {
        const state: "done" | "active" | "pending" =
          idx < activeIdx ? "done" : idx === activeIdx ? "active" : "pending";

        return (
          <StepItem key={step.key}>
            <StepDot $state={state}>{step.icon}</StepDot>
            {idx < steps.length - 1 && <StepLine $done={idx < activeIdx} />}
            <StepLabel $state={state}>{t(step.labelKey)}</StepLabel>
          </StepItem>
        );
      })}
    </StepperWrapper>
  );
};

export default RescueStepProgress;

// ─── Styled Components ───────────────────────────────────────
const StepperWrapper = styled.div`
  display: flex;
  align-items: flex-start;
  width: 100%;
  padding: 0.75rem 0 1.5rem;
  overflow-x: auto;

  &::-webkit-scrollbar {
    height: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 2px;
  }
`;

const StepItem = styled.div`
  display: flex;
  align-items: center;
  position: relative;
  flex: 1;
  min-width: 0;

  &:last-child {
    flex: 0 0 auto;
  }
`;

const StepDot = styled.div<{ $state: "done" | "active" | "pending" }>`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  z-index: 1;
  transition: all 0.3s;

  background: ${({ $state }) =>
    $state === "done"
      ? "#16a34a"
      : $state === "active"
        ? "#dc2626"
        : "#f3f4f6"};
  color: ${({ $state }) =>
    $state === "done" || $state === "active" ? "white" : "#9ca3af"};
  box-shadow: ${({ $state }) =>
    $state === "active" ? "0 0 0 4px rgba(220, 38, 38, 0.2)" : "none"};
`;

const StepLine = styled.div<{ $done: boolean }>`
  flex: 1;
  height: 2px;
  min-width: 12px;
  background: ${({ $done }) => ($done ? "#16a34a" : "#e5e7eb")};
  transition: background 0.3s;
`;

const StepLabel = styled.span<{ $state: "done" | "active" | "pending" }>`
  position: absolute;
  top: 36px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.625rem;
  font-weight: ${({ $state }) => ($state === "active" ? 700 : 500)};
  color: ${({ $state }) =>
    $state === "done"
      ? "#16a34a"
      : $state === "active"
        ? "#dc2626"
        : "#9ca3af"};
  white-space: nowrap;
  text-align: center;
  width: max-content;
`;
