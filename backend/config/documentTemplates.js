/**
 * Standardized Document Template System
 * Defines fixed field templates for 20+ government document types.
 * Each template specifies: fields, labels, input types, and whether required.
 */

export const DOCUMENT_TEMPLATES = {
  aadhaar_card: {
    label: 'Aadhaar Card',
    icon: '🆔',
    category: 'identity',
    fields: [
      { key: 'aadhaarNumber', label: 'Aadhaar Number', type: 'text', required: true, pattern: /^\d{12}$/, hint: '12-digit number' },
      { key: 'fullName', label: 'Full Name', type: 'text', required: true },
      { key: 'dateOfBirth', label: 'Date of Birth', type: 'date', required: true },
      { key: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other'], required: true },
      { key: 'mobileNumber', label: 'Mobile Number', type: 'text', required: false },
      { key: 'fatherName', label: "Father's / Husband's Name", type: 'text', required: false },
      { key: 'address', label: 'Address', type: 'address', required: true },
    ]
  },

  pan_card: {
    label: 'PAN Card',
    icon: '💳',
    category: 'identity',
    fields: [
      { key: 'panNumber', label: 'PAN Number', type: 'text', required: true, pattern: /^[A-Z]{5}\d{4}[A-Z]$/, hint: 'e.g. ABCDE1234F' },
      { key: 'fullName', label: 'Full Name', type: 'text', required: true },
      { key: 'fatherName', label: "Father's Name", type: 'text', required: true },
      { key: 'dateOfBirth', label: 'Date of Birth', type: 'date', required: true },
    ]
  },

  passport: {
    label: 'Passport',
    icon: '✈️',
    category: 'identity',
    fields: [
      { key: 'passportNumber', label: 'Passport Number', type: 'text', required: true },
      { key: 'fullName', label: 'Full Name', type: 'text', required: true },
      { key: 'nationality', label: 'Nationality', type: 'text', required: true, defaultValue: 'Indian' },
      { key: 'dateOfBirth', label: 'Date of Birth', type: 'date', required: true },
      { key: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other'], required: true },
      { key: 'placeOfBirth', label: 'Place of Birth', type: 'text', required: true },
      { key: 'issueDate', label: 'Date of Issue', type: 'date', required: true },
      { key: 'expiryDate', label: 'Date of Expiry', type: 'date', required: true },
      { key: 'issuingAuthority', label: 'Place of Issue', type: 'text', required: false },
      { key: 'address', label: 'Address', type: 'address', required: false },
    ]
  },

  voter_id: {
    label: 'Voter ID (EPIC)',
    icon: '🗳️',
    category: 'identity',
    fields: [
      { key: 'voterIdNumber', label: 'EPIC Number', type: 'text', required: true, hint: 'e.g. ABC1234567' },
      { key: 'fullName', label: 'Full Name', type: 'text', required: true },
      { key: 'fatherName', label: "Father's / Husband's Name", type: 'text', required: false },
      { key: 'motherName', label: "Mother's Name", type: 'text', required: false },
      { key: 'spouseName', label: "Spouse's Name", type: 'text', required: false },
      { key: 'dateOfBirth', label: 'Date of Birth', type: 'date', required: false },
      { key: 'age', label: 'Age', type: 'number', required: false },
      { key: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other'], required: true },
      { key: 'address', label: 'Address', type: 'address', required: true },
    ]
  },

  driving_license: {
    label: 'Driving License',
    icon: '🚗',
    category: 'identity',
    fields: [
      { key: 'licenseNumber', label: 'License Number', type: 'text', required: true },
      { key: 'fullName', label: 'Full Name', type: 'text', required: true },
      { key: 'dateOfBirth', label: 'Date of Birth', type: 'date', required: true },
      { key: 'fatherName', label: "Father's / Husband's Name", type: 'text', required: false },
      { key: 'bloodGroup', label: 'Blood Group', type: 'text', required: false },
      { key: 'vehicleClass', label: 'Vehicle Class', type: 'text', required: false, hint: 'e.g. LMV, MCWG' },
      { key: 'issueDate', label: 'Date of Issue', type: 'date', required: false },
      { key: 'expiryDate', label: 'Valid Till', type: 'date', required: false },
      { key: 'issuingAuthority', label: 'Issuing RTO', type: 'text', required: false },
      { key: 'address', label: 'Address', type: 'address', required: false },
    ]
  },

  ration_card: {
    label: 'Ration Card',
    icon: '🍚',
    category: 'welfare',
    fields: [
      { key: 'rationCardNumber', label: 'Ration Card Number', type: 'text', required: true },
      { key: 'cardType', label: 'Card Type', type: 'select', options: ['APL', 'BPL', 'AAY', 'PHH', 'NPHH'], required: false },
      { key: 'fullName', label: 'Head of Family Name', type: 'text', required: true },
      { key: 'familyMembers', label: 'Family Members', type: 'textarea', required: false },
      { key: 'fpsNumber', label: 'FPS (Ration Shop) Number', type: 'text', required: false },
      { key: 'address', label: 'Address', type: 'address', required: true },
    ]
  },

  birth_certificate: {
    label: 'Birth Certificate',
    icon: '👶',
    category: 'civil',
    fields: [
      { key: 'registrationNumber', label: 'Registration Number', type: 'text', required: true },
      { key: 'childName', label: "Child's Name", type: 'text', required: true },
      { key: 'dateOfBirth', label: 'Date of Birth', type: 'date', required: true },
      { key: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other'], required: true },
      { key: 'placeOfBirth', label: 'Place of Birth', type: 'text', required: true },
      { key: 'fatherName', label: "Father's Name", type: 'text', required: true },
      { key: 'motherName', label: "Mother's Name", type: 'text', required: true },
      { key: 'issueDate', label: 'Date of Issue', type: 'date', required: false },
      { key: 'issuingAuthority', label: 'Registrar / Issuing Authority', type: 'text', required: false },
      { key: 'address', label: 'Permanent Address', type: 'address', required: false },
    ]
  },

  death_certificate: {
    label: 'Death Certificate',
    icon: '📋',
    category: 'civil',
    fields: [
      { key: 'registrationNumber', label: 'Registration Number', type: 'text', required: true },
      { key: 'deceasedName', label: "Deceased Person's Name", type: 'text', required: true },
      { key: 'dateOfDeath', label: 'Date of Death', type: 'date', required: true },
      { key: 'placeOfDeath', label: 'Place of Death', type: 'text', required: true },
      { key: 'age', label: 'Age at Death', type: 'number', required: false },
      { key: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other'], required: false },
      { key: 'causeOfDeath', label: 'Cause of Death', type: 'text', required: false },
      { key: 'fatherName', label: "Father's / Husband's Name", type: 'text', required: false },
      { key: 'issueDate', label: 'Date of Issue', type: 'date', required: false },
      { key: 'issuingAuthority', label: 'Registrar / Issuing Authority', type: 'text', required: false },
      { key: 'address', label: 'Permanent Address', type: 'address', required: false },
    ]
  },

  income_certificate: {
    label: 'Income Certificate',
    icon: '💰',
    category: 'financial',
    fields: [
      { key: 'certificateNumber', label: 'Certificate Number', type: 'text', required: true },
      { key: 'fullName', label: 'Full Name', type: 'text', required: true },
      { key: 'fatherName', label: "Father's / Husband's Name", type: 'text', required: false },
      { key: 'annualIncome', label: 'Annual Income (₹)', type: 'number', required: true },
      { key: 'incomeSource', label: 'Source of Income', type: 'text', required: false },
      { key: 'issueDate', label: 'Date of Issue', type: 'date', required: false },
      { key: 'expiryDate', label: 'Valid Till', type: 'date', required: false },
      { key: 'issuingAuthority', label: 'Issuing Authority', type: 'text', required: false },
      { key: 'address', label: 'Address', type: 'address', required: false },
    ]
  },

  caste_certificate: {
    label: 'Caste Certificate',
    icon: '📜',
    category: 'social',
    fields: [
      { key: 'certificateNumber', label: 'Certificate Number', type: 'text', required: true },
      { key: 'fullName', label: 'Full Name', type: 'text', required: true },
      { key: 'fatherName', label: "Father's Name", type: 'text', required: true },
      { key: 'caste', label: 'Caste / Sub-Caste', type: 'text', required: true },
      { key: 'religion', label: 'Religion', type: 'text', required: false },
      { key: 'issueDate', label: 'Date of Issue', type: 'date', required: false },
      { key: 'issuingAuthority', label: 'Issuing Authority', type: 'text', required: false },
      { key: 'address', label: 'Address', type: 'address', required: false },
    ]
  },

  community_certificate: {
    label: 'Community Certificate',
    icon: '🏛️',
    category: 'social',
    fields: [
      { key: 'certificateNumber', label: 'Certificate Number', type: 'text', required: true },
      { key: 'fullName', label: 'Full Name', type: 'text', required: true },
      { key: 'fatherName', label: "Father's Name", type: 'text', required: false },
      { key: 'community', label: 'Community', type: 'text', required: true },
      { key: 'religion', label: 'Religion', type: 'text', required: false },
      { key: 'issueDate', label: 'Date of Issue', type: 'date', required: false },
      { key: 'issuingAuthority', label: 'Issuing Authority', type: 'text', required: false },
      { key: 'address', label: 'Address', type: 'address', required: false },
    ]
  },

  domicile_certificate: {
    label: 'Domicile Certificate',
    icon: '🏠',
    category: 'residence',
    fields: [
      { key: 'certificateNumber', label: 'Certificate Number', type: 'text', required: true },
      { key: 'fullName', label: 'Full Name', type: 'text', required: true },
      { key: 'fatherName', label: "Father's Name", type: 'text', required: false },
      { key: 'motherName', label: "Mother's Name", type: 'text', required: false },
      { key: 'dateOfBirth', label: 'Date of Birth', type: 'date', required: false },
      { key: 'permanentAddress', label: 'Permanent Address', type: 'text', required: true },
      { key: 'yearsOfResidence', label: 'Years of Residence', type: 'number', required: false },
      { key: 'issueDate', label: 'Date of Issue', type: 'date', required: false },
      { key: 'issuingAuthority', label: 'Issuing Authority', type: 'text', required: false },
      { key: 'address', label: 'Address', type: 'address', required: false },
    ]
  },

  residence_certificate: {
    label: 'Residence Certificate',
    icon: '🏘️',
    category: 'residence',
    fields: [
      { key: 'certificateNumber', label: 'Certificate Number', type: 'text', required: true },
      { key: 'fullName', label: 'Full Name', type: 'text', required: true },
      { key: 'fatherName', label: "Father's / Husband's Name", type: 'text', required: false },
      { key: 'localBody', label: 'Local Body / Panchayat / Municipality', type: 'text', required: false },
      { key: 'periodOfResidence', label: 'Period of Residence', type: 'text', required: false },
      { key: 'issueDate', label: 'Date of Issue', type: 'date', required: false },
      { key: 'issuingAuthority', label: 'Issuing Authority', type: 'text', required: false },
      { key: 'address', label: 'Address', type: 'address', required: true },
    ]
  },

  marriage_certificate: {
    label: 'Marriage Certificate',
    icon: '💒',
    category: 'civil',
    fields: [
      { key: 'registrationNumber', label: 'Registration Number', type: 'text', required: true },
      { key: 'husbandName', label: "Husband's Name", type: 'text', required: true },
      { key: 'wifeName', label: "Wife's Name", type: 'text', required: true },
      { key: 'dateOfMarriage', label: 'Date of Marriage', type: 'date', required: true },
      { key: 'placeOfMarriage', label: 'Place of Marriage', type: 'text', required: false },
      { key: 'issueDate', label: 'Date of Issue', type: 'date', required: false },
      { key: 'issuingAuthority', label: 'Registrar / Issuing Authority', type: 'text', required: false },
      { key: 'address', label: 'Address', type: 'address', required: false },
    ]
  },

  sslc_certificate: {
    label: 'SSLC / 10th Certificate',
    icon: '🎓',
    category: 'educational',
    fields: [
      { key: 'registerNumber', label: 'Register Number', type: 'text', required: true },
      { key: 'studentName', label: "Student's Name", type: 'text', required: true },
      { key: 'dateOfBirth', label: 'Date of Birth', type: 'date', required: false },
      { key: 'fatherName', label: "Father's Name", type: 'text', required: false },
      { key: 'motherName', label: "Mother's Name", type: 'text', required: false },
      { key: 'schoolName', label: 'School Name', type: 'text', required: true },
      { key: 'yearOfPassing', label: 'Year of Passing', type: 'number', required: true },
      { key: 'marksGrade', label: 'Marks / Grade', type: 'text', required: false },
    ]
  },

  pension_certificate: {
    label: 'Pension Certificate',
    icon: '👴',
    category: 'financial',
    fields: [
      { key: 'pensionId', label: 'Pension ID / PPO Number', type: 'text', required: true },
      { key: 'pensionerName', label: "Pensioner's Name", type: 'text', required: true },
      { key: 'pensionType', label: 'Pension Type', type: 'text', required: false, hint: 'e.g. Old Age, Widow, Disability' },
      { key: 'aadhaarNumber', label: 'Aadhaar Number', type: 'text', required: false },
      { key: 'bankAccountDetails', label: 'Bank Account Details', type: 'text', required: false },
      { key: 'amount', label: 'Monthly Pension Amount (₹)', type: 'number', required: false },
      { key: 'issueDate', label: 'Date of Issue', type: 'date', required: false },
      { key: 'address', label: 'Address', type: 'address', required: false },
    ]
  },

  disability_certificate: {
    label: 'Disability Certificate',
    icon: '♿',
    category: 'medical',
    fields: [
      { key: 'certificateNumber', label: 'Certificate Number', type: 'text', required: true },
      { key: 'fullName', label: 'Full Name', type: 'text', required: true },
      { key: 'fatherName', label: "Father's / Guardian's Name", type: 'text', required: false },
      { key: 'dateOfBirth', label: 'Date of Birth', type: 'date', required: false },
      { key: 'disabilityType', label: 'Type of Disability', type: 'text', required: true },
      { key: 'disabilityPercentage', label: 'Disability Percentage (%)', type: 'number', required: false },
      { key: 'issueDate', label: 'Date of Issue', type: 'date', required: false },
      { key: 'expiryDate', label: 'Valid Till', type: 'date', required: false },
      { key: 'issuingAuthority', label: 'Issuing Medical Authority', type: 'text', required: false },
      { key: 'address', label: 'Address', type: 'address', required: false },
    ]
  },

  employment_certificate: {
    label: 'Employment / Experience Certificate',
    icon: '💼',
    category: 'employment',
    fields: [
      { key: 'certificateNumber', label: 'Certificate Number', type: 'text', required: false },
      { key: 'fullName', label: 'Employee Name', type: 'text', required: true },
      { key: 'employeeId', label: 'Employee ID', type: 'text', required: false },
      { key: 'employerName', label: 'Employer / Organization Name', type: 'text', required: true },
      { key: 'designation', label: 'Designation', type: 'text', required: false },
      { key: 'issueDate', label: 'Date of Issue', type: 'date', required: false },
      { key: 'address', label: 'Address', type: 'address', required: false },
    ]
  },

  land_record: {
    label: 'Land Record / Patta',
    icon: '🌾',
    category: 'property',
    fields: [
      { key: 'surveyNumber', label: 'Survey / Patta Number', type: 'text', required: true },
      { key: 'fullName', label: "Owner's Name", type: 'text', required: true },
      { key: 'fatherName', label: "Father's Name", type: 'text', required: false },
      { key: 'area', label: 'Land Area', type: 'text', required: false },
      { key: 'landType', label: 'Land Type', type: 'text', required: false },
      { key: 'issueDate', label: 'Date of Issue', type: 'date', required: false },
      { key: 'issuingAuthority', label: 'Issuing Authority', type: 'text', required: false },
      { key: 'address', label: 'Land Location / Address', type: 'address', required: false },
    ]
  },

  medical_certificate: {
    label: 'Medical Certificate',
    icon: '🏥',
    category: 'medical',
    fields: [
      { key: 'certificateNumber', label: 'Certificate Number', type: 'text', required: false },
      { key: 'fullName', label: "Patient's Name", type: 'text', required: true },
      { key: 'dateOfBirth', label: 'Date of Birth', type: 'date', required: false },
      { key: 'doctorName', label: "Doctor's Name", type: 'text', required: true },
      { key: 'hospitalName', label: 'Hospital / Clinic Name', type: 'text', required: true },
      { key: 'issueDate', label: 'Date of Issue', type: 'date', required: true },
      { key: 'address', label: 'Address', type: 'address', required: false },
    ]
  },

  bank_passbook: {
    label: 'Bank Passbook',
    icon: '🏦',
    category: 'financial',
    fields: [
      { key: 'accountNumber', label: 'Account Number', type: 'text', required: true },
      { key: 'fullName', label: "Account Holder's Name", type: 'text', required: true },
      { key: 'bankName', label: 'Bank Name', type: 'text', required: true },
      { key: 'ifscCode', label: 'IFSC Code', type: 'text', required: false },
      { key: 'branchName', label: 'Branch Name', type: 'text', required: false },
      { key: 'address', label: 'Address', type: 'address', required: false },
    ]
  },

  educational_certificate: {
    label: 'Educational Certificate',
    icon: '📚',
    category: 'educational',
    fields: [
      { key: 'certificateNumber', label: 'Certificate / Roll Number', type: 'text', required: false },
      { key: 'fullName', label: "Student's Name", type: 'text', required: true },
      { key: 'dateOfBirth', label: 'Date of Birth', type: 'date', required: false },
      { key: 'institutionName', label: 'Institution / University Name', type: 'text', required: true },
      { key: 'courseName', label: 'Course / Degree', type: 'text', required: false },
      { key: 'yearOfPassing', label: 'Year of Passing', type: 'number', required: false },
      { key: 'marksGrade', label: 'Marks / Grade / CGPA', type: 'text', required: false },
      { key: 'issueDate', label: 'Date of Issue', type: 'date', required: false },
    ]
  },

  other: {
    label: 'Other Document',
    icon: '📄',
    category: 'other',
    fields: [
      { key: 'fullName', label: 'Full Name', type: 'text', required: false },
      { key: 'dateOfBirth', label: 'Date of Birth', type: 'date', required: false },
      { key: 'certificateNumber', label: 'Document / Certificate Number', type: 'text', required: false },
      { key: 'issueDate', label: 'Date of Issue', type: 'date', required: false },
      { key: 'issuingAuthority', label: 'Issuing Authority', type: 'text', required: false },
      { key: 'address', label: 'Address', type: 'address', required: false },
    ]
  }
};

/**
 * Get field keys for a document type (used for empty field initialization)
 */
export function getTemplateFields(documentType) {
  const template = DOCUMENT_TEMPLATES[documentType];
  if (!template) return ['fullName', 'dateOfBirth', 'address'];
  return template.fields.map(f => f.key);
}

/**
 * Get full template definition for a document type
 */
export function getTemplate(documentType) {
  return DOCUMENT_TEMPLATES[documentType] || DOCUMENT_TEMPLATES.other;
}

/**
 * Get all document type keys
 */
export function getAllDocumentTypes() {
  return Object.keys(DOCUMENT_TEMPLATES);
}

export default DOCUMENT_TEMPLATES;
