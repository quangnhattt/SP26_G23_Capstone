import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { HiX, HiPlus, HiTrash } from "react-icons/hi";
import { ConfigProvider, Tag, Select, Spin } from "antd";
import {
  serviceOrderService,
  type IAdditionalItemsResponse,
} from "@/services/admin/serviceOrderService";
import { getServices, type IService } from "@/services/admin/serviceService";
import { getProducts, type IProduct } from "@/services/admin/productService";
import { toast } from "react-toastify";

interface Props {
  isOpen: boolean;
  maintenanceId: number | null;
  canAdd: boolean; // true when order status === IN_DIAGNOSIS
  onClose: () => void;
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(v);

const ITEM_STATUS_COLOR: Record<string, string> = {
  APPROVED: "green",
  PENDING: "orange",
  REJECTED: "red",
};

type Row = { productId: number | null; quantity: number; notes: string };
const emptyRow = (): Row => ({ productId: null, quantity: 1, notes: "" });

const dropdownGlobalStyle = `
  .additional-items-dropdown .ant-select-item {
    color: #111827 !important;
  }
  .additional-items-dropdown .ant-select-item-option-content {
    color: #111827 !important;
  }
  .additional-items-dropdown .ant-select-item-option-selected {
    background-color: #eff6ff !important;
  }
`;

if (typeof document !== "undefined") {
  const styleId = "additional-items-dropdown-style";
  if (!document.getElementById(styleId)) {
    const tag = document.createElement("style");
    tag.id = styleId;
    tag.innerHTML = dropdownGlobalStyle;
    document.head.appendChild(tag);
  }
}

const selectTheme = {
  token: { colorText: "#111827", colorTextPlaceholder: "#6b7280" },
  components: {
    Select: {
      colorText: "#111827",
      colorTextPlaceholder: "#6b7280",
      colorBgContainer: "#fff",
      optionSelectedColor: "#111827",
      colorTextDisabled: "#111827",
      colorTextQuaternary: "#6b7280",
    },
  },
};

const AdditionalItemsModal = ({ isOpen, maintenanceId, canAdd, onClose }: Props) => {
  const { t } = useTranslation();
  const [data, setData] = useState<IAdditionalItemsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serviceRows, setServiceRows] = useState<Row[]>([emptyRow()]);
  const [partRows, setPartRows] = useState<Row[]>([emptyRow()]);
  const [serviceOptions, setServiceOptions] = useState<IService[]>([]);
  const [partOptions, setPartOptions] = useState<IProduct[]>([]);

  const reload = async (id: number) => {
    setLoading(true);
    try {
      setData(await serviceOrderService.getAdditionalItems(id));
    } catch {
      toast.error(t("additionalItemsLoadError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen || maintenanceId === null) return;
    reload(maintenanceId);
    setServiceRows([emptyRow()]);
    setPartRows([emptyRow()]);
  }, [isOpen, maintenanceId]);

  useEffect(() => {
    if (!isOpen || !canAdd) return;
    getServices().then(setServiceOptions).catch(() => {});
    getProducts({ pageSize: 200 }).then((res) => setPartOptions(res.items)).catch(() => {});
  }, [isOpen, canAdd]);

  const updateRow = <T extends Row>(
    setter: React.Dispatch<React.SetStateAction<T[]>>,
    idx: number,
    patch: Partial<T>
  ) => setter((rows) => rows.map((r, i) => (i === idx ? { ...r, ...patch } : r)));

  const handleSubmit = async () => {
    if (!maintenanceId) return;
    const services = serviceRows
      .filter((r) => r.productId !== null)
      .map(({ productId, quantity, notes }) => ({
        productId: productId!,
        quantity,
        ...(notes ? { notes } : {}),
      }));
    const parts = partRows
      .filter((r) => r.productId !== null)
      .map(({ productId, quantity, notes }) => ({
        productId: productId!,
        quantity,
        ...(notes ? { notes } : {}),
      }));

    if (!services.length && !parts.length) {
      toast.warning(t("additionalItemsValidation"));
      return;
    }
    try {
      setSubmitting(true);
      await serviceOrderService.addAdditionalItems(maintenanceId, { services, parts });
      toast.success(t("additionalItemsSuccess"));
      await reload(maintenanceId!);

      setServiceRows([emptyRow()]);
      setPartRows([emptyRow()]);
    } catch {
      toast.error(t("additionalItemsError"));
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // Flatten services + parts into a unified display list
  const flatItems = data
    ? [
        ...(data.services ?? []).map((s) => ({
          ...s,
          type: "SERVICE" as const,
        })),
        ...(data.parts ?? []).map((p) => ({ ...p, type: "PART" as const })),
      ]
    : [];

  return (
    <Overlay onClick={onClose}>
      <Box onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <HeaderTitle>{t("additionalItemsTitle")} #{maintenanceId}</HeaderTitle>
          <CloseBtn onClick={onClose}>
            <HiX size={20} />
          </CloseBtn>
        </ModalHeader>

        <Body>
          {loading ? (
            <Center>
              <Spin />
            </Center>
          ) : (
            <>
              {/* Existing items list */}
              <SectionLabel>{t("additionalItemsExistingLabel")}</SectionLabel>
              {flatItems.length > 0 ? (
                <TableWrapper>
                  <LineTable>
                    <thead>
                      <tr>
                        <Th style={{ width: 40 }}>{t("additionalItemsColNo")}</Th>
                        <Th>{t("additionalItemsColType")}</Th>
                        <Th>{t("additionalItemsColCode")}</Th>
                        <Th>{t("additionalItemsColName")}</Th>
                        <Th style={{ textAlign: "right" }}>{t("additionalItemsColQty")}</Th>
                        <Th style={{ textAlign: "right" }}>{t("additionalItemsColUnitPrice")}</Th>
                        <Th style={{ textAlign: "center" }}>{t("additionalItemsColStatus")}</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {flatItems.map((item, idx) => (
                        <Tr key={idx}>
                          <TdMuted>{idx + 1}</TdMuted>
                          <Td>
                            <Tag color={item.type === "SERVICE" ? "blue" : "purple"}>
                              {item.type === "SERVICE"
                                ? t("additionalItemsTypeService")
                                : t("additionalItemsTypePart")}
                            </Tag>
                          </Td>
                          <TdMuted style={{ textAlign: "left" }}>
                            {item.itemCode}
                          </TdMuted>
                          <Td>
                            <div>{item.itemName}</div>
                            {item.notes && (
                              <NoteText>{item.notes}</NoteText>
                            )}
                          </Td>
                          <TdRight>{item.quantity}</TdRight>
                          <TdRight>{formatCurrency(item.unitPrice)}</TdRight>
                          <Td style={{ textAlign: "center" }}>
                            <Tag color={ITEM_STATUS_COLOR[item.itemStatus] ?? "default"}>
                              {t(`additionalItemsStatus_${item.itemStatus}`) || item.itemStatus}
                            </Tag>
                          </Td>
                        </Tr>
                      ))}
                    </tbody>
                  </LineTable>
                </TableWrapper>
              ) : (
                <EmptyText>{t("additionalItemsEmpty")}</EmptyText>
              )}

              {/* Add form — only when IN_DIAGNOSIS */}
              {canAdd && (
                <>
                  <SectionLabel style={{ marginTop: 20 }}>
                    {t("additionalItemsNewServicesLabel")}
                  </SectionLabel>
                  {serviceRows.map((row, idx) => (
                    <FormRow key={idx}>
                      <ConfigProvider theme={selectTheme}>
                        <Select
                          showSearch
                          placeholder={t("additionalItemsSelectService")}
                          style={{ flex: 1, minWidth: 0 }}
                          popupClassName="additional-items-dropdown"
                          value={row.productId ?? undefined}
                          onChange={(val) =>
                            updateRow(setServiceRows, idx, { productId: val })
                          }
                          filterOption={(input, opt) =>
                            (opt?.label as string ?? "")
                              .toLowerCase()
                              .includes(input.toLowerCase())
                          }
                          options={serviceOptions.map((s) => ({
                            value: s.id,
                            label: `[${s.code}] ${s.name}`,
                          }))}
                        />
                      </ConfigProvider>
                      <QtyInput
                        type="number"
                        placeholder={t("additionalItemsQtyPlaceholder")}
                        value={row.quantity}
                        min={0.01}
                        step={0.01}
                        onChange={(e) =>
                          updateRow(setServiceRows, idx, {
                            quantity: parseFloat(e.target.value) || 1,
                          })
                        }
                      />
                      <NoteInput
                        placeholder={t("additionalItemsNotePlaceholder")}
                        value={row.notes}
                        onChange={(e) =>
                          updateRow(setServiceRows, idx, {
                            notes: e.target.value,
                          })
                        }
                      />
                      {serviceRows.length > 1 && (
                        <RemoveBtn
                          onClick={() =>
                            setServiceRows((r) =>
                              r.filter((_, i) => i !== idx)
                            )
                          }
                        >
                          <HiTrash size={15} />
                        </RemoveBtn>
                      )}
                    </FormRow>
                  ))}
                  <AddBtn onClick={() => setServiceRows((r) => [...r, emptyRow()])}>
                    <HiPlus size={13} /> {t("additionalItemsAddRow")}
                  </AddBtn>

                  <SectionLabel style={{ marginTop: 16 }}>
                    {t("additionalItemsNewPartsLabel")}
                  </SectionLabel>
                  {partRows.map((row, idx) => (
                    <FormRow key={idx}>
                      <ConfigProvider theme={selectTheme}>
                        <Select
                          showSearch
                          placeholder={t("additionalItemsSelectPart")}
                          style={{ flex: 1, minWidth: 0 }}
                          popupClassName="additional-items-dropdown"
                          value={row.productId ?? undefined}
                          onChange={(val) =>
                            updateRow(setPartRows, idx, { productId: val })
                          }
                          filterOption={(input, opt) =>
                            (opt?.label as string ?? "")
                              .toLowerCase()
                              .includes(input.toLowerCase())
                          }
                          options={partOptions.map((p) => ({
                            value: p.id,
                            label: `[${p.code}] ${p.name}`,
                          }))}
                        />
                      </ConfigProvider>
                      <QtyInput
                        type="number"
                        placeholder={t("additionalItemsQtyPlaceholder")}
                        value={row.quantity}
                        min={1}
                        step={1}
                        onChange={(e) =>
                          updateRow(setPartRows, idx, {
                            quantity: parseInt(e.target.value) || 1,
                          })
                        }
                      />
                      <NoteInput
                        placeholder={t("additionalItemsNotePlaceholder")}
                        value={row.notes}
                        onChange={(e) =>
                          updateRow(setPartRows, idx, {
                            notes: e.target.value,
                          })
                        }
                      />
                      {partRows.length > 1 && (
                        <RemoveBtn
                          onClick={() =>
                            setPartRows((r) =>
                              r.filter((_, i) => i !== idx)
                            )
                          }
                        >
                          <HiTrash size={15} />
                        </RemoveBtn>
                      )}
                    </FormRow>
                  ))}
                  <AddBtn onClick={() => setPartRows((r) => [...r, emptyRow()])}>
                    <HiPlus size={13} /> {t("additionalItemsAddRow")}
                  </AddBtn>
                </>
              )}
            </>
          )}
        </Body>

        <Footer>
          <CancelBtn onClick={onClose}>{t("additionalItemsClose")}</CancelBtn>
          {canAdd && (
            <ConfirmBtn onClick={handleSubmit} disabled={submitting}>
              {submitting ? t("additionalItemsSubmitting") : t("additionalItemsSubmit")}
            </ConfirmBtn>
          )}
        </Footer>
      </Box>
    </Overlay>
  );
};

export default AdditionalItemsModal;

// ─── Styled Components ────────────────────────────────────────────────────────

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 24px;
`;

const Box = styled.div`
  background: #fff;
  border-radius: 14px;
  width: 100%;
  max-width: 860px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
  background: #f8faff;
  border-radius: 14px 14px 0 0;
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
  padding: 20px;
  overflow-y: auto;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const Center = styled.div`
  display: flex;
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

const TableWrapper = styled.div`
  overflow-x: auto;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
`;

const LineTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
`;

const Th = styled.th`
  padding: 9px 12px;
  text-align: left;
  font-weight: 600;
  color: #374151;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  white-space: nowrap;
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

const TdMuted = styled(Td)`
  color: #9ca3af;
  font-size: 12px;
  text-align: center;
`;

const TdRight = styled(Td)`
  text-align: right;
  white-space: nowrap;
`;

const NoteText = styled.div`
  font-size: 11px;
  color: #9ca3af;
  margin-top: 2px;
`;

const EmptyText = styled.div`
  text-align: center;
  color: #9ca3af;
  font-size: 14px;
  padding: 20px 0;
`;

const FormRow = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const QtyInput = styled.input`
  width: 80px;
  padding: 7px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  color: #111827;
  outline: none;
  &:focus {
    border-color: #3b82f6;
  }
`;

const NoteInput = styled.input`
  flex: 1;
  padding: 7px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  color: #111827;
  outline: none;
  &:focus {
    border-color: #3b82f6;
  }
`;

const RemoveBtn = styled.button`
  background: none;
  border: none;
  color: #ef4444;
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  &:hover {
    background: #fef2f2;
  }
`;

const AddBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 12px;
  border: 1px dashed #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  color: #6b7280;
  background: none;
  cursor: pointer;
  align-self: flex-start;
  &:hover {
    border-color: #3b82f6;
    color: #3b82f6;
  }
`;

const Footer = styled.div`
  padding: 14px 20px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
`;

const CancelBtn = styled.button`
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

const ConfirmBtn = styled.button`
  padding: 8px 20px;
  background: #3b82f6;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  cursor: pointer;
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  &:not(:disabled):hover {
    background: #2563eb;
  }
`;
