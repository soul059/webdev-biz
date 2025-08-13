const { MongoClient } = require('mongodb');
const QRCode = require('qrcode');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const NEXTAUTH_URL = process.env.NEXTAUTH_URL || 'http://localhost:3001';

async function generateMissingQRCodes() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const collection = db.collection('receipts');
    
    const receipts = await collection.find({ 
      isActive: true,
      $or: [
        { qrCodeUrl: null },
        { qrCodeUrl: { $exists: false } },
        { qrCodeUrl: "" }
      ]
    }).toArray();
    
    console.log(`Found ${receipts.length} receipts without QR codes`);
    
    let updatedCount = 0;
    
    for (const receipt of receipts) {
      try {
        console.log(`Generating QR code for receipt ${receipt.receiptId}`);
        
        // Generate QR Code
        const qrCodeUrl = `${NEXTAUTH_URL}/receipt/${receipt.receiptId}`;
        const qrCodeData = await QRCode.toDataURL(qrCodeUrl);
        
        // For now, we'll use the data URL directly since Cloudinary might not be configured
        await collection.updateOne(
          { _id: receipt._id },
          { $set: { qrCodeUrl: qrCodeData } }
        );
        
        updatedCount++;
        console.log(`✓ Updated receipt ${receipt.receiptId}`);
        
      } catch (error) {
        console.error(`Error processing receipt ${receipt.receiptId}:`, error);
      }
    }
    
    console.log(`Migration completed. Updated ${updatedCount} receipts with QR codes.`);
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await client.close();
  }
}

generateMissingQRCodes();
