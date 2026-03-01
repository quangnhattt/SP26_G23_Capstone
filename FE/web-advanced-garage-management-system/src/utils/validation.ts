import { Rule } from "antd/lib/form";

// const REG_PHONE = /((^(\+84|84|0|0084){1})(3|5|7|8|9))+([0-9]{8})$/;
const MOBI = /((^(\+84|84|0|0084){1})(3)(2|3|4|5|6|7|8|9))+([0-9]{7})$/;
const VINA = /((^(\+84|84|0|0084){1})(8)(2|3|4|5|6|8|9))+([0-9]{7})$/;
const VIETTEL = /((^(\+84|84|0|0084){1})(9)(3|4|1|6|7|8|9|0))+([0-9]{7})$/;

export const errorValidPhone = () => ({
  validator(_: Rule, value: number) {
    const str = value?.toString()?.trim();
    if (!str) return Promise.resolve();

    const isValidCarrier =
      str.match(MOBI) || str.match(VINA) || str.match(VIETTEL);
    const isValidNumber = !isNaN(Number(value));

    if (!isValidCarrier || !isValidNumber) {
      return Promise.reject(
        new Error("Vui lòng nhập đúng định dạng số điện thoại!")
      );
    }
    return Promise.resolve();
  },
});

export const errorConfirmPassword = ({
  getFieldValue,
}: {
  getFieldValue: (name: string) => unknown;
}) => ({
  validator(_: Rule, value: string) {
    if (!value) return Promise.resolve();
    if (!value || getFieldValue("password") === value) {
      return Promise.resolve();
    }
    return Promise.reject(new Error("Mật khẩu nhập lại chưa trùng khớp!"));
  },
});

export const errorWhiteSpace = () => ({
  validator(_: Rule, value: string) {
    if (!value) return Promise.resolve();
    if (value.startsWith(" ") || value.endsWith(" ")) {
      return Promise.reject(
        new Error("Không được bắt đầu hoặc kết thúc bằng khoảng trắng!")
      );
    }
    return Promise.resolve();
  },
});

export const validateEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string) => {
  const phoneRegex = /^\+?[0-9]{9,15}$/;
  return phoneRegex.test(phone);
};

export const checkStringEmpty = (str?: string) => {
  if (typeof str != "string") return false;
  if (str.length == 0) return false;
  if (str == undefined || str == null) return false;
  return true;
};
