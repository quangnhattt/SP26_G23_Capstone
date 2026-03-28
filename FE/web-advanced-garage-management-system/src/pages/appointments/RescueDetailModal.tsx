import { useState } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { FaTimes, FaUser, FaCar, FaMapMarkerAlt, FaWrench } from "react-icons/fa";
import type { IRescueRequest } from "@/apis/rescue";
import {
  customerConsent,
  acceptTowing,
  makeRescuePayment,
  cancelRescueRequest,
  acceptRescueJob,
  arriveRescue,
  startDiagnosis,
  addRepairItems,
  completeRepair,
  type IRescuePaymentPayload,
  type IRescueCustomerConsentPayload,
} from "@/apis/rescue";
import { toast } from "react-toastify";
import RescueStepProgress from "@/pages/admin/components/rescue-manager/RescueStepProgress";

import { rescueStatusConfig } from "./rescueStatusConfig";

interface Props {
  data: IRescueRequest | null;
  loading: boolean;
  onClose: () => void;
  onRefresh?: () => void;
  userRoleID?: number; // 3 = Technician, 4 = Customer
}

const RescueDetailModal = ({ data, loading, onClose, onRefresh, userRoleID }: Props) => {
  const { t, i18n } = useTranslation();
  const isTechnician = userRoleID === 3;
  const isCustomer = userRoleID === 4;

  // Customer states
  const [consenting, setConsenting] = useState(false);
  const [consentNotes, setConsentNotes] = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<IRescuePaymentPayload["paymentMethod"]>("TRANSFER");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentRef, setPaymentRef] = useState("");
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);

  // Technician states
  const [techLoading, setTechLoading] = useState(false);
  const [diagnosisNotes, setDiagnosisNotes] = useState("");
  const [canRepairOnSite, setCanRepairOnSite] = useState<boolean | null>(null);
  const [completionNotes, setCompletionNotes] = useState("");
  const [repairItems, setRepairItems] = useState([
    { productId: "", quantity: "", unitPrice: "", notes: "" },
  ]);
  const [repairItemsSubmitting, setRepairItemsSubmitting] = useState(false);

  // Cancel state
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  const TERMINAL_STATUSES = ["COMPLETED", "CANCELLED", "SPAM"];
  const canCancel = data ? !TERMINAL_STATUSES.includes(data.status) : false;

  const handleConsent = async (payload: IRescueCustomerConsentPayload) => {
    if (!data) return;
    setConsenting(true);
    try {
      await customerConsent(data.rescueId, payload);
      toast.success(
        payload.consentGiven
          ? "Đã xác nhận đồng ý sửa tại chỗ!"
          : "Đã từ chối sửa tại chỗ!",
      );
      onRefresh?.();
      onClose();
    } catch {
      toast.error("Xác nhận thất bại!");
    } finally {
      setConsenting(false);
    }
  };

  const handleAcceptTowing = async () => {
    if (!data) return;
    setConsenting(true);
    try {
      await acceptTowing(data.rescueId);
      toast.success("Đã xác nhận chấp nhận dịch vụ kéo xe!");
      onRefresh?.();
      onClose();
    } catch {
      toast.error("Xác nhận thất bại!");
    } finally {
      setConsenting(false);
    }
  };

  const handlePayment = async () => {
    if (!data || !paymentAmount) return;
    setPaymentSubmitting(true);
    try {
      await makeRescuePayment(data.rescueId, {
        paymentMethod,
        amount: Number(paymentAmount),
        transactionReference: paymentRef.trim() || undefined,
      });
      toast.success("Thanh toán thành công!");
      setShowPayment(false);
      onRefresh?.();
      onClose();
    } catch {
      toast.error("Thanh toán thất bại!");
    } finally {
      setPaymentSubmitting(false);
    }
  };

  // ─── Technician handlers ─────────────────────────────────
  const handleTechAcceptJob = async () => {
    if (!data) return;
    setTechLoading(true);
    try {
      await acceptRescueJob(data.rescueId);
      toast.success("Đã nhận job cứu hộ!");
      onRefresh?.();
      onClose();
    } catch {
      toast.error("Nhận job thất bại!");
    } finally {
      setTechLoading(false);
    }
  };

  const handleTechArrive = async () => {
    if (!data) return;
    setTechLoading(true);
    try {
      await arriveRescue(data.rescueId);
      toast.success("Đã xác nhận đến nơi!");
      onRefresh?.();
      onClose();
    } catch {
      toast.error("Xác nhận thất bại!");
    } finally {
      setTechLoading(false);
    }
  };

  const handleTechDiagnosis = async () => {
    if (!data || canRepairOnSite === null || !diagnosisNotes.trim()) return;
    setTechLoading(true);
    try {
      await startDiagnosis(data.rescueId, {
        diagnosisNotes: diagnosisNotes.trim(),
        canRepairOnSite,
      });
      toast.success("Đã gửi kết quả chẩn đoán!");
      onRefresh?.();
      onClose();
    } catch {
      toast.error("Gửi chẩn đoán thất bại!");
    } finally {
      setTechLoading(false);
    }
  };

  const handleTechCompleteRepair = async () => {
    if (!data) return;
    setTechLoading(true);
    try {
      await completeRepair(data.rescueId, {
        completionNotes: completionNotes.trim() || undefined,
      });
      toast.success("Đã báo hoàn tất sửa chữa!");
      onRefresh?.();
      onClose();
    } catch {
      toast.error("Báo hoàn tất thất bại!");
    } finally {
      setTechLoading(false);
    }
  };

  const handleAddRepairItems = async () => {
    if (!data) return;
    const validItems = repairItems.filter(
      (i) => i.productId.trim() && i.quantity.trim() && i.unitPrice.trim(),
    );
    if (validItems.length === 0) {
      toast.error("Vui lòng nhập ít nhất 1 vật tư/dịch vụ hợp lệ!");
      return;
    }
    setRepairItemsSubmitting(true);
    try {
      await addRepairItems(data.rescueId, {
        items: validItems.map((i) => ({
          productId: Number(i.productId),
          quantity: Number(i.quantity),
          unitPrice: Number(i.unitPrice),
          notes: i.notes.trim() || undefined,
        })),
      });
      toast.success("Đã ghi nhận vật tư/dịch vụ!");
      onRefresh?.();
    } catch {
      toast.error("Ghi nhận vật tư thất bại!");
    } finally {
      setRepairItemsSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!data || !cancelReason.trim()) return;
    setCancelling(true);
    try {
      await cancelRescueRequest(data.rescueId, cancelReason.trim());
      toast.success("Đã huỷ yêu cầu cứu hộ!");
      setShowCancelForm(false);
      onRefresh?.();
      onClose();
    } catch {
      toast.error("Huỷ yêu cầu thất bại!");
    } finally {
      setCancelling(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      const locale = i18n.language?.startsWith("vi") ? "vi-VN" : "en-US";
      return new Date(dateStr).toLocaleDateString(locale);
    } catch {
      return dateStr;
    }
  };

  const getStatusInfo = (status: string) =>
    rescueStatusConfig[status] || { labelKey: "", color: "#6b7280", bg: "#f3f4f6" };

  return (
    <Overlay onClick={onClose}>
      <Card onClick={(e) => e.stopPropagation()}>
        <Header>
          <Title>{t("rescueDetailTitle")}</Title>
          <CloseBtn onClick={onClose}>
            <FaTimes size={18} />
          </CloseBtn>
        </Header>

        {loading ? (
          <Loading>{t("loading")}</Loading>
        ) : data ? (
          <Body>
            <Section>
              <SectionTitle>
                <FaUser size={16} />
                {t("appointmentsCustomerInfo")}
              </SectionTitle>
              <Grid>
                <Field>
                  <Label>{t("fullName")}</Label>
                  <Value>{data.customerName}</Value>
                </Field>
                <Field>
                  <Label>{t("phoneNumber")}</Label>
                  <Value>{data.customerPhone}</Value>
                </Field>
              </Grid>
            </Section>

            <Divider />

            <Section>
              <SectionTitle>
                <FaCar size={16} />
                {t("bookingVehicleInfo")}
              </SectionTitle>
              <Grid>
                <Field>
                  <Label>{t("rescueMgrCar")}</Label>
                  <Value>
                    {data.brand} {data.model}
                  </Value>
                </Field>
                <Field>
                  <Label>{t("licensePlate")}</Label>
                  <Value>{data.licensePlate}</Value>
                </Field>
              </Grid>
            </Section>

            <Divider />

            <Section>
              <SectionTitle>
                <FaWrench size={16} />
                {t("appointmentsRequestInfo")}
              </SectionTitle>
              <Grid>
                <Field>
                  <Label>{t("rescueDetailCode")}</Label>
                  <Value>#{data.rescueId}</Value>
                </Field>
                <Field>
                  <Label>{t("status")}</Label>
                  <StatusBadge
                    $color={getStatusInfo(data.status).color}
                    $bg={getStatusInfo(data.status).bg}
                  >
                    {getStatusInfo(data.status).labelKey
                      ? t(getStatusInfo(data.status).labelKey)
                      : data.status}
                  </StatusBadge>
                </Field>
                <Field>
                  <Label>{t("appointmentsCreated")}</Label>
                  <Value>{formatDate(data.createdDate)}</Value>
                </Field>
                {data.rescueType && (
                  <Field>
                    <Label>{t("rescueDetailType")}</Label>
                    <Value>{data.rescueType}</Value>
                  </Field>
                )}
              </Grid>
              <Field style={{ marginTop: "0.75rem" }}>
                <Label>{t("rescueAddress")}</Label>
                <Value>
                  <InlineIcon>
                    <FaMapMarkerAlt size={13} />
                  </InlineIcon>
                  {data.currentAddress}
                </Value>
              </Field>
              <Field style={{ marginTop: "0.75rem" }}>
                <Label>{t("rescueProblemDescLabel")}</Label>
                <Value>{data.problemDescription}</Value>
              </Field>
            </Section>

            <Divider />

            {/* Stepper */}
            <Section>
              <SectionTitle>Tiến trình xử lý</SectionTitle>
              <RescueStepProgress status={data.status} />
            </Section>

            {/* ── Hành động theo từng bước ── */}

            {/* ═══ TECHNICIAN actions ═══ */}

            {/* KTV: Nhận job */}
            {isTechnician && data.status === "DISPATCHED" && (
              <>
                <Divider />
                <ActionCard $highlight>
                  <ActionCardTitle>Bạn được phân công job cứu hộ này</ActionCardTitle>
                  <ActionInfo>Xác nhận nhận việc để bắt đầu di chuyển đến khách hàng.</ActionInfo>
                  <ActionBtnRow>
                    <ActionBtn $color="#0891b2" onClick={handleTechAcceptJob} disabled={techLoading}>
                      {techLoading ? "Đang xử lý..." : "Nhận job"}
                    </ActionBtn>
                  </ActionBtnRow>
                </ActionCard>
              </>
            )}

            {/* KTV: Xác nhận đến nơi */}
            {isTechnician && data.status === "EN_ROUTE" && (
              <>
                <Divider />
                <ActionCard $highlight>
                  <ActionCardTitle>Bạn đang trên đường đến</ActionCardTitle>
                  <ActionInfo>Khi đã đến vị trí khách hàng, xác nhận để tiếp tục quy trình.</ActionInfo>
                  <ActionBtnRow>
                    <ActionBtn $color="#0d9488" onClick={handleTechArrive} disabled={techLoading}>
                      {techLoading ? "Đang xử lý..." : "Xác nhận đã đến nơi"}
                    </ActionBtn>
                  </ActionBtnRow>
                </ActionCard>
              </>
            )}

            {/* KTV: Chẩn đoán */}
            {isTechnician && ["ON_SITE", "DIAGNOSING"].includes(data.status as string) && (
              <>
                <Divider />
                <ActionCard $highlight>
                  <ActionCardTitle>Chẩn đoán lỗi xe</ActionCardTitle>
                  <ActionInfo>Ghi nhận kết quả chẩn đoán và xác định có thể sửa tại chỗ không.</ActionInfo>
                  <FormGroup>
                    <FormLabel>Ghi chú chẩn đoán *</FormLabel>
                    <FormTextarea
                      value={diagnosisNotes}
                      onChange={(e) => setDiagnosisNotes(e.target.value)}
                      rows={3}
                      placeholder="Mô tả tình trạng xe..."
                    />
                  </FormGroup>
                  <FormGroup>
                    <FormLabel>Có thể sửa tại chỗ? *</FormLabel>
                    <RadioRow>
                      <RadioBtn $selected={canRepairOnSite === true} onClick={() => setCanRepairOnSite(true)}>
                        Sửa tại chỗ
                      </RadioBtn>
                      <RadioBtn $selected={canRepairOnSite === false} onClick={() => setCanRepairOnSite(false)}>
                        Cần kéo xe
                      </RadioBtn>
                    </RadioRow>
                  </FormGroup>
                  <ActionBtnRow>
                    <ActionBtn
                      $color="#ea580c"
                      onClick={handleTechDiagnosis}
                      disabled={!diagnosisNotes.trim() || canRepairOnSite === null || techLoading}
                    >
                      {techLoading ? "Đang gửi..." : "Gửi chẩn đoán"}
                    </ActionBtn>
                  </ActionBtnRow>
                </ActionCard>
              </>
            )}

            {/* KTV: Ghi nhận vật tư + Hoàn tất sửa chữa */}
            {isTechnician && data.status === "REPAIRING" && (
              <>
                <Divider />
                {/* --- Repair items --- */}
                <ActionCard $highlight>
                  <ActionCardTitle>Ghi nhận vật tư / dịch vụ sử dụng</ActionCardTitle>
                  <ActionInfo>Thêm các vật tư và công dịch vụ đã sử dụng.</ActionInfo>
                  {repairItems.map((item, idx) => (
                    <RepairItemRow key={idx}>
                      <RepairItemInputs>
                        <FormInput
                          type="number"
                          placeholder="Product ID *"
                          value={item.productId}
                          onChange={(e) => {
                            const next = [...repairItems];
                            next[idx] = { ...next[idx], productId: e.target.value };
                            setRepairItems(next);
                          }}
                          style={{ flex: "0 0 100px" }}
                        />
                        <FormInput
                          type="number"
                          placeholder="Số lượng *"
                          value={item.quantity}
                          onChange={(e) => {
                            const next = [...repairItems];
                            next[idx] = { ...next[idx], quantity: e.target.value };
                            setRepairItems(next);
                          }}
                          style={{ flex: "0 0 80px" }}
                        />
                        <FormInput
                          type="number"
                          placeholder="Đơn giá *"
                          value={item.unitPrice}
                          onChange={(e) => {
                            const next = [...repairItems];
                            next[idx] = { ...next[idx], unitPrice: e.target.value };
                            setRepairItems(next);
                          }}
                          style={{ flex: "1" }}
                        />
                        <FormInput
                          placeholder="Ghi chú"
                          value={item.notes}
                          onChange={(e) => {
                            const next = [...repairItems];
                            next[idx] = { ...next[idx], notes: e.target.value };
                            setRepairItems(next);
                          }}
                          style={{ flex: "2" }}
                        />
                        {repairItems.length > 1 && (
                          <RemoveItemBtn
                            onClick={() =>
                              setRepairItems(repairItems.filter((_, i) => i !== idx))
                            }
                          >
                            ✕
                          </RemoveItemBtn>
                        )}
                      </RepairItemInputs>
                    </RepairItemRow>
                  ))}
                  <ActionBtnRow>
                    <ActionBtnOutline
                      onClick={() =>
                        setRepairItems([
                          ...repairItems,
                          { productId: "", quantity: "", unitPrice: "", notes: "" },
                        ])
                      }
                    >
                      + Thêm dòng
                    </ActionBtnOutline>
                    <ActionBtn
                      $color="#2563eb"
                      onClick={handleAddRepairItems}
                      disabled={repairItemsSubmitting}
                    >
                      {repairItemsSubmitting ? "Đang lưu..." : "Lưu vật tư"}
                    </ActionBtn>
                  </ActionBtnRow>
                </ActionCard>

                <Divider />
                {/* --- Complete repair --- */}
                <ActionCard $highlight>
                  <ActionCardTitle>Hoàn tất sửa chữa</ActionCardTitle>
                  <ActionInfo>Sửa xong? Ghi chú kết quả và báo hoàn tất để SA tạo hóa đơn.</ActionInfo>
                  <FormGroup>
                    <FormLabel>Ghi chú hoàn tất</FormLabel>
                    <FormTextarea
                      value={completionNotes}
                      onChange={(e) => setCompletionNotes(e.target.value)}
                      rows={3}
                      placeholder="VD: Đã thay bơm xăng thành công, xe đã khởi động bình thường."
                    />
                  </FormGroup>
                  <ActionBtnRow>
                    <ActionBtn $color="#16a34a" onClick={handleTechCompleteRepair} disabled={techLoading}>
                      {techLoading ? "Đang gửi..." : "Xác nhận hoàn tất"}
                    </ActionBtn>
                  </ActionBtnRow>
                </ActionCard>
              </>
            )}

            {/* KTV: Các trạng thái chờ (không cần hành động) */}
            {isTechnician && ["REPAIR_COMPLETE", "TOWING_DISPATCHED", "TOWING_ACCEPTED", "TOWED", "INVOICED", "INVOICE_SENT", "PAYMENT_PENDING"].includes(data.status as string) && (
              <>
                <Divider />
                <ActionCard>
                  <ActionInfo>Đang chờ xưởng và khách hàng xử lý hóa đơn & thanh toán.</ActionInfo>
                </ActionCard>
              </>
            )}

            {/* ═══ CUSTOMER actions ═══ */}

            {/* KH: Chờ SA xử lý */}
            {isCustomer && ["PENDING", "REVIEWING"].includes(data.status as string) && (
              <>
                <Divider />
                <ActionCard>
                  <ActionInfo>Yêu cầu đang được xưởng tiếp nhận và xử lý. Vui lòng chờ phản hồi.</ActionInfo>
                </ActionCard>
              </>
            )}

            {/* KH: Chờ KTV */}
            {isCustomer && ["PROPOSED_ROADSIDE", "PROPOSED_TOWING", "DISPATCHED", "EN_ROUTE"].includes(data.status as string) && (
              <>
                <Divider />
                <ActionCard>
                  <ActionInfo>
                    {["PROPOSED_ROADSIDE", "PROPOSED_TOWING"].includes(data.status as string)
                      ? "Xưởng đang đề xuất phương án. Đang chờ điều phối kỹ thuật viên."
                      : data.status === "DISPATCHED"
                        ? "Kỹ thuật viên đã được phân công. Đang chờ KTV xác nhận."
                        : "Kỹ thuật viên đang trên đường đến vị trí của bạn."}
                  </ActionInfo>
                </ActionCard>
              </>
            )}

            {/* KH: KTV đến nơi — chờ chẩn đoán */}
            {isCustomer && data.status === "ON_SITE" && (
              <>
                <Divider />
                <ActionCard>
                  <ActionInfo>Kỹ thuật viên đã đến nơi. Đang tiến hành kiểm tra xe.</ActionInfo>
                </ActionCard>
              </>
            )}

            {/* KH: Chẩn đoán xong — cần xác nhận sửa tại chỗ */}
            {isCustomer && data.status === "DIAGNOSING" && (
              <>
                <Divider />
                <ActionCard $highlight>
                  <ActionCardTitle>Kỹ thuật viên đã hoàn tất chẩn đoán</ActionCardTitle>
                  <ActionInfo>Xem xét kết quả và xác nhận để kỹ thuật viên tiến hành sửa chữa tại chỗ.</ActionInfo>
                  <FormGroup>
                    <FormLabel>Ghi chú xác nhận (tuỳ chọn)</FormLabel>
                    <FormTextarea
                      value={consentNotes}
                      onChange={(e) => setConsentNotes(e.target.value)}
                      rows={2}
                      placeholder="VD: Khách hàng đồng ý kiểm tra và sửa chữa tại chỗ."
                    />
                  </FormGroup>
                  <ActionBtnRow>
                    <ActionBtn
                      $color="#16a34a"
                      onClick={() => handleConsent({ consentGiven: true, consentNotes: consentNotes.trim() || undefined })}
                      disabled={consenting}
                    >
                      {consenting ? "Đang xử lý..." : "Đồng ý sửa tại chỗ"}
                    </ActionBtn>
                    <ActionBtnOutline
                      onClick={() => handleConsent({ consentGiven: false, consentNotes: consentNotes.trim() || undefined })}
                      disabled={consenting}
                    >
                      Từ chối
                    </ActionBtnOutline>
                  </ActionBtnRow>
                </ActionCard>
              </>
            )}

            {/* KH: KTV đang sửa tại chỗ */}
            {isCustomer && data.status === "REPAIRING" && (
              <>
                <Divider />
                <ActionCard>
                  <ActionInfo>Kỹ thuật viên đang tiến hành sửa chữa tại chỗ.</ActionInfo>
                </ActionCard>
              </>
            )}

            {/* KH: Xưởng đã điều xe kéo — cần xác nhận */}
            {isCustomer && data.status === "TOWING_DISPATCHED" && (
              <>
                <Divider />
                <ActionCard $highlight>
                  <ActionCardTitle>Xưởng đề xuất dịch vụ kéo xe</ActionCardTitle>
                  <ActionInfo>Xưởng đã điều phối xe kéo đến vị trí của bạn. Bạn có đồng ý sử dụng dịch vụ kéo xe không?</ActionInfo>
                  <ActionBtnRow>
                    <ActionBtn $color="#16a34a" onClick={handleAcceptTowing} disabled={consenting}>
                      {consenting ? "Đang xử lý..." : "Chấp nhận kéo xe"}
                    </ActionBtn>
                  </ActionBtnRow>
                </ActionCard>
              </>
            )}

            {/* KH: Đã chấp nhận kéo / xe về xưởng */}
            {isCustomer && ["TOWING_ACCEPTED", "TOWED"].includes(data.status as string) && (
              <>
                <Divider />
                <ActionCard>
                  <ActionInfo>
                    {data.status === "TOWING_ACCEPTED"
                      ? "Bạn đã chấp nhận kéo xe. Xe đang được kéo về xưởng."
                      : "Xe đã được kéo về xưởng. Đang chờ xử lý."}
                  </ActionInfo>
                </ActionCard>
              </>
            )}

            {/* KH: Chờ hóa đơn */}
            {isCustomer && ["REPAIR_COMPLETE", "INVOICED"].includes(data.status as string) && (
              <>
                <Divider />
                <ActionCard>
                  <ActionInfo>
                    {data.status === "REPAIR_COMPLETE"
                      ? "Sửa chữa đã hoàn tất. Xưởng đang tạo hóa đơn."
                      : "Hóa đơn đã được tạo. Đang chờ xưởng gửi hóa đơn đến bạn."}
                  </ActionInfo>
                </ActionCard>
              </>
            )}

            {/* KH: Thanh toán */}
            {isCustomer && data.status === "INVOICE_SENT" && !showPayment && (
              <>
                <Divider />
                <ActionCard $highlight>
                  <ActionCardTitle>Cần thanh toán</ActionCardTitle>
                  <ActionInfo>Hóa đơn đã được gửi. Vui lòng xác nhận thanh toán để hoàn tất.</ActionInfo>
                  <ActionBtnRow>
                    <ActionBtn $color="#1d4ed8" onClick={() => setShowPayment(true)}>
                      Xác nhận thanh toán
                    </ActionBtn>
                  </ActionBtnRow>
                </ActionCard>
              </>
            )}

            {isCustomer && data.status === "INVOICE_SENT" && showPayment && (
              <>
                <Divider />
                <ActionCard $highlight>
                  <ActionCardTitle>Thông tin thanh toán</ActionCardTitle>
                  <FormGroup>
                    <FormLabel>Phương thức *</FormLabel>
                    <FormSelect
                      value={paymentMethod}
                      onChange={(e) =>
                        setPaymentMethod(e.target.value as IRescuePaymentPayload["paymentMethod"])
                      }
                    >
                      <option value="TRANSFER">Chuyển khoản</option>
                      <option value="CASH">Tiền mặt</option>
                      <option value="CARD">Thẻ</option>
                      <option value="EWALLET">Ví điện tử</option>
                    </FormSelect>
                  </FormGroup>
                  <FormGroup>
                    <FormLabel>Số tiền (VND) *</FormLabel>
                    <FormInput
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      placeholder="Nhập số tiền"
                    />
                  </FormGroup>
                  {paymentMethod === "TRANSFER" && (
                    <FormGroup>
                      <FormLabel>Mã giao dịch</FormLabel>
                      <FormInput
                        value={paymentRef}
                        onChange={(e) => setPaymentRef(e.target.value)}
                        placeholder="VD: VCB20260228001234"
                      />
                    </FormGroup>
                  )}
                  <ActionBtnRow>
                    <ActionBtn
                      $color="#1d4ed8"
                      onClick={handlePayment}
                      disabled={!paymentAmount || paymentSubmitting}
                    >
                      {paymentSubmitting ? "Đang xử lý..." : "Thanh toán"}
                    </ActionBtn>
                    <ActionBtnOutline onClick={() => setShowPayment(false)} disabled={paymentSubmitting}>
                      Quay lại
                    </ActionBtnOutline>
                  </ActionBtnRow>
                </ActionCard>
              </>
            )}

            {/* ── Huỷ yêu cầu (luôn hiện nếu chưa kết thúc) ── */}
            {canCancel && !showCancelForm && (
              <>
                <Divider />
                <CancelSection>
                  <CancelBtn onClick={() => setShowCancelForm(true)}>
                    Huỷ yêu cầu cứu hộ
                  </CancelBtn>
                </CancelSection>
              </>
            )}

            {canCancel && showCancelForm && (
              <>
                <Divider />
                <ActionCard $danger>
                  <ActionCardTitle>Huỷ yêu cầu cứu hộ</ActionCardTitle>
                  <ActionInfo>
                    Vui lòng nhập lý do huỷ. Hành động này không thể hoàn tác.
                  </ActionInfo>
                  <FormGroup>
                    <FormLabel>Lý do huỷ *</FormLabel>
                    <FormTextarea
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      rows={3}
                      placeholder="Nhập lý do huỷ yêu cầu..."
                    />
                  </FormGroup>
                  <ActionBtnRow>
                    <ActionBtn
                      $color="#dc2626"
                      onClick={handleCancel}
                      disabled={!cancelReason.trim() || cancelling}
                    >
                      {cancelling ? "Đang huỷ..." : "Xác nhận huỷ"}
                    </ActionBtn>
                    <ActionBtnOutline onClick={() => { setShowCancelForm(false); setCancelReason(""); }}>
                      Không huỷ
                    </ActionBtnOutline>
                  </ActionBtnRow>
                </ActionCard>
              </>
            )}
          </Body>
        ) : (
          <Loading>{t("errorOccurred")}</Loading>
        )}
      </Card>
    </Overlay>
  );
};

export default RescueDetailModal;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
`;

const Card = styled.div`
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 680px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  position: sticky;
  top: 0;
  background: white;
  z-index: 1;
`;

const Title = styled.h2`
  font-size: 1.125rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
`;

const CloseBtn = styled.button`
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 0.375rem;
  border-radius: 6px;
  transition: background 0.15s;

  &:hover {
    background: #f3f4f6;
    color: #111827;
  }
`;

const Loading = styled.div`
  padding: 3rem;
  text-align: center;
  color: #6b7280;
`;

const Body = styled.div`
  padding: 1.5rem;
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const SectionTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9375rem;
  font-weight: 700;
  color: #111827;
`;

const Divider = styled.div`
  height: 1px;
  background: #e5e7eb;
  margin: 1.25rem 0;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const Label = styled.span`
  font-size: 0.75rem;
  font-weight: 500;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.025em;
`;

const Value = styled.span`
  font-size: 0.875rem;
  color: #111827;
  line-height: 1.4;
`;

const StatusBadge = styled.span<{ $color: string; $bg: string }>`
  padding: 0.2rem 0.625rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  color: ${({ $color }) => $color};
  background: ${({ $bg }) => $bg};
  width: fit-content;
`;

const InlineIcon = styled.span`
  margin-right: 0.375rem;
  color: #9ca3af;
`;

const ActionInfo = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
  line-height: 1.5;
`;

const ActionBtn = styled.button<{ $color: string }>`
  padding: 0.625rem 1.25rem;
  border: none;
  border-radius: 8px;
  background: ${({ $color }) => $color};
  color: white;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
  width: fit-content;

  &:hover {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ActionBtnOutline = styled.button`
  padding: 0.625rem 1.25rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  color: #374151;
  font-size: 0.875rem;
  cursor: pointer;

  &:hover {
    background: #f9fafb;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ActionBtnRow = styled.div`
  display: flex;
  gap: 0.75rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const FormLabel = styled.label`
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
`;

const FormInput = styled.input`
  padding: 0.5rem 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.875rem;
  outline: none;
  color: #111827;
  background: #fff;

  &::placeholder {
    color: #9ca3af;
  }

  &:focus {
    border-color: #1d4ed8;
  }
`;

const FormSelect = styled.select`
  padding: 0.5rem 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.875rem;
  outline: none;
  color: #111827;
  background: #fff;

  &:focus {
    border-color: #1d4ed8;
  }
`;

const FormTextarea = styled.textarea`
  padding: 0.5rem 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.875rem;
  outline: none;
  resize: vertical;
  color: #111827;
  background: #fff;

  &::placeholder {
    color: #9ca3af;
  }

  &:focus {
    border-color: #1d4ed8;
  }
`;

const ActionCard = styled.div<{ $highlight?: boolean; $danger?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 10px;
  background: ${({ $danger, $highlight }) =>
    $danger ? "#fef2f2" : $highlight ? "#eff6ff" : "#f9fafb"};
  border: 1px solid
    ${({ $danger, $highlight }) =>
      $danger ? "#fecaca" : $highlight ? "#bfdbfe" : "#e5e7eb"};
`;

const ActionCardTitle = styled.div`
  font-size: 0.875rem;
  font-weight: 700;
  color: #111827;
`;

const CancelSection = styled.div`
  display: flex;
  justify-content: center;
`;

const CancelBtn = styled.button`
  padding: 0.5rem 1.25rem;
  border: 1px solid #fca5a5;
  border-radius: 8px;
  background: white;
  color: #dc2626;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #fef2f2;
    border-color: #f87171;
  }
`;

const RadioRow = styled.div`
  display: flex;
  gap: 0.75rem;
`;

const RadioBtn = styled.div<{ $selected: boolean }>`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.625rem;
  border: 2px solid ${({ $selected }) => ($selected ? "#1d4ed8" : "#e5e7eb")};
  border-radius: 8px;
  cursor: pointer;
  background: ${({ $selected }) => ($selected ? "#eff6ff" : "white")};
  color: ${({ $selected }) => ($selected ? "#1d4ed8" : "#374151")};
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;

  &:hover {
    border-color: ${({ $selected }) => ($selected ? "#1d4ed8" : "#d1d5db")};
  }
`;

const RepairItemRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const RepairItemInputs = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
`;

const RemoveItemBtn = styled.button`
  padding: 0.25rem 0.5rem;
  border: 1px solid #fca5a5;
  border-radius: 6px;
  background: white;
  color: #dc2626;
  font-size: 0.75rem;
  cursor: pointer;
  flex-shrink: 0;

  &:hover {
    background: #fef2f2;
  }
`;
