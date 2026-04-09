// Re-export schema types
export type {
  User,
  NewUser,
  Event,
  NewEvent,
  Registrant,
  NewRegistrant,
  Checkin,
  NewCheckin,
  VipNotification,
  NewVipNotification,
  GlobalField,
  NewGlobalField,
  FieldOption,
  FormFieldConfig,
  CustomQuestion,
} from "@/lib/db/schema";

// Re-export enums for convenience
export {
  userRoleEnum,
  eventStatusEnum,
  checkinMethodEnum,
  fieldTypeEnum,
} from "@/lib/db/schema";

// Form field types
export type FieldType =
  | "short_text"
  | "long_text"
  | "dropdown"
  | "multiple_choice"
  | "checkboxes";

// Event form field (from global fields)
export interface EventFormField {
  globalFieldId: string;
  label: string;
  fieldType: FieldType;
  options: string[];
  isRequired: boolean;
  order: number;
}

// Form data from registrant
export interface FormData {
  [key: string]: unknown;
}

// Check-in result
export interface CheckinResult {
  success: boolean;
  registrant?: import("@/lib/db/schema").Registrant;
  message: string;
  method: "qr" | "manual_email";
}

// Dashboard stats
export interface DashboardStats {
  totalRegistered: number;
  checkedIn: number;
  remaining: number;
  checkInRate: number;
}