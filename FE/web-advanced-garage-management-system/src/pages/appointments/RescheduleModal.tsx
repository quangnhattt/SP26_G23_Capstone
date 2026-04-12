import { useState } from "react";
import styled from "styled-components";
import { FaTimes, FaCalendarAlt, FaExclamationTriangle } from "react-icons/fa";
import { toast } from "react-toastify";
import { getAvailableSlots, respondReschedule, type ISlotAvailability } from "@/apis/appointments";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";

interface Props {
  appointmentId: number;
  rejectionReason?: string | null; // Lý do SA gửi (lưu vào rejectionReason)
  onClose: () => void;
  onSuccess: () => void;
}

const RescheduleModal = ({ appointmentId, rejectionReason, onClose, onSuccess }: Props) => {
  const [step, setStep] = useState<"choice" | "pick_slot">("choice");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [slots, setSlots] = useState<ISlotAvailability[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleDateChange = async (date: string) => {
    setSelectedDate(date);
    setSelectedTime("");
    if (!date) {
      setSlots([]);
      return;
    }
    setLoadingSlots(true);
    try {
      const result = await getAvailableSlots(date);
      setSlots(result.slots);
    } catch {
      setSlots([]);
      toast.error("Không thể tải danh sách khung giờ.");
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleAccept = async () => {
    if (!selectedDate || !selectedTime) {
      toast.warn("Vui lòng chọn ngày và khung giờ mới.");
      return;
    }
    setSubmitting(true);
    try {
      await respondReschedule(appointmentId, {
        accept: true,
        newDate: selectedDate,
        newTime: selectedTime,
        notes: notes.trim() || undefined,
      });
      toast.success("Đã xác nhận lịch hẹn mới!");
      onSuccess();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Xác nhận thất bại! Khung giờ có thể đã hết chỗ."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDecline = async () => {
    setSubmitting(true);
    try {
      await respondReschedule(appointmentId, {
        accept: false,
        notes: notes.trim() || "Khách hàng từ chối dời lịch.",
      });
      toast.success("Đã từ chối yêu cầu dời lịch. Lịch hẹn đã được hủy.");
      onSuccess();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Xử lý thất bại!"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Overlay onClick={onClose}>
      <Card onClick={(e) => e.stopPropagation()}>
        <Header>
          <HeaderLeft>
            <FaCalendarAlt size={18} color="#2563eb" />
            <Title>Phản hồi đề xuất dời lịch</Title>
          </HeaderLeft>
          <CloseBtn onClick={onClose}><FaTimes size={16} /></CloseBtn>
        </Header>

        <Body>
          {/* Lý do SA đề xuất */}
          {rejectionReason && (
            <ReasonBox>
              <FaExclamationTriangle size={14} color="#d97706" />
              <div>
                <ReasonLabel>Lý do từ Cố Vấn Dịch Vụ</ReasonLabel>
                <ReasonText>{rejectionReason.replace("SA yêu cầu dời lịch: ", "")}</ReasonText>
              </div>
            </ReasonBox>
          )}

          {step === "choice" && (
            <>
              <ChoiceDesc>
                Cố Vấn Dịch Vụ đã yêu cầu bạn dời lịch hẹn. Bạn có muốn chọn thời gian mới không?
              </ChoiceDesc>
              <ChoiceButtons>
                <PickNewSlotBtn onClick={() => setStep("pick_slot")}>
                  Chọn lịch mới
                </PickNewSlotBtn>
                <DeclineLink onClick={() => setStep("pick_slot_decline")}>
                  Từ chối & Hủy lịch
                </DeclineLink>
              </ChoiceButtons>
            </>
          )}

          {(step === "pick_slot" || step === "pick_slot_decline") && (
            <>
              {step === "pick_slot" && (
                <>
                  <SectionLabel>Chọn ngày</SectionLabel>
                  <DateInput
                    type="date"
                    min={new Date().toISOString().split("T")[0]}
                    value={selectedDate}
                    onChange={(e) => handleDateChange(e.target.value)}
                  />

                  {selectedDate && (
                    <>
                      <SectionLabel style={{ marginTop: "1rem" }}>Chọn khung giờ</SectionLabel>
                      {loadingSlots ? (
                        <LoadingText>Đang tải khung giờ...</LoadingText>
                      ) : slots.length === 0 ? (
                        <LoadingText>Không có dữ liệu khung giờ.</LoadingText>
                      ) : (
                        <SlotGrid>
                          {slots.map((slot) => {
                            const now = new Date();
                            const isToday = selectedDate === now.toISOString().split("T")[0];
                            const slotHour = parseInt(slot.startTime.split(":")[0]);
                            const isPast = isToday && slotHour <= now.getHours();
                            const isDisabled = !slot.isAvailable || isPast;
                            const isSelected = selectedTime === slot.startTime;

                            return (
                              <SlotBtn
                                key={slot.slotIndex}
                                $selected={isSelected}
                                $disabled={isDisabled}
                                onClick={() => !isDisabled && setSelectedTime(slot.startTime)}
                              >
                                <SlotTime>{slot.startTime} – {slot.endTime}</SlotTime>
                                <SlotStatus $available={!isDisabled}>
                                  {isPast ? "Đã qua" : slot.isAvailable ? `Còn ${slot.availableCount} chỗ` : "Hết chỗ"}
                                </SlotStatus>
                              </SlotBtn>
                            );
                          })}
                        </SlotGrid>
                      )}
                    </>
                  )}
                </>
              )}

              <SectionLabel style={{ marginTop: "1rem" }}>Ghi chú (không bắt buộc)</SectionLabel>
              <NotesInput
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={step === "pick_slot" ? "Ghi chú thêm cho lịch hẹn mới..." : "Lý do từ chối..."}
                rows={3}
              />

              <Footer>
                <CancelBtn onClick={() => setStep("choice")} disabled={submitting}>Quay lại</CancelBtn>
                {step === "pick_slot" ? (
                  <ConfirmBtn
                    onClick={handleAccept}
                    disabled={submitting || !selectedDate || !selectedTime}
                  >
                    {submitting ? "Đang xử lý..." : "Xác nhận lịch mới"}
                  </ConfirmBtn>
                ) : (
                  <DeclineBtn onClick={handleDecline} disabled={submitting}>
                    {submitting ? "Đang xử lý..." : "Hủy lịch hẹn"}
                  </DeclineBtn>
                )}
              </Footer>
            </>
          )}
        </Body>
      </Card>
    </Overlay>
  );
};

export default RescheduleModal;

// ── Styled ──────────────────────────────────────────────────
const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
  padding: 1rem;
`;

const Card = styled.div`
  background: #fff;
  border-radius: 14px;
  width: 100%;
  max-width: 560px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 24px 64px rgba(0,0,0,0.18);
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  position: sticky;
  top: 0;
  background: #fff;
  z-index: 1;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 0.625rem;
`;

const Title = styled.h2`
  font-size: 1.0625rem;
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
  border-radius: 6px;
  transition: background 0.15s;
  &:hover { background: #f3f4f6; color: #111827; }
`;

const Body = styled.div`
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const ReasonBox = styled.div`
  display: flex;
  gap: 0.625rem;
  background: #fef3c7;
  border: 1px solid #fcd34d;
  border-radius: 10px;
  padding: 0.875rem 1rem;
`;

const ReasonLabel = styled.div`
  font-size: 0.75rem;
  font-weight: 600;
  color: #92400e;
  margin-bottom: 0.25rem;
`;

const ReasonText = styled.div`
  font-size: 0.875rem;
  color: #78350f;
`;

const ChoiceDesc = styled.p`
  font-size: 0.9rem;
  color: #374151;
  line-height: 1.6;
  margin: 0;
`;

const ChoiceButtons = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 0.5rem;
`;

const PickNewSlotBtn = styled.button`
  padding: 0.75rem 1.5rem;
  background: #2563eb;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
  &:hover { background: #1d4ed8; }
`;

const DeclineLink = styled.button`
  padding: 0.625rem;
  background: none;
  border: 1px solid #fca5a5;
  border-radius: 10px;
  color: #dc2626;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.15s;
  &:hover { background: #fef2f2; }
`;

const SectionLabel = styled.div`
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
`;

const DateInput = styled.input`
  width: 100%;
  padding: 0.625rem 0.875rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.9rem;
  color: #111827;
  box-sizing: border-box;
  &:focus { outline: none; border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
`;

const SlotGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.625rem;
  @media (max-width: 480px) { grid-template-columns: repeat(2, 1fr); }
`;

const SlotBtn = styled.button<{ $selected: boolean; $disabled: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.625rem 0.5rem;
  border-radius: 10px;
  border: 2px solid ${({ $selected, $disabled }) =>
    $disabled ? "#e5e7eb" : $selected ? "#2563eb" : "#d1d5db"};
  background: ${({ $selected, $disabled }) =>
    $disabled ? "#f9fafb" : $selected ? "#eff6ff" : "#fff"};
  cursor: ${({ $disabled }) => ($disabled ? "not-allowed" : "pointer")};
  opacity: ${({ $disabled }) => ($disabled ? 0.5 : 1)};
  transition: all 0.15s;
  &:hover:not(:disabled) { border-color: #2563eb; }
`;

const SlotTime = styled.span`
  font-size: 0.8125rem;
  font-weight: 700;
  color: #111827;
`;

const SlotStatus = styled.span<{ $available: boolean }>`
  font-size: 0.7rem;
  color: ${({ $available }) => ($available ? "#16a34a" : "#dc2626")};
  font-weight: 500;
`;

const NotesInput = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.875rem;
  font-family: inherit;
  resize: vertical;
  box-sizing: border-box;
  color: #111827;
  &:focus { outline: none; border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
  &::placeholder { color: #9ca3af; }
`;

const Footer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 0.5rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
`;

const LoadingText = styled.div`
  color: #6b7280;
  font-size: 0.875rem;
  padding: 1rem 0;
  text-align: center;
`;

const CancelBtn = styled.button`
  padding: 0.5rem 1.25rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  color: #374151;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.15s;
  &:hover { background: #f9fafb; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const ConfirmBtn = styled.button`
  padding: 0.5rem 1.5rem;
  border: none;
  border-radius: 8px;
  background: #2563eb;
  color: #fff;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
  &:hover:not(:disabled) { background: #1d4ed8; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const DeclineBtn = styled.button`
  padding: 0.5rem 1.5rem;
  border: none;
  border-radius: 8px;
  background: #dc2626;
  color: #fff;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
  &:hover:not(:disabled) { background: #b91c1c; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;
