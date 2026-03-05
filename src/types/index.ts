export type PlanType = "FREE" | "PRO" | "TEAM" | "ENTERPRISE";
export type AccountStatus = "ACTIVE" | "SUSPENDED" | "CANCELLED" | "BLOCKED";
export type CardType = "CREDIT" | "DEBIT" | "PREPAID";
export type PaymentMethod = "CARD" | "BANK_TRANSFER" | "CRYPTO" | "OTHER";
export type LaptopType = "DELL" | "MAC";
export type UserRole = "ADMIN" | "VIEWER";

export interface Account {
  id: string;
  email: string;
  planType: PlanType;
  monthlyCost: string;
  status: AccountStatus;
  renewalDate: Date | null;
  sharingEnabled: boolean;
  sharedWith: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Card {
  id: string;
  cardholderName: string;
  last4: string;
  cardType: CardType;
  bankName: string | null;
  expiryMonth: number | null;
  expiryYear: number | null;
  createdAt: Date;
}

export interface AccountUser {
  id: string;
  accountId: string;
  userName: string;
  department: string | null;
  assignedAt: Date;
}

export interface Payment {
  id: string;
  accountId: string;
  accountEmail?: string | null;
  amount: string;
  paymentMethod: PaymentMethod;
  cardId: string | null;
  description: string | null;
  paidAt: Date;
  refunded: boolean;
  refundedAt: Date | null;
  refundReason: string | null;
  createdAt: Date;
}

export interface Laptop {
  id: string;
  assetTag: string;
  type: LaptopType;
  brand: string;
  model: string;
  serialNumber: string | null;
  specs: string | null;
  assignedTo: string | null;
  department: string | null;
  purchaseDate: Date | null;
  warrantyEnd: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditLog {
  id: string;
  userId: string | null;
  userName?: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  details: Record<string, unknown> | null;
  createdAt: Date;
}

export interface TrackingDashboard {
  accounts: {
    total: number;
    active: number;
    blocked: number;
    monthlySpend: string;
  };
  payments: {
    totalPayments: number;
    totalAmount: string;
    refunds: number;
    refundAmount: string;
  };
  laptops: {
    total: number;
    dell: number;
    mac: number;
    assigned: number;
  };
}
