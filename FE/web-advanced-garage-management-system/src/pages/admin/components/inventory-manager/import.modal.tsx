import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { HiPlus, HiTrash, HiX } from "react-icons/hi";
import { toast } from "react-toastify";
import {
  inventoryService,
  type IImportItem,
} from "@/services/admin/inventoryService";
import { type IProduct } from "@/services/admin/productService";
import { getSuppliers, type ISupplier } from "@/services/admin/supplierService";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  products: IProduct[];
}

const EMPTY_ITEM: IImportItem = { productId: 0, quantity: 1, unitPrice: 0, note: "" };

// ─── Component ────────────────────────────────────────────────────────────────

const ImportModal = ({ isOpen, onClose, onSuccess, products }: ImportModalProps) => {
  const { t } = useTranslation();
  const [suppliers, setSuppliers] = useState<ISupplier[]>([]);
  const [supplierId, setSupplierId] = useState<number | "">("");
  const [importNote, setImportNote] = useState("");
  const [importItems, setImportItems] = useState<IImportItem[]>([{ ...EMPTY_ITEM }]);
  const [submitting, setSubmitting] = useState(false);

  // Load suppliers once when modal first opens
  useEffect(() => {
    if (!isOpen) return;
    setSupplierId("");
    setImportNote("");
    setImportItems([{ ...EMPTY_ITEM }]);
    getSuppliers()
      .then((res) => setSuppliers(res.items))
      .catch(() => {});
  }, [isOpen]);

  if (!isOpen) return null;

  const updateItem = (index: number, field: keyof IImportItem, value: string | number) => {
    setImportItems((prev) =>
      prev.map((it, i) => (i === index ? { ...it, [field]: value } : it))
    );
  };

  const addItem = () => setImportItems((prev) => [...prev, { ...EMPTY_ITEM }]);

  const removeItem = (index: number) =>
    setImportItems((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async () => {
    if (!supplierId) {
      toast.error(t("inventoryImportSupplierRequired"));
      return;
    }
    if (importItems.some((it) => !it.productId || it.quantity <= 0 || it.unitPrice <= 0)) {
      toast.error(t("inventoryImportItemRequired"));
      return;
    }
    try {
      setSubmitting(true);
      await inventoryService.importInventory({
        supplierId: Number(supplierId),
        note: importNote,
        items: importItems,
      });
      toast.success(t("inventoryImportSuccess"));
      onSuccess();
      onClose();
    } catch {
      toast.error(t("inventoryImportError"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Overlay onClick={onClose}>
      <Box onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>{t("inventoryImportTitle")}</ModalTitle>
          <CloseBtn onClick={onClose}><HiX size={20} /></CloseBtn>
        </ModalHeader>

        <Body>
          {/* Supplier */}
          <FormGroup>
            <Label>{t("inventoryImportSupplier")} <Required>*</Required></Label>
            <Select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value === "" ? "" : Number(e.target.value))}
            >
              <option value="">{t("inventoryImportSelectSupplier")}</option>
              {suppliers.map((s) => (
                <option key={s.supplierID} value={s.supplierID}>
                  {s.name}
                </option>
              ))}
            </Select>
          </FormGroup>

          {/* Note */}
          <FormGroup>
            <Label>{t("inventoryImportNote")}</Label>
            <Input
              type="text"
              placeholder={t("inventoryImportNotePlaceholder")}
              value={importNote}
              onChange={(e) => setImportNote(e.target.value)}
            />
          </FormGroup>

          {/* Items */}
          <ItemsHeader>
            <Label style={{ margin: 0 }}>{t("inventoryImportItemList")} <Required>*</Required></Label>
            <AddItemBtn onClick={addItem}>
              <HiPlus size={14} /> {t("inventoryImportAddRow")}
            </AddItemBtn>
          </ItemsHeader>

          <ItemsTable>
            <thead>
              <tr>
                <ItemTh>{t("inventoryImportProduct")}</ItemTh>
                <ItemTh>{t("inventoryImportQuantity")}</ItemTh>
                <ItemTh>{t("inventoryImportUnitPrice")}</ItemTh>
                <ItemTh>{t("inventoryImportNote")}</ItemTh>
                <ItemTh />
              </tr>
            </thead>
            <tbody>
              {importItems.map((it, i) => (
                <tr key={i}>
                  <ItemTd>
                    <Select
                      value={it.productId || ""}
                      onChange={(e) => updateItem(i, "productId", Number(e.target.value))}
                    >
                      <option value="">{t("inventoryImportSelectProduct")}</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.code} — {p.name}
                        </option>
                      ))}
                    </Select>
                  </ItemTd>
                  <ItemTd>
                    <InputSmall
                      type="number"
                      min={1}
                      value={it.quantity}
                      onChange={(e) => updateItem(i, "quantity", Number(e.target.value))}
                    />
                  </ItemTd>
                  <ItemTd>
                    <InputSmall
                      type="number"
                      min={0}
                      value={it.unitPrice}
                      onChange={(e) => updateItem(i, "unitPrice", Number(e.target.value))}
                    />
                  </ItemTd>
                  <ItemTd>
                    <InputSmall
                      type="text"
                      placeholder={t("inventoryImportItemNotePlaceholder")}
                      value={it.note}
                      onChange={(e) => updateItem(i, "note", e.target.value)}
                    />
                  </ItemTd>
                  <ItemTd>
                    <RemoveBtn onClick={() => removeItem(i)} disabled={importItems.length === 1}>
                      <HiTrash size={15} />
                    </RemoveBtn>
                  </ItemTd>
                </tr>
              ))}
            </tbody>
          </ItemsTable>
        </Body>

        <Footer>
          <CancelBtn onClick={onClose}>{t("inventoryImportCancel")}</CancelBtn>
          <SubmitBtn onClick={handleSubmit} disabled={submitting}>
            {submitting
              ? t("inventoryImportSubmitting")
              : t("inventoryImportSubmit")}
          </SubmitBtn>
        </Footer>
      </Box>
    </Overlay>
  );
};

export default ImportModal;

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
  max-width: 780px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 24px;
  border-bottom: 1px solid #e5e7eb;
`;

const ModalTitle = styled.h2`
  font-size: 17px;
  font-weight: 700;
  color: #111827;
  margin: 0;
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
  &:hover { background: #f3f4f6; }
`;

const Body = styled.div`
  padding: 20px 24px;
  overflow-y: auto;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const Footer = styled.div`
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Label = styled.label`
  font-size: 13px;
  font-weight: 600;
  color: #374151;
`;

const Required = styled.span`
  color: #ef4444;
`;

const Select = styled.select`
  width: 100%;
  padding: 9px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  background: #fff;
  color: #374151;
  outline: none;
  cursor: pointer;
  &:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const Input = styled.input`
  padding: 9px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  &:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const ItemsHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const AddItemBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 5px 12px;
  background: #eff6ff;
  color: #3b82f6;
  border: 1px solid #bfdbfe;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  &:hover { background: #dbeafe; }
`;

const ItemsTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
`;

const ItemTh = styled.th`
  padding: 8px 10px;
  text-align: left;
  font-weight: 600;
  color: #6b7280;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
`;

const ItemTd = styled.td`
  padding: 6px 6px;
  vertical-align: middle;
`;

const InputSmall = styled.input`
  width: 100%;
  padding: 7px 10px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 13px;
  outline: none;
  box-sizing: border-box;
  &:focus { border-color: #3b82f6; }
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
  &:hover:not(:disabled) { background: #fef2f2; }
  &:disabled { opacity: 0.3; cursor: not-allowed; }
`;

const CancelBtn = styled.button`
  padding: 9px 20px;
  border: 1px solid #e5e7eb;
  background: #fff;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  color: #374151;
  &:hover { background: #f9fafb; }
`;

const SubmitBtn = styled.button`
  padding: 9px 20px;
  background: #3b82f6;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  &:hover:not(:disabled) { background: #2563eb; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;
