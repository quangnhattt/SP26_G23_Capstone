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
} from "react-icons/fa";
import type { RescueStatus } from "@/apis/rescue";

// ─── On-site repair flow steps ───────────────────────────────
// Flow: SA đề xuất → KH xác nhận → SA điều KTV (KTV auto-nhận) → KTV đến nơi
//       → Chẩn đoán → Sửa chữa → Sửa xong (SA/KTV edit phụ) → HĐ → Thanh toán
const ON_SITE_STEPS: {
  key: string;
  label: string;
  icon: React.ReactNode;
  statuses: RescueStatus[];
}[] = [
  {
    key: "propose",
    label: "Đề xuất",
    icon: <FaClipboardCheck size={14} />,
    statuses: ["PENDING"],
  },
  {
    key: "customer_confirm",
    label: "KH xác nhận",
    icon: <FaUserCheck size={14} />,
    statuses: ["PROPOSED_ROADSIDE", "PROPOSED_TOWING"],
  },
  {
    key: "deposit",
    label: "KH đặt cọc",
    icon: <FaHandHoldingUsd size={14} />,
    statuses: ["PROPOSAL_ACCEPTED"],
  },
  {
    key: "assign",
    label: "Điều phối KTV",
    icon: <FaUserCog size={14} />,
    statuses: [],
  },
  {
    key: "arrive",
    label: "Đến nơi",
    icon: <FaMapMarkerAlt size={14} />,
    statuses: ["DISPATCHED", "EN_ROUTE"],
  },
  {
    key: "diagnose",
    label: "Chẩn đoán",
    icon: <FaTools size={14} />,
    statuses: ["ON_SITE", "DIAGNOSING"],
  },
  {
    key: "repair",
    label: "Sửa chữa",
    icon: <FaWrench size={14} />,
    statuses: ["REPAIRING"],
  },
  {
    key: "complete",
    label: "Sửa xong",
    icon: <FaCheckCircle size={14} />,
    statuses: ["REPAIR_COMPLETE"],
  },
  {
    key: "invoice",
    label: "Hóa đơn",
    icon: <FaFileInvoiceDollar size={14} />,
    statuses: ["INVOICED"],
  },
  {
    key: "send",
    label: "Gửi HĐ",
    icon: <FaPaperPlane size={14} />,
    statuses: ["INVOICE_SENT"],
  },
  {
    key: "paid",
    label: "Thanh toán",
    icon: <FaMoneyBillWave size={14} />,
    statuses: ["PAYMENT_PENDING"],
  },
  {
    key: "done",
    label: "Hoàn thành",
    icon: <FaFlag size={14} />,
    statuses: ["COMPLETED"],
  },
];

// Terminal / non-flow statuses
const TERMINAL_STATUSES: RescueStatus[] = [
  "CANCELLED",
  "SPAM",
  "CUSTOMER_REJECTED",
  "TOWING_REJECTED",
];

function getActiveStepIndex(status: RescueStatus): number {
  for (let i = ON_SITE_STEPS.length - 1; i >= 0; i--) {
    if (ON_SITE_STEPS[i].statuses.includes(status)) return i;
  }
  // Statuses that fall between defined step statuses
  // Indices: 0=propose,1=customer_confirm,2=deposit,3=assign(auto-done),4=arrive,5=diagnose,6=repair,7=complete,8=invoice,9=send,10=paid,11=done
  const statusOrder: Record<string, number> = {
    ACCEPTED: 0,
    EVALUATING: 0,
    QUOTE_SENT: 0,
    REVIEWING: 1,             // SA đang xem xét → KH xác nhận step
    TOWING_ACCEPTED: 2,       // customer accepted towing → deposit step
    NEED_TOWING: 5,
    TOWING_CONFIRMED: 5,
  };
  return statusOrder[status] ?? -1;
}

interface Props {
  status: RescueStatus;
}

const RescueStepProgress = ({ status }: Props) => {
  if (TERMINAL_STATUSES.includes(status)) return null;

  const activeIdx = getActiveStepIndex(status);

  return (
    <StepperWrapper>
      {ON_SITE_STEPS.map((step, idx) => {
        const state: "done" | "active" | "pending" =
          idx < activeIdx ? "done" : idx === activeIdx ? "active" : "pending";

        return (
          <StepItem key={step.key}>
            <StepDot $state={state}>
              {step.icon}
            </StepDot>
            {idx < ON_SITE_STEPS.length - 1 && (
              <StepLine $done={idx < activeIdx} />
            )}
            <StepLabel $state={state}>{step.label}</StepLabel>
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
