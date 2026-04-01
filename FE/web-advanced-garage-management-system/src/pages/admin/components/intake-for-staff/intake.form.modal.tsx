import React, { useEffect, useState } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Button,
  Row,
  Col,
  Radio,
  Divider,
  ConfigProvider,
} from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import {
  createIntake,
  updateIntake,
  type IIntakeDetail,
} from "@/services/admin/intakeService";
import { getServices, type IService } from "@/services/admin/serviceService";
import { getProducts, type IProduct } from "@/services/admin/productService";
import { getPackages, type IPackage } from "@/services/admin/packageService";
import { getTechnicians, type ITechnician } from "@/apis/technicians";
import { searchUsers, type IUser } from "@/services/admin/userService";
import { getCarsByCustomerId, type ICar } from "@/apis/cars";

const { TextArea } = Input;

const BLACK_LABEL_RENDER = (props: { label: React.ReactNode }) => (
  <span style={{ color: "#000000" }}>{props.label}</span>
);

const CONDITION_OPTIONS = ["NORMAL", "SCRATCH", "DENT", "DEFORM"].map((v) => ({
  value: v,
  label: v,
}));

interface Props {
  open: boolean;
  mode: "create" | "update";
  intakeId?: number;
  detailData?: IIntakeDetail | null;
  onClose: () => void;
  onSuccess: () => void;
}

const IntakeFormModal = ({
  open,
  mode,
  intakeId,
  detailData,
  onClose,
  onSuccess,
}: Props) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [services, setServices] = useState<IService[]>([]);
  const [products, setProducts] = useState<IProduct[]>([]);
  const [packages, setPackages] = useState<IPackage[]>([]);
  const [technicians, setTechnicians] = useState<ITechnician[]>([]);
  const [users, setUsers] = useState<IUser[]>([]);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const [userSearchValue, setUserSearchValue] = useState("");
  const [customerCars, setCustomerCars] = useState<ICar[]>([]);
  const [carsLoading, setCarsLoading] = useState(false);
  const customerMode = Form.useWatch("customerMode", form);
  const carMode = Form.useWatch("carMode", form);
  const selectedCustomerId = Form.useWatch("customerId", form);

  useEffect(() => {
    if (!selectedCustomerId) {
      setCustomerCars([]);
      return;
    }
    setCarsLoading(true);
    getCarsByCustomerId(selectedCustomerId)
      .then(setCustomerCars)
      .catch(() => {})
      .finally(() => setCarsLoading(false));
    form.setFieldValue("carId", undefined);
  }, [selectedCustomerId, form]);

  useEffect(() => {
    getServices()
      .then(setServices)
      .catch(() => {});
    getProducts()
      .then(setProducts)
      .catch(() => {});
    getPackages()
      .then(setPackages)
      .catch(() => {});
    getTechnicians()
      .then(setTechnicians)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!userSearchValue.trim()) {
      setUsers([]);
      return;
    }
    const timer = setTimeout(() => {
      setUserSearchLoading(true);
      searchUsers(userSearchValue.trim())
        .then(setUsers)
        .catch(() => {})
        .finally(() => setUserSearchLoading(false));
    }, 2000);
    return () => clearTimeout(timer);
  }, [userSearchValue]);

  useEffect(() => {
    if (!open) return;

    if (mode === "create") {
      form.resetFields();
      form.setFieldsValue({
        customerMode: "existing",
        carMode: "existing",
        serviceDetails: [{ productId: undefined, quantity: 1, notes: "" }],
        partDetails: [{ productId: undefined, quantity: 1, notes: "" }],
        vehicleConditions: [
          {
            frontStatus: "CLEAN",
            rearStatus: "CLEAN",
            leftStatus: "CLEAN",
            rightStatus: "CLEAN",
            roofStatus: "CLEAN",
            conditionNote: "",
          },
        ],
      });
      return;
    }

    if (mode === "update" && detailData) {
      form.setFieldsValue({
        maintenance: {
          maintenanceType: detailData.maintenanceType ?? undefined,
          notes: "",
          assignedTechnicianId: detailData.technicianId ?? undefined,
          bayId: null,
        },
        customerFullName: detailData.customer.fullName,
        customerPhone: detailData.customer.phone,
        customerEmail: detailData.customer.email,
        customerGender: detailData.customer.gender ?? undefined,
        customerDob: detailData.customer.dob ?? "",
        carLicensePlate: detailData.car.licensePlate,
        carBrand: detailData.car.brand ?? "",
        carModel: detailData.car.model ?? "",
        carYear: detailData.car.year ?? undefined,
        carColor: detailData.car.color ?? "",
        carEngineNumber: detailData.car.engineNumber,
        carChassisNumber: detailData.car.chassisNumber ?? "",
        carOdometer: detailData.car.currentOdometer,
        packageId: detailData.package?.packageId ?? null,
        serviceDetails: detailData.serviceDetails.map((s) => ({
          productId: s.serviceProductId,
          quantity: s.serviceQty,
          notes: s.serviceNotes,
        })),
        partDetails: detailData.partDetails.map((p) => ({
          productId: p.partProductId,
          quantity: p.partQty,
          notes: p.partNotes,
        })),
        vehicleConditions: detailData.vehicleIntakeConditions.map((c) => ({
          frontStatus: c.frontStatus,
          rearStatus: c.rearStatus,
          leftStatus: c.leftStatus,
          rightStatus: c.rightStatus,
          roofStatus: c.roofStatus,
          conditionNote: c.intakeConditionNote,
        })),
      });
    }
  }, [open, mode, detailData, form]);

  const handleSubmit = async () => {
    try {
      const v = await form.validateFields();
      setSubmitting(true);

      if (mode === "create") {
        await createIntake({
          customer: {
            mode: v.customerMode,
            customerId: v.customerId,
            fullName: v.customerFullName,
            phone: v.customerPhone,
            email: v.customerEmail,
          },
          car: {
            mode: v.carMode,
            carId: v.carId,
            licensePlate: v.carLicensePlate,
            brand: v.carBrand,
            model: v.carModel,
            year: v.carYear,
            currentOdometer: v.carOdometer,
            color: v.carColor,
            engineNumber: v.carEngineNumber,
            chassisNumber: v.carChassisNumber,
          },
          maintenance: v.maintenance,
          packageSelection: { selectedPackageId: v.packageId ?? null },
          serviceDetails: v.serviceDetails ?? [],
          partDetails: v.partDetails ?? [],
          vehicleIntakeConditions: v.vehicleConditions ?? [],
        });
      } else if (intakeId) {
        await updateIntake(intakeId, {
          maintenance: v.maintenance,
          customer: [
            {
              fullName: v.customerFullName,
              phone: v.customerPhone,
              email: v.customerEmail,
              gender: v.customerGender ?? "",
              dob: v.customerDob ?? "",
            },
          ],
          car: {
            licensePlate: v.carLicensePlate,
            brand: v.carBrand,
            model: v.carModel,
            year: v.carYear,
            color: v.carColor,
            engineNumber: v.carEngineNumber,
            chassisNumber: v.carChassisNumber,
            currentOdometer: v.carOdometer,
          },
          packageSelection: { selectedPackageId: v.packageId ?? null },
          serviceDetails: v.serviceDetails ?? [],
          partDetails: v.partDetails ?? [],
          vehicleCondition: (v.vehicleConditions ?? []).map(
            (c: {
              frontStatus: string;
              rearStatus: string;
              leftStatus: string;
              rightStatus: string;
              roofStatus: string;
              conditionNote: string;
            }) => ({
              frontStatus: c.frontStatus,
              rearStatus: c.rearStatus,
              leftStatus: c.leftStatus,
              rightStatus: c.rightStatus,
              roofStatus: c.roofStatus,
              conditionNotes: c.conditionNote,
            }),
          ),
        });
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      if (err && typeof err === "object" && "errorFields" in err) return;
      console.error("Submit error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const isCreate = mode === "create";

  return (
    <Modal
      open={open}
      onCancel={onClose}
      className="intake-form-modal"
      title={isCreate ? t("intakeFormCreateTitle") : t("intakeFormUpdateTitle")}
      width={820}
      onOk={handleSubmit}
      okText={submitting ? t("processing") : t("saveChanges")}
      confirmLoading={submitting}
      cancelText={t("cancel")}
      styles={{
        body: {
          maxHeight: "72vh",
          overflowY: "auto",
          padding: "1.25rem 1.5rem",
        },
      }}
    >
      <FormWrapper>
        <ConfigProvider
          theme={{
            token: {
              colorText: "#000000",
              colorTextPlaceholder: "#000000",
              colorBgContainer: "#ffffff",
            },
            components: {
              Select: { colorText: "#000000", optionSelectedColor: "#000000" },
              Input: { colorText: "#000000" },
              InputNumber: { colorText: "#000000" },
              Radio: { colorText: "#000000" },
            },
          }}
        >
          <Form form={form} layout="vertical" requiredMark={false}>
            {/* ── Customer ────────────────────────────────────── */}
            <SectionTitle>{t("intakeDetailCustomer")}</SectionTitle>
            {isCreate && (
              <Form.Item name="customerMode" label={t("intakeFormMode")}>
                <Radio.Group>
                  <Radio value="existing">{t("intakeFormExisting")}</Radio>
                  <Radio value="new">{t("intakeFormNew")}</Radio>
                </Radio.Group>
              </Form.Item>
            )}
            {isCreate && customerMode === "existing" && (
              <Form.Item
                name="customerId"
                label={t("intakeFormCustomerId")}
                rules={[{ required: true }]}
              >
                <Select
                  showSearch
                  placeholder={t("intakeFormSearchByPhone")}
                  filterOption={false}
                  searchValue={userSearchValue}
                  onSearch={setUserSearchValue}
                  loading={userSearchLoading}
                  options={users.map((u) => ({
                    value: u.userID,
                    label: `${u.fullName} — ${u.phone}`,
                  }))}
                  classNames={{ popup: { root: "intake-form-dropdown" } }}
                  style={{ width: 300, color: "#000000" }}
                  labelRender={BLACK_LABEL_RENDER}
                />
              </Form.Item>
            )}
            {(!isCreate || customerMode === "new") && (
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    name="customerFullName"
                    label={t("intakeDetailFullName")}
                  >
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="customerPhone"
                    label={t("intakeDetailPhone")}
                  >
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="customerEmail"
                    label={t("intakeDetailEmail")}
                  >
                    <Input />
                  </Form.Item>
                </Col>
                {!isCreate && (
                  <>
                    <Col span={8}>
                      <Form.Item
                        name="customerGender"
                        label={t("intakeFormGender")}
                      >
                        <Select
                          allowClear
                          options={[
                            { value: "male", label: t("intakeFormMale") },
                            { value: "female", label: t("intakeFormFemale") },
                          ]}
                          classNames={{
                            popup: { root: "intake-form-dropdown" },
                          }}
                          style={{ color: "#000000" }}
                          labelRender={BLACK_LABEL_RENDER}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item
                        name="customerDob"
                        label={t("intakeDetailDob")}
                      >
                        <Input placeholder="YYYY-MM-DD" />
                      </Form.Item>
                    </Col>
                  </>
                )}
              </Row>
            )}

            <Divider />

            {/* ── Car ─────────────────────────────────────────── */}
            <SectionTitle>{t("intakeDetailCar")}</SectionTitle>
            {isCreate && (
              <Form.Item name="carMode" label={t("intakeFormMode")}>
                <Radio.Group>
                  <Radio value="existing">{t("intakeFormExisting")}</Radio>
                  <Radio value="new">{t("intakeFormNew")}</Radio>
                </Radio.Group>
              </Form.Item>
            )}
            {isCreate && carMode === "existing" && (
              <Form.Item
                name="carId"
                label={t("intakeFormCarId")}
                rules={[{ required: true }]}
              >
                <Select
                  loading={carsLoading}
                  disabled={!selectedCustomerId}
                  placeholder={
                    selectedCustomerId
                      ? t("intakeFormSelectCar")
                      : t("intakeFormSelectCustomerFirst")
                  }
                  options={customerCars.map((c) => ({
                    value: c.carId,
                    label: `${c.licensePlate} — ${c.brand} ${c.model} (${c.year})`,
                  }))}
                  classNames={{ popup: { root: "intake-form-dropdown" } }}
                  style={{ width: 360, color: "#000000" }}
                  labelRender={BLACK_LABEL_RENDER}
                />
              </Form.Item>
            )}
            {(!isCreate || carMode === "new") && (
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    name="carLicensePlate"
                    label={t("intakeDetailLicensePlate")}
                  >
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="carBrand" label={t("intakeFormBrand")}>
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="carModel" label={t("intakeFormModel")}>
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="carYear" label={t("intakeFormYear")}>
                    <InputNumber
                      style={{ width: "100%" }}
                      min={1900}
                      max={2100}
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="carColor" label={t("intakeFormColor")}>
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="carOdometer"
                    label={t("intakeDetailOdometer")}
                  >
                    <InputNumber style={{ width: "100%" }} min={0} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="carEngineNumber"
                    label={t("intakeDetailEngine")}
                  >
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="carChassisNumber"
                    label={t("intakeFormChassis")}
                  >
                    <Input />
                  </Form.Item>
                </Col>
              </Row>
            )}

            <Divider />

            {/* ── Maintenance ─────────────────────────────────── */}
            <SectionTitle>{t("intakeFormMaintenance")}</SectionTitle>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name={["maintenance", "maintenanceType"]}
                  label={t("intakeColType")}
                  rules={[{ required: isCreate }]}
                >
                  <Select
                    options={[
                      { value: "REPAIR", label: t("intakeRepair") },
                      { value: "MAINTENANCE", label: t("intakeMaintenance") },
                    ]}
                    classNames={{ popup: { root: "intake-form-dropdown" } }}
                    style={{ color: "#000000" }}
                    labelRender={BLACK_LABEL_RENDER}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name={["maintenance", "assignedTechnicianId"]}
                  label={t("intakeFormTechnicianId")}
                  rules={[{ required: true }]}
                >
                  <Select
                    showSearch
                    filterOption={(input, opt) =>
                      (opt?.label ?? "")
                        .toString()
                        .toLowerCase()
                        .includes(input.toLowerCase())
                    }
                    options={technicians.map((t) => ({
                      value: t.technicianId,
                      label: t.fullName,
                    }))}
                    classNames={{ popup: { root: "intake-form-dropdown" } }}
                    style={{ color: "#000000" }}
                    labelRender={BLACK_LABEL_RENDER}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name={["maintenance", "bayId"]}
                  label={t("intakeFormBayId")}
                >
                  <InputNumber style={{ width: "100%" }} min={1} />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item
              name={["maintenance", "notes"]}
              label={t("intakeDetailNotes")}
            >
              <TextArea rows={2} />
            </Form.Item>

            <Divider />

            {/* ── Package ─────────────────────────────────────── */}
            <SectionTitle>{t("intakeDetailPackage")}</SectionTitle>
            <Form.Item name="packageId" label={t("intakeFormPackageId")}>
              <Select
                allowClear
                showSearch
                filterOption={(input, opt) =>
                  (opt?.label ?? "")
                    .toString()
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
                options={packages.map((p) => ({
                  value: p.packageID,
                  label: p.name,
                }))}
                classNames={{ popup: { root: "intake-form-dropdown" } }}
                style={{ width: 300, color: "#000000" }}
                labelRender={BLACK_LABEL_RENDER}
              />
            </Form.Item>

            <Divider />

            {/* ── Service Details ──────────────────────────────── */}
            <SectionTitle>{t("intakeDetailServices")}</SectionTitle>
            <Form.List name="serviceDetails">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name }) => (
                    <Row key={key} gutter={8} align="middle">
                      <Col span={7}>
                        <Form.Item
                          name={[name, "productId"]}
                          label={t("intakeFormProductId")}
                          rules={[{ required: true }]}
                        >
                          <Select
                            showSearch
                            filterOption={(input, opt) =>
                              (opt?.label ?? "")
                                .toString()
                                .toLowerCase()
                                .includes(input.toLowerCase())
                            }
                            options={services.map((s) => ({
                              value: s.id,
                              label: s.name,
                            }))}
                            classNames={{
                              popup: { root: "intake-form-dropdown" },
                            }}
                            style={{ color: "#000000" }}
                            labelRender={BLACK_LABEL_RENDER}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={5}>
                        <Form.Item
                          name={[name, "quantity"]}
                          label={t("intakeDetailQty")}
                          rules={[{ required: true }]}
                        >
                          <InputNumber style={{ width: "100%" }} min={1} />
                        </Form.Item>
                      </Col>
                      <Col span={10}>
                        <Form.Item
                          name={[name, "notes"]}
                          label={t("intakeDetailNotes")}
                        >
                          <Input />
                        </Form.Item>
                      </Col>
                      <Col span={2} style={{ paddingTop: 6 }}>
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => remove(name)}
                        />
                      </Col>
                    </Row>
                  ))}
                  <Button
                    type="dashed"
                    icon={<PlusOutlined />}
                    onClick={() => add({ quantity: 1, notes: "" })}
                    block
                  >
                    {t("intakeFormAddService")}
                  </Button>
                </>
              )}
            </Form.List>

            <Divider />

            {/* ── Part Details ─────────────────────────────────── */}
            <SectionTitle>{t("intakeDetailParts")}</SectionTitle>
            <Form.List name="partDetails">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name }) => (
                    <Row key={key} gutter={8} align="middle">
                      <Col span={7}>
                        <Form.Item
                          name={[name, "productId"]}
                          label={t("intakeFormProductId")}
                          rules={[{ required: true }]}
                        >
                          <Select
                            showSearch
                            filterOption={(input, opt) =>
                              (opt?.label ?? "")
                                .toString()
                                .toLowerCase()
                                .includes(input.toLowerCase())
                            }
                            options={products.map((p) => ({
                              value: p.id,
                              label: p.name,
                            }))}
                            classNames={{
                              popup: { root: "intake-form-dropdown" },
                            }}
                            style={{ color: "#000000" }}
                            labelRender={BLACK_LABEL_RENDER}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={5}>
                        <Form.Item
                          name={[name, "quantity"]}
                          label={t("intakeDetailQty")}
                          rules={[{ required: true }]}
                        >
                          <InputNumber style={{ width: "100%" }} min={1} />
                        </Form.Item>
                      </Col>
                      <Col span={10}>
                        <Form.Item
                          name={[name, "notes"]}
                          label={t("intakeDetailNotes")}
                        >
                          <Input />
                        </Form.Item>
                      </Col>
                      <Col span={2} style={{ paddingTop: 6 }}>
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => remove(name)}
                        />
                      </Col>
                    </Row>
                  ))}
                  <Button
                    type="dashed"
                    icon={<PlusOutlined />}
                    onClick={() => add({ quantity: 1, notes: "" })}
                    block
                  >
                    {t("intakeFormAddPart")}
                  </Button>
                </>
              )}
            </Form.List>

            <Divider />

            {/* ── Vehicle Conditions ───────────────────────────── */}
            <SectionTitle>{t("intakeDetailConditions")}</SectionTitle>
            <Form.List name="vehicleConditions">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name }) => (
                    <ConditionCard key={key}>
                      <Row gutter={12}>
                        <Col span={8}>
                          <Form.Item
                            name={[name, "frontStatus"]}
                            label={t("intakeDetailFront")}
                          >
                            <Select
                              options={CONDITION_OPTIONS}
                              classNames={{
                                popup: { root: "intake-form-dropdown" },
                              }}
                              style={{ color: "#000000" }}
                              labelRender={BLACK_LABEL_RENDER}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item
                            name={[name, "rearStatus"]}
                            label={t("intakeDetailRear")}
                          >
                            <Select
                              options={CONDITION_OPTIONS}
                              classNames={{
                                popup: { root: "intake-form-dropdown" },
                              }}
                              style={{ color: "#000000" }}
                              labelRender={BLACK_LABEL_RENDER}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item
                            name={[name, "roofStatus"]}
                            label={t("intakeDetailRoof")}
                          >
                            <Select
                              options={CONDITION_OPTIONS}
                              classNames={{
                                popup: { root: "intake-form-dropdown" },
                              }}
                              style={{ color: "#000000" }}
                              labelRender={BLACK_LABEL_RENDER}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item
                            name={[name, "leftStatus"]}
                            label={t("intakeDetailLeft")}
                          >
                            <Select
                              options={CONDITION_OPTIONS}
                              classNames={{
                                popup: { root: "intake-form-dropdown" },
                              }}
                              style={{ color: "#000000" }}
                              labelRender={BLACK_LABEL_RENDER}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item
                            name={[name, "rightStatus"]}
                            label={t("intakeDetailRight")}
                          >
                            <Select
                              options={CONDITION_OPTIONS}
                              classNames={{
                                popup: { root: "intake-form-dropdown" },
                              }}
                              style={{ color: "#000000" }}
                              labelRender={BLACK_LABEL_RENDER}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item
                            name={[name, "conditionNote"]}
                            label={t("intakeDetailConditionNote")}
                          >
                            <Input />
                          </Form.Item>
                        </Col>
                      </Row>
                      <RemoveBtn
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => remove(name)}
                      >
                        {t("intakeFormRemoveCondition")}
                      </RemoveBtn>
                    </ConditionCard>
                  ))}
                  <Button
                    type="dashed"
                    icon={<PlusOutlined />}
                    onClick={() =>
                      add({
                        frontStatus: "CLEAN",
                        rearStatus: "CLEAN",
                        leftStatus: "CLEAN",
                        rightStatus: "CLEAN",
                        roofStatus: "CLEAN",
                        conditionNote: "",
                      })
                    }
                    block
                  >
                    {t("intakeFormAddCondition")}
                  </Button>
                </>
              )}
            </Form.List>
          </Form>
        </ConfigProvider>
      </FormWrapper>
    </Modal>
  );
};

export default IntakeFormModal;

const FormWrapper = styled.div`
  .ant-form-item-label > label {
    color: #374151 !important;
    font-weight: 500;
  }

  .ant-input,
  .ant-input textarea,
  textarea.ant-input,
  .ant-input-number-input,
  .ant-input-affix-wrapper input,
  .ant-select-selection-item,
  .ant-select-selection-placeholder,
  .ant-radio-wrapper,
  .ant-radio-wrapper span {
    color: #000000 !important;
    -webkit-text-fill-color: #000000 !important;
  }

  .ant-input,
  textarea.ant-input,
  .ant-input-affix-wrapper,
  .ant-input-number,
  .ant-select-selector {
    background-color: #fff !important;
  }

  .ant-divider {
    margin: 12px 0;
  }
`;

// Global style: covers both the modal body and the dropdown portals
const formGlobalStyle = `
  /* All text inside modal inputs / selects */
  .intake-form-modal input,
  .intake-form-modal textarea,
  .intake-form-modal [class*="ant-select-selection"],
  .intake-form-modal [class*="ant-input-number-input"],
  .intake-form-modal [class*="ant-radio"] span,
  .intake-form-modal .ant-select-selector,
  .intake-form-modal .ant-select-selector * {
    color: #000000 !important;
    -webkit-text-fill-color: #000000 !important;
  }
  .intake-form-modal [class*="ant-select-selector"],
  .intake-form-modal [class*="ant-input"],
  .intake-form-modal [class*="ant-input-number"] {
    background-color: #ffffff !important;
  }
  /* Dropdown portals */
  .intake-form-dropdown .ant-select-item,
  .intake-form-dropdown .ant-select-item-option-content {
    color: #000000 !important;
  }
  .intake-form-dropdown .ant-select-item-option-selected {
    background-color: #eff6ff !important;
  }
`;

if (typeof document !== "undefined") {
  const styleId = "intake-form-global-style-v2";
  if (!document.getElementById(styleId)) {
    const tag = document.createElement("style");
    tag.id = styleId;
    tag.innerHTML = formGlobalStyle;
    document.head.appendChild(tag);
  }
}

const SectionTitle = styled.h3`
  font-size: 0.9375rem;
  font-weight: 700;
  color: #1d4ed8;
  margin: 0 0 12px;
  padding-bottom: 6px;
  border-bottom: 2px solid #dbeafe;
`;

const ConditionCard = styled.div`
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px 16px 0;
  margin-bottom: 12px;
  position: relative;
`;

const RemoveBtn = styled(Button)`
  margin-bottom: 8px;
`;
