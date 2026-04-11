import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { FaTimes, FaTruck, FaWrench } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { proposeRescueToCustomer, type IRescueRequest, type IRescueSuggestedPart } from "@/apis/rescue";
import { getServices, type IService } from "@/services/admin/serviceService";
import { getProducts, type IProduct } from "@/services/admin/productService";
import { toast } from "react-toastify";

interface SelectedPart {
  product: IProduct;
  qty: number;
}

interface ProposalModalProps {
  rescue: IRescueRequest;
  onClose: () => void;
  onSuccess: () => void;
}

const ProposalModal = ({ rescue, onClose, onSuccess }: ProposalModalProps) => {
  const { t } = useTranslation();
  const [proposalType, setProposalType] = useState<
    "ROADSIDE" | "TOWING" | null
  >(null);
  const [proposalNote, setProposalNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [services, setServices] = useState<IService[]>([]);
  const [products, setProducts] = useState<IProduct[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selectedServices, setSelectedServices] = useState<IService[]>([]);
  const [selectedParts, setSelectedParts] = useState<SelectedPart[]>([]);
  const [manualFee, setManualFee] = useState("");
  const [depositAmount, setDepositAmount] = useState("");

  useEffect(() => {
    setLoadingServices(true);
    getServices()
      .then((data) => setServices(data.filter((s) => s.isActive)))
      .catch(() => {})
      .finally(() => setLoadingServices(false));

    setLoadingProducts(true);
    getProducts()
      .then((res) => setProducts(res.items.filter((p: IProduct) => p.isActive)))
      .catch(() => {})
      .finally(() => setLoadingProducts(false));
  }, []);

  const calculatedFee = useMemo(() => {
    const serviceFee = selectedServices.reduce((sum, s) => sum + s.price, 0);
    const partFee = selectedParts.reduce(
      (sum, p) => sum + p.product.price * p.qty,
      0,
    );
    return serviceFee + partFee;
  }, [selectedServices, selectedParts]);

  const estimatedFee =
    calculatedFee > 0
      ? calculatedFee
      : manualFee
        ? Number(manualFee)
        : undefined;

  // Auto-tính tiền đặt cọc = 50% tổng tiền đề xuất (chỉ khi requiresDeposit = true)
  useEffect(() => {
    if (rescue.requiresDeposit && estimatedFee) {
      setDepositAmount(Math.round(estimatedFee * 0.5).toString());
    } else {
      setDepositAmount("");
    }
  }, [estimatedFee, rescue.requiresDeposit]);

  const toggleService = (svc: IService) => {
    setSelectedServices((prev) =>
      prev.some((s) => s.id === svc.id)
        ? prev.filter((s) => s.id !== svc.id)
        : [...prev, svc],
    );
  };

  const togglePart = (product: IProduct) => {
    setSelectedParts((prev) => {
      if (prev.some((p) => p.product.id === product.id)) {
        return prev.filter((p) => p.product.id !== product.id);
      }
      return [...prev, { product, qty: 1 }];
    });
  };

  const updatePartQty = (productId: number, qty: number) => {
    if (qty < 1) return;
    setSelectedParts((prev) =>
      prev.map((p) => (p.product.id === productId ? { ...p, qty } : p)),
    );
  };

  const handleSubmit = async () => {
    if (!proposalType) return;
    try {
      setSubmitting(true);
      const selectedServiceAsParts: IRescueSuggestedPart[] = selectedServices.map(
        (s) => ({
          partId: s.id,
          quantity: 1,
        }),
      );
      const selectedPartsPayload: IRescueSuggestedPart[] = selectedParts.map((p) => ({
        partId: p.product.id,
        quantity: p.qty,
      }));
      const suggestedParts: IRescueSuggestedPart[] = [
        ...selectedServiceAsParts,
        ...selectedPartsPayload,
      ];

      await proposeRescueToCustomer(rescue.rescueId, {
        rescueType: proposalType,
        proposalNotes: proposalNote.trim() || undefined,
        estimatedServiceFee: estimatedFee ?? 0,
        depositAmount: rescue.requiresDeposit && depositAmount ? Number(depositAmount) : undefined,
        suggestedParts: suggestedParts.length > 0 ? suggestedParts : undefined,
      });
      toast.success(
        proposalType === "ROADSIDE"
          ? t("rescueMgrProposalConfirmRoadside") + " ✓"
          : t("rescueMgrProposalConfirmTowing") + " ✓",
      );
      onSuccess();
    } catch (error) {
      console.error("Error submitting proposal:", error);
      toast.error(t("rescueMgrQuoteError"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>{t("rescueMgrProposalModalTitle")}</ModalTitle>
          <CloseBtn onClick={onClose}>
            <FaTimes />
          </CloseBtn>
        </ModalHeader>
        <ModalBody>
          {/* Proposal type */}
          <FormGroup>
            <FormLabel>{t("rescueMgrProposalTypeLabel")}</FormLabel>
            <RadioGroup>
              <RadioOption
                $selected={proposalType === "ROADSIDE"}
                $type="ROADSIDE"
                onClick={() => setProposalType("ROADSIDE")}
              >
                <FaWrench size={14} />
                {t("rescueMgrProposalRoadside")}
              </RadioOption>
              <RadioOption
                $selected={proposalType === "TOWING"}
                $type="TOWING"
                onClick={() => setProposalType("TOWING")}
              >
                <FaTruck size={14} />
                {t("rescueMgrProposalTowing")}
              </RadioOption>
            </RadioGroup>
          </FormGroup>

          {/* Services */}
          <FormGroup>
            <FormLabel>{t("rescueMgrProposalServicesLabel")}</FormLabel>
            {loadingServices ? (
              <HintText>{t("rescueMgrProposalServicesLoading")}</HintText>
            ) : services.length === 0 ? (
              <HintText>{t("rescueMgrProposalServicesEmpty")}</HintText>
            ) : (
              <CheckList>
                {services.map((svc) => {
                  const checked = selectedServices.some((s) => s.id === svc.id);
                  return (
                    <CheckItem
                      key={svc.id}
                      $checked={checked}
                      onClick={() => toggleService(svc)}
                    >
                      <CheckBox $checked={checked}>{checked && "✓"}</CheckBox>
                      <CheckItemInfo>
                        <CheckItemName>{svc.name}</CheckItemName>
                        <CheckItemPrice>
                          {svc.price.toLocaleString()} VND
                        </CheckItemPrice>
                      </CheckItemInfo>
                    </CheckItem>
                  );
                })}
              </CheckList>
            )}
          </FormGroup>

          {/* Parts / Accessories */}
          <FormGroup>
            <FormLabel>{t("rescueMgrProposalPartsLabel")}</FormLabel>
            {loadingProducts ? (
              <HintText>{t("rescueMgrProposalPartsLoading")}</HintText>
            ) : products.length === 0 ? (
              <HintText>{t("rescueMgrProposalPartsEmpty")}</HintText>
            ) : (
              <CheckList>
                {products.map((product) => {
                  const selected = selectedParts.find(
                    (p) => p.product.id === product.id,
                  );
                  return (
                    <CheckItem
                      key={product.id}
                      $checked={!!selected}
                      onClick={() => togglePart(product)}
                    >
                      <CheckBox $checked={!!selected}>
                        {selected && "✓"}
                      </CheckBox>
                      <CheckItemInfo>
                        <CheckItemName>{product.name}</CheckItemName>
                        <CheckItemPrice>
                          {product.price.toLocaleString()} VND
                        </CheckItemPrice>
                      </CheckItemInfo>
                      {selected && (
                        <QtyControl onClick={(e) => e.stopPropagation()}>
                          <QtyBtn
                            onClick={() =>
                              updatePartQty(product.id, selected.qty - 1)
                            }
                            disabled={selected.qty <= 1}
                          >
                            −
                          </QtyBtn>
                          <QtyValue>{selected.qty}</QtyValue>
                          <QtyBtn
                            onClick={() =>
                              updatePartQty(product.id, selected.qty + 1)
                            }
                          >
                            +
                          </QtyBtn>
                        </QtyControl>
                      )}
                    </CheckItem>
                  );
                })}
              </CheckList>
            )}
          </FormGroup>

          {/* Customer note */}
          <FormGroup>
            <FormLabel>{t("rescueMgrCustomerNoteLabel")}</FormLabel>
            <FormTextarea
              value={proposalNote}
              onChange={(e) => setProposalNote(e.target.value)}
              rows={3}
              placeholder={t("rescueMgrCustomerNotePlaceholder")}
            />
          </FormGroup>

          {/* Estimated fee */}
          <FormGroup>
            <FormLabel>{t("rescueMgrProposalEstFeeLabel")}</FormLabel>
            {calculatedFee > 0 ? (
              <FeeAutoBox>
                <FeeAutoAmount>
                  {calculatedFee.toLocaleString()} VND
                </FeeAutoAmount>
              </FeeAutoBox>
            ) : (
              <FormInput
                type="number"
                value={manualFee}
                onChange={(e) => setManualFee(e.target.value)}
                placeholder={t("rescueMgrProposalEstFeeManual")}
              />
            )}
          </FormGroup>

          {rescue.requiresDeposit && (
            <FormGroup>
              <FormLabel>{t("rescueMgrDepositAmountLabel")}</FormLabel>
              <FormInput
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="0"
                readOnly={!!estimatedFee}
              />
              <DepositHint>{t("rescueMgrDepositAmountHint")}</DepositHint>
            </FormGroup>
          )}
        </ModalBody>
        <ModalFooter>
          <ModalCancelBtn onClick={onClose} disabled={submitting}>
            {t("rescueMgrClose")}
          </ModalCancelBtn>
          <ModalConfirmBtn
            $type={proposalType}
            onClick={handleSubmit}
            disabled={!proposalType || submitting}
          >
            {submitting
              ? t("rescueMgrSending")
              : proposalType === "ROADSIDE"
                ? t("rescueMgrProposalConfirmRoadside")
                : proposalType === "TOWING"
                  ? t("rescueMgrProposalConfirmTowing")
                  : t("rescueMgrProposeSolution")}
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
  max-width: 560px;
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
    $type === "ROADSIDE"
      ? "#16a34a"
      : $type === "TOWING"
        ? "#0891b2"
        : "#6b7280"};
  color: white;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: ${({ $type }) =>
      $type === "ROADSIDE"
        ? "#15803d"
        : $type === "TOWING"
          ? "#0e7490"
          : "#4b5563"};
  }

  &:disabled {
    background: #d1d5db;
    cursor: not-allowed;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 1.25rem;
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

const RadioOption = styled.div<{
  $selected: boolean;
  $type: "ROADSIDE" | "TOWING";
}>`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.875rem;
  border: 2px solid
    ${({ $selected, $type }) =>
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
    border-color: ${({ $type }) =>
      $type === "ROADSIDE" ? "#16a34a" : "#0891b2"};
  }
`;

const HintText = styled.p`
  font-size: 0.8125rem;
  color: #9ca3af;
  margin: 0;
`;

const CheckList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 180px;
  overflow-y: auto;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 0.5rem;
`;

const CheckItem = styled.div<{ $checked: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.5rem 0.625rem;
  border-radius: 6px;
  cursor: pointer;
  background: ${({ $checked }) => ($checked ? "#f0fdf4" : "transparent")};
  border: 1px solid ${({ $checked }) => ($checked ? "#86efac" : "transparent")};
  transition: background 0.12s;

  &:hover {
    background: ${({ $checked }) => ($checked ? "#dcfce7" : "#f9fafb")};
  }
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
`;

const CheckItemInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const CheckItemName = styled.div`
  font-size: 0.8125rem;
  font-weight: 500;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const CheckItemPrice = styled.div`
  font-size: 0.75rem;
  color: #6b7280;
`;

const QtyControl = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex-shrink: 0;
`;

const QtyBtn = styled.button`
  width: 22px;
  height: 22px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 0.875rem;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #374151;

  &:hover:not(:disabled) {
    background: #f3f4f6;
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const QtyValue = styled.span`
  min-width: 20px;
  text-align: center;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #111827;
`;

const FeeAutoBox = styled.div`
  padding: 0.625rem 0.875rem;
  border-radius: 8px;
  background: #f0fdf4;
  border: 1px solid #86efac;
`;

const FeeAutoAmount = styled.div`
  font-size: 1rem;
  font-weight: 700;
  color: #15803d;
`;

const DepositHint = styled.p`
  margin: 0.375rem 0 0;
  font-size: 0.75rem;
  color: #d97706;
  font-style: italic;
`;

