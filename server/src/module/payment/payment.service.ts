import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomUUID } from "node:crypto";
import QRCode from "qrcode";

type MBTransaction = {
  transactionDesc?: string;
  creditAmount?: string;
  [key: string]: unknown;
};

@Injectable()
export class PaymentService {
  constructor(private readonly configService: ConfigService) {}

  generateTransactionCode(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const uuidPart = randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
    return `PAY${timestamp}${uuidPart}`;
  }

  async createPaymentQR(amount: number, transactionCode: string) {
    const accountNo = this.configService.get<string>("BANK_ACCOUNT_NO");
    const accountName = this.configService.get<string>("BANK_ACCOUNT_NAME");
    const acqId = this.configService.get<string>("BANK_ACQ_ID");

    if (!accountNo || !accountName || !acqId) {
      throw new Error(
        "Missing bank account config: BANK_ACCOUNT_NO, BANK_ACCOUNT_NAME, BANK_ACQ_ID",
      );
    }

    const bankName = this.getBankName(acqId);

    const response = await fetch("https://api.vietqr.io/v2/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accountNo,
        accountName,
        acqId,
        addInfo: transactionCode,
        amount,
        template: "compact",
      }),
    });

    if (!response.ok) {
      throw new Error(`VietQR API failed with status ${response.status}`);
    }

    const data = (await response.json()) as {
      code: number | string;
      desc: string;
      data?: { qrDataURL?: string; qrCode?: string; [key: string]: unknown };
    };

    const isSuccess = data.code === 0 || data.code === "00";
    let qrDataURL = data.data?.qrDataURL;

    // Some VietQR responses may only include qrCode. Build a renderable data URL for frontend.
    if (!qrDataURL && data.data?.qrCode) {
      qrDataURL = await QRCode.toDataURL(data.data.qrCode);
    }

    if (!isSuccess || !qrDataURL) {
      throw new Error(data.desc || "Failed to generate payment QR");
    }

    return {
      code: data.code,
      desc: data.desc,
      data: {
        ...data.data,
        qrDataURL,
      },
      bankInfo: {
        accountNo,
        accountName,
        bankName,
      },
    };
  }

  async checkPaymentStatus(transactionCode: string, amount: number) {
    const username = this.configService.get<string>("MB_USERNAME");
    const password = this.configService.get<string>("MB_PASSWORD");
    const accountNumber = this.configService.get<string>("BANK_ACCOUNT_NO");

    if (!username || !password || !accountNumber) {
      throw new Error(
        "Missing MB Bank config: MB_USERNAME, MB_PASSWORD, BANK_ACCOUNT_NO",
      );
    }

    const loadMbbank = new Function(
      "return import('mbbank')",
    ) as () => Promise<{
      MB: new (args: { username: string; password: string }) => {
        login: () => Promise<void>;
        getTransactionsHistory: (args: {
          accountNumber: string;
          fromDate: string;
          toDate: string;
        }) => Promise<unknown>;
      };
    }>;

    let MBConstructor: {
      new (args: { username: string; password: string }): {
        login: () => Promise<void>;
        getTransactionsHistory: (args: {
          accountNumber: string;
          fromDate: string;
          toDate: string;
        }) => Promise<unknown>;
      };
    };

    try {
      const { MB } = await loadMbbank();
      MBConstructor = MB;
    } catch {
      throw new Error("mbbank package is not installed. Run: npm i mbbank");
    }
    const mb = new MBConstructor({ username, password });
    await mb.login();

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const formatDate = (date: Date): string => {
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    };

    const transactions = (await mb.getTransactionsHistory({
      accountNumber,
      fromDate: formatDate(yesterday),
      toDate: formatDate(today),
    })) as MBTransaction[];

    if (!transactions || transactions.length === 0) {
      return { paid: false as const };
    }

    const target = transactions.find((item) => {
      const description = (item.transactionDesc ?? "").replace(/\s+/g, "");
      const code = transactionCode.replace(/\s+/g, "");
      const creditAmount = Number.parseInt(item.creditAmount ?? "0", 10);
      return description.includes(code) && creditAmount === amount;
    });

    if (!target) {
      return { paid: false as const };
    }

    return { paid: true as const, transaction: target };
  }

  /**
   * Get bank display name from VietQR acqId (BIN)
   */
  getBankName(acqId: string): string {
    const BANK_NAMES: Record<string, string> = {
      "970422": "MB Bank (Quân Đội)",
      "970415": "VietinBank",
      "970436": "Vietcombank",
      "970418": "BIDV",
      "970405": "Agribank",
      "970407": "Techcombank",
      "970416": "ACB",
      "970432": "VPBank",
      "970423": "TPBank",
      "970426": "MSB",
      "970448": "OCB",
      "970403": "Sacombank",
      "970412": "DongA Bank",
      "970431": "Eximbank",
      "970421": "VRB",
      "970441": "VIB",
      "970443": "SHB",
      "970449": "LPBank",
      "970454": "VietABank",
      "970452": "KienLong Bank",
      "970429": "SeABank",
    };
    return BANK_NAMES[acqId] || `Ngân hàng (${acqId})`;
  }

  /**
   * Get bank info for display on frontend
   */
  getBankInfo() {
    const accountNo = this.configService.get<string>("BANK_ACCOUNT_NO") || "";
    const accountName = this.configService.get<string>("BANK_ACCOUNT_NAME") || "";
    const acqId = this.configService.get<string>("BANK_ACQ_ID") || "";
    return {
      accountNo,
      accountName,
      bankName: this.getBankName(acqId),
    };
  }
}
