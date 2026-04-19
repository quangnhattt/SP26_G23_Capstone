import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { HiX, HiDocumentText } from "react-icons/hi";
import { Spin } from "antd";
import {
  serviceOrderService,
  type IInvoice,
} from "@/services/admin/serviceOrderService";
import { toast } from "react-toastify";
import {
  formatLineItemBracketLines,
  formatLineItemSourceTypeDisplay,
} from "./lineItemDisplayFormatting";

interface Props {
  isOpen: boolean;
  maintenanceId: number | null;
  mode?: "create" | "view";
  onSuccess?: () => void;
  onClose: () => void;
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    v,
  );

const formatDate = (iso: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const InvoiceModal = ({
  isOpen,
  maintenanceId,
  mode = "create",
  onSuccess,
  onClose,
}: Props) => {
  const { t } = useTranslation();
  const [invoice, setInvoice] = useState<IInvoice | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || maintenanceId === null) return;
    let cancelled = false;

    // Defer state updates to avoid synchronous setState in effect body.
    Promise.resolve().then(() => {
      if (!cancelled) {
        setLoading(true);
        setInvoice(null);
      }
    });

    const apiCall =
      mode === "view"
        ? serviceOrderService.getInvoice(maintenanceId)
        : serviceOrderService.createInvoice(maintenanceId);

    apiCall
      .then((data) => {
        if (!cancelled) {
          setInvoice(data);
          if (mode === "create") {
            onSuccess?.();
          }
        }
      })
      .catch(() => {
        if (!cancelled) toast.error(t("invoiceLoadError"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, maintenanceId, mode, onSuccess, t]);

  if (!isOpen) return null;

  return (
    <Overlay onClick={onClose}>
      <Box onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <HeaderLeft>
            <HiDocumentText size={20} color="#3b82f6" />
            <HeaderTitle>
              {t("invoiceTitle")} #{maintenanceId}
            </HeaderTitle>
          </HeaderLeft>
          <CloseBtn onClick={onClose}>
            <HiX size={20} />
          </CloseBtn>
        </ModalHeader>

        <Body>
          {loading && (
            <Center>
              <Spin />
            </Center>
          )}

          {!loading && invoice && (
            <>
              <BodyIntro>
                {/* Customer */}
                <SectionLabel>{t("invoiceCustomerInfo")}</SectionLabel>
                <InfoGrid>
                  <InfoItem>
                    <InfoLabel>{t("invoiceCustomerFullName")}</InfoLabel>
                    <InfoValue>{invoice.customer.fullName}</InfoValue>
                  </InfoItem>
                  <InfoItem>
                    <InfoLabel>{t("invoiceCustomerPhone")}</InfoLabel>
                    <InfoValue>{invoice.customer.phone}</InfoValue>
                  </InfoItem>
                  <InfoItem>
                    <InfoLabel>{t("invoiceCustomerEmail")}</InfoLabel>
                    <InfoValue>{invoice.customer.email}</InfoValue>
                  </InfoItem>
                  <InfoItem>
                    <InfoLabel>{t("invoiceCustomerMembership")}</InfoLabel>
                    <InfoValue>{invoice.membershipRankApplied || "—"}</InfoValue>
                  </InfoItem>
                </InfoGrid>

                {/* Vehicle */}
                <SectionLabel>{t("invoiceVehicleInfo")}</SectionLabel>
                <InfoGrid>
                  <InfoItem>
                    <InfoLabel>{t("invoiceVehicleBrandModel")}</InfoLabel>
                    <InfoValue>
                      {invoice.brand} {invoice.model}
                    </InfoValue>
                  </InfoItem>
                  <InfoItem>
                    <InfoLabel>{t("invoiceVehiclePlate")}</InfoLabel>
                    <InfoValue>{invoice.licensePlate}</InfoValue>
                  </InfoItem>
                  <InfoItem>
                    <InfoLabel>{t("invoiceVehicleColor")}</InfoLabel>
                    <InfoValue>{invoice.color}</InfoValue>
                  </InfoItem>
                  <InfoItem>
                    <InfoLabel>{t("invoiceVehicleReceiveDate")}</InfoLabel>
                    <InfoValue>{formatDate(invoice.maintenanceDate)}</InfoValue>
                  </InfoItem>
                </InfoGrid>

                {/* Packages */}
                {invoice.packageUsages?.length > 0 && (
                  <>
                    <SectionLabel>{t("invoicePackages")}</SectionLabel>
                    <PackageList>
                      {invoice.packageUsages.map((pkg, i) => (
                        <PackageRow key={i}>
                          <PackageName>
                            {pkg.packageName}{" "}
                            <PackageCode>({pkg.packageCode})</PackageCode>
                          </PackageName>
                          <PackageDiscount>
                            -{formatCurrency(pkg.packageDiscountAmount)}
                          </PackageDiscount>
                        </PackageRow>
                      ))}
                    </PackageList>
                  </>
                )}
              </BodyIntro>

              {/* Line items: scroll only this block so more rows fit on small screens */}
              <LineItemsSection>
                <SectionLabel>{t("invoiceLineItems")}</SectionLabel>
                <TableScrollArea>
                  <LineTable>
                    <thead>
                      <tr>
                        <Th style={{ width: 40 }}>{t("invoiceColNo")}</Th>
                        <Th>{t("invoiceColType")}</Th>
                        <Th>{t("invoiceColName")}</Th>
                        <Th style={{ textAlign: "right" }}>
                          {t("invoiceColQty")}
                        </Th>
                        <Th style={{ textAlign: "right" }}>
                          {t("invoiceColUnitPrice")}
                        </Th>
                        <Th style={{ textAlign: "right" }}>
                          {t("invoiceColTotal")}
                        </Th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.lineItems.map((item, idx) => (
                        <Tr key={idx}>
                          <TdMuted>{idx + 1}</TdMuted>
                          <Td>
                            {formatLineItemSourceTypeDisplay(item.sourceType, t)}
                          </Td>
                          <TdName>
                            <NamePrimary>
                              {item.itemName
                                ? formatLineItemBracketLines(item.itemName, t)
                                : "—"}
                            </NamePrimary>
                            {item.notes && (
                              <NameNote>
                                {formatLineItemBracketLines(item.notes, t)}
                              </NameNote>
                            )}
                          </TdName>
                          <TdRight>{item.quantity}</TdRight>
                          <TdRight>{formatCurrency(item.unitPrice)}</TdRight>
                          <TdRight>{formatCurrency(item.totalPrice)}</TdRight>
                        </Tr>
                      ))}
                    </tbody>
                  </LineTable>
                </TableScrollArea>
              </LineItemsSection>

              {/* Summary */}
              <SummaryBox>
                {invoice.membershipDiscountAmount > 0 && (
                  <SummaryRow>
                    <span>
                      {t("invoiceMembershipDiscount")} (
                      {invoice.membershipDiscountPercent}%)
                    </span>
                    <DiscountValue>
                      -{formatCurrency(invoice.membershipDiscountAmount)}
                    </DiscountValue>
                  </SummaryRow>
                )}
                <SummaryTotal>
                  <span>{t("invoiceFinalAmount")}</span>
                  <TotalValue>{formatCurrency(invoice.finalAmount)}</TotalValue>
                </SummaryTotal>
              </SummaryBox>
            </>
          )}
        </Body>

        <Footer>
          <CloseTextBtn onClick={onClose}>{t("invoiceClose")}</CloseTextBtn>
        </Footer>
      </Box>
    </Overlay>
  );
};

export default InvoiceModal;

// ─── Styled Components ────────────────────────────────────────────────────────

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 8px;
  overflow: hidden;
  @media (min-width: 640px) {
    padding: 24px;
  }
`;

const Box = styled.div`
  background: #fff;
  border-radius: 14px;
  width: 100%;
  max-width: 900px;
  max-height: calc(100dvh - 16px);
  height: min(92dvh, calc(100dvh - 16px));
  min-height: 0;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  @media (min-width: 640px) {
    max-height: min(92dvh, calc(100dvh - 48px));
    height: min(92dvh, calc(100dvh - 48px));
  }
`;

const ModalHeader = styled.div`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
  background: #f8faff;
  border-radius: 14px 14px 0 0;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const HeaderTitle = styled.h2`
  font-size: 16px;
  font-weight: 700;
  margin: 0;
  color: #111827;
`;

const CloseBtn = styled.button`
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 4px;
  border-radius: 6px;
  &:hover {
    background: rgba(0, 0, 0, 0.06);
  }
`;

const Body = styled.div`
  padding: 16px;
  overflow: hidden;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
  @media (min-width: 640px) {
    padding: 20px;
  }
`;

const BodyIntro = styled.div`
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
  max-height: 38dvh;
  overscroll-behavior: contain;
  @media (min-width: 640px) {
    max-height: 34vh;
  }
`;

const LineItemsSection = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1 1 0%;
  min-height: 0;
  overflow: hidden;
  gap: 8px;
`;

const TableScrollArea = styled.div`
  flex: 1 1 0%;
  min-height: 0;
  overflow: auto;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
`;

const Center = styled.div`
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
`;

const SectionLabel = styled.h3`
  font-size: 12px;
  font-weight: 700;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0;
  padding-bottom: 8px;
  border-bottom: 1px solid #f3f4f6;
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 24px;
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const InfoItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const InfoLabel = styled.span`
  font-size: 12px;
  color: #9ca3af;
`;

const InfoValue = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: #111827;
`;

const PackageList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const PackageRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
`;

const PackageName = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: #111827;
`;

const PackageCode = styled.span`
  font-size: 12px;
  color: #6b7280;
`;

const PackageDiscount = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: #16a34a;
`;

const LineTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
`;

const Th = styled.th`
  position: sticky;
  top: 0;
  z-index: 1;
  padding: 9px 12px;
  text-align: left;
  font-weight: 600;
  color: #374151;
  background: #f3f4f6;
  border-bottom: 1px solid #e5e7eb;
  white-space: nowrap;
  box-shadow: inset 0 -1px 0 #e5e7eb;
`;

const Tr = styled.tr`
  &:not(:last-child) {
    border-bottom: 1px solid #f3f4f6;
  }
  &:hover {
    background: #f9fafb;
  }
`;

const Td = styled.td`
  padding: 9px 12px;
  color: #374151;
`;

const TdName = styled(Td)`
  padding: 9px 12px;
  color: #111827;
  vertical-align: top;
`;

const NamePrimary = styled.div`
  color: #111827;
  font-weight: 500;
  line-height: 1.45;
`;

const NameNote = styled.div`
  margin-top: 4px;
  font-size: 12px;
  color: #111827;
  line-height: 1.45;
`;

const TdMuted = styled(Td)`
  color: #9ca3af;
  font-size: 12px;
  text-align: center;
`;

const TdRight = styled(Td)`
  text-align: right;
  white-space: nowrap;
`;

const SummaryBox = styled.div`
  flex-shrink: 0;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  overflow: hidden;
  background: #fff;
`;

const SummaryRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  font-size: 14px;
  color: #374151;
  border-bottom: 1px solid #f3f4f6;
`;

const DiscountValue = styled.span`
  color: #16a34a;
  font-weight: 600;
`;

const SummaryTotal = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  font-size: 15px;
  font-weight: 700;
  color: #111827;
  background: #f9fafb;
`;

const TotalValue = styled.span`
  color: #1d4ed8;
  font-size: 17px;
`;

const Footer = styled.div`
  flex-shrink: 0;
  padding: 14px 20px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
`;

const CloseTextBtn = styled.button`
  padding: 8px 20px;
  border: 1px solid #e5e7eb;
  background: #fff;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  color: #374151;
  &:hover {
    background: #f9fafb;
  }
`;
