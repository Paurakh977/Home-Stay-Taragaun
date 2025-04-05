import mongoose, { Schema } from 'mongoose';

// Define district schema
const districtSchema = new Schema({
  name: { type: String, required: true },
  municipalities: [{ type: String }]
});

// Define province schema with districts
const provinceSchema = new Schema({
  name: { type: String, required: true },
  districts: [districtSchema]
});

// Define location schema
const locationSchema = new Schema(
  {
    // The location schema stores a list of provinces in Nepal
    provinces: [provinceSchema]
  },
  {
    timestamps: true,
    collection: 'Location Collection'  // Use existing collection name
  }
);

// Create model (check if it exists first to prevent overwrite during hot reload)
const Location = mongoose.models.Location || mongoose.model('Location', locationSchema);

export default Location; 