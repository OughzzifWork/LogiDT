/**
 * Database storage engine for LogiTrack
 * On-premise self-contained persistent store with atomic file writes.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type { 
  User, 
  Carrier, 
  Driver, 
  Order, 
  DeliveryProof, 
  AuditLog, 
  BillingStatus,
  OperationalStatus,
  AdminStatus,
  SapConnectionConfig,
  SapQueryPreset
} from '../types/index.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const PROOFS_DIR = path.join(DATA_DIR, 'proofs');

export interface DatabaseSchema {
  users: User[];
  carriers: Carrier[];
  drivers: Driver[];
  orders: Order[];
  proofs: DeliveryProof[];
  auditLogs: AuditLog[];
  lastErpSync: string;
  sapConfig: SapConnectionConfig;
  sapQueries: SapQueryPreset[];
}

// Ensure storage directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(PROOFS_DIR)) {
  fs.mkdirSync(PROOFS_DIR, { recursive: true });
}

// Initial seed data
const initialSeedData: DatabaseSchema = {
  users: [
    {
      id: 'usr_admin',
      name: 'Paul Bernard (Admin AIA)',
      email: 'admin@logitrack.internal',
      role: 'ADMIN',
      active: true,
      createdAt: '2026-09-01T08:00:00.000Z'
    },
    {
      id: 'usr_logistics',
      name: 'Sophie Lambert (Logistique)',
      email: 'logistique@logitrack.internal',
      role: 'LOGISTICS',
      active: true,
      createdAt: '2026-09-01T08:00:00.000Z'
    },
    {
      id: 'usr_carr_dupont',
      name: 'Transports Dupont (Gérant)',
      email: 'dupont@transports-dupont.fr',
      role: 'CARRIER',
      carrierId: 'carr_dupont',
      active: true,
      createdAt: '2026-09-01T08:00:00.000Z'
    },
    {
      id: 'usr_carr_sud',
      name: 'Sud Logistique (Gérant)',
      email: 'contact@sud-logistique.fr',
      role: 'CARRIER',
      carrierId: 'carr_sud',
      active: true,
      createdAt: '2026-09-01T08:00:00.000Z'
    },
    {
      id: 'usr_drv_marc',
      name: 'Marc Leclerc (Chauffeur)',
      email: 'marc.leclerc@transports-dupont.fr',
      role: 'DRIVER',
      carrierId: 'carr_dupont',
      driverId: 'drv_marc',
      active: true,
      createdAt: '2026-09-02T09:00:00.000Z'
    },
    {
      id: 'usr_drv_antoine',
      name: 'Antoine Vidal (Chauffeur)',
      email: 'antoine.vidal@transports-dupont.fr',
      role: 'DRIVER',
      carrierId: 'carr_dupont',
      driverId: 'drv_antoine',
      active: true,
      createdAt: '2026-09-02T09:00:00.000Z'
    },
    {
      id: 'usr_drv_pierre',
      name: 'Pierre Moreau (Chauffeur Sud)',
      email: 'pierre.moreau@sud-logistique.fr',
      role: 'DRIVER',
      carrierId: 'carr_sud',
      driverId: 'drv_pierre',
      active: true,
      createdAt: '2026-09-02T09:00:00.000Z'
    }
  ],
  carriers: [
    {
      id: 'carr_dupont',
      code: 'DUPONT-01',
      name: 'Transports Dupont Express',
      contactEmail: 'contact@transports-dupont.fr',
      contactPhone: '+33 3 20 44 55 66',
      active: true,
      createdAt: '2026-09-01T08:00:00.000Z'
    },
    {
      id: 'carr_sud',
      code: 'SUDLOG-02',
      name: 'Sud Fret & Logistique',
      contactEmail: 'contact@sud-logistique.fr',
      contactPhone: '+33 4 91 22 33 44',
      active: true,
      createdAt: '2026-09-01T08:00:00.000Z'
    }
  ],
  drivers: [
    {
      id: 'drv_marc',
      carrierId: 'carr_dupont',
      firstName: 'Marc',
      lastName: 'Leclerc',
      phone: '+33 6 12 34 56 78',
      licenseNumber: 'PERM-FR-849301',
      vehiclePlate: 'EX-921-TK',
      active: true,
      createdAt: '2026-09-02T09:00:00.000Z'
    },
    {
      id: 'drv_antoine',
      carrierId: 'carr_dupont',
      firstName: 'Antoine',
      lastName: 'Vidal',
      phone: '+33 6 98 76 54 32',
      licenseNumber: 'PERM-FR-774019',
      vehiclePlate: 'GH-441-ZZ',
      active: true,
      createdAt: '2026-09-02T09:00:00.000Z'
    },
    {
      id: 'drv_pierre',
      carrierId: 'carr_sud',
      firstName: 'Pierre',
      lastName: 'Moreau',
      phone: '+33 6 45 88 12 00',
      licenseNumber: 'PERM-FR-391044',
      vehiclePlate: 'AB-123-CD',
      active: true,
      createdAt: '2026-09-02T09:00:00.000Z'
    }
  ],
  orders: [
    {
      id: 'ord_10254',
      orderNumber: 'CMD-10254',
      bcNumber: 'BC-10254',
      dtNumber: 'DT-10254',
      blFcNumber: 'BLFC-8812',
      clientName: 'Industries Métallurgiques du Nord',
      deliveryAddress: '14 Rue de la Fonderie, ZI Les Graviers',
      destinationCity: 'Lille',
      postalCode: '59000',
      destinationContact: 'M. Gérard Fontaine',
      destinationPhone: '+33 3 20 11 22 33',
      cargoDescription: '2 Palettes Pièces usinées de précision',
      packagesCount: 2,
      weightKg: 480,
      billingStatus: 'NON_FACTUREE',
      operationalStatus: 'AFFECTE',
      adminStatus: 'AFFECTEE_CHAUFFEUR',
      carrierId: 'carr_dupont',
      driverId: 'drv_marc',
      createdAt: '2026-09-28T07:30:00.000Z',
      updatedAt: '2026-09-28T09:15:00.000Z'
    },
    {
      id: 'ord_10255',
      orderNumber: 'CMD-10255',
      bcNumber: 'BC-10255',
      dtNumber: 'DT-10255',
      blFcNumber: 'BLFC-8813',
      clientName: 'Ateliers Électroniques de France',
      deliveryAddress: '8 Allée des Frênes',
      destinationCity: 'Roubaix',
      postalCode: '59100',
      destinationContact: 'Mme Clara Dubois',
      destinationPhone: '+33 3 20 77 88 99',
      cargoDescription: '5 Cartons composants électroniques',
      packagesCount: 5,
      weightKg: 65,
      billingStatus: 'NON_FACTUREE',
      operationalStatus: 'AFFECTE',
      adminStatus: 'AFFECTEE_TRANSPORTEUR',
      carrierId: 'carr_dupont',
      driverId: null,
      createdAt: '2026-09-28T08:00:00.000Z',
      updatedAt: '2026-09-28T08:30:00.000Z'
    },
    {
      id: 'ord_10256',
      orderNumber: 'CMD-10256',
      bcNumber: 'BC-10256',
      dtNumber: 'DT-10256',
      blFcNumber: 'BLFC-8814',
      clientName: 'Chantiers Navals Méditerranée',
      deliveryAddress: 'Quai des Armateurs, Hangar 4',
      destinationCity: 'Marseille',
      postalCode: '13002',
      destinationContact: 'M. Jean-Luc Bastia',
      destinationPhone: '+33 4 91 55 66 77',
      cargoDescription: '1 Palette outillage lourd',
      packagesCount: 1,
      weightKg: 320,
      billingStatus: 'NON_FACTUREE',
      operationalStatus: 'AFFECTE',
      adminStatus: 'AFFECTEE_CHAUFFEUR',
      carrierId: 'carr_sud',
      driverId: 'drv_pierre',
      createdAt: '2026-09-28T08:30:00.000Z',
      updatedAt: '2026-09-28T09:45:00.000Z'
    },
    {
      id: 'ord_10257',
      orderNumber: 'CMD-10257',
      bcNumber: 'BC-10257',
      dtNumber: 'DT-10257',
      blFcNumber: 'BLFC-8815',
      clientName: 'Pharmacie Centrale Régionale',
      deliveryAddress: '25 Boulevard de la Santé',
      destinationCity: 'Douai',
      postalCode: '59500',
      destinationContact: 'Dr. Vincent Martin',
      destinationPhone: '+33 3 27 90 10 20',
      cargoDescription: '10 Caisses Isothermes Médicaments',
      packagesCount: 10,
      weightKg: 140,
      billingStatus: 'NON_FACTUREE',
      operationalStatus: 'AFFECTE',
      adminStatus: 'CREEE',
      carrierId: null,
      driverId: null,
      createdAt: '2026-09-29T06:00:00.000Z',
      updatedAt: '2026-09-29T06:00:00.000Z'
    }
  ],
  proofs: [],
  auditLogs: [
    {
      id: 'aud_seed_1',
      orderId: 'ord_10254',
      eventType: 'ORDER_CREATED',
      previousStatus: null,
      newStatus: 'CREEE',
      actorId: 'usr_admin',
      actorName: 'Paul Bernard (Admin AIA)',
      actorRole: 'ADMIN',
      ipAddress: '127.0.0.1',
      userAgent: 'System/Seed',
      timestamp: '2026-09-28T07:30:00.000Z',
      details: { source: 'ERP_IMPORT', orderNumber: 'CMD-10254' }
    },
    {
      id: 'aud_seed_2',
      orderId: 'ord_10254',
      eventType: 'CARRIER_ASSIGNED',
      previousStatus: 'CREEE',
      newStatus: 'AFFECTEE_TRANSPORTEUR',
      actorId: 'usr_logistics',
      actorName: 'Sophie Lambert (Logistique)',
      actorRole: 'LOGISTICS',
      ipAddress: '127.0.0.1',
      userAgent: 'System/Seed',
      timestamp: '2026-09-28T08:00:00.000Z',
      details: { carrierId: 'carr_dupont', carrierName: 'Transports Dupont Express' }
    },
    {
      id: 'aud_seed_3',
      orderId: 'ord_10254',
      eventType: 'DRIVER_ASSIGNED',
      previousStatus: 'AFFECTEE_TRANSPORTEUR',
      newStatus: 'AFFECTEE_CHAUFFEUR',
      actorId: 'usr_carr_dupont',
      actorName: 'Transports Dupont (Gérant)',
      actorRole: 'CARRIER',
      ipAddress: '127.0.0.1',
      userAgent: 'System/Seed',
      timestamp: '2026-09-28T09:15:00.000Z',
      details: { driverId: 'drv_marc', driverName: 'Marc Leclerc' }
    }
  ],
  lastErpSync: '2026-09-29T06:00:00.000Z',
  sapConfig: {
    driver: 'SAP_HANA',
    host: 'sap-hana.aia.atlas.internal',
    port: 30015,
    databaseName: 'HDB_AIA',
    schema: 'SAPABAP1',
    username: 'SAP_LOGITRACK_RO',
    password: '••••••••••••',
    ssl: true,
    poolSize: 10,
    timeoutSeconds: 15,
    autoSyncEnabled: true,
    autoSyncIntervalMinutes: 30,
    lastTestedAt: '2026-09-29T06:45:00.000Z',
    lastTestStatus: 'SUCCESS',
    lastTestMessage: 'Connexion établie avec succès (Instance HANA 2.0 SPS 07 Rev 73)',
    serverVersion: 'SAP HANA Database 2.00.073.00.1695287654'
  },
  sapQueries: [
    {
      id: 'qry_likp_lips',
      name: 'Extraction Bons de Livraison & Transport (LIKP / LIPS)',
      category: 'SAP S/4HANA & ECC',
      description: 'Extrait les ordres d’expédition prêts pour transport avec adresses, tonnages et transporteurs désignés.',
      sql: `SELECT 
  LIKP.VBELN AS orderNumber,
  LIKP.BSTNK AS bcNumber,
  LIKP.BOLNR AS dtNumber,
  LIKP.LFDAT AS deliveryDate,
  KNA1.NAME1 AS clientName,
  KNA1.STRAS AS deliveryAddress,
  KNA1.ORT01 AS destinationCity,
  KNA1.PSTLZ AS postalCode,
  KNA1.TELF1 AS destinationPhone,
  LIPS.ARKTX AS cargoDescription,
  CAST(LIPS.LFIMG AS DECIMAL(10,2)) AS weightKg
FROM SAPABAP1.LIKP AS LIKP
INNER JOIN SAPABAP1.LIPS AS LIPS ON LIKP.VBELN = LIPS.VBELN
INNER JOIN SAPABAP1.KNA1 AS KNA1 ON LIKP.KUNNR = KNA1.KUNNR
WHERE LIKP.LFART IN ('LF', 'NL')
  AND LIKP.WADAT >= CURRENT_DATE - 7
ORDER BY LIKP.ERDAT DESC;`,
      updatedAt: '2026-09-29T06:00:00.000Z'
    },
    {
      id: 'qry_odln_sbo',
      name: 'SAP Business One - Livraisons Aliments Bétail (ODLN / DLN1)',
      category: 'SAP Business One',
      description: 'Extrait les documents de livraison (ODLN) et lignes d’articles (DLN1) pour les sacs et vracs AIA.',
      sql: `SELECT 
  T0.DocNum AS orderNumber,
  T0.NumAtCard AS bcNumber,
  T0.LicTradNum AS dtNumber,
  T0.CardName AS clientName,
  T0.Address AS deliveryAddress,
  T0.City AS destinationCity,
  T0.ZipCode AS postalCode,
  T1.ItemCode AS itemCode,
  T1.Dscription AS cargoDescription,
  T1.Quantity AS packagesCount,
  T1.Weight1 AS weightKg
FROM ODLN T0
INNER JOIN DLN1 T1 ON T0.DocEntry = T1.DocEntry
WHERE T0.DocStatus = 'O'
  AND T0.DocDate >= DATEADD(day, -5, GETDATE())
ORDER BY T0.DocDate DESC;`,
      updatedAt: '2026-09-29T06:00:00.000Z'
    },
    {
      id: 'qry_reconciliation',
      name: 'Rapprochement des Preuves de Livraison & Facturation (VBRK)',
      category: 'Facturation & Audit',
      description: 'Vérifie les bons de livraison clôturés dans LogiTrack en attente de validation comptable dans SAP.',
      sql: `SELECT 
  LIKP.VBELN AS orderNumber,
  VBRK.VBELN AS invoiceNumber,
  VBRK.FKDAT AS billingDate,
  VBRK.NETWR AS totalAmountEur,
  VBRK.WAERK AS currency
FROM SAPABAP1.LIKP AS LIKP
LEFT JOIN SAPABAP1.VBRP AS VBRP ON LIKP.VBELN = VBRP.VGBEL
LEFT JOIN SAPABAP1.VBRK AS VBRK ON VBRP.VBELN = VBRK.VBELN
WHERE LIKP.WBSTK = 'C'
ORDER BY LIKP.WADAT DESC;`,
      updatedAt: '2026-09-29T06:00:00.000Z'
    }
  ]
};

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (!parsed.sapConfig) {
          parsed.sapConfig = JSON.parse(JSON.stringify(initialSeedData.sapConfig));
        }
        if (!parsed.sapQueries || parsed.sapQueries.length === 0) {
          parsed.sapQueries = JSON.parse(JSON.stringify(initialSeedData.sapQueries));
        }
        return parsed;
      }
    } catch (e) {
      console.error('[DB] Failed reading db.json, initializing from seed', e);
    }
    this.persist(initialSeedData);
    return JSON.parse(JSON.stringify(initialSeedData));
  }

  private persist(dataToSave?: DatabaseSchema) {
    const payload = dataToSave || this.data;
    try {
      const tempPath = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tempPath, JSON.stringify(payload, null, 2), 'utf-8');
      fs.renameSync(tempPath, DB_FILE);
    } catch (e) {
      console.error('[DB] Error writing to db.json', e);
    }
  }

  // USERS
  getUsers(): User[] {
    return [...this.data.users];
  }

  getUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  getUserByEmail(email: string): User | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  createUser(userData: Omit<User, 'id' | 'createdAt'>): User {
    const newUser: User = {
      ...userData,
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString()
    };
    this.data.users.push(newUser);
    this.persist();
    return newUser;
  }

  updateUser(id: string, updates: Partial<User>): User | null {
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx === -1) return null;
    this.data.users[idx] = {
      ...this.data.users[idx],
      ...updates
    };
    this.persist();
    return this.data.users[idx];
  }

  deleteUser(id: string): boolean {
    const initialLen = this.data.users.length;
    this.data.users = this.data.users.filter(u => u.id !== id);
    if (this.data.users.length !== initialLen) {
      this.persist();
      return true;
    }
    return false;
  }

  toggleUserActive(id: string, active: boolean): User | null {
    const user = this.data.users.find(u => u.id === id);
    if (!user) return null;
    user.active = active;
    this.persist();
    return user;
  }

  // CARRIERS
  getCarriers(): Carrier[] {
    return [...this.data.carriers];
  }

  getCarrierById(id: string): Carrier | undefined {
    return this.data.carriers.find(c => c.id === id);
  }

  createCarrier(carrier: Omit<Carrier, 'id' | 'createdAt'>): Carrier {
    const newCarrier: Carrier = {
      ...carrier,
      id: `carr_${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    this.data.carriers.push(newCarrier);
    this.persist();
    return newCarrier;
  }

  // DRIVERS
  getDrivers(carrierId?: string): Driver[] {
    if (carrierId) {
      return this.data.drivers.filter(d => d.carrierId === carrierId);
    }
    return [...this.data.drivers];
  }

  getDriverById(id: string): Driver | undefined {
    return this.data.drivers.find(d => d.id === id);
  }

  createDriver(driver: Omit<Driver, 'id' | 'createdAt'>): Driver {
    const newDriver: Driver = {
      ...driver,
      id: `drv_${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    this.data.drivers.push(newDriver);
    this.persist();
    return newDriver;
  }

  toggleDriverActive(id: string, active: boolean): Driver | null {
    const driver = this.data.drivers.find(d => d.id === id);
    if (!driver) return null;
    driver.active = active;
    this.persist();
    return driver;
  }

  // ORDERS
  getOrders(filters?: {
    carrierId?: string;
    driverId?: string;
    operationalStatus?: OperationalStatus;
    billingStatus?: BillingStatus;
    search?: string;
  }): Order[] {
    let list = [...this.data.orders];

    if (filters?.carrierId) {
      list = list.filter(o => o.carrierId === filters.carrierId);
    }
    if (filters?.driverId) {
      list = list.filter(o => o.driverId === filters.driverId);
    }
    if (filters?.operationalStatus) {
      list = list.filter(o => o.operationalStatus === filters.operationalStatus);
    }
    if (filters?.billingStatus) {
      list = list.filter(o => o.billingStatus === filters.billingStatus);
    }
    if (filters?.search) {
      const q = filters.search.trim().toLowerCase();
      list = list.filter(o => 
        o.orderNumber.toLowerCase().includes(q) ||
        o.bcNumber.toLowerCase().includes(q) ||
        o.dtNumber.toLowerCase().includes(q) ||
        o.blFcNumber.toLowerCase().includes(q) ||
        o.clientName.toLowerCase().includes(q) ||
        o.destinationCity.toLowerCase().includes(q)
      );
    }

    return list;
  }

  getOrderById(id: string): Order | undefined {
    return this.data.orders.find(o => o.id === id);
  }

  getOrderByNumber(orderNumber: string): Order | undefined {
    const clean = orderNumber.trim().toUpperCase();
    return this.data.orders.find(o => 
      o.orderNumber.toUpperCase() === clean ||
      o.orderNumber.replace(/[^A-Z0-9]/g, '') === clean.replace(/[^A-Z0-9]/g, '')
    );
  }

  createOrder(orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Order {
    const now = new Date().toISOString();
    const newOrder: Order = {
      ...orderData,
      id: `ord_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      createdAt: now,
      updatedAt: now
    };
    this.data.orders.unshift(newOrder);
    this.persist();
    return newOrder;
  }

  updateOrder(id: string, updates: Partial<Order>): Order | null {
    const index = this.data.orders.findIndex(o => o.id === id);
    if (index === -1) return null;

    this.data.orders[index] = {
      ...this.data.orders[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.persist();
    return this.data.orders[index];
  }

  // PROOFS
  createProof(proofData: Omit<DeliveryProof, 'id' | 'serverReceivedAt'>): DeliveryProof {
    const newProof: DeliveryProof = {
      ...proofData,
      id: `prf_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      serverReceivedAt: new Date().toISOString()
    };
    this.data.proofs.push(newProof);
    this.persist();
    return newProof;
  }

  getProofById(id: string): DeliveryProof | undefined {
    return this.data.proofs.find(p => p.id === id);
  }

  getProofByOrderId(orderId: string): DeliveryProof | undefined {
    return this.data.proofs.find(p => p.orderId === orderId);
  }

  // AUDIT LOG (Strict append-only, no update or delete allowed)
  addAuditLog(entry: Omit<AuditLog, 'id' | 'timestamp'>): AuditLog {
    const log: AuditLog = {
      ...entry,
      id: `aud_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      timestamp: new Date().toISOString()
    };
    this.data.auditLogs.unshift(log);
    this.persist();
    return log;
  }

  getAuditLogs(orderId?: string, limit = 100): AuditLog[] {
    if (orderId) {
      return this.data.auditLogs.filter(l => l.orderId === orderId).slice(0, limit);
    }
    return this.data.auditLogs.slice(0, limit);
  }

  // ERP SYNC
  getLastErpSync(): string {
    return this.data.lastErpSync;
  }

  setLastErpSync(iso: string) {
    this.data.lastErpSync = iso;
    this.persist();
  }

  // SAP DATABASE CONFIG & SQL QUERIES
  getSapConfig(): SapConnectionConfig {
    if (!this.data.sapConfig) {
      this.data.sapConfig = JSON.parse(JSON.stringify(initialSeedData.sapConfig));
    }
    return { ...this.data.sapConfig };
  }

  updateSapConfig(updates: Partial<SapConnectionConfig>): SapConnectionConfig {
    if (!this.data.sapConfig) {
      this.data.sapConfig = JSON.parse(JSON.stringify(initialSeedData.sapConfig));
    }
    this.data.sapConfig = {
      ...this.data.sapConfig,
      ...updates
    } as SapConnectionConfig;
    this.persist();
    return { ...this.data.sapConfig };
  }

  getSapQueries(): SapQueryPreset[] {
    if (!this.data.sapQueries || this.data.sapQueries.length === 0) {
      this.data.sapQueries = JSON.parse(JSON.stringify(initialSeedData.sapQueries));
    }
    return [...this.data.sapQueries];
  }

  saveSapQuery(query: Omit<SapQueryPreset, 'updatedAt'>): SapQueryPreset {
    if (!this.data.sapQueries) {
      this.data.sapQueries = [];
    }
    const now = new Date().toISOString();
    const existingIndex = this.data.sapQueries.findIndex(q => q.id === query.id);
    const saved: SapQueryPreset = {
      ...query,
      id: query.id || `qry_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      updatedAt: now
    };

    if (existingIndex >= 0) {
      this.data.sapQueries[existingIndex] = saved;
    } else {
      this.data.sapQueries.push(saved);
    }
    this.persist();
    return saved;
  }

  deleteSapQuery(id: string): boolean {
    if (!this.data.sapQueries) return false;
    const initialLen = this.data.sapQueries.length;
    this.data.sapQueries = this.data.sapQueries.filter(q => q.id !== id);
    if (this.data.sapQueries.length !== initialLen) {
      this.persist();
      return true;
    }
    return false;
  }

  // Reset database to initial seed (for testing)
  resetToSeed() {
    this.data = JSON.parse(JSON.stringify(initialSeedData));
    this.persist();
  }
}

export const db = new Database();
export { PROOFS_DIR };
