/**
 * Workflow & State Machine Engine for LogiTrack
 * Enforces server-side transition checks, pre-conditions, RBAC and audit logging.
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { db, PROOFS_DIR } from './db.ts';
import type { 
  Order, 
  User, 
  OperationalStatus, 
  AdminStatus, 
  DeliveryProof 
} from '../types/index.ts';

export interface WorkflowError {
  code: string;
  message: string;
  statusCode: number;
}

export class WorkflowEngine {
  /**
   * Assign carrier to order (Admin or Logistics)
   */
  static assignCarrier(
    orderId: string, 
    carrierId: string, 
    actor: User, 
    reqMeta: { ip: string; userAgent: string }
  ): { success: true; order: Order } | { success: false; error: WorkflowError } {
    if (actor.role !== 'ADMIN' && actor.role !== 'LOGISTICS') {
      return {
        success: false,
        error: { code: 'FORBIDDEN', message: 'Seul un administrateur ou un agent logistique peut affecter un transporteur.', statusCode: 403 }
      };
    }

    const order = db.getOrderById(orderId);
    if (!order) {
      return { success: false, error: { code: 'ORDER_NOT_FOUND', message: 'Commande introuvable.', statusCode: 404 } };
    }

    const carrier = db.getCarrierById(carrierId);
    if (!carrier || !carrier.active) {
      return { success: false, error: { code: 'INVALID_CARRIER', message: 'Transporteur invalide ou inactif.', statusCode: 400 } };
    }

    const prevCarrierId = order.carrierId;
    const prevAdminStatus = order.adminStatus;
    const newAdminStatus: AdminStatus = 'AFFECTEE_TRANSPORTEUR';

    const updated = db.updateOrder(orderId, {
      carrierId,
      // If changing carrier, unassign driver
      driverId: prevCarrierId !== carrierId ? null : order.driverId,
      adminStatus: newAdminStatus
    });

    db.addAuditLog({
      orderId,
      eventType: 'CARRIER_ASSIGNED',
      previousStatus: prevAdminStatus,
      newStatus: newAdminStatus,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      ipAddress: reqMeta.ip,
      userAgent: reqMeta.userAgent,
      details: {
        carrierId,
        carrierName: carrier.name,
        carrierCode: carrier.code
      }
    });

    return { success: true, order: updated! };
  }

  /**
   * Assign driver to order (Carrier owner or Admin)
   */
  static assignDriver(
    orderId: string, 
    driverId: string, 
    actor: User, 
    reqMeta: { ip: string; userAgent: string }
  ): { success: true; order: Order } | { success: false; error: WorkflowError } {
    const order = db.getOrderById(orderId);
    if (!order) {
      return { success: false, error: { code: 'ORDER_NOT_FOUND', message: 'Commande introuvable.', statusCode: 404 } };
    }

    // RBAC: Carrier can only assign their own orders
    if (actor.role === 'CARRIER') {
      if (!actor.carrierId || order.carrierId !== actor.carrierId) {
        db.addAuditLog({
          orderId,
          eventType: 'SECURITY_VIOLATION_ATTEMPT',
          previousStatus: order.operationalStatus,
          newStatus: null,
          actorId: actor.id,
          actorName: actor.name,
          actorRole: actor.role,
          ipAddress: reqMeta.ip,
          userAgent: reqMeta.userAgent,
          details: { attempt: 'CROSS_TENANT_ASSIGNMENT', targetOrderId: orderId }
        });
        return {
          success: false,
          error: { code: 'TENANT_FORBIDDEN', message: 'Accès interdit : Cette commande appartient à un autre transporteur.', statusCode: 403 }
        };
      }
    } else if (actor.role !== 'ADMIN' && actor.role !== 'LOGISTICS') {
      return {
        success: false,
        error: { code: 'FORBIDDEN', message: 'Droits insuffisants pour affecter un chauffeur.', statusCode: 403 }
      };
    }

    const driver = db.getDriverById(driverId);
    if (!driver || !driver.active) {
      return { success: false, error: { code: 'INVALID_DRIVER', message: 'Chauffeur introuvable ou inactif.', statusCode: 400 } };
    }

    // Verify driver belongs to the assigned carrier
    if (order.carrierId && driver.carrierId !== order.carrierId) {
      return {
        success: false,
        error: { code: 'DRIVER_CARRIER_MISMATCH', message: 'Le chauffeur sélectionné n’appartient pas au transporteur assigné.', statusCode: 400 }
      };
    }

    const prevAdminStatus = order.adminStatus;
    const newAdminStatus: AdminStatus = 'AFFECTEE_CHAUFFEUR';

    const updated = db.updateOrder(orderId, {
      driverId,
      adminStatus: newAdminStatus
    });

    db.addAuditLog({
      orderId,
      eventType: 'DRIVER_ASSIGNED',
      previousStatus: prevAdminStatus,
      newStatus: newAdminStatus,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      ipAddress: reqMeta.ip,
      userAgent: reqMeta.userAgent,
      details: {
        driverId,
        driverName: `${driver.firstName} ${driver.lastName}`,
        vehiclePlate: driver.vehiclePlate
      }
    });

    return { success: true, order: updated! };
  }

  /**
   * STEP 1: Transition to SUR_SITE (Chauffeur arrive sur site, scan BC ou saisie n° commande)
   */
  static confirmOnSite(
    orderId: string,
    bcOrOrderInput: string,
    isManualEntry: boolean,
    actor: User,
    reqMeta: { ip: string; userAgent: string }
  ): { success: true; order: Order } | { success: false; error: WorkflowError } {
    const order = db.getOrderById(orderId);
    if (!order) {
      return { success: false, error: { code: 'ORDER_NOT_FOUND', message: 'Commande introuvable.', statusCode: 404 } };
    }

    // Security check: must be assigned driver or admin
    if (actor.role === 'DRIVER') {
      if (order.driverId !== actor.driverId) {
        db.addAuditLog({
          orderId,
          eventType: 'SECURITY_VIOLATION_ATTEMPT',
          previousStatus: order.operationalStatus,
          newStatus: null,
          actorId: actor.id,
          actorName: actor.name,
          actorRole: actor.role,
          ipAddress: reqMeta.ip,
          userAgent: reqMeta.userAgent,
          details: { attempt: 'UNASSIGNED_DRIVER_ACCESS', targetOrderId: orderId }
        });
        return {
          success: false,
          error: { code: 'FORBIDDEN', message: 'Accès interdit : Cette commande ne vous est pas affectée.', statusCode: 403 }
        };
      }
    } else if (actor.role !== 'ADMIN') {
      return {
        success: false,
        error: { code: 'FORBIDDEN', message: 'Action réservée au chauffeur affecté.', statusCode: 403 }
      };
    }

    // State machine check
    if (order.operationalStatus !== 'AFFECTE') {
      return {
        success: false,
        error: {
          code: 'INVALID_TRANSITION',
          message: `Transition impossible : le statut actuel est '${order.operationalStatus}', attendu 'AFFECTE'.`,
          statusCode: 400
        }
      };
    }

    // Validation: Match BC or Order Number
    const cleanInput = bcOrOrderInput.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    const cleanBC = order.bcNumber.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    const cleanCMD = order.orderNumber.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

    const isValid = cleanInput === cleanBC || cleanInput === cleanCMD;
    if (!isValid) {
      return {
        success: false,
        error: {
          code: 'BC_MISMATCH',
          message: `Code BC ou numéro de commande non correspondant (Reçu: '${bcOrOrderInput}', Attendu: '${order.bcNumber}' ou '${order.orderNumber}').`,
          statusCode: 400
        }
      };
    }

    const prevOpStatus = order.operationalStatus;
    const newOpStatus: OperationalStatus = 'SUR_SITE';
    const newAdminStatus: AdminStatus = 'SUR_SITE';

    const updated = db.updateOrder(orderId, {
      operationalStatus: newOpStatus,
      adminStatus: newAdminStatus
    });

    db.addAuditLog({
      orderId,
      eventType: isManualEntry ? 'BC_MANUAL_ENTERED' : 'BC_SCANNED',
      previousStatus: prevOpStatus,
      newStatus: newOpStatus,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      ipAddress: reqMeta.ip,
      userAgent: reqMeta.userAgent,
      details: {
        inputScanned: bcOrOrderInput,
        matchedBC: order.bcNumber,
        matchedOrder: order.orderNumber,
        isManual: isManualEntry
      }
    });

    return { success: true, order: updated! };
  }

  /**
   * STEP 2: Transition to CHARGE (Scan du Document de Transport DT)
   */
  static confirmLoaded(
    orderId: string,
    dtInput: string,
    actor: User,
    reqMeta: { ip: string; userAgent: string }
  ): { success: true; order: Order } | { success: false; error: WorkflowError } {
    const order = db.getOrderById(orderId);
    if (!order) {
      return { success: false, error: { code: 'ORDER_NOT_FOUND', message: 'Commande introuvable.', statusCode: 404 } };
    }

    if (actor.role === 'DRIVER') {
      if (order.driverId !== actor.driverId) {
        return {
          success: false,
          error: { code: 'FORBIDDEN', message: 'Accès interdit : Cette commande ne vous est pas affectée.', statusCode: 403 }
        };
      }
    } else if (actor.role !== 'ADMIN') {
      return {
        success: false,
        error: { code: 'FORBIDDEN', message: 'Action réservée au chauffeur affecté.', statusCode: 403 }
      };
    }

    // State machine check
    if (order.operationalStatus !== 'SUR_SITE') {
      return {
        success: false,
        error: {
          code: 'INVALID_TRANSITION',
          message: `Transition impossible : le statut actuel est '${order.operationalStatus}', précondition 'SUR_SITE' requise.`,
          statusCode: 400
        }
      };
    }

    // Verify DT
    const cleanInput = dtInput.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    const cleanDT = order.dtNumber.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

    if (cleanInput !== cleanDT) {
      return {
        success: false,
        error: {
          code: 'DT_MISMATCH',
          message: `Code DT non correspondant (Reçu: '${dtInput}', Attendu: '${order.dtNumber}').`,
          statusCode: 400
        }
      };
    }

    const prevOpStatus = order.operationalStatus;
    const newOpStatus: OperationalStatus = 'CHARGE';
    const newAdminStatus: AdminStatus = 'CHARGE';

    const updated = db.updateOrder(orderId, {
      operationalStatus: newOpStatus,
      adminStatus: newAdminStatus
    });

    db.addAuditLog({
      orderId,
      eventType: 'DT_SCANNED',
      previousStatus: prevOpStatus,
      newStatus: newOpStatus,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      ipAddress: reqMeta.ip,
      userAgent: reqMeta.userAgent,
      details: {
        inputScanned: dtInput,
        matchedDT: order.dtNumber
      }
    });

    return { success: true, order: updated! };
  }

  /**
   * STEP 3: Transition to LIVRE (Photo de déchargement capturée en direct avec la caméra)
   */
  static confirmDelivered(
    orderId: string,
    photoData: {
      imageBase64: string;
      mimeType: string;
      gpsLatitude?: number | null;
      gpsLongitude?: number | null;
      gpsAccuracy?: number | null;
      capturedAt?: string;
      deviceInfo?: string;
    },
    actor: User,
    reqMeta: { ip: string; userAgent: string }
  ): { success: true; order: Order; proof: DeliveryProof } | { success: false; error: WorkflowError } {
    const order = db.getOrderById(orderId);
    if (!order) {
      return { success: false, error: { code: 'ORDER_NOT_FOUND', message: 'Commande introuvable.', statusCode: 404 } };
    }

    if (actor.role === 'DRIVER') {
      if (order.driverId !== actor.driverId) {
        return {
          success: false,
          error: { code: 'FORBIDDEN', message: 'Accès interdit : Cette commande ne vous est pas affectée.', statusCode: 403 }
        };
      }
    } else if (actor.role !== 'ADMIN') {
      return {
        success: false,
        error: { code: 'FORBIDDEN', message: 'Action réservée au chauffeur affecté.', statusCode: 403 }
      };
    }

    // Security & Photo Payload Validation
    if (!photoData.imageBase64 || typeof photoData.imageBase64 !== 'string') {
      return {
        success: false,
        error: { code: 'MISSING_PHOTO', message: 'Capture photo obligatoire pour valider la livraison.', statusCode: 400 }
      };
    }

    // Extract base64 buffer
    let base64Clean = photoData.imageBase64;
    let declaredMime = photoData.mimeType || 'image/jpeg';
    if (base64Clean.includes(';base64,')) {
      const parts = base64Clean.split(';base64,');
      declaredMime = parts[0].replace('data:', '');
      base64Clean = parts[1];
    }

    // Allowed MIME types
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimes.includes(declaredMime.toLowerCase())) {
      return {
        success: false,
        error: { code: 'INVALID_IMAGE_MIME', message: `Type d’image non autorisé (${declaredMime}). Seuls JPEG, PNG et WEBP sont acceptés.`, statusCode: 400 }
      };
    }

    // State machine check
    if (order.operationalStatus !== 'CHARGE') {
      return {
        success: false,
        error: {
          code: 'INVALID_TRANSITION',
          message: `Transition impossible : le statut actuel est '${order.operationalStatus}', précondition 'CHARGE' requise.`,
          statusCode: 400
        }
      };
    }

    const buffer = Buffer.from(base64Clean, 'base64');
    const sizeBytes = buffer.length;

    // Max size check: 8MB
    if (sizeBytes > 8 * 1024 * 1024) {
      return {
        success: false,
        error: { code: 'PHOTO_TOO_LARGE', message: 'Taille de photo supérieure à la limite maximale (8 Mo).', statusCode: 400 }
      };
    }

    // Min size check: at least 2KB (reject empty dummy files)
    if (sizeBytes < 2048) {
      return {
        success: false,
        error: { code: 'PHOTO_TOO_SMALL', message: 'Capture photo invalide ou fichier corrompu.', statusCode: 400 }
      };
    }

    // Cryptographic hash calculation for non-repudiation
    const sha256Hash = crypto.createHash('sha256').update(buffer).digest('hex');

    // Secure private file storage
    const ext = declaredMime.includes('png') ? 'png' : declaredMime.includes('webp') ? 'webp' : 'jpg';
    const fileName = `proof_${orderId}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}.${ext}`;
    const filePath = path.join(PROOFS_DIR, fileName);

    try {
      fs.writeFileSync(filePath, buffer);
    } catch (e) {
      console.error('[Workflow] Failed to write proof file', e);
      return {
        success: false,
        error: { code: 'STORAGE_FAILURE', message: 'Erreur serveur lors de la sauvegarde sécurisée de la preuve.', statusCode: 500 }
      };
    }

    const watermarkText = `CMD:${order.orderNumber} | DT:${order.dtNumber} | DRV:${actor.name} | ${new Date().toISOString()}`;

    // Create Proof record
    const proof = db.createProof({
      orderId,
      driverId: actor.driverId || 'ADMIN',
      fileName,
      fileSizeBytes: sizeBytes,
      mimeType: declaredMime,
      sha256Hash,
      gpsLatitude: photoData.gpsLatitude ?? null,
      gpsLongitude: photoData.gpsLongitude ?? null,
      gpsAccuracy: photoData.gpsAccuracy ?? null,
      capturedAt: photoData.capturedAt || new Date().toISOString(),
      deviceInfo: photoData.deviceInfo || 'Mobile Web App PWA',
      watermarkText,
      storedPath: filePath
    });

    const prevOpStatus = order.operationalStatus;
    const newOpStatus: OperationalStatus = 'LIVRE';
    const newAdminStatus: AdminStatus = 'LIVRE';

    const updated = db.updateOrder(orderId, {
      operationalStatus: newOpStatus,
      adminStatus: newAdminStatus
    });

    db.addAuditLog({
      orderId,
      eventType: 'DELIVERY_CONFIRMED',
      previousStatus: prevOpStatus,
      newStatus: newOpStatus,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      ipAddress: reqMeta.ip,
      userAgent: reqMeta.userAgent,
      details: {
        proofId: proof.id,
        sha256Hash,
        fileSizeBytes: sizeBytes,
        gps: photoData.gpsLatitude ? { lat: photoData.gpsLatitude, lng: photoData.gpsLongitude } : null
      }
    });

    return { success: true, order: updated!, proof };
  }
}
