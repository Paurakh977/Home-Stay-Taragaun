import mongoose, { Schema } from 'mongoose';

// Define the schema
const contactSchema = new Schema(
  {
    homestayId: { 
      type: String, 
      required: true,
      index: true  // Index for faster lookup
    },
    name: { type: String, required: true },
    mobile: { type: String, required: true },
    email: { type: String, default: '' },
    facebook: { type: String, default: '' },
    youtube: { type: String, default: '' },
    instagram: { type: String, default: '' },
    tiktok: { type: String, default: '' },
    twitter: { type: String, default: '' }
  },
  {
    timestamps: true,
    collection: 'Contacts Collection'  // Use existing collection name
  }
);

// Create model (check if it exists first to prevent overwrite during hot reload)
const Contact = mongoose.models.Contact || mongoose.model('Contact', contactSchema);

export default Contact; 