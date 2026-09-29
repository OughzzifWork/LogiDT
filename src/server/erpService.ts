/**
 * ERP Integration Service
 * Secure decoupled integration layer between company ERP and LogiTrack PWA
 */

import { db } from './db.ts';
import type { Order, ErpSyncStatus, User } from '../types/index.ts';

// Simulated ERP database records available for import
const ERP_MOCK_FEED = [
  {
    orderNumber: 'CMD-10258',
    bcNumber: 'BC-10258',
    dtNumber: 'DT-10258',
    blFcNumber: 'BLFC-8816',
    clientName: 'Consortium BTP Régional',
    deliveryAddress: '32 Route Industrielle, Zone Sud',
    destinationCity: 'Valenciennes',
    postalCode: '59300',
    destinationContact: 'M. Thomas Leroux',
    destinationPhone: '+33 3 27 12 34 56',
    cargoDescription: '4 Palettes d’agrégats et outillage',
    packagesCount: 4,
    weightKg: 850,
    billingStatus: 'NON_FACTUREE' as const
  },
  {
    orderNumber: 'CMD-10259',
    bcNumber: 'BC-10259',
    dtNumber: 'DT-10259',
    blFcNumber: 'BLFC-8817',
    clientName: 'Laboratoires Cosmé-Bio',
    deliveryAddress: '5 Rue des Lilas',
    destinationCity: 'Arras',
    postalCode: '62000',
    destinationContact: 'Mme Sandrine Roux',
    destinationPhone: '+33 3 21 88 99 00',
    cargoDescription: '1 Palette flaconnage verre',
    packagesCount: 1,
    weightKg: 190,
    billingStatus: 'FACTUREE' as const
  }
];

export class ErpService {
  /**
   * Get sync status and metrics
   */
  static getSyncStatus(): ErpSyncStatus {
    const orders = db.getOrders();
    const deliveredCount = orders.filter(o => o.operationalStatus === 'LIVRE').length;

    return {
      lastSyncAt: db.getLastErpSync(),
      syncedOrdersCount: orders.length,
      erpConnected: true,
      pendingExportCount: deliveredCount
    };
  }

  /**
   * Import pending orders from ERP into LogiTrack
   */
  static syncFromErp(actor: User, reqMeta: { ip: string; userAgent: string }): {
    importedCount: number;
    updatedCount: number;
    newOrders: Order[];
  } {
    let importedCount = 0;
    const newOrders: Order[] = [];

    for (const item of ERP_MOCK_FEED) {
      const existing = db.getOrderByNumber(item.orderNumber);
      if (!existing) {
        const created = db.createOrder({
          orderNumber: item.orderNumber,
          bcNumber: item.bcNumber,
          dtNumber: item.dtNumber,
          blFcNumber: item.blFcNumber,
          clientName: item.clientName,
          deliveryAddress: item.deliveryAddress,
          destinationCity: item.destinationCity,
          postalCode: item.postalCode,
          destinationContact: item.destinationContact,
          destinationPhone: item.destinationPhone,
          cargoDescription: item.cargoDescription,
          packagesCount: item.packagesCount,
          weightKg: item.weightKg,
          billingStatus: item.billingStatus,
          operationalStatus: 'AFFECTE',
          adminStatus: 'CREEE',
          carrierId: null,
          driverId: null
        });

        newOrders.push(created);
        importedCount++;

        db.addAuditLog({
          orderId: created.id,
          eventType: 'ERP_SYNCED',
          previousStatus: null,
          newStatus: 'CREEE',
          actorId: actor.id,
          actorName: actor.name,
          actorRole: actor.role,
          ipAddress: reqMeta.ip,
          userAgent: reqMeta.userAgent,
          details: {
            source: 'ERP_CONNECTOR',
            orderNumber: created.orderNumber,
            client: created.clientName
          }
        });
      }
    }

    db.setLastErpSync(new Date().toISOString());

    return {
      importedCount,
      updatedCount: 0,
      newOrders
    };
  }

  /**
   * Export delivery confirmation proofs to ERP for billing closure
   */
  static exportDeliveriesToErp(actor: User, reqMeta: { ip: string; userAgent: string }) {
    const deliveredOrders = db.getOrders({ operationalStatus: 'LIVRE' });
    const exportedList = [];

    for (const ord of deliveredOrders) {
      const proof = db.getProofByOrderId(ord.id);
      exportedList.push({
        orderNumber: ord.orderNumber,
        bcNumber: ord.bcNumber,
        dtNumber: ord.dtNumber,
        blFcNumber: ord.blFcNumber,
        status: 'LIVRE',
        proofHash: proof ? proof.sha256Hash : null,
        deliveredAt: proof ? proof.serverReceivedAt : ord.updatedAt
      });
    }

    db.addAuditLog({
      orderId: null,
      eventType: 'ERP_SYNCED',
      previousStatus: null,
      newStatus: null,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      ipAddress: reqMeta.ip,
      userAgent: reqMeta.userAgent,
      details: {
        action: 'EXPORT_DELIVERIES_TO_ERP',
        exportedCount: exportedList.length
      }
    });

    return {
      exportedCount: exportedList.length,
      records: exportedList
    };
  }
}
