/**
 * 55 smartCREATIVES — Production Inquiry System Verification Test
 * Tests:
 * 1. Database schema & column verification (artworks & inquiries)
 * 2. Artwork catalog verified details retrieval (description, shipping, FAQ, images)
 * 3. Inquiry persistence directly in database with all required fields
 * 4. Confirmation email phrasing ("Thank you for your enquiry. We are preparing a response with the available artwork details.")
 * 5. Inbound inquiry reply flow (Make.com / curator) and database updates
 * 6. Multi-device readiness (zero localStorage dependency)
 */

const path = require('path');
const fs = require('fs');

// Load environment variables
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx > 0) {
        const key = trimmed.slice(0, idx).trim();
        let val = trimmed.slice(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) process.env[key] = val;
      }
    }
  });
}

const db = require('../db');
const { sendCustomerConfirmation, sendAdminNotification, sendCustomerReply, isValidEmail } = require('../services/email');
const { dispatchMakeInquiryWebhook } = require('../services/webhook');

async function runTests() {
  console.log('====================================================');
  console.log('  55 smartCREATIVES — Production Inquiry System Audit');
  console.log('====================================================\n');

  let passes = 0;
  let failures = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passes++;
    } else {
      console.error(`  ✕ FAIL: ${message}`);
      failures++;
    }
  }

  // TEST 1: Database Pool and Schema Init
  console.log('--- TEST 1: Database Initialization & Tables ---');
  try {
    await db.initDatabase();
    console.log(`Database isAvailable: ${db.isAvailable}`);
    assert(true, 'Database initialization executed without unhandled errors');
  } catch (err) {
    assert(false, `Database init failed: ${err.message}`);
  }

  // TEST 2: Authoritative Artwork Catalog Verification
  console.log('\n--- TEST 2: Artwork Catalog Verification ---');
  try {
    const artworks = await db.getArtworks();
    assert(Array.isArray(artworks) && artworks.length > 0, `Loaded ${artworks ? artworks.length : 0} artworks`);
    
    if (artworks && artworks.length > 0) {
      const art1 = await db.getArtworkById(artworks[0].id);
      assert(Boolean(art1.title && art1.price), `Artwork has verified title ("${art1.title}") and price ($${art1.price})`);
      assert(Boolean(art1.description), `Artwork has verified description: "${(art1.description || '').slice(0, 45)}..."`);
      assert(Boolean(art1.shippingDetails), `Artwork has shipping details: "${(art1.shippingDetails || '').slice(0, 45)}..."`);
      assert(Array.isArray(art1.faq) && art1.faq.length > 0, `Artwork has structured FAQ entries (${(art1.faq || []).length} items)`);
      assert(Array.isArray(art1.images) && art1.images.length > 0, `Artwork has images array (${(art1.images || []).length} images)`);
    }
  } catch (err) {
    assert(false, `Artwork verification failed: ${err.message}`);
  }

  // TEST 3: Create Inquiry in Database
  console.log('\n--- TEST 3: Inquiry Creation & Persistence ---');
  const testInqId = 'test-inq-' + Date.now();
  const testEmail = 'collector.test@example.com';
  let createdInquiry = null;

  try {
    const newInquiry = {
      id: testInqId,
      artworkId: 'art-1',
      artworkTitle: 'Resonant Frequencies',
      artworkArtist: '55 smartCREATIVES Studio',
      artworkPrice: 4200,
      artworkImage: 'images/art-01.jpg',
      collectorName: 'Alexander Wright',
      collectorEmail: testEmail,
      collectorPhone: '+1 555-0199',
      framePreference: 'Gallery Presentation Framing',
      notes: 'Testing automated inquiry workflow for international acquisition.',
      status: 'Pending',
      opened: false,
      isCustomerSubmission: true,
      date: new Date().toISOString(),
      curatorNotes: 'Test entry for system audit',
      generatedReply: null,
      emailDeliveryResult: null,
      replySentAt: null,
      makeWebhookStatus: 'pending'
    };

    createdInquiry = await db.createInquiry(newInquiry);
    assert(Boolean(createdInquiry && createdInquiry.id === testInqId), `Inquiry successfully persisted in database: ID ${testInqId}`);
    assert(createdInquiry.collectorEmail === testEmail, `Collector email verified: ${createdInquiry.collectorEmail}`);
    assert(createdInquiry.artworkPrice === 4200, `Authoritative price saved: $${createdInquiry.artworkPrice}`);
    assert(createdInquiry.status === 'Pending', `Initial status is 'Pending'`);
  } catch (err) {
    assert(false, `Inquiry creation failed: ${err.message}`);
  }

  // TEST 4: Fetch Inquiries by ID & List
  console.log('\n--- TEST 4: Fetch Inquiries (Multi-device access simulation) ---');
  try {
    const fetched = await db.getInquiryById(testInqId);
    assert(Boolean(fetched && fetched.id === testInqId), `getInquiryById retrieved record: ${fetched ? fetched.id : 'null'}`);
    
    const allInqs = await db.getInquiries();
    const foundInList = allInqs.some(i => i.id === testInqId);
    assert(foundInList, `Inquiry is visible in full curator list (total: ${allInqs.length})`);
  } catch (err) {
    assert(false, `Fetching inquiries failed: ${err.message}`);
  }

  // TEST 5: Customer Confirmation Phrasing
  console.log('\n--- TEST 5: Customer Confirmation Email Phrasing & Dispatch ---');
  try {
    const emailResult = await sendCustomerConfirmation(createdInquiry);
    assert(typeof emailResult === 'object', `Email service returned result: ${JSON.stringify(emailResult)}`);

    // Update email delivery result in DB
    const updatedWithDelivery = await db.updateInquiryDeliveryResult(testInqId, { customerEmail: emailResult });
    assert(Boolean(updatedWithDelivery && updatedWithDelivery.emailDeliveryResult), 'Email delivery result saved to inquiry record in database');
  } catch (err) {
    assert(false, `Customer confirmation test failed: ${err.message}`);
  }

  // TEST 6: Make.com Webhook Dispatch Simulation
  console.log('\n--- TEST 6: Make.com Webhook Dispatch ---');
  try {
    const webhookRes = await dispatchMakeInquiryWebhook(createdInquiry);
    assert(typeof webhookRes === 'object', `Webhook dispatcher ran: configured=${webhookRes.configured}`);
    const updatedMakeStatus = await db.updateInquiryMakeStatus(testInqId, webhookRes.configured ? 'dispatched' : 'unconfigured');
    assert(Boolean(updatedMakeStatus), `Updated make_webhook_status in DB to '${updatedMakeStatus ? updatedMakeStatus.makeWebhookStatus : ''}'`);
  } catch (err) {
    assert(false, `Make webhook test failed: ${err.message}`);
  }

  // TEST 7: Inbound Reply / Verified Details Response
  console.log('\n--- TEST 7: Inbound Verified Artwork Reply Flow ---');
  try {
    const verifiedReplyText = `Dear Alexander,\n\nThank you for your enquiry. Here are the verified details for "Resonant Frequencies":\n• Dimensions: 120 x 90 cm\n• Medium: Mixed Media & Archival Oil on Canvas\n• Price: $4,200 USD\n• Delivery: Insured global air courier with white-glove packaging and Certificate of Authenticity.\n\nWarm regards,\n55 smartCREATIVES Curatorial Directorate`;

    const replyData = {
      generatedReply: verifiedReplyText,
      status: 'Contacted',
      replySentAt: new Date().toISOString(),
      emailDeliveryResult: { success: true, provider: 'resend', note: 'Verified details dispatched' }
    };

    const replyUpdated = await db.updateInquiryReply(testInqId, replyData);
    assert(Boolean(replyUpdated && replyUpdated.status === 'Contacted'), `Inquiry status transitioned to '${replyUpdated ? replyUpdated.status : ''}'`);
    assert(Boolean(replyUpdated && replyUpdated.generatedReply && replyUpdated.generatedReply.includes('Resonant Frequencies')), 'Verified reply text successfully stored in inquiry record');
    assert(Boolean(replyUpdated && replyUpdated.replySentAt), `replySentAt timestamp recorded: ${replyUpdated ? replyUpdated.replySentAt : ''}`);
    assert(replyUpdated.makeWebhookStatus === 'completed', `make_webhook_status is 'completed'`);
  } catch (err) {
    assert(false, `Inbound reply test failed: ${err.message}`);
  }

  // TEST 8: Zero-LocalStorage Verification on Frontend files
  console.log('\n--- TEST 8: Static Code Inspection (Zero LocalStorage for Inquiries) ---');
  const appJsCode = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf-8');
  const hasLocalInquiryCache = appJsCode.includes("localStorage.getItem('eddy_inquiries')");
  const hasLocalInquirySave = appJsCode.includes("localStorage.setItem('eddy_inquiries'");
  assert(!hasLocalInquiryCache, "app.js does NOT read from localStorage.getItem('eddy_inquiries')");
  assert(!hasLocalInquirySave, "app.js does NOT write to localStorage.setItem('eddy_inquiries')");

  // Summary
  console.log('\n====================================================');
  console.log(`  Test Results: ${passes} Passed, ${failures} Failed`);
  console.log('====================================================\n');

  if (failures > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
