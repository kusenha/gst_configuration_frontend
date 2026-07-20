export type Role =
  | "employee"
  | "department_head"
  | "finance_officer"
  | "hr_officer"
  | "administrator"
  | "super_admin";

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: Role;
  firstName?: string;
  lastName?: string;
  mustChangePassword?: boolean;
  services?: string[];
}

export interface AppLauncherEntry {
  id: number;
  name: string;
  displayName: string;
  description: string;
  frontendUrl: string;
  icon: string;
  color: string;
  hasAccess: boolean;
}

export interface DirectoryUser {
  id: string;
  checkNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  services?: string[];
}

export interface SmtpConfig {
  id: number;
  enabled: boolean;
  host: string;
  port: number;
  username: string;
  hasPassword: boolean;
  encryption: "tls" | "ssl" | "none";
  fromAddress: string;
  fromName: string;
  updatedAt: string;
  updatedBy: string;
}

export interface SmsConfig {
  id: number;
  enabled: boolean;
  provider: string;
  baseUrl: string;
  hasApiKey: boolean;
  hasApiSecret: boolean;
  senderId: string;
  extraConfig: Record<string, unknown>;
  updatedAt: string;
  updatedBy: string;
}

export interface Service {
  id: number;
  name: string;
  displayName: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  lastSeenAt: string | null;
}

export interface ServiceSetting {
  id: number;
  service: string;
  key: string;
  value: unknown;
  description: string;
  isSecret: boolean;
  updatedAt: string;
  updatedBy: string;
}

export interface EmailTemplate {
  id: number;
  service: string;
  key: string;
  name: string;
  channel: string;
  subject: string;
  bodyText: string;
  bodyHtml: string;
  accentColor: string;
  backgroundColor: string;
  logoUrl: string;
  headerText: string;
  footerText: string;
  isActive: boolean;
  previewSampleContext: Record<string, string>;
  updatedAt: string;
  updatedBy: string;
}

export interface DockerService {
  key: string;
  containerName: string;
  status: "running" | "exited" | "paused" | "restarting" | "created" | "missing" | string;
  startedAt: string | null;
  shortId: string | null;
}

export interface EmployeeImportRow {
  id: number;
  rowNumber: number;
  checkNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  status: "pending" | "created" | "failed";
  errorMessage: string;
  emailSent: boolean;
}

export interface EmployeeImportSkippedRow {
  rowNumber: number;
  error: string;
}

export interface EmployeeImportBatch {
  id: string;
  fileName: string;
  createdBy: string;
  totalRows: number;
  createdRows: number;
  failedRows: number;
  status: "processing" | "completed";
  createdAt: string;
  completedAt: string | null;
  rows: EmployeeImportRow[];
  skippedRows?: EmployeeImportSkippedRow[];
}

export interface ExternalIntegration {
  id: number;
  service: string;
  name: string;
  category: string;
  baseUrl: string;
  hasApiKey: boolean;
  hasApiSecret: boolean;
  extraConfig: Record<string, unknown>;
  isActive: boolean;
  notes: string;
  updatedAt: string;
  updatedBy: string;
}
