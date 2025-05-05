import mongoose, { Schema } from 'mongoose';

// Define the schema
const officialSchema = new Schema(
  {
    homestayId: { 
      type: String, 
      required: true,
      index: true  // Index for faster lookup
    },
    name: { type: String, required: true },
    role: { type: String, required: true },
    contactNo: { type: String, required: true },
    gender: { 
      type: String, 
      enum: ['male', 'female', 'other'],
      default: 'male'
    }
  },
  {
    timestamps: true,
    collection: 'Officials Collection'  // Use existing collection name
  }
);

// Create model (check if it exists first to prevent overwrite during hot reload)
const Official = mongoose.models.Official || mongoose.model('Official', officialSchema);

export default Official; 