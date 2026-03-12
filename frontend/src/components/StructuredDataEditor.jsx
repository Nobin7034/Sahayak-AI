import React, { useState } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';

const StructuredDataEditor = ({ document, onSave, onCancel }) => {
  const [formData, setFormData] = useState(document.extractedData || {});
  const [errors, setErrors] = useState({});

  const getFieldsForDocumentType = (documentType) => {
    const fieldConfigs = {
      aadhaar_card: [
        { name: 'aadhaarNumber', label: 'Aadhaar Number', type: 'text', pattern: '[0-9]{12}' },
        { name: 'fullName', label: 'Full Name', type: 'text', required: true },
        { name: 'dateOfBirth', label: 'Date of Birth', type: 'date', required: true },
        { name: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other'] },
        { name: 'address.line1', label: 'Address Line 1', type: 'text' },
        { name: 'address.line2', label: 'Address Line 2', type: 'text' },
        { name: 'address.city', label: 'City', type: 'text' },
        { name: 'address.state', label: 'State', type: 'text' },
        { name: 'address.pincode', label: 'Pincode', type: 'text', pattern: '[0-9]{6}' }
      ],
      pan_card: [
        { name: 'panNumber', label: 'PAN Number', type: 'text', pattern: '[A-Z]{5}[0-9]{4}[A-Z]{1}' },
        { name: 'fullName', label: 'Full Name', type: 'text', required: true },
        { name: 'fatherName', label: 'Father\'s Name', type: 'text' },
        { name: 'dateOfBirth', label: 'Date of Birth', type: 'date' }
      ],
      voter_id: [
        { name: 'voterIdNumber', label: 'Voter ID Number', type: 'text' },
        { name: 'fullName', label: 'Full Name', type: 'text', required: true },
        { name: 'fatherName', label: 'Father\'s Name', type: 'text' },
        { name: 'motherName', label: 'Mother\'s Name', type: 'text' },
        { name: 'spouseName', label: 'Spouse Name', type: 'text' },
        { name: 'dateOfBirth', label: 'Date of Birth', type: 'date' },
        { name: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other'] },
        { name: 'address.line1', label: 'Address Line 1', type: 'text' },
        { name: 'address.city', label: 'City', type: 'text' },
        { name: 'address.state', label: 'State', type: 'text' },
        { name: 'address.pincode', label: 'Pincode', type: 'text' }
      ],
      ration_card: [
        { name: 'rationCardNumber', label: 'Ration Card Number', type: 'text' },
        { name: 'cardType', label: 'Card Type', type: 'select', options: ['APL', 'BPL', 'AAY'] },
        { name: 'headOfFamily', label: 'Head of Family', type: 'text', required: true },
        { name: 'familyMembers', label: 'Family Members', type: 'text' },
        { name: 'fpsNumber', label: 'FPS Number', type: 'text' },
        { name: 'address.line1', label: 'Address Line 1', type: 'text' },
        { name: 'address.city', label: 'City', type: 'text' },
        { name: 'address.state', label: 'State', type: 'text' }
      ],
      birth_certificate: [
        { name: 'childName', label: 'Child Name', type: 'text', required: true },
        { name: 'dateOfBirth', label: 'Date of Birth', type: 'date', required: true },
        { name: 'placeOfBirth', label: 'Place of Birth', type: 'text' },
        { name: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other'] },
        { name: 'fatherName', label: 'Father\'s Name', type: 'text' },
        { name: 'motherName', label: 'Mother\'s Name', type: 'text' },
        { name: 'registrationNumber', label: 'Registration Number', type: 'text' }
      ],
      income_certificate: [
        { name: 'fullName', label: 'Full Name', type: 'text', required: true },
        { name: 'annualIncome', label: 'Annual Income', type: 'number' },
        { name: 'incomeSource', label: 'Income Source', type: 'text' },
        { name: 'certificateNumber', label: 'Certificate Number', type: 'text' },
        { name: 'issueDate', label: 'Issue Date', type: 'date' },
        { name: 'validity', label: 'Valid Until', type: 'date' },
        { name: 'address.line1', label: 'Address Line 1', type: 'text' },
        { name: 'address.city', label: 'City', type: 'text' },
        { name: 'address.state', label: 'State', type: 'text' }
      ],
      caste_certificate: [
        { name: 'fullName', label: 'Full Name', type: 'text', required: true },
        { name: 'fatherName', label: 'Father\'s Name', type: 'text' },
        { name: 'caste', label: 'Caste', type: 'text' },
        { name: 'religion', label: 'Religion', type: 'text' },
        { name: 'certificateNumber', label: 'Certificate Number', type: 'text' },
        { name: 'issuingAuthority', label: 'Issuing Authority', type: 'text' },
        { name: 'address.line1', label: 'Address Line 1', type: 'text' },
        { name: 'address.city', label: 'City', type: 'text' }
      ]
    };

    return fieldConfigs[documentType] || [
      { name: 'fullName', label: 'Full Name', type: 'text', required: true },
      { name: 'address.line1', label: 'Address', type: 'text' }
    ];
  };

  const getNestedValue = (obj, path) => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  const setNestedValue = (obj, path, value) => {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {};
      return current[key];
    }, obj);
    target[lastKey] = value;
  };

  const handleChange = (fieldName, value) => {
    const newFormData = { ...formData };
    setNestedValue(newFormData, fieldName, value);
    setFormData(newFormData);
    
    // Clear error for this field
    if (errors[fieldName]) {
      const newErrors = { ...errors };
      delete newErrors[fieldName];
      setErrors(newErrors);
    }
  };

  const validateForm = () => {
    const fields = getFieldsForDocumentType(document.documentType);
    const newErrors = {};

    fields.forEach(field => {
      if (field.required) {
        const value = getNestedValue(formData, field.name);
        if (!value || value.trim() === '') {
          newErrors[field.name] = `${field.label} is required`;
        }
      }

      if (field.pattern) {
        const value = getNestedValue(formData, field.name);
        if (value && !new RegExp(field.pattern).test(value)) {
          newErrors[field.name] = `Invalid ${field.label} format`;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSave(formData);
    }
  };

  const fields = getFieldsForDocumentType(document.documentType);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              Edit Document Data
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {document.name} - {document.documentType.replace(/_/g, ' ')}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fields.map((field) => {
              const value = getNestedValue(formData, field.name) || '';
              const error = errors[field.name];

              return (
                <div key={field.name} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  
                  {field.type === 'select' ? (
                    <select
                      value={value}
                      onChange={(e) => handleChange(field.name, e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        error ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select {field.label}</option>
                      {field.options.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : field.type === 'textarea' ? (
                    <textarea
                      value={value}
                      onChange={(e) => handleChange(field.name, e.target.value)}
                      rows={3}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        error ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                  ) : (
                    <input
                      type={field.type}
                      value={value}
                      onChange={(e) => handleChange(field.name, e.target.value)}
                      pattern={field.pattern}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        error ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                  )}
                  
                  {error && (
                    <div className="flex items-center mt-1 text-red-600 text-sm">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {error}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* OCR Confidence */}
          {formData.confidence && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm text-blue-800">
                OCR Confidence: {formData.confidence}%
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="btn-primary flex items-center"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default StructuredDataEditor;
