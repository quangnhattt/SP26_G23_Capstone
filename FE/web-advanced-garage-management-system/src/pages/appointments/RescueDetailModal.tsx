import { useState } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import {
  FaTimes,
  FaUser,
  FaCar,
  FaMapMarkerAlt,
  FaWrench,
  FaTruck,
  FaFileAlt,
  FaMoneyBillWave,
  FaBoxOpen,
  FaTools,
  FaStickyNote,
  FaCheckCircle,
  FaTimesCircle,
} from "react-icons/fa";
import type { IRescueRequest } from "@/apis/rescue";
import {
  customerConsent,
  acceptTowing,
  makeRescuePayment,
  makeRescueDeposit,
  cancelRescueRequest,
  arriveRescue,
  startDiagnosis,
  addRepairItems,
  completeRepair,
  acceptProposal,
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

const RescueDetailModal = ({
  data,
  loading,
  onClose,
  onRefresh,
  userRoleID,
}: Props) => {
  const { t, i18n } = useTranslation();
  const isTechnician = userRoleID === 3;
  const isCustomer = userRoleID === 4;

  // Deposit QR modal
  const [showDepositQR, setShowDepositQR] = useState(false);
  const [depositPaying, setDepositPaying] = useState(false);

  // Customer states
  const [proposalAccepting, setProposalAccepting] = useState(false);
  const [consenting, setConsenting] = useState(false);
  const [consentNotes, setConsentNotes] = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] =
    useState<IRescuePaymentPayload["paymentMethod"]>("TRANSFER");
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

  const handleAcceptProposal = async () => {
    if (!data) return;
    setProposalAccepting(true);
    try {
      await acceptProposal(data.rescueId);
      toast.success(t("rescueProposalAcceptSuccess"));
      onRefresh?.();
    } catch {
      toast.error(t("rescueProposalAcceptError"));
    } finally {
      setProposalAccepting(false);
    }
  };

  const handlePayDeposit = async () => {
    if (!data?.depositAmount) return;
    setDepositPaying(true);
    try {
      await makeRescueDeposit(data.rescueId, {
        paymentMethod: "TRANSFER",
        amount: data.depositAmount,
        transactionReference: `DEP-RES-${data.rescueId}-001`,
      });
      toast.success(t("rescueDepositPaySuccess"));
      onRefresh?.();
    } catch {
      toast.error(t("rescueDepositPayError"));
    } finally {
      setDepositPaying(false);
    }
  };

  const handleConsent = async (payload: IRescueCustomerConsentPayload) => {
    if (!data) return;
    setConsenting(true);
    try {
      await customerConsent(data.rescueId, payload);
      toast.success(
        payload.consentGiven
          ? t("rescueConsentAgreedSuccess")
          : t("rescueConsentDeclinedSuccess"),
      );
      onRefresh?.();
      onClose();
    } catch {
      toast.error(t("rescueConsentError"));
    } finally {
      setConsenting(false);
    }
  };

  const handleAcceptTowing = async () => {
    if (!data) return;
    setConsenting(true);
    try {
      await acceptTowing(data.rescueId);
      toast.success(t("rescueTowingAcceptSuccess"));
      onRefresh?.();
      onClose();
    } catch {
      toast.error(t("rescueTowingAcceptError"));
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
      toast.success(t("rescuePaymentSuccess"));
      setShowPayment(false);
      onRefresh?.();
      onClose();
    } catch {
      toast.error(t("rescuePaymentError"));
    } finally {
      setPaymentSubmitting(false);
    }
  };

  // ─── Technician handlers ─────────────────────────────────
  const handleTechArrive = async () => {
    if (!data) return;
    setTechLoading(true);
    try {
      await arriveRescue(data.rescueId);
      toast.success(t("rescueMgrArriveSuccess"));
      onRefresh?.();
      onClose();
    } catch {
      toast.error(t("rescueMgrArriveError"));
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
      toast.success(t("rescueTechDiagnosisSuccess"));
      onRefresh?.();
      onClose();
    } catch {
      toast.error(t("rescueTechDiagnosisError"));
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
      toast.success(t("rescueTechCompleteRepairSuccess"));
      onRefresh?.();
      onClose();
    } catch {
      toast.error(t("rescueTechCompleteRepairError"));
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
      toast.error(t("rescueTechRepairItemsRequired"));
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
      toast.success(t("rescueTechRepairItemsSuccess"));
      onRefresh?.();
    } catch {
      toast.error(t("rescueTechRepairItemsError"));
    } finally {
      setRepairItemsSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!data || !cancelReason.trim()) return;
    setCancelling(true);
    try {
      await cancelRescueRequest(data.rescueId, cancelReason.trim());
      toast.success(t("rescueCancelSuccess"));
      setShowCancelForm(false);
      onRefresh?.();
      onClose();
    } catch {
      toast.error(t("rescueCancelError"));
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
    rescueStatusConfig[status] || {
      labelKey: "",
      color: "#6b7280",
      bg: "#f3f4f6",
    };

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
              <SectionTitle>{t("rescueProcessTitle")}</SectionTitle>
              <RescueStepProgress status={data.status} />
            </Section>

            {/* ── Hành động theo từng bước ── */}

            {/* ═══ TECHNICIAN actions ═══ */}

            {/* KTV: Đã được phân công / đang trên đường — xác nhận đến nơi */}
            {isTechnician && data.status === "EN_ROUTE" && (
                <>
                  <Divider />
                  <ActionCard $highlight>
                    <ActionCardTitle>
                      {t("rescueTechEnRouteTitle")}
                    </ActionCardTitle>
                    <ActionInfo>
                      {t("rescueTechEnRouteInfo")}
                    </ActionInfo>
                    <ActionBtnRow>
                      <ActionBtn
                        $color="#0d9488"
                        onClick={handleTechArrive}
                        disabled={techLoading}
                      >
                        {techLoading
                          ? t("rescueTechProcessing")
                          : t("rescueTechConfirmArrivalBtn")}
                      </ActionBtn>
                    </ActionBtnRow>
                  </ActionCard>
                </>
              )}

            {/* KTV: Chẩn đoán */}
            {isTechnician &&
              ["ON_SITE", "DIAGNOSING"].includes(data.status as string) && (
                <>
                  <Divider />
                  <ActionCard $highlight>
                    <ActionCardTitle>{t("rescueTechDiagnoseTitle")}</ActionCardTitle>
                    <ActionInfo>{t("rescueTechDiagnoseInfo")}</ActionInfo>
                    <FormGroup>
                      <FormLabel>{t("rescueTechDiagnoseNotesLabel")}</FormLabel>
                      <FormTextarea
                        value={diagnosisNotes}
                        onChange={(e) => setDiagnosisNotes(e.target.value)}
                        rows={3}
                        placeholder={t("rescueTechDiagnoseNotesPlaceholder")}
                      />
                    </FormGroup>
                    <FormGroup>
                      <FormLabel>{t("rescueTechCanRepairLabel")}</FormLabel>
                      <RadioRow>
                        <RadioBtn
                          $selected={canRepairOnSite === true}
                          onClick={() => setCanRepairOnSite(true)}
                        >
                          {t("rescueTechRepairOnSiteOption")}
                        </RadioBtn>
                        <RadioBtn
                          $selected={canRepairOnSite === false}
                          onClick={() => setCanRepairOnSite(false)}
                        >
                          {t("rescueTechNeedTowingOption")}
                        </RadioBtn>
                      </RadioRow>
                    </FormGroup>
                    <ActionBtnRow>
                      <ActionBtn
                        $color="#ea580c"
                        onClick={handleTechDiagnosis}
                        disabled={
                          !diagnosisNotes.trim() ||
                          canRepairOnSite === null ||
                          techLoading
                        }
                      >
                        {techLoading
                          ? t("rescueTechSending")
                          : t("rescueTechSubmitDiagnosisBtn")}
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
                  <ActionCardTitle>{t("rescueTechRepairItemsTitle")}</ActionCardTitle>
                  <ActionInfo>{t("rescueTechRepairItemsInfo")}</ActionInfo>
                  {repairItems.map((item, idx) => (
                    <RepairItemRow key={idx}>
                      <RepairItemInputs>
                        <FormInput
                          type="number"
                          placeholder={t("rescueTechProductIdPlaceholder")}
                          value={item.productId}
                          onChange={(e) => {
                            const next = [...repairItems];
                            next[idx] = {
                              ...next[idx],
                              productId: e.target.value,
                            };
                            setRepairItems(next);
                          }}
                          style={{ flex: "0 0 100px" }}
                        />
                        <FormInput
                          type="number"
                          placeholder={t("rescueTechQtyPlaceholder")}
                          value={item.quantity}
                          onChange={(e) => {
                            const next = [...repairItems];
                            next[idx] = {
                              ...next[idx],
                              quantity: e.target.value,
                            };
                            setRepairItems(next);
                          }}
                          style={{ flex: "0 0 80px" }}
                        />
                        <FormInput
                          type="number"
                          placeholder={t("rescueTechUnitPricePlaceholder")}
                          value={item.unitPrice}
                          onChange={(e) => {
                            const next = [...repairItems];
                            next[idx] = {
                              ...next[idx],
                              unitPrice: e.target.value,
                            };
                            setRepairItems(next);
                          }}
                          style={{ flex: "1" }}
                        />
                        <FormInput
                          placeholder={t("rescueTechNotesPlaceholder")}
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
                              setRepairItems(
                                repairItems.filter((_, i) => i !== idx),
                              )
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
                          {
                            productId: "",
                            quantity: "",
                            unitPrice: "",
                            notes: "",
                          },
                        ])
                      }
                    >
                      {t("rescueTechAddRowBtn")}
                    </ActionBtnOutline>
                    <ActionBtn
                      $color="#2563eb"
                      onClick={handleAddRepairItems}
                      disabled={repairItemsSubmitting}
                    >
                      {repairItemsSubmitting
                        ? t("rescueTechSaving")
                        : t("rescueTechSaveMaterialsBtn")}
                    </ActionBtn>
                  </ActionBtnRow>
                </ActionCard>

                <Divider />
                {/* --- Complete repair --- */}
                <ActionCard $highlight>
                  <ActionCardTitle>{t("rescueTechCompleteRepairTitle")}</ActionCardTitle>
                  <ActionInfo>{t("rescueTechCompleteRepairInfo")}</ActionInfo>
                  <FormGroup>
                    <FormLabel>{t("rescueTechCompletionNotesLabel")}</FormLabel>
                    <FormTextarea
                      value={completionNotes}
                      onChange={(e) => setCompletionNotes(e.target.value)}
                      rows={3}
                      placeholder={t("rescueTechCompletionNotesPlaceholder")}
                    />
                  </FormGroup>
                  <ActionBtnRow>
                    <ActionBtn
                      $color="#16a34a"
                      onClick={handleTechCompleteRepair}
                      disabled={techLoading}
                    >
                      {techLoading
                        ? t("rescueTechSending")
                        : t("rescueTechConfirmCompleteBtn")}
                    </ActionBtn>
                  </ActionBtnRow>
                </ActionCard>
              </>
            )}

            {/* KTV: Chỉnh sửa phụ tùng sau khi sửa xong (REPAIR_COMPLETE) */}
            {isTechnician && data.status === "REPAIR_COMPLETE" && (
              <>
                <Divider />
                <ActionCard $highlight>
                  <ActionCardTitle>{t("rescueTechEditPartsTitle")}</ActionCardTitle>
                  <ActionInfo>{t("rescueTechEditPartsInfo")}</ActionInfo>
                  {repairItems.map((item, idx) => (
                    <RepairItemRow key={idx}>
                      <RepairItemInputs>
                        <FormInput
                          type="number"
                          placeholder={t("rescueTechProductIdPlaceholder")}
                          value={item.productId}
                          onChange={(e) => {
                            const next = [...repairItems];
                            next[idx] = {
                              ...next[idx],
                              productId: e.target.value,
                            };
                            setRepairItems(next);
                          }}
                          style={{ flex: "0 0 100px" }}
                        />
                        <FormInput
                          type="number"
                          placeholder={t("rescueTechQtyPlaceholder")}
                          value={item.quantity}
                          onChange={(e) => {
                            const next = [...repairItems];
                            next[idx] = {
                              ...next[idx],
                              quantity: e.target.value,
                            };
                            setRepairItems(next);
                          }}
                          style={{ flex: "0 0 80px" }}
                        />
                        <FormInput
                          type="number"
                          placeholder={t("rescueTechUnitPricePlaceholder")}
                          value={item.unitPrice}
                          onChange={(e) => {
                            const next = [...repairItems];
                            next[idx] = {
                              ...next[idx],
                              unitPrice: e.target.value,
                            };
                            setRepairItems(next);
                          }}
                          style={{ flex: "1" }}
                        />
                        <FormInput
                          placeholder={t("rescueTechNotesPlaceholder")}
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
                              setRepairItems(
                                repairItems.filter((_, i) => i !== idx),
                              )
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
                          {
                            productId: "",
                            quantity: "",
                            unitPrice: "",
                            notes: "",
                          },
                        ])
                      }
                    >
                      {t("rescueTechAddRowBtn")}
                    </ActionBtnOutline>
                    <ActionBtn
                      $color="#2563eb"
                      onClick={handleAddRepairItems}
                      disabled={repairItemsSubmitting}
                    >
                      {repairItemsSubmitting
                        ? t("rescueTechSaving")
                        : t("rescueTechSavePartsBtn")}
                    </ActionBtn>
                  </ActionBtnRow>
                </ActionCard>
                <Divider />
                <ActionCard>
                  <ActionInfo>{t("rescueTechWaitingInvoice")}</ActionInfo>
                </ActionCard>
              </>
            )}

            {/* KTV: Các trạng thái chờ (không cần hành động) */}
            {isTechnician &&
              [
                "TOWING_DISPATCHED",
                "TOWING_ACCEPTED",
                "TOWED",
                "INVOICED",
                "INVOICE_SENT",
                "PAYMENT_PENDING",
              ].includes(data.status as string) && (
                <>
                  <Divider />
                  <ActionCard>
                    <ActionInfo>{t("rescueTechWaitingPayment")}</ActionInfo>
                  </ActionCard>
                </>
              )}

            {/* ═══ CUSTOMER actions ═══ */}

            {/* KH: Chờ SA xử lý */}
            {isCustomer &&
              data.status === "PENDING" && (
                <>
                  <Divider />
                  <ActionCard>
                    <ActionInfo>
                      {t("rescueCustomerPendingInfo")}
                    </ActionInfo>
                  </ActionCard>
                </>
              )}

            {/* KH: SA đề xuất phương án — xem phiếu đề xuất đầy đủ & xác nhận */}
            {isCustomer &&
              ["PROPOSED_ROADSIDE", "PROPOSED_TOWING"].includes(
                data.status as string,
              ) && (
                <>
                  <Divider />
                  {/* ── Phiếu đề xuất ── */}
                  <ProposalDocument>
                    <ProposalDocHeader>
                      <ProposalDocIcon>
                        <FaFileAlt size={16} />
                      </ProposalDocIcon>
                      <div>
                        <ProposalDocTitle>
                          {t("rescueProposalDocumentTitle")}
                        </ProposalDocTitle>
                        <ProposalDocCode>
                          RESCUE-{data.rescueId}
                        </ProposalDocCode>
                      </div>
                      <ProposalTypeBadge
                        $isRoadside={data.status === "PROPOSED_ROADSIDE"}
                      >
                        {data.status === "PROPOSED_ROADSIDE" ? (
                          <>
                            <FaWrench size={11} /> Sửa tại chỗ
                          </>
                        ) : (
                          <>
                            <FaTruck size={11} /> Kéo về xưởng
                          </>
                        )}
                      </ProposalTypeBadge>
                    </ProposalDocHeader>

                    <ProposalDocBody>
                      {/* Phí ước tính */}
                      {data.estimatedServiceFee != null &&
                        data.estimatedServiceFee > 0 && (
                          <ProposalFeeBlock>
                            <ProposalFeeLabel>
                              <FaMoneyBillWave size={13} /> {t("rescueEstimatedFeeLabel")}
                            </ProposalFeeLabel>
                            <ProposalFeeAmount>
                              {data.estimatedServiceFee.toLocaleString()} VND
                            </ProposalFeeAmount>
                            <ProposalFeeNote>
                              {t("rescueEstimatedFeeNote")}
                            </ProposalFeeNote>
                          </ProposalFeeBlock>
                        )}

                      {/* Tiền đặt cọc */}
                      {data.depositAmount != null && data.depositAmount > 0 && (
                        <ProposalDepositBlock onClick={() => setShowDepositQR(true)}>
                          <ProposalDepositLabel>
                            <FaMoneyBillWave size={13} /> {t("rescueDepositLabel")}
                          </ProposalDepositLabel>
                          <ProposalDepositAmount>
                            {data.depositAmount.toLocaleString()} VND
                          </ProposalDepositAmount>
                          <ProposalDepositNote>
                            {t("rescueMgrDepositAmountHint")}
                          </ProposalDepositNote>
                          <ProposalDepositTapHint>
                            {t("rescueDepositTapQR")}
                          </ProposalDepositTapHint>
                        </ProposalDepositBlock>
                      )}

                      {/* Ghi chú SA */}
                      {data.proposalNotes && (
                        <ProposalSection>
                          <ProposalSectionTitle>
                              <FaStickyNote size={12} /> {t("rescueProposalWorkshopNote")}
                          </ProposalSectionTitle>
                          <ProposalNoteText>
                            {data.proposalNotes}
                          </ProposalNoteText>
                        </ProposalSection>
                      )}

                      {/* Dịch vụ dự kiến */}
                      {data.suggestedServices &&
                        data.suggestedServices.length > 0 && (
                          <ProposalSection>
                            <ProposalSectionTitle>
                              <FaTools size={12} /> {t("rescueProposalServicesTitle")}
                            </ProposalSectionTitle>
                            <ProposalPartsList>
                              {data.suggestedServices.map((svc, idx) => (
                                <ProposalPartItem key={idx}>
                                  <ProposalPartName>
                                    {svc.serviceName ||
                                      `${t("rescueServiceFallback")} #${svc.serviceId}`}
                                  </ProposalPartName>
                                  {svc.price != null && svc.price > 0 && (
                                    <ProposalPartMeta>
                                      {svc.price.toLocaleString()} VND
                                    </ProposalPartMeta>
                                  )}
                                </ProposalPartItem>
                              ))}
                            </ProposalPartsList>
                          </ProposalSection>
                        )}

                      {/* Phụ tùng dự kiến */}
                      {data.suggestedParts &&
                        data.suggestedParts.length > 0 && (
                          <ProposalSection>
                            <ProposalSectionTitle>
                              <FaBoxOpen size={12} /> {t("rescueProposalPartsTitle")}
                            </ProposalSectionTitle>
                            <ProposalPartsList>
                              {data.suggestedParts.map((part, idx) => (
                                <ProposalPartItem key={idx}>
                                  <ProposalPartName>
                                    {part.partName ||
                                      `${t("rescuePartFallback")} #${part.partId}`}
                                  </ProposalPartName>
                                  <ProposalPartMeta>
                                    x{part.quantity}
                                    {part.unitPrice != null &&
                                      part.unitPrice > 0 && (
                                        <>
                                          {" "}
                                          ·{" "}
                                          {(
                                            part.unitPrice * part.quantity
                                          ).toLocaleString()}{" "}
                                          VND
                                        </>
                                      )}
                                  </ProposalPartMeta>
                                </ProposalPartItem>
                              ))}
                            </ProposalPartsList>
                          </ProposalSection>
                        )}

                      {/* Hướng dẫn */}
                      <ProposalHintBox
                        $isRoadside={data.status === "PROPOSED_ROADSIDE"}
                      >
                        {data.status === "PROPOSED_ROADSIDE"
                          ? t("rescueProposalHintRoadside")
                          : t("rescueProposalHintTowing")}
                      </ProposalHintBox>
                    </ProposalDocBody>

                    <ProposalDocFooter>
                      <ProposalFooterNote>
                        {t("rescueProposalReadCarefully")}
                      </ProposalFooterNote>
                      <ActionBtnRow>
                        <ActionBtn
                          $color="#16a34a"
                          onClick={handleAcceptProposal}
                          disabled={proposalAccepting}
                          style={{ gap: "0.375rem" }}
                        >
                          <FaCheckCircle size={13} />
                          {proposalAccepting
                            ? t("rescueMgrProcessing")
                            : t("rescueAcceptProposalBtn")}
                        </ActionBtn>
                        <ActionBtnOutline
                          onClick={() => setShowCancelForm(true)}
                          disabled={proposalAccepting}
                          style={{ gap: "0.375rem" }}
                        >
                          <FaTimesCircle size={13} />
                          {t("rescueCustomerDeclineBtn")}
                        </ActionBtnOutline>
                      </ActionBtnRow>
                    </ProposalDocFooter>
                  </ProposalDocument>
                </>
              )}

            {/* KH: Đã đồng ý đề xuất — chờ đóng cọc */}
            {isCustomer &&
              data.status === "PROPOSAL_ACCEPTED" &&
              data.depositAmount != null &&
              data.depositAmount > 0 &&
              !data.isDepositPaid && (
                <>
                  <Divider />
                  <ActionCard>
                    <ActionInfo>
                      {t("rescueDepositRequiredInfo")}
                    </ActionInfo>
                    <ProposalDepositBlock
                      style={{ marginTop: "0.75rem" }}
                      onClick={() => setShowDepositQR(true)}
                    >
                      <ProposalDepositLabel>
                        <FaMoneyBillWave size={13} /> {t("rescueDepositDueLabel")}
                      </ProposalDepositLabel>
                      <ProposalDepositAmount>
                        {data.depositAmount.toLocaleString()} VND
                      </ProposalDepositAmount>
                      <ProposalDepositNote>
                        {t("rescueMgrDepositAmountHint")}
                      </ProposalDepositNote>
                      <ProposalDepositTapHint>
                        {t("rescueDepositTapQR")}
                      </ProposalDepositTapHint>
                    </ProposalDepositBlock>
                    <ActionBtnRow style={{ marginTop: "0.75rem", justifyContent: "flex-end" }}>
                      <ActionBtn
                        $color="#ea580c"
                        onClick={handlePayDeposit}
                        disabled={depositPaying}
                        style={{ gap: "0.375rem" }}
                      >
                        <FaCheckCircle size={13} />
                        {depositPaying ? t("rescueMgrProcessing") : t("rescueConfirmDepositBtn")}
                      </ActionBtn>
                    </ActionBtnRow>
                  </ActionCard>
                </>
              )}

            {/* KH: Đã đồng ý — KTV đã được phân công tự động */}
            {isCustomer && data.status === "EN_ROUTE" && (
                <>
                  <Divider />
                  <ActionCard>
                    <ActionInfo>
                      {t("rescueCustomerKtvEnRoute")}
                    </ActionInfo>
                  </ActionCard>
                </>
              )}

            {/* KH: KTV đến nơi — chờ chẩn đoán */}
            {isCustomer && data.status === "ON_SITE" && (
              <>
                <Divider />
                <ActionCard>
                  <ActionInfo>{t("rescueCustomerKtvOnSite")}</ActionInfo>
                </ActionCard>
              </>
            )}

            {/* KH: Chẩn đoán xong — cần xác nhận sửa tại chỗ */}
            {isCustomer && data.status === "DIAGNOSING" && (
              <>
                <Divider />
                <ActionCard $highlight>
                  <ActionCardTitle>{t("rescueCustomerDiagnosingTitle")}</ActionCardTitle>
                  <ActionInfo>{t("rescueCustomerDiagnosingInfo")}</ActionInfo>
                  <FormGroup>
                    <FormLabel>{t("rescueCustomerConsentNotesLabel")}</FormLabel>
                    <FormTextarea
                      value={consentNotes}
                      onChange={(e) => setConsentNotes(e.target.value)}
                      rows={2}
                      placeholder={t("rescueCustomerConsentNotesPlaceholder")}
                    />
                  </FormGroup>
                  <ActionBtnRow>
                    <ActionBtn
                      $color="#16a34a"
                      onClick={() =>
                        handleConsent({
                          consentGiven: true,
                          consentNotes: consentNotes.trim() || undefined,
                        })
                      }
                      disabled={consenting}
                    >
                      {consenting
                        ? t("rescueTechProcessing")
                        : t("rescueCustomerAgreeRepairBtn")}
                    </ActionBtn>
                    <ActionBtnOutline
                      onClick={() =>
                        handleConsent({
                          consentGiven: false,
                          consentNotes: consentNotes.trim() || undefined,
                        })
                      }
                      disabled={consenting}
                    >
                      {t("rescueCustomerDeclineBtn")}
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
                  <ActionInfo>{t("rescueCustomerRepairingInfo")}</ActionInfo>
                </ActionCard>
              </>
            )}

            {/* KH: Xưởng đã điều xe kéo — cần xác nhận */}
            {isCustomer && data.status === "TOWING_DISPATCHED" && (
              <>
                <Divider />
                <ActionCard $highlight>
                  <ActionCardTitle>{t("rescueCustomerTowingTitle")}</ActionCardTitle>
                  <ActionInfo>{t("rescueCustomerTowingInfo")}</ActionInfo>
                  <ActionBtnRow>
                    <ActionBtn
                      $color="#16a34a"
                      onClick={handleAcceptTowing}
                      disabled={consenting}
                    >
                      {consenting
                        ? t("rescueTechProcessing")
                        : t("rescueCustomerAcceptTowingBtn")}
                    </ActionBtn>
                  </ActionBtnRow>
                </ActionCard>
              </>
            )}

            {/* KH: Đã chấp nhận kéo / xe về xưởng */}
            {isCustomer &&
              ["TOWING_ACCEPTED", "TOWED"].includes(data.status as string) && (
                <>
                  <Divider />
                  <ActionCard>
                    <ActionInfo>
                      {data.status === "TOWING_ACCEPTED"
                        ? t("rescueCustomerTowingAcceptedInfo")
                        : t("rescueCustomerTowedInfo")}
                    </ActionInfo>
                  </ActionCard>
                </>
              )}

            {/* KH: Chờ hóa đơn */}
            {isCustomer &&
              ["REPAIR_COMPLETE", "INVOICED"].includes(
                data.status as string,
              ) && (
                <>
                  <Divider />
                  <ActionCard>
                    <ActionInfo>
                      {data.status === "REPAIR_COMPLETE"
                        ? t("rescueCustomerRepairComplete")
                        : t("rescueCustomerInvoiced")}
                    </ActionInfo>
                  </ActionCard>
                </>
              )}

            {/* KH: Thanh toán */}
            {isCustomer && data.status === "INVOICE_SENT" && !showPayment && (
              <>
                <Divider />
                <ActionCard $highlight>
                  <ActionCardTitle>{t("rescueCustomerNeedPaymentTitle")}</ActionCardTitle>
                  <ActionInfo>{t("rescueCustomerNeedPaymentInfo")}</ActionInfo>
                  <ActionBtnRow>
                    <ActionBtn
                      $color="#1d4ed8"
                      onClick={() => setShowPayment(true)}
                    >
                      {t("rescueCustomerConfirmPaymentBtn")}
                    </ActionBtn>
                  </ActionBtnRow>
                </ActionCard>
              </>
            )}

            {isCustomer && data.status === "INVOICE_SENT" && showPayment && (
              <>
                <Divider />
                <ActionCard $highlight>
                  <ActionCardTitle>{t("rescueCustomerPaymentInfoTitle")}</ActionCardTitle>
                  <FormGroup>
                    <FormLabel>{t("rescueCustomerPaymentMethodLabel")}</FormLabel>
                    <FormSelect
                      value={paymentMethod}
                      onChange={(e) =>
                        setPaymentMethod(
                          e.target
                            .value as IRescuePaymentPayload["paymentMethod"],
                        )
                      }
                    >
                      <option value="TRANSFER">{t("rescueCustomerPaymentMethodTransfer")}</option>
                      <option value="CASH">{t("rescueCustomerPaymentMethodCash")}</option>
                      <option value="CARD">{t("rescueCustomerPaymentMethodCard")}</option>
                      <option value="EWALLET">{t("rescueCustomerPaymentMethodEwallet")}</option>
                    </FormSelect>
                  </FormGroup>
                  <FormGroup>
                    <FormLabel>{t("rescueCustomerAmountLabel")}</FormLabel>
                    <FormInput
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      placeholder={t("rescueCustomerAmountPlaceholder")}
                    />
                  </FormGroup>
                  {paymentMethod === "TRANSFER" && (
                    <FormGroup>
                      <FormLabel>{t("rescueCustomerTransactionRefLabel")}</FormLabel>
                      <FormInput
                        value={paymentRef}
                        onChange={(e) => setPaymentRef(e.target.value)}
                        placeholder={t("rescueCustomerTransactionRefPlaceholder")}
                      />
                    </FormGroup>
                  )}
                  <ActionBtnRow>
                    <ActionBtn
                      $color="#1d4ed8"
                      onClick={handlePayment}
                      disabled={!paymentAmount || paymentSubmitting}
                    >
                      {paymentSubmitting
                        ? t("rescueTechProcessing")
                        : t("rescueCustomerPayBtn")}
                    </ActionBtn>
                    <ActionBtnOutline
                      onClick={() => setShowPayment(false)}
                      disabled={paymentSubmitting}
                    >
                      {t("rescueCustomerBackBtn")}
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
                    {t("rescueCancelBtn")}
                  </CancelBtn>
                </CancelSection>
              </>
            )}

            {canCancel && showCancelForm && (
              <>
                <Divider />
                <ActionCard $danger>
                  <ActionCardTitle>{t("rescueCancelTitle")}</ActionCardTitle>
                  <ActionInfo>{t("rescueCancelInfo")}</ActionInfo>
                  <FormGroup>
                    <FormLabel>{t("rescueCancelReasonLabel")}</FormLabel>
                    <FormTextarea
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      rows={3}
                      placeholder={t("rescueCancelReasonPlaceholder")}
                    />
                  </FormGroup>
                  <ActionBtnRow>
                    <ActionBtn
                      $color="#dc2626"
                      onClick={handleCancel}
                      disabled={!cancelReason.trim() || cancelling}
                    >
                      {cancelling
                        ? t("rescueCancelProcessing")
                        : t("rescueCancelConfirmBtn")}
                    </ActionBtn>
                    <ActionBtnOutline
                      onClick={() => {
                        setShowCancelForm(false);
                        setCancelReason("");
                      }}
                    >
                      {t("rescueCancelKeepBtn")}
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

      {/* Deposit QR Modal */}
      {showDepositQR && data?.depositAmount && (
        <QROverlay onClick={() => setShowDepositQR(false)}>
          <QRCard onClick={(e) => e.stopPropagation()}>
            <QRCardHeader>
              <QRCardTitle>{t("rescueDepositQRTitle")}</QRCardTitle>
              <CloseBtn onClick={() => setShowDepositQR(false)}>
                <FaTimes size={16} />
              </CloseBtn>
            </QRCardHeader>
            <QRCardBody>
              <QRAmount>{data.depositAmount.toLocaleString()} VND</QRAmount>
              <QRNote>RESCUE-{data.rescueId} · {t("rescueDepositLabel")}</QRNote>
              <QRImageWrapper>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=RESCUE-${data.rescueId}|DEPOSIT|${data.depositAmount}VND`}
                  alt={t("rescueDepositQRTitle")}
                  width={220}
                  height={220}
                />
              </QRImageWrapper>
              <QRHint>{t("rescueDepositQRScanHint")}</QRHint>
            </QRCardBody>
          </QRCard>
        </QROverlay>
      )}
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

// ─── Phiếu đề xuất styled components ─────────────────────────
const ProposalDocument = styled.div`
  border: 1.5px solid #2563eb;
  border-radius: 12px;
  overflow: hidden;
  margin-top: 0.5rem;
`;

const ProposalDocHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border-bottom: 1px solid #bfdbfe;
`;

const ProposalDocIcon = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: #2563eb;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const ProposalDocTitle = styled.div`
  font-size: 0.875rem;
  font-weight: 700;
  color: #1e3a8a;
`;

const ProposalDocCode = styled.div`
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 1px;
`;

const ProposalTypeBadge = styled.div<{ $isRoadside: boolean }>`
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 700;
  background: ${({ $isRoadside }) => ($isRoadside ? "#f0fdf4" : "#ecfeff")};
  color: ${({ $isRoadside }) => ($isRoadside ? "#16a34a" : "#0891b2")};
  border: 1.5px solid
    ${({ $isRoadside }) => ($isRoadside ? "#86efac" : "#67e8f9")};
  white-space: nowrap;
`;

const ProposalDocBody = styled.div`
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
  background: white;
`;

const ProposalFeeBlock = styled.div`
  background: #fefce8;
  border: 1.5px solid #fde68a;
  border-radius: 10px;
  padding: 0.875rem 1rem;
`;

const ProposalFeeLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.8rem;
  color: #92400e;
  font-weight: 600;
  margin-bottom: 0.25rem;
`;

const ProposalFeeAmount = styled.div`
  font-size: 1.375rem;
  font-weight: 800;
  color: #d97706;
  letter-spacing: -0.5px;
`;

const ProposalFeeNote = styled.div`
  font-size: 0.7rem;
  color: #a16207;
  margin-top: 0.25rem;
`;

const ProposalDepositBlock = styled.div`
  background: #fff7ed;
  border: 1.5px solid #fed7aa;
  border-radius: 10px;
  padding: 0.875rem 1rem;
`;

const ProposalDepositLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.8rem;
  color: #c2410c;
  font-weight: 600;
  margin-bottom: 0.25rem;
`;

const ProposalDepositAmount = styled.div`
  font-size: 1.375rem;
  font-weight: 800;
  color: #ea580c;
  letter-spacing: -0.5px;
`;

const ProposalDepositNote = styled.div`
  font-size: 0.7rem;
  color: #9a3412;
  margin-top: 0.25rem;
  font-style: italic;
`;

const ProposalDepositTapHint = styled.div`
  font-size: 0.7rem;
  color: #ea580c;
  font-weight: 600;
  margin-top: 0.5rem;
`;

const QROverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
`;

const QRCard = styled.div`
  background: white;
  border-radius: 16px;
  width: 300px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
`;

const QRCardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #e5e7eb;
`;

const QRCardTitle = styled.div`
  font-size: 0.9rem;
  font-weight: 700;
  color: #111827;
`;

const QRCardBody = styled.div`
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
`;

const QRAmount = styled.div`
  font-size: 1.5rem;
  font-weight: 800;
  color: #ea580c;
`;

const QRNote = styled.div`
  font-size: 0.75rem;
  color: #6b7280;
`;

const QRImageWrapper = styled.div`
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 0.75rem;
  margin-top: 0.25rem;

  img {
    display: block;
  }
`;

const QRHint = styled.div`
  font-size: 0.75rem;
  color: #9ca3af;
  text-align: center;
  margin-top: 0.25rem;
`;

const ProposalSection = styled.div``;

const ProposalSectionTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.8rem;
  font-weight: 700;
  color: #374151;
  margin-bottom: 0.375rem;
`;

const ProposalNoteText = styled.div`
  font-size: 0.8125rem;
  color: #374151;
  background: #f9fafb;
  border-left: 3px solid #6b7280;
  padding: 0.5rem 0.75rem;
  border-radius: 0 6px 6px 0;
  line-height: 1.5;
`;

const ProposalPartsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
`;

const ProposalPartItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f3f4f6;
  border-radius: 6px;
  padding: 0.375rem 0.625rem;
`;

const ProposalPartName = styled.span`
  font-size: 0.8125rem;
  color: #111827;
  font-weight: 500;
`;

const ProposalPartMeta = styled.span`
  font-size: 0.75rem;
  color: #6b7280;
`;

const ProposalHintBox = styled.div<{ $isRoadside: boolean }>`
  font-size: 0.8125rem;
  color: ${({ $isRoadside }) => ($isRoadside ? "#15803d" : "#0e7490")};
  background: ${({ $isRoadside }) => ($isRoadside ? "#f0fdf4" : "#ecfeff")};
  border-radius: 8px;
  padding: 0.625rem 0.875rem;
  border: 1px solid
    ${({ $isRoadside }) => ($isRoadside ? "#bbf7d0" : "#a5f3fc")};
`;

const ProposalDocFooter = styled.div`
  padding: 0.75rem 1rem;
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem;
`;

const ProposalFooterNote = styled.span`
  font-size: 0.75rem;
  color: #6b7280;
`;
