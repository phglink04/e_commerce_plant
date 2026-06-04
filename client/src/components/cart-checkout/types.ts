export type CartItem = {
  plantId: string;
  quantity: number;
  price: number;
};

export type Plant = {
  _id: string;
  name: string;
  imageCover: string;
  price: number;
  salePrice?: number;
  discountPercentage?: number;
  stock?: number;
  availability?: "In Stock" | "Out Of Stock" | "Discontinued";
};

export type Address = {
  id: string;
  fullName: string;
  phone: string;
  city: string;
  district: string;
  ward: string;
  addressLine: string;
};

export type PaymentMethod = "cash" | "qr";

export type PaymentSession = {
  orderId: string;
  transactionCode: string;
  amount: number;
  qrDataURL: string;
  bankInfo?: {
    accountNo: string;
    accountName: string;
    bankName: string;
  };
};
