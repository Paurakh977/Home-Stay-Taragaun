import mongoose, { Document, Schema } from 'mongoose';

// Define the interface for the custom field option
interface CustomFieldOption extends Document {
  value: string;
  label: string;
}

// Define the interface for the custom field definition
export interface ICustomFieldDefinition extends Document {
  fieldId: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'select';
  options?: string[];
  required: boolean;
  addedBy: string;
  addedAt: Date;
}

// Define the interface for the custom field document
export interface ICustomField extends Document {
  fieldId: string;
  definitions: ICustomFieldDefinition[];
  createdAt: Date;
  updatedAt: Date;
}

// Create the schema for custom field options
const CustomFieldOptionSchema = new Schema<CustomFieldOption>({
  value: { type: String, required: true },
  label: { type: String, required: true }
});

// Create the schema for custom field definitions
const CustomFieldDefinitionSchema = new Schema<ICustomFieldDefinition>({
  fieldId: { type: String, required: true, index: true },
  label: { type: String, required: true },
  type: { 
    type: String, 
    required: true,
    enum: ['text', 'number', 'date', 'boolean', 'select']
  },
  options: { type: [String], default: undefined },
  required: { type: Boolean, default: false },
  addedBy: { type: String, required: true },
  addedAt: { type: Date, default: Date.now }
});

// Create the schema for custom fields
const CustomFieldSchema = new Schema<ICustomField>({
  fieldId: { type: String, required: true, unique: true },
  definitions: [CustomFieldDefinitionSchema]
}, { timestamps: true });

// Create and export the model
const CustomField = mongoose.models.CustomField || mongoose.model<ICustomField>('CustomField', CustomFieldSchema);

export default CustomField; 