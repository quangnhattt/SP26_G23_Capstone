import { useState } from "react";
import styled from "styled-components";
import { FaTimes, FaTruck, FaWrench } from "react-icons/fa";
import { proposeRescueToCustomer, type IRescueRequest } from "@/apis/rescue";
import { toast } from "react-toastify";

interface ProposalModalProps {
  rescue: IRescueRequest;
  onClose: () => void;
  onSuccess: () => void;
}

const ProposalModal = ({ rescue, onClose, onSuccess }: ProposalModalProps) => {
  const [proposalType, setProposalType] = useState<"ROADSIDE" | "TOWING" | null>(null);
  const [proposalNote, setProposalNote] = useState("");
  const [proposalFee, setProposalFee] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!proposalType) return;
    try {
      setSubmitting(true);
      await proposeRescueToCustomer(rescue.rescueId, {
        rescueType: proposalType,
        proposalNotes: proposalNote.trim() || undefined,
        estimatedServiceFee: proposalFee ? Number(proposalFee) : undefined,
      });
      toast.success(
        proposalType === "ROADSIDE"
          ? "Đã đề xuất sửa tại chỗ — SA tiếp tục điều KTV!"
          : "Đã đề xuất kéo xe — SA tiếp tục điều xe kéo!",
      );
      onSuccess();
    } catch (error) {
      console.error("Error submitting proposal:", error);
      toast.error("Gửi đề xuất thất bại!");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "500px" }}
      >
        <ModalHeader>
          <ModalTitle>Đề xuất phương án cứu hộ</ModalTitle>
          <CloseBtn onClick={onClose}>
            <FaTimes />
          </CloseBtn>
        </ModalHeader>
        <ModalBody>
          <FormGroup>
            <FormLabel>Phương án xử lý *</FormLabel>
            <RadioGroup>
              <RadioOption
                $selected={proposalType === "ROADSIDE"}
                $type="ROADSIDE"
                onClick={() => setProposalType("ROADSIDE")}
              >
                <FaWrench size={14} />
                Sửa tại chỗ
              </RadioOption>
              <RadioOption
                $selected={proposalType === "TOWING"}
                $type="TOWING"
                onClick={() => setProposalType("TOWING")}
              >
                <FaTruck size={14} />
                Kéo xe về gara
              </RadioOption>
            </RadioGroup>
            {proposalType && (
              <FlowHint $type={proposalType}>
                {proposalType === "ROADSIDE"
                  ? "→ Luồng: Điều KTV → KTV đến → Chẩn đoán → KH xác nhận → Sửa → Hoàn tất → Hóa đơn"
                  : "→ Luồng: Điều xe kéo → KH chấp nhận → Xe về xưởng → Hóa đơn"}
              </FlowHint>
            )}
          </FormGroup>
          <FormGroup>
            <FormLabel>Ghi chú cho khách hàng</FormLabel>
            <FormTextarea
              value={proposalNote}
              onChange={(e) => setProposalNote(e.target.value)}
              rows={3}
              placeholder="VD: Kỹ thuật viên sẽ đến trong vòng 30 phút..."
            />
          </FormGroup>
          <FormGroup>
            <FormLabel>Phí dịch vụ ước tính (VND)</FormLabel>
            <FormInput
              type="number"
              value={proposalFee}
              onChange={(e) => setProposalFee(e.target.value)}
              placeholder="Tuỳ chọn — nhập nếu đã có ước tính"
            />
          </FormGroup>
        </ModalBody>
        <ModalFooter>
          <ModalCancelBtn onClick={onClose} disabled={submitting}>
            Hủy
          </ModalCancelBtn>
          <ModalConfirmBtn
            $type={proposalType}
            onClick={handleSubmit}
            disabled={!proposalType || submitting}
          >
            {submitting
              ? "Đang gửi..."
              : proposalType === "ROADSIDE"
                ? "Xác nhận sửa tại chỗ"
                : proposalType === "TOWING"
                  ? "Xác nhận kéo xe"
                  : "Gửi đề xuất"}
          </ModalConfirmBtn>
        </ModalFooter>
      </ModalContent>
    </ModalOverlay>
  );
};

export default ProposalModal;

// ─── Styled Components ───────────────────────────────────────
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

const ModalCancelBtn = styled.button`
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

const ModalConfirmBtn = styled.button<{ $type: "ROADSIDE" | "TOWING" | null }>`
  padding: 0.5rem 1.25rem;
  border: none;
  border-radius: 8px;
  background: ${({ $type }) =>
    $type === "ROADSIDE" ? "#16a34a" : $type === "TOWING" ? "#0891b2" : "#6b7280"};
  color: white;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: ${({ $type }) =>
      $type === "ROADSIDE" ? "#15803d" : $type === "TOWING" ? "#0e7490" : "#4b5563"};
  }

  &:disabled {
    background: #d1d5db;
    cursor: not-allowed;
  }
`;

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

  &:focus {
    border-color: #6b7280;
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

  &:focus {
    border-color: #6b7280;
  }
`;

const RadioGroup = styled.div`
  display: flex;
  gap: 0.75rem;
`;

const RadioOption = styled.div<{ $selected: boolean; $type: "ROADSIDE" | "TOWING" }>`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.875rem;
  border: 2px solid ${({ $selected, $type }) =>
    $selected ? ($type === "ROADSIDE" ? "#16a34a" : "#0891b2") : "#e5e7eb"};
  border-radius: 10px;
  cursor: pointer;
  background: ${({ $selected, $type }) =>
    $selected ? ($type === "ROADSIDE" ? "#f0fdf4" : "#ecfeff") : "white"};
  color: ${({ $selected, $type }) =>
    $selected ? ($type === "ROADSIDE" ? "#16a34a" : "#0891b2") : "#374151"};
  font-size: 0.875rem;
  font-weight: 600;
  transition: all 0.15s;

  &:hover {
    border-color: ${({ $type }) => ($type === "ROADSIDE" ? "#16a34a" : "#0891b2")};
  }
`;

const FlowHint = styled.div<{ $type: "ROADSIDE" | "TOWING" }>`
  margin-top: 0.625rem;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  background: ${({ $type }) => ($type === "ROADSIDE" ? "#f0fdf4" : "#ecfeff")};
  color: ${({ $type }) => ($type === "ROADSIDE" ? "#15803d" : "#0e7490")};
  border-left: 3px solid ${({ $type }) => ($type === "ROADSIDE" ? "#16a34a" : "#0891b2")};
`;
