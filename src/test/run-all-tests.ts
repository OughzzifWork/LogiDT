/**
 * LogiTrack Automated Test Suite
 * Covers Unit, Integration, E2E Workflow, and Security IDOR tests.
 */

import crypto from 'crypto';
import fs from 'fs';
import { db } from '../server/db.ts';
import { WorkflowEngine } from '../server/workflow.ts';
import { ErpService } from '../server/erpService.ts';
import type { User } from '../types/index.ts';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${testName}${detail ? ` - ${detail}` : ''}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n======================================================');
  console.log('🚀 LOGITRACK DEVSECOPS & WORKFLOW AUTOMATED TEST SUITE');
  console.log('======================================================\n');

  // Reset database to pristine state for test
  db.resetToSeed();

  const adminUser = db.getUserById('usr_admin')!;
  const logisticsUser = db.getUserById('usr_logistics')!;
  const carrierDupontUser = db.getUserById('usr_carr_dupont')!;
  const carrierSudUser = db.getUserById('usr_carr_sud')!;
  const driverMarcUser = db.getUserById('usr_drv_marc')!;
  const driverPierreUser = db.getUserById('usr_drv_pierre')!;

  const testMeta = { ip: '127.0.0.1', userAgent: 'AutomatedTestSuite/1.0' };

  // -----------------------------------------------------------------
  // 1. UNIT & SECURITY RBAC / IDOR TESTS
  // -----------------------------------------------------------------
  console.log('--- 1. TESTS UNITAIRES ET SÉCURITÉ RBAC / ISOLATION MULTI-TENANT ---');

  // Test: Carrier Dupont cannot assign an order belonging to Sud Logistique
  const crossTenantAssign = WorkflowEngine.assignDriver('ord_10256', 'drv_marc', carrierDupontUser, testMeta);
  assert(
    !crossTenantAssign.success && crossTenantAssign.error.statusCode === 403,
    'Sécurité IDOR : Un transporteur ne peut pas modifier la commande d’un concurrent',
    `Code retourné : ${!crossTenantAssign.success ? crossTenantAssign.error.code : 'SUCCESS'}`
  );

  // Test: Driver Marc cannot act on Pierre's order
  const driverForbidden = WorkflowEngine.confirmOnSite('ord_10256', 'BC-10256', false, driverMarcUser, testMeta);
  assert(
    !driverForbidden.success && driverForbidden.error.statusCode === 403,
    'Sécurité Chauffeur : Un chauffeur ne peut pas accéder aux commandes d’un autre chauffeur',
    `Code retourné : ${!driverForbidden.success ? driverForbidden.error.code : 'SUCCESS'}`
  );

  // Test: Illegal state transition (skip to LIVRE without being CHARGE)
  const illegalTransition = WorkflowEngine.confirmDelivered(
    'ord_10254', // Currently AFFECTE, assigned to Marc
    {
      imageBase64: Buffer.from('test photo').toString('base64'),
      mimeType: 'image/jpeg'
    },
    driverMarcUser,
    testMeta
  );
  assert(
    !illegalTransition.success && illegalTransition.error.code === 'INVALID_TRANSITION',
    'Machine d’état : Rejet d’un saut de statut direct vers LIVRÉ sans SUR_SITE ni CHARGÉ'
  );

  // Test: Invalid photo MIME type rejected
  const invalidMime = WorkflowEngine.confirmDelivered(
    'ord_10254',
    {
      imageBase64: Buffer.from('executable binary data').toString('base64'),
      mimeType: 'application/x-msdownload'
    },
    driverMarcUser,
    testMeta
  );
  assert(
    !invalidMime.success && invalidMime.error.code === 'INVALID_IMAGE_MIME',
    'Upload Sécurité : Rejet de type MIME dangereux ou non autorisé'
  );

  // -----------------------------------------------------------------
  // 2. END-TO-END WORKFLOW SUITE (CRITÈRE FINAL DE RÉUSSITE)
  // -----------------------------------------------------------------
  console.log('\n--- 2. SCÉNARIO DE BOUT EN BOUT (CRITÈRE FINAL DU PROMPT) ---');

  // Step 1: Admin / Logistics creates & assigns order 10257 to Carrier Dupont
  const assignCarrierRes = WorkflowEngine.assignCarrier('ord_10257', 'carr_dupont', logisticsUser, testMeta);
  assert(assignCarrierRes.success && assignCarrierRes.order.carrierId === 'carr_dupont', 'Étape 1 : AIA/Logistique affecte la commande au transporteur Dupont');

  // Step 2: Carrier Dupont views order and assigns to Driver Marc
  const assignDriverRes = WorkflowEngine.assignDriver('ord_10257', 'drv_marc', carrierDupontUser, testMeta);
  assert(assignDriverRes.success && assignDriverRes.order.driverId === 'drv_marc', 'Étape 2 : Le transporteur affecte la commande à son chauffeur Marc');

  // Step 3: Driver arrives on site and scans BC (or enters order number)
  // Negative test: wrong BC
  const wrongBcRes = WorkflowEngine.confirmOnSite('ord_10257', 'WRONG-BC-999', false, driverMarcUser, testMeta);
  assert(!wrongBcRes.success && wrongBcRes.error.code === 'BC_MISMATCH', 'Étape 3a : Le serveur rejette un code BC erroné');

  // Positive test: correct BC
  const onSiteRes = WorkflowEngine.confirmOnSite('ord_10257', 'BC-10257', false, driverMarcUser, testMeta);
  assert(onSiteRes.success && onSiteRes.order.operationalStatus === 'SUR_SITE', 'Étape 3b : Validation BC réussie -> Statut opérationnel SUR_SITE');

  // Step 4: Driver scans DT for loading
  // Negative test: wrong DT
  const wrongDtRes = WorkflowEngine.confirmLoaded('ord_10257', 'DT-WRONG', driverMarcUser, testMeta);
  assert(!wrongDtRes.success && wrongDtRes.error.code === 'DT_MISMATCH', 'Étape 4a : Le serveur rejette un Document de Transport DT non concordant');

  // Positive test: correct DT
  const loadedRes = WorkflowEngine.confirmLoaded('ord_10257', 'DT-10257', driverMarcUser, testMeta);
  assert(loadedRes.success && loadedRes.order.operationalStatus === 'CHARGE', 'Étape 4b : Validation DT réussie -> Statut opérationnel CHARGÉ');

  // Step 5: Driver captures delivery photo proof
  // Create simulated 4KB JPEG payload
  const rawJpgBuffer = Buffer.alloc(4096, 0xff);
  const base64Jpg = rawJpgBuffer.toString('base64');

  const deliverRes = WorkflowEngine.confirmDelivered(
    'ord_10257',
    {
      imageBase64: `data:image/jpeg;base64,${base64Jpg}`,
      mimeType: 'image/jpeg',
      gpsLatitude: 50.3708,
      gpsLongitude: 3.0768,
      gpsAccuracy: 12,
      capturedAt: new Date().toISOString(),
      deviceInfo: 'Chrome Mobile / Android PWA'
    },
    driverMarcUser,
    testMeta
  );

  assert(deliverRes.success && deliverRes.order.operationalStatus === 'LIVRE', 'Étape 5 : Capture photo caméra -> Statut opérationnel LIVRÉ');

  if (deliverRes.success) {
    const proof = deliverRes.proof;
    assert(
      !!proof.sha256Hash && proof.sha256Hash.length === 64,
      'Étape 6 : Preuve certifiée avec empreinte cryptographique SHA-256 (64 hex)',
      `Hash: ${proof.sha256Hash.slice(0, 16)}...`
    );
    assert(fs.existsSync(proof.storedPath), 'Étape 7 : Fichier photo stocké dans le répertoire privé sécurisé');
  }

  // Step 8: Verify Audit Trail
  const auditLogs = db.getAuditLogs('ord_10257');
  assert(
    auditLogs.length >= 4,
    'Étape 8 : Journal d’audit immuable avec traçabilité complète de chaque action',
    `Événements tracés : ${auditLogs.map(l => l.eventType).join(', ')}`
  );

  // -----------------------------------------------------------------
  // 3. INTEGRATION ERP TESTS
  // -----------------------------------------------------------------
  console.log('\n--- 3. TESTS INTÉGRATION ERP & SYNCHRONISATION ---');
  const syncResult = ErpService.syncFromErp(adminUser, testMeta);
  assert(syncResult.importedCount >= 1, 'Intégration ERP : Importation automatique des nouvelles commandes métier');

  const exportResult = ErpService.exportDeliveriesToErp(adminUser, testMeta);
  assert(exportResult.exportedCount >= 1, 'Intégration ERP : Export des preuves et statuts livrés vers la facturation ERP');

  console.log('\n======================================================');
  console.log(`RÉSULTAT FINAL DES TESTS : ${passed} RÉUSSIS / ${failed} ÉCHECS`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test execution fatal error:', err);
  process.exit(1);
});
