import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { HiX, HiPlus, HiTrash } from "react-icons/hi";
import {
  ConfigProvider,
  Tag,
  Select,
  Spin,
  Table as AntTable,
  InputNumber,
} from "antd";
import type { ColumnsType } from "antd/es/table";
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
  onSuccess?: () => void;
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(v);

const ITEM_STATUS_COLOR: Record<string, string> = {
  APPROVED: "green",
  PENDING: "orange",
  REJECTED: "red",
};

type FlatItemRow = {
  type: "SERVICE" | "PART";
  itemCode: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
  itemStatus: string;
};

type Row = { productId: number | null; quantity: number | null; notes: string };
const emptyRow = (): Row => ({ productId: null, quantity: null, notes: "" });

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

const AdditionalItemsModal = ({ isOpen, maintenanceId, canAdd, onClose, onSuccess }: Props) => {
  const { t } = useTranslation();
  const [data, setData] = useState<IAdditionalItemsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
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
    setHasSubmitted(false);
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

    const rowsWithProduct = [...serviceRows, ...partRows].filter(
      (r) => r.productId !== null,
    );
    const hasInvalidQty = rowsWithProduct.some(
      (r) => r.quantity == null || r.quantity < 1,
    );
    if (hasInvalidQty) {
      toast.warning(t("additionalItemsQtyInvalid"));
      return;
    }

    const services = serviceRows
      .filter(
        (r) =>
          r.productId !== null &&
          r.quantity != null &&
          r.quantity >= 1,
      )
      .map(({ productId, quantity, notes }) => ({
        productId: productId!,
        quantity: quantity!,
        ...(notes ? { notes } : {}),
      }));
    const parts = partRows
      .filter(
        (r) =>
          r.productId !== null &&
          r.quantity != null &&
          r.quantity >= 1,
      )
      .map(({ productId, quantity, notes }) => ({
        productId: productId!,
        quantity: quantity!,
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
      setHasSubmitted(true);
      await reload(maintenanceId!);

      setServiceRows([emptyRow()]);
      setPartRows([emptyRow()]);
    } catch {
      toast.error(t("additionalItemsError"));
    } finally {
      setSubmitting(false);
    }
  };

  const flatItems: FlatItemRow[] = useMemo(
    () =>
      data
        ? [
            ...(data.services ?? []).map((s) => ({
              ...s,
              type: "SERVICE" as const,
            })),
            ...(data.parts ?? []).map((p) => ({ ...p, type: "PART" as const })),
          ]
        : [],
    [data],
  );

  const additionalItemsColumns: ColumnsType<FlatItemRow> = useMemo(
    () => [
      {
        title: t("additionalItemsColNo"),
        key: "index",
        width: 56,
        align: "center",
        render: (_: unknown, __: FlatItemRow, index: number) => index + 1,
      },
      {
        title: t("additionalItemsColType"),
        key: "type",
        width: 120,
        render: (_: unknown, record: FlatItemRow) => (
          <Tag color={record.type === "SERVICE" ? "blue" : "purple"}>
            {record.type === "SERVICE"
              ? t("additionalItemsTypeService")
              : t("additionalItemsTypePart")}
          </Tag>
        ),
      },
      {
        title: t("additionalItemsColCode"),
        dataIndex: "itemCode",
        key: "itemCode",
        width: 120,
        render: (code: string) => <CodeCell>{code}</CodeCell>,
      },
      {
        title: t("additionalItemsColName"),
        key: "itemName",
        ellipsis: true,
        render: (_: unknown, record: FlatItemRow) => (
          <div>
            <div>{record.itemName}</div>
            {record.notes && <NoteText>{record.notes}</NoteText>}
          </div>
        ),
      },
      {
        title: t("additionalItemsColQty"),
        dataIndex: "quantity",
        key: "quantity",
        width: 88,
        align: "right",
      },
      {
        title: t("additionalItemsColUnitPrice"),
        key: "unitPrice",
        width: 120,
        align: "right",
        render: (_: unknown, record: FlatItemRow) =>
          formatCurrency(record.unitPrice),
      },
      {
        title: t("additionalItemsColStatus"),
        key: "itemStatus",
        width: 130,
        align: "center",
        render: (_: unknown, record: FlatItemRow) => (
          <Tag color={ITEM_STATUS_COLOR[record.itemStatus] ?? "default"}>
            {t(`additionalItemsStatus_${record.itemStatus}`) || record.itemStatus}
          </Tag>
        ),
      },
    ],
    [t],
  );

  const handleClose = () => {
    if (hasSubmitted) onSuccess?.();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Overlay onClick={handleClose}>
      <Box onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <HeaderTitle>{t("additionalItemsTitle")} #{maintenanceId}</HeaderTitle>
          <CloseBtn onClick={handleClose}>
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
                <TableCard>
                  <AntTable<FlatItemRow>
                    columns={additionalItemsColumns}
                    dataSource={flatItems}
                    rowKey={(record, index) =>
                      `${record.type}-${record.itemCode}-${index}`
                    }
                    pagination={false}
                    size="small"
                    scroll={{ x: "max-content" }}
                  />
                </TableCard>
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
                          filterOption={(input, opt) => {
                            const id = opt?.value as number | undefined;
                            const s = serviceOptions.find((x) => x.id === id);
                            if (!s) return false;
                            return `[${s.code}] ${s.name}`
                              .toLowerCase()
                              .includes(input.toLowerCase());
                          }}
                          options={serviceOptions.map((s) => ({
                            value: s.id,
                            label: (
                              <span style={{ color: "#111827" }}>{`[${s.code}] ${s.name}`}</span>
                            ),
                          }))}
                        />
                      </ConfigProvider>
                      <QtyInputNumber
                        min={1}
                        step={1}
                        precision={0}
                        placeholder={t("additionalItemsQtyPlaceholder")}
                        value={row.quantity ?? null}
                        controls
                        onChange={(val) =>
                          updateRow(setServiceRows, idx, {
                            quantity:
                              val != null && !Number.isNaN(Number(val))
                                ? Math.max(1, Math.floor(Number(val)))
                                : null,
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
                          filterOption={(input, opt) => {
                            const id = opt?.value as number | undefined;
                            const p = partOptions.find((x) => x.id === id);
                            if (!p) return false;
                            return `[${p.code}] ${p.name}`
                              .toLowerCase()
                              .includes(input.toLowerCase());
                          }}
                          options={partOptions.map((p) => ({
                            value: p.id,
                            label: (
                              <span style={{ color: "#111827" }}>{`[${p.code}] ${p.name}`}</span>
                            ),
                          }))}
                        />
                      </ConfigProvider>
                      <QtyInputNumber
                        min={1}
                        step={1}
                        precision={0}
                        placeholder={t("additionalItemsQtyPlaceholder")}
                        value={row.quantity ?? null}
                        controls
                        onChange={(val) =>
                          updateRow(setPartRows, idx, {
                            quantity:
                              val != null && !Number.isNaN(Number(val))
                                ? Math.max(1, Math.floor(Number(val)))
                                : null,
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
          <CancelBtn onClick={handleClose}>{t("additionalItemsClose")}</CancelBtn>
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

const TableCard = styled.div`
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
  padding: 0 8px;

  .ant-table {
    color: #374151;
  }
  .ant-table-thead > tr > th,
  .ant-table-thead > tr > td {
    color: #374151 !important;
    background: #f3f4f6 !important;
  }
  .ant-table-tbody > tr > td {
    color: #374151 !important;
  }
  .ant-table-tbody > tr:hover > td {
    background: #f9fafb !important;
  }
`;

const CodeCell = styled.span`
  color: #9ca3af;
  font-size: 12px;
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

const QtyInputNumber = styled(InputNumber)`
  width: 112px !important;
  flex-shrink: 0;

  && .ant-input-number-input-wrap input {
    color: #111827 !important;
    -webkit-text-fill-color: #111827 !important;
    font-size: 13px;
  }

  && .ant-input-number-handler-wrap {
    border-inline-start-color: #d1d5db;
  }

  && .ant-input-number-handler {
    color: #374151;
  }

  && .ant-input-number-handler:hover {
    color: #111827;
  }

  &&.ant-input-number-outlined {
    border-color: #d1d5db;
    border-radius: 6px;
  }

  &&.ant-input-number-focused.ant-input-number-outlined {
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.12);
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
