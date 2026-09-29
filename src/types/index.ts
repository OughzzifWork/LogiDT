/**
 * Types & Domain Models for LogiTrack Logistics PWA
 */

export type UserRole = 'ADMIN' | 'LOGISTICS' | 'CARRIER' | 'DRIVER';

export type OperationalStatus = 'AFFECTE' | 'SUR_SITE' | 'CHARGE' | 'LIVRE';

export type AdminStatus = 
  | 'CREEE'
  | 'AFFECTEE_TRANSPORTEUR'
  | 'AFFECTEE_CHAUFFEUR'
  | 'SUR_SITE'
  | 'CHARGE'
  | 'LIVRE'
  | 'CLOTUREE';

export type BillingStatus = 'FACTUREE' | 'NON_FACTUREE';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  carrierId?: string; // Set when role === 'CARRIER' or 'DRIVER'
  driverId?: string;  // Set when role === 'DRIVER'
  active: boolean;
  createdAt: string;
}

export interface Carrier {
  id: string;
  code: string;
  name: string;
  contactEmail: string;
  contactPhone: string;
  active: boolean;
  createdAt: string;
}

export interface Driver {
  id: string;
  carrierId: string;
  firstName: string;
  lastName: string;
  phone: string;
  licenseNumber: string;
  vehiclePlate?: string;
  active: boolean;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;       // e.g. "CMD-2026-10254"
  bcNumber: string;          // Bon de Commande, e.g. "BC-98421"
  dtNumber: string;          // Document de Transport, e.g. "DT-77312"
  blFcNumber: string;        // Bon de Livraison / Facturation, e.g. "BLFC-4401"
  clientName: string;
  deliveryAddress: string;
  destinationCity: string;
  postalCode: string;
  destinationContact: string;
  destinationPhone: string;
  cargoDescription: string;
  packagesCount: number;
  weightKg: number;
  billingStatus: BillingStatus;
  operationalStatus: OperationalStatus;
  adminStatus: AdminStatus;
  carrierId: string | null;
  driverId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryProof {
  id: string;
  orderId: string;
  driverId: string;
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
  sha256Hash: string;
  gpsLatitude: number | null;
  gpsLongitude: number | null;
  gpsAccuracy: number | null;
  capturedAt: string;
  serverReceivedAt: string;
  deviceInfo: string;
  watermarkText: string;
  storedPath: string;
}

export interface AuditLog {
  id: string;
  orderId: string | null;
  eventType: 
    | 'ORDER_CREATED'
    | 'CARRIER_ASSIGNED'
    | 'DRIVER_ASSIGNED'
    | 'ON_SITE_CONFIRMED'
    | 'BC_SCANNED'
    | 'BC_MANUAL_ENTERED'
    | 'DT_SCANNED'
    | 'LOADED_CONFIRMED'
    | 'PHOTO_CAPTURED'
    | 'DELIVERY_CONFIRMED'
    | 'ERP_SYNCED'
    | 'DRIVER_CREATED'
    | 'DRIVER_TOGGLED'
    | 'CARRIER_CREATED'
    | 'USER_CREATED'
    | 'USER_UPDATED'
    | 'USER_DELETED'
    | 'USER_TOGGLED'
    | 'SECURITY_VIOLATION_ATTEMPT';
  previousStatus: string | null;
  newStatus: string | null;
  actorId: string;
  actorName: string;
  actorRole: UserRole | string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  details: Record<string, unknown>;
}

export interface ErpSyncStatus {
  lastSyncAt: string;
  syncedOrdersCount: number;
  erpConnected: boolean;
  pendingExportCount: number;
}

export interface AuthSession {
  token: string;
  user: User;
}

export interface ScannerResult {
  code: string;
  format?: string;
  timestamp: number;
}

export type SapDriverType = 'SAP_HANA' | 'SAP_ASE' | 'MSSQL_SBO' | 'ORACLE_SAP' | 'POSTGRES';

export interface SapConnectionConfig {
  driver: SapDriverType;
  host: string;
  port: number;
  databaseName: string;
  schema: string;
  username: string;
  password?: string;
  ssl: boolean;
  poolSize: number;
  timeoutSeconds: number;
  autoSyncEnabled: boolean;
  autoSyncIntervalMinutes: number;
  lastTestedAt?: string;
  lastTestStatus?: 'SUCCESS' | 'FAILED' | 'PENDING';
  lastTestMessage?: string;
  serverVersion?: string;
}

export interface SapQueryPreset {
  id: string;
  name: string;
  category: string;
  description: string;
  sql: string;
  updatedAt?: string;
}

export interface SapQueryResult {
  success: boolean;
  executionTimeMs: number;
  totalRows: number;
  columns: string[];
  rows: Record<string, unknown>[];
  message?: string;
  error?: string;
}
