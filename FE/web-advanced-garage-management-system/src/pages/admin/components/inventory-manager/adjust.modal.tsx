import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { HiAdjustments, HiX } from "react-icons/hi";
import { toast } from "react-toastify";
import { inventoryService } from "@/services/admin/inventoryService";
import { type IProduct } from "@/services/admin/productService";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";

interface AdjustModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  products: IProduct[];
  selectedProductId?: number;
}

const AdjustModal = ({
  isOpen,
  onClose,
  onSuccess,
  products,
  selectedProductId,
}: AdjustModalProps) => {
  const { t } = useTranslation();
  const [productId, setProductId] = useState<number | "">("");
  const [actualQuantity, setActualQuantity] = useState<number | "">("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setProductId(selectedProductId ?? "");
    setActualQuantity("");
  }, [isOpen, selectedProductId]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!productId) {
      toast.error(t("inventoryAdjustProductRequired"));
      return;
    }

    if (actualQuantity === "" || Number(actualQuantity) < 0) {
      toast.error(t("inventoryAdjustQuantityRequired"));
      return;
    }

    try {
      setSubmitting(true);
      await inventoryService.adjustInventory({
        productId: Number(productId),
        actualQuantity: Number(actualQuantity),
      });
      toast.success(t("inventoryAdjustSuccess"));
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("inventoryAdjustError")));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Overlay onClick={onClose}>
      <Box onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <HeaderLeft>
            <HiAdjustments size={20} />
            <ModalTitle>{t("inventoryAdjustTitle")}</ModalTitle>
          </HeaderLeft>
          <CloseBtn onClick={onClose}>
            <HiX size={20} />
          </CloseBtn>
        </ModalHeader>

        <Body>
          <Description>{t("inventoryAdjustDescription")}</Description>

          <FormGroup>
            <Label>{t("inventoryAdjustProductLabel")}</Label>
            <Select
              value={productId}
              onChange={(e) =>
                setProductId(e.target.value === "" ? "" : Number(e.target.value))
              }
            >
              <option value="">{t("inventoryAdjustSelectProduct")}</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.code} — {product.name}
                </option>
              ))}
            </Select>
          </FormGroup>

          <FormGroup>
            <Label>{t("inventoryAdjustQuantityLabel")}</Label>
            <Input
              type="number"
              min={0}
              value={actualQuantity}
              placeholder={t("inventoryAdjustQuantityPlaceholder")}
              onChange={(e) =>
                setActualQuantity(
                  e.target.value === "" ? "" : Number(e.target.value),
                )
              }
            />
          </FormGroup>
        </Body>

        <Footer>
          <CancelBtn onClick={onClose}>{t("inventoryAdjustCancel")}</CancelBtn>
          <SubmitBtn onClick={handleSubmit} disabled={submitting}>
            {submitting ? t("inventoryAdjustSubmitting") : t("inventoryAdjustSubmit")}
          </SubmitBtn>
        </Footer>
      </Box>
    </Overlay>
  );
};

export default AdjustModal;

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
  max-width: 520px;
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

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  color: #111827;
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

  &:hover {
    background: #f3f4f6;
  }
`;

const Body = styled.div`
  padding: 20px 24px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const Description = styled.p`
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  color: #6b7280;
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

const Footer = styled.div`
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
`;

const CancelBtn = styled.button`
  padding: 8px 16px;
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

const SubmitBtn = styled.button`
  padding: 8px 16px;
  border: none;
  background: #2563eb;
  color: #fff;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: #1d4ed8;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;