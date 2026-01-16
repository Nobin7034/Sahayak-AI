import mongoose from 'mongoose';
import dotenv from 'dotenv';
import AkshayaCenter from '../models/AkshayaCenter.js';
import connectDB from '../config/db.js';

dotenv.config();

async function updateCenterPincodes() {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    const centers = await AkshayaCenter.find({});
    console.log(`Found ${centers.length} centers to update`);

    for (const center of centers) {
      if (center.location?.coordinates && center.location.coordinates.length === 2) {
        const [lng, lat] = center.location.coordinates;

        try {
          // Call the reverse geocoding API
          const response = await fetch(`http://localhost:5000/api/geocode/reverse?lat=${lat}&lng=${lng}`);
          const data = await response.json();

          if (data.success && data.components && data.components.postcode) {
            const newPincode = data.components.postcode;

            // Update the center with the correct pincode
            await AkshayaCenter.updateOne(
              { _id: center._id },
              {
                $set: {
                  'address.pincode': newPincode
                }
              }
            );

            console.log(`✅ Updated ${center.name}: ${center.address.pincode} → ${newPincode}`);
          } else {
            console.log(`⚠️  No pincode found for ${center.name} at coordinates: ${lat}, ${lng}`);
          }
        } catch (error) {
          console.error(`❌ Error updating ${center.name}:`, error.message);
        }

        // Add delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        console.log(`⚠️  No coordinates found for ${center.name}`);
      }
    }

    console.log('\n✅ Pincode update process completed');

    // Verify the updates
    const updatedCenters = await AkshayaCenter.find({});
    console.log('\n📋 Updated centers:');
    updatedCenters.forEach(center => {
      console.log(`${center.name}: ${center.address.pincode}`);
    });

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

updateCenterPincodes();