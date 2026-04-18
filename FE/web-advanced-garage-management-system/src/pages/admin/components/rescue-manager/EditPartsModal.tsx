import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { FaTimes } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { addRepairItems, type IRescueRequest } from "@/apis/rescue";
import type { IProduct } from "@/services/admin/productService";
import { toast } from "react-toastify";

interface SelectedPart {
  product: IProduct;
  qty: number;
  unitPrice: number;
  notes: string;
}

interface EditPartsModalProps {
  rescue: IRescueRequest;
  actorId?: number;
  onClose: () => void;
  onSuccess: () => void;
}

const EditPartsModal = ({
  rescue,
  actorId,
  onClose,
  onSuccess,
}: EditPartsModalProps) => {
  const { t } = useTranslation();
  const [selectedParts, setSelectedParts] = useState<SelectedPart[]>([]);
  const [search, setSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const suggestedProducts = useMemo<IProduct[]>(
    () =>
      (rescue.suggestedParts ?? []).map((part) => ({
        id: part.partId,
        code: part.partCode ?? `PART-${part.partId}`,
        name: part.partName ?? `Part #${part.partId}`,
        price: part.unitPrice ?? 0,
        unit: part.partType ?? null,
        category: "",
        warranty: 0,
        minStockLevel: 0,
        stockQty: 0,
        description: "",
        image: null,
        isActive: true,
      })),
    [rescue.suggestedParts],
  );

  useEffect(() => {
    if (selectedParts.length > 0) return;
    if (!rescue.suggestedParts || rescue.suggestedParts.length === 0) return;

    const byId = new Map<number, IProduct>();
    for (const p of suggestedProducts) byId.set(p.id, p);

    const initialSelected: SelectedPart[] = rescue.suggestedParts.map((part) => {
      const product =
        byId.get(part.partId) ??
        ({
          id: part.partId,
          code: part.partCode ?? `PART-${part.partId}`,
          name: part.partName ?? `Part #${part.partId}`,
          price: part.unitPrice ?? 0,
          unit: part.partType ?? null,
          category: "",
          warranty: 0,
          minStockLevel: 0,
          stockQty: 0,
          description: "",
          image: null,
          isActive: true,
        } as IProduct);

      return {
        product,
        qty: part.quantity > 0 ? part.quantity : 1,
        unitPrice: part.unitPrice ?? product.price ?? 0,
        notes: "",
      };
    });

    setSelectedParts(initialSelected);
  }, [rescue.suggestedParts, suggestedProducts, selectedParts.length]);

  const filtered = selectedParts.filter(
    (p) =>
      p.product.name.toLowerCase().includes(search.toLowerCase()) ||
      p.product.code.toLowerCase().includes(search.toLowerCase()),
  );

  const updateQty = (productId: number, qty: number) => {
    if (qty < 1) return;
    setSelectedParts((prev) =>
      prev.map((p) => (p.product.id === productId ? { ...p, qty } : p)),
    );
  };

  const updateUnitPrice = (productId: number, unitPrice: number) => {
    setSelectedParts((prev) =>
      prev.map((p) =>
        p.product.id === productId ? { ...p, unitPrice } : p,
      ),
    );
  };

  const updateNotes = (productId: number, notes: string) => {
    setSelectedParts((prev) =>
      prev.map((p) =>
        p.product.id === productId ? { ...p, notes } : p,
      ),
    );
  };

  const ALLOWED_STATUSES: string[] = ["DIAGNOSING", "REPAIRING"];

  const handleSubmit = async () => {
    if (!ALLOWED_STATUSES.includes(rescue.status)) {
      toast.error(t("rescueTechRepairItemsInvalidStatus"));
      return;
    }
    if (selectedParts.length === 0) {
      toast.error(t("rescueTechRepairItemsRequired"));
      return;
    }
    setSubmitting(true);
    try {
      await addRepairItems(rescue.rescueId, {
        actorId,
        items: selectedParts.map((p) => ({
          productId: p.product.id,
          quantity: p.qty,
          unitPrice: p.unitPrice,
          notes: p.notes.trim() || undefined,
        })),
      });
      toast.success(t("rescueTechRepairItemsSuccess"));
      onSuccess();
    } catch {
      toast.error(t("rescueTechRepairItemsError"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>
            {t("rescueMgrEditPartsModalTitle")} — RESCUE-{rescue.rescueId}
          </ModalTitle>
          <CloseBtn onClick={onClose} disabled={submitting}>
            <FaTimes />
          </CloseBtn>
        </ModalHeader>

        <ModalBody>
          <HintText>{t("rescueMgrEditPartsHint")}</HintText>

          {/* Search */}
          <SearchInput
            placeholder={t("rescueMgrPartsSearchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {/* Product list: chỉ hiển thị phụ tùng đã có trên đơn */}
          {filtered.length === 0 ? (
            <EmptyText>{t("rescueMgrProposalPartsEmpty")}</EmptyText>
          ) : (
            <CheckList>
              {filtered.map((selected) => {
                const product = selected.product;
                return (
                  <CheckItem
                    key={product.id}
                    $checked={true}
                  >
                    <CheckBox $checked={true}>✓</CheckBox>
                    <CheckItemInfo>
                      <CheckItemName>{product.name}</CheckItemName>
                      <CheckItemMeta>
                        {product.code}
                        {product.unit ? ` · ${product.unit}` : ""}
                        {" · "}
                        {product.price.toLocaleString()} VND
                      </CheckItemMeta>
                    </CheckItemInfo>

                    <SelectedControls onClick={(e) => e.stopPropagation()}>
                      {/* Qty: chỉ cho phép giảm, không cho tăng */}
                      <QtyControl>
                        <QtyBtn
                          onClick={() => updateQty(product.id, selected.qty - 1)}
                          disabled={selected.qty <= 1}
                        >
                          −
                        </QtyBtn>
                        <QtyValue>{selected.qty}</QtyValue>
                      </QtyControl>

                      {/* Unit price */}
                      <PriceInput
                        type="number"
                        value={selected.unitPrice}
                        onChange={(e) =>
                          updateUnitPrice(
                            product.id,
                            Number(e.target.value),
                          )
                        }
                        placeholder={t("rescueTechUnitPricePlaceholder")}
                      />

                      {/* Notes */}
                      <NotesInput
                        value={selected.notes}
                        onChange={(e) =>
                          updateNotes(product.id, e.target.value)
                        }
                        placeholder={t("rescueTechNotesPlaceholder")}
                      />
                    </SelectedControls>
                  </CheckItem>
                );
              })}
            </CheckList>
          )}

          {/* Summary */}
          {selectedParts.length > 0 && (
            <SummaryBox>
              <SummaryTitle>
                {t("rescueMgrSelectedCount", { count: selectedParts.length })}
              </SummaryTitle>
              <SummaryTotal>
                {t("rescueMgrTotalCost")}:{" "}
                <strong>
                  {selectedParts
                    .reduce((s, p) => s + p.qty * p.unitPrice, 0)
                    .toLocaleString()}{" "}
                  VND
                </strong>
              </SummaryTotal>
            </SummaryBox>
          )}
        </ModalBody>

        <ModalFooter>
          <ModalCancelBtn onClick={onClose} disabled={submitting}>
            {t("rescueMgrCancel")}
          </ModalCancelBtn>
          <ModalConfirmBtn
            onClick={handleSubmit}
            disabled={submitting || selectedParts.length === 0}
          >
            {submitting ? t("rescueMgrProcessing") : t("rescueTechSavePartsBtn")}
          </ModalConfirmBtn>
        </ModalFooter>
      </ModalContent>
    </ModalOverlay>
  );
};

export default EditPartsModal;

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
  max-width: 620px;
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
  &:hover { color: #111827; }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
`;

const ModalBody = styled.div`
  padding: 1.25rem 1.5rem;
  overflow-y: auto;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #e5e7eb;
`;

const HintText = styled.p`
  font-size: 0.8125rem;
  color: #6b7280;
  margin: 0;
`;

const EmptyText = styled.p`
  font-size: 0.8125rem;
  color: #9ca3af;
  margin: 0;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.875rem;
  outline: none;
  box-sizing: border-box;
  color: #111827;
  &::placeholder { color: #9ca3af; }
  &:focus { border-color: #6b7280; }
`;

const CheckList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  max-height: 360px;
  overflow-y: auto;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 0.5rem;
`;

const CheckItem = styled.div<{ $checked: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: 0.625rem;
  padding: 0.5rem 0.625rem;
  border-radius: 6px;
  cursor: pointer;
  background: ${({ $checked }) => ($checked ? "#f0fdf4" : "transparent")};
  border: 1px solid ${({ $checked }) => ($checked ? "#86efac" : "transparent")};
  transition: background 0.12s;
  flex-wrap: wrap;
  &:hover { background: ${({ $checked }) => ($checked ? "#dcfce7" : "#f9fafb")}; }
`;

const CheckBox = styled.div<{ $checked: boolean }>`
  width: 18px;
  height: 18px;
  border-radius: 4px;
  border: 2px solid ${({ $checked }) => ($checked ? "#16a34a" : "#d1d5db")};
  background: ${({ $checked }) => ($checked ? "#16a34a" : "white")};
  color: white;
  font-size: 0.6875rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-weight: 700;
  margin-top: 2px;
`;

const CheckItemInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const CheckItemName = styled.div`
  font-size: 0.8125rem;
  font-weight: 500;
  color: #111827;
`;

const CheckItemMeta = styled.div`
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 1px;
`;

const SelectedControls = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  width: 100%;
  padding-left: 26px;
  margin-top: 0.375rem;
`;

const QtyControl = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex-shrink: 0;
`;

const QtyBtn = styled.button`
  width: 24px;
  height: 24px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 0.9375rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #374151;
  &:hover:not(:disabled) { background: #f3f4f6; }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
`;

const QtyValue = styled.span`
  min-width: 22px;
  text-align: center;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #111827;
`;

const PriceInput = styled.input`
  width: 110px;
  padding: 0.3rem 0.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 0.8125rem;
  outline: none;
  color: #111827;
  &:focus { border-color: #6b7280; }
`;

const NotesInput = styled.input`
  flex: 1;
  min-width: 80px;
  padding: 0.3rem 0.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 0.8125rem;
  outline: none;
  color: #111827;
  &::placeholder { color: #9ca3af; }
  &:focus { border-color: #6b7280; }
`;

const SummaryBox = styled.div`
  padding: 0.75rem 1rem;
  background: #f0fdf4;
  border: 1px solid #86efac;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const SummaryTitle = styled.div`
  font-size: 0.8125rem;
  color: #374151;
`;

const SummaryTotal = styled.div`
  font-size: 0.875rem;
  color: #15803d;
`;

const ModalCancelBtn = styled.button`
  padding: 0.5rem 1.25rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  color: #374151;
  font-size: 0.875rem;
  cursor: pointer;
  &:hover { background: #f9fafb; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const ModalConfirmBtn = styled.button`
  padding: 0.5rem 1.5rem;
  border: none;
  border-radius: 8px;
  background: #dc2626;
  color: white;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  &:hover:not(:disabled) { background: #b91c1c; }
  &:disabled { background: #d1d5db; cursor: not-allowed; }
`;
