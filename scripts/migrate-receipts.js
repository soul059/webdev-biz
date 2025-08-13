const { MongoClient } = require('mongodb');
const CryptoJS = require('crypto-js');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

function encrypt(text) {
  return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
}

function decrypt(encryptedText) {
  const bytes = CryptoJS.AES.decrypt(encryptedText, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}

async function migrateReceipts() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const collection = db.collection('receipts');
    
    const receipts = await collection.find({ isActive: true }).toArray();
    console.log(`Found ${receipts.length} receipts to check`);
    
    let updatedCount = 0;
    
    for (const receipt of receipts) {
      try {
        const decryptedData = JSON.parse(decrypt(receipt.encryptedData));
        
        // Check if freelancerInfo is missing
        if (!decryptedData.freelancerInfo) {
          console.log(`Updating receipt ${receipt.receiptId} - missing freelancerInfo`);
          
          // Add default freelancerInfo
          decryptedData.freelancerInfo = {
            name: 'keval chauhan',
            email: 'keval.s.chauhan1@gmail.com',
            phone: '09429806587',
            address: 'near Croma, uttarsanda road, 387001',
            website: ''
          };
          
          // Re-encrypt the data
          const newEncryptedData = encrypt(JSON.stringify(decryptedData));
          
          // Update the receipt
          await collection.updateOne(
            { _id: receipt._id },
            { $set: { encryptedData: newEncryptedData } }
          );
          
          updatedCount++;
        }
      } catch (error) {
        console.error(`Error processing receipt ${receipt.receiptId}:`, error);
      }
    }
    
    console.log(`Migration completed. Updated ${updatedCount} receipts.`);
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await client.close();
  }
}

migrateReceipts();
