import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import {
  Lock,
  Unlock,
  Upload,
  FileText,
  Eye,
  Download,
  Trash2,
  Edit3,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  Plus,
  Search,
  Filter,
  Settings,
  BarChart3,
  X,
  Loader2,
  LogOut
} from 'lucide-react';

const DocumentLocker = () => {
  const { user } = useAuth();
  const [lockerExists, setLockerExists] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState([]);
  const [stats, setStats] = useState(null);
  const [showCreateLocker, setShowCreateLocker] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [showMyDetails, setShowMyDetails] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showDocumentDetails, setShowDocumentDetails] = useState(false);
  const [showOCRVerification, setShowOCRVerification] = useState(false);
  const [ocrVerificationData, setOCRVerificationData] = useState(null);
  const [crossValidationResults, setCrossValidationResults] = useState(null);
  const [showCrossValidation, setShowCrossValidation] = useState(false);
  const [detailsSearchTerm, setDetailsSearchTerm] = useState('');
  const [editingField, setEditingField] = useState(null);
  const [editingValue, setEditingValue] = useState('');
  const [showReplaceDocument, setShowReplaceDocument] = useState(false);
  const [replaceDocumentData, setReplaceDocumentData] = useState(null);
  const [replaceForm, setReplaceForm] = useState({
    file: null,
    performOCR: true
  });

  // Form states
  const [createForm, setCreateForm] = useState({ pin: '', confirmPin: '' });
  const [unlockForm, setUnlockForm] = useState({ pin: '' });
  const [currentPin, setCurrentPin] = useState(''); // Store current PIN for operations
  const [uploadForm, setUploadForm] = useState({
    file: null,
    documentType: '',
    name: '',
    tags: '',
    pin: ''
  });
  const [documentValidation, setDocumentValidation] = useState({
    isValidating: false,
    isValid: null,
    message: ''
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [warning, setWarning] = useState('');
  const [processing, setProcessing] = useState(false);

  const documentTypes = [
    { value: 'aadhaar_card', label: 'Aadhaar Card', icon: '🆔' },
    { value: 'pan_card', label: 'PAN Card', icon: '💳' },
    { value: 'voter_id', label: 'Voter ID (EPIC)', icon: '🗳️' },
    { value: 'ration_card', label: 'Ration Card', icon: '🍚' },
    { value: 'birth_certificate', label: 'Birth Certificate', icon: '👶' },
    { value: 'death_certificate', label: 'Death Certificate', icon: '⚰️' },
    { value: 'income_certificate', label: 'Income Certificate', icon: '💰' },
    { value: 'caste_certificate', label: 'Caste Certificate', icon: '📜' },
    { value: 'community_certificate', label: 'Community Certificate', icon: '🏛️' },
    { value: 'domicile_certificate', label: 'Domicile Certificate', icon: '🏠' },
    { value: 'residence_certificate', label: 'Residence Certificate', icon: '🏘️' },
    { value: 'marriage_certificate', label: 'Marriage Certificate', icon: '💒' },
    { value: 'driving_license', label: 'Driving License', icon: '🚗' },
    { value: 'sslc_certificate', label: 'SSLC Certificate', icon: '🎓' },
    { value: 'pension_certificate', label: 'Pension Certificate', icon: '👴' }
  ];

  useEffect(() => {
    checkLockerStatus();
  }, []);

  const checkLockerStatus = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/document-locker/exists');
      setLockerExists(response.data.exists);
      setLoading(false);
    } catch (error) {
      console.error('Error checking locker status:', error);
      setError('Failed to check locker status');
      setLoading(false);
    }
  };

  const createLocker = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (createForm.pin !== createForm.confirmPin) {
      setError('PIN and confirmation PIN do not match');
      return;
    }

    if (createForm.pin.length < 4 || createForm.pin.length > 6) {
      setError('PIN must be between 4 and 6 digits');
      return;
    }

    try {
      setProcessing(true);
      await axios.post('/api/document-locker/create', createForm);
      setSuccess('Document locker created successfully!');
      setLockerExists(true);
      setShowCreateLocker(false);
      setCreateForm({ pin: '', confirmPin: '' });
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create locker');
    } finally {
      setProcessing(false);
    }
  };

  const unlockLocker = async (e) => {
    e.preventDefault();
    setError('');

    try {
      setProcessing(true);
      const response = await axios.post('/api/document-locker/unlock', unlockForm);
      setIsUnlocked(true);
      setCurrentPin(unlockForm.pin); // Store PIN before clearing form
      
      // Load documents and stats with the PIN
      await loadDocumentsWithPin(unlockForm.pin);
      await loadStatsWithPin(unlockForm.pin);
      
      setUnlockForm({ pin: '' }); // Clear form after successful operations
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to unlock locker');
    } finally {
      setProcessing(false);
    }
  };

  const loadDocumentsWithPin = async (pin) => {
    try {
      console.log('Loading documents with PIN:', pin ? 'PIN provided' : 'No PIN');
      const response = await axios.post('/api/document-locker/documents', {
        pin: pin
      });
      setDocuments(response.data.data);
      console.log('Documents loaded successfully:', response.data.data.length);
    } catch (error) {
      console.error('Error loading documents:', error.response?.data || error.message);
      setError(`Failed to load documents: ${error.response?.data?.message || error.message}`);
    }
  };

  const loadStatsWithPin = async (pin) => {
    try {
      console.log('Loading stats with PIN:', pin ? 'PIN provided' : 'No PIN');
      const response = await axios.post('/api/document-locker/stats', {
        pin: pin
      });
      setStats(response.data.data);
      console.log('Stats loaded successfully');
    } catch (error) {
      console.error('Error loading stats:', error.response?.data || error.message);
      // Don't show error for stats as it's not critical
    }
  };

  const loadDocuments = async () => {
    if (!currentPin) {
      console.warn('No current PIN available for loading documents');
      return;
    }
    
    try {
      console.log('Loading documents with current PIN');
      const response = await axios.post('/api/document-locker/documents', {
        pin: currentPin
      });
      setDocuments(response.data.data);
      console.log('Documents loaded successfully:', response.data.data.length);
    } catch (error) {
      console.error('Error loading documents:', error.response?.data || error.message);
      setError(`Failed to load documents: ${error.response?.data?.message || error.message}`);
    }
  };

  const loadStats = async () => {
    if (!currentPin) {
      console.warn('No current PIN available for loading stats');
      return;
    }
    
    try {
      console.log('Loading stats with current PIN');
      const response = await axios.post('/api/document-locker/stats', {
        pin: currentPin
      });
      setStats(response.data.data);
      console.log('Stats loaded successfully');
    } catch (error) {
      console.error('Error loading stats:', error.response?.data || error.message);
      // Don't show error for stats as it's not critical
    }
  };

  const loadProfileData = async () => {
    if (!currentPin) {
      console.warn('No current PIN available for loading profile data');
      return {};
    }
    
    try {
      console.log('Loading profile data for auto-fill');
      const response = await axios.post('/api/document-locker/profile-data', {
        pin: currentPin
      });
      console.log('Profile data loaded:', Object.keys(response.data.data));
      return response.data.data;
    } catch (error) {
      console.error('Error loading profile data:', error.response?.data || error.message);
      return {};
    }
  };

  const validateDocumentFile = async (file) => {
    if (!file) {
      setDocumentValidation({ isValidating: false, isValid: null, message: '' });
      return;
    }

    setDocumentValidation({ isValidating: true, isValid: null, message: 'Validating document authenticity...' });

    try {
      const formData = new FormData();
      formData.append('document', file);

      const response = await axios.post('/api/document-locker/validate-document', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.isAuthentic) {
        setDocumentValidation({
          isValidating: false,
          isValid: true,
          message: 'Document appears to be authentic'
        });
      } else {
        setDocumentValidation({
          isValidating: false,
          isValid: false,
          message: response.data.message || 'This document appears to be fake or not a valid government document'
        });
      }
    } catch (error) {
      console.error('Document validation error:', error);
      // If validation service is unavailable, allow upload
      setDocumentValidation({
        isValidating: false,
        isValid: true,
        message: 'Validation service unavailable - proceeding without validation'
      });
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    setUploadForm({ ...uploadForm, file });
    
    // Validate the document immediately
    if (file) {
      validateDocumentFile(file);
    } else {
      setDocumentValidation({ isValidating: false, isValid: null, message: '' });
    }
  };

  const uploadDocument = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setWarning('');

    if (!uploadForm.file || !uploadForm.documentType || !uploadForm.pin) {
      setError('Please fill all required fields');
      return;
    }

    // Double-check validation before upload
    if (documentValidation.isValid === false) {
      setError('Cannot upload fake documents. Please select an authentic government document.');
      return;
    }

    try {
      setProcessing(true);
      const formData = new FormData();
      formData.append('document', uploadForm.file);
      formData.append('documentType', uploadForm.documentType);
      formData.append('name', uploadForm.name || uploadForm.file.name);
      formData.append('tags', uploadForm.tags);
      formData.append('pin', uploadForm.pin);

      const response = await axios.post('/api/document-locker/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setSuccess('Document uploaded and processed successfully!');
      setShowUpload(false);
      setUploadForm({ file: null, documentType: '', name: '', tags: '', pin: '' });
      setDocumentValidation({ isValidating: false, isValid: null, message: '' });
      
      // Update current PIN if upload was successful
      setCurrentPin(uploadForm.pin);
      await loadDocumentsWithPin(uploadForm.pin);
      await loadStatsWithPin(uploadForm.pin);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to upload document');
    } finally {
      setProcessing(false);
    }
  };

  const viewDocument = async (documentId) => {
    try {
      const response = await axios.post(`/api/document-locker/documents/${documentId}`, {
        pin: currentPin
      });
      
      const documentData = response.data.data;
      
      // Fetch the document file as blob for preview
      try {
        const fileResponse = await axios.post(
          `/api/document-locker/documents/${documentId}/view`,
          { pin: currentPin },
          { responseType: 'blob' }
        );
        
        // Create object URL for the blob
        const fileUrl = URL.createObjectURL(fileResponse.data);
        documentData.fileUrl = fileUrl;
      } catch (fileError) {
        console.error('Failed to load document file:', fileError);
        // Continue without file preview
      }
      
      setSelectedDocument(documentData);
      setShowDocumentDetails(true);
    } catch (error) {
      setError('Failed to load document details');
    }
  };

  const downloadDocument = async (documentId, fileName) => {
    try {
      const response = await axios.post(`/api/document-locker/documents/${documentId}/download`, {
        pin: currentPin
      }, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setError('Failed to download document');
    }
  };

  const deleteDocument = async (documentId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      await axios.delete(`/api/document-locker/documents/${documentId}`, {
        data: { pin: currentPin }
      });
      setSuccess('Document deleted successfully');
      loadDocuments();
      loadStats();
    } catch (error) {
      setError('Failed to delete document');
    }
  };

  const openReplaceDocument = (document) => {
    setReplaceDocumentData(document);
    setReplaceForm({ file: null, performOCR: true });
    setShowReplaceDocument(true);
  };

  const replaceDocument = async (e) => {
    e.preventDefault();
    
    if (!replaceForm.file) {
      setError('Please select a file to upload');
      return;
    }

    try {
      setProcessing(true);
      setError('');

      const formData = new FormData();
      formData.append('document', replaceForm.file);
      formData.append('pin', currentPin);
      formData.append('performOCR', replaceForm.performOCR.toString());

      const response = await axios.put(
        `/api/document-locker/documents/${replaceDocumentData._id}/replace`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setSuccess('Document replaced successfully! OCR processing completed.');
      setShowReplaceDocument(false);
      setReplaceDocumentData(null);
      setReplaceForm({ file: null, performOCR: true });
      
      // Reload documents
      loadDocuments();
      loadStats();
      
      // Show verification modal if OCR was performed
      if (replaceForm.performOCR && response.data.data) {
        setOCRVerificationData(response.data.data);
        setShowOCRVerification(true);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to replace document');
    } finally {
      setProcessing(false);
    }
  };

  const verifyOCRData = async (documentId) => {
    try {
      setProcessing(true);
      const response = await axios.post(`/api/document-locker/documents/${documentId}/verify-ocr`, {
        pin: currentPin
      });
      setOCRVerificationData(response.data.data);
      setShowOCRVerification(true);
    } catch (error) {
      setError('Failed to verify OCR data');
    } finally {
      setProcessing(false);
    }
  };

  const runCrossValidation = async () => {
    try {
      setProcessing(true);
      const response = await axios.post('/api/document-locker/cross-validate', {
        pin: currentPin
      });
      setCrossValidationResults(response.data.data);
      setShowCrossValidation(true);
    } catch (error) {
      setError('Failed to run cross-validation');
    } finally {
      setProcessing(false);
    }
  };

  const syncFieldAcrossDocuments = async (fieldName, fieldValue, sourceDocumentId) => {
    try {
      console.log(`Syncing field ${fieldName} across all documents:`, fieldValue);
      
      const response = await axios.put('/api/document-locker/sync-field', {
        pin: currentPin,
        fieldName,
        fieldValue,
        sourceDocumentId
      });
      
      console.log(`Sync completed: ${response.data.message}`);
      
      // Reload documents to reflect changes
      await loadDocuments();
      
      return response.data;
    } catch (error) {
      console.error('Field sync error:', error);
      setError(`Failed to sync field: ${error.response?.data?.message || error.message}`);
      return null;
    }
  };

  const updateOCRData = async (documentId, updatedData) => {
    try {
      setProcessing(true);
      
      // First update the current document
      await axios.put(`/api/document-locker/documents/${documentId}/ocr-data`, {
        pin: currentPin,
        extractedData: updatedData
      });
      
      // Then sync common fields across all documents
      const commonFields = ['fullName', 'dateOfBirth', 'address'];
      
      for (const fieldName of commonFields) {
        if (updatedData[fieldName] !== undefined && updatedData[fieldName] !== null && updatedData[fieldName] !== '') {
          await syncFieldAcrossDocuments(fieldName, updatedData[fieldName], documentId);
        }
      }
      
      setSuccess('Data updated and synchronized across all documents');
      loadDocuments();
      setShowOCRVerification(false);
    } catch (error) {
      setError('Failed to update OCR data');
    } finally {
      setProcessing(false);
    }
  };

  // Lock and exit the locker
  const lockAndExit = () => {
    if (window.confirm('Are you sure you want to lock and exit the document locker?')) {
      setIsUnlocked(false);
      setCurrentPin('');
      setDocuments([]);
      setStats(null);
      setSuccess('Locker locked successfully');
    }
  };

  // Debug function to check current state
  const debugCurrentState = () => {
    console.log('=== Document Locker Debug Info ===');
    console.log('Locker exists:', lockerExists);
    console.log('Is unlocked:', isUnlocked);
    console.log('Current PIN available:', !!currentPin);
    console.log('Documents count:', documents.length);
    console.log('Stats available:', !!stats);
    console.log('Processing:', processing);
    console.log('Error:', error);
    console.log('Success:', success);
    console.log('================================');
  };

  // Add debug button in development
  const isDevelopment = import.meta.env.DEV;

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.documentType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || doc.documentType === filterType;
    return matchesSearch && matchesFilter;
  });

  const getDocumentTypeInfo = (type) => {
    // First check the main document types
    const mainType = documentTypes.find(dt => dt.value === type);
    if (mainType) return mainType;
    
    // Handle legacy document types
    const legacyTypes = {
      passport: { label: 'Passport', icon: '✈️' },
      bank_passbook: { label: 'Bank Passbook', icon: '🏦' },
      salary_slip: { label: 'Salary Slip', icon: '💼' },
      property_document: { label: 'Property Document', icon: '🏠' },
      educational_certificate: { label: 'Educational Certificate', icon: '🎓' },
      medical_certificate: { label: 'Medical Certificate', icon: '🏥' },
      other: { label: 'Other', icon: '📄' }
    };
    
    return legacyTypes[type] || { label: type.replace('_', ' '), icon: '📄' };
  };

  const getValidationColor = (score) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getValidationIcon = (score) => {
    if (score >= 90) return <CheckCircle className="w-4 h-4" />;
    if (score >= 70) return <Clock className="w-4 h-4" />;
    return <AlertTriangle className="w-4 h-4" />;
  };

  // Get relevant fields for each document type
  const getRelevantFields = (documentType) => {
    const fieldMappings = {
      aadhaar_card: ['aadhaarNumber', 'fullName', 'dateOfBirth', 'gender', 'address'],
      
      pan_card: ['panNumber', 'fullName', 'fatherName', 'dateOfBirth'],
      
      voter_id: ['voterIdNumber', 'fullName', 'fatherName', 'motherName', 'spouseName', 'dateOfBirth', 'gender', 'address'],
      
      ration_card: ['rationCardNumber', 'cardType', 'headOfFamily', 'familyMembers', 'address', 'fpsNumber'],
      
      birth_certificate: ['childName', 'dateOfBirth', 'placeOfBirth', 'gender', 'fatherName', 'motherName', 'registrationNumber'],
      
      death_certificate: ['deceasedName', 'dateOfDeath', 'placeOfDeath', 'age', 'gender', 'causeOfDeath', 'registrationNumber'],
      
      income_certificate: ['fullName', 'address', 'annualIncome', 'incomeSource', 'certificateNumber', 'issueDate', 'validity'],
      
      caste_certificate: ['fullName', 'fatherName', 'caste', 'religion', 'address', 'certificateNumber', 'issuingAuthority'],
      
      community_certificate: ['fullName', 'community', 'religion', 'address', 'certificateNumber', 'issueDate'],
      
      domicile_certificate: ['fullName', 'fatherName', 'motherName', 'permanentAddress', 'yearsOfResidence', 'certificateNumber', 'issueDate'],
      
      residence_certificate: ['fullName', 'address', 'localBody', 'periodOfResidence', 'certificateNumber', 'issueDate'],
      
      marriage_certificate: ['husbandName', 'wifeName', 'dateOfMarriage', 'placeOfMarriage', 'registrationNumber', 'issuingAuthority'],
      
      driving_license: ['licenseNumber', 'fullName', 'dateOfBirth', 'address', 'vehicleClass', 'issueDate', 'validity'],
      
      sslc_certificate: ['studentName', 'registerNumber', 'dateOfBirth', 'schoolName', 'yearOfPassing', 'marksGrade'],
      
      pension_certificate: ['pensionerName', 'pensionType', 'pensionId', 'aadhaarNumber', 'bankAccountDetails', 'amount'],
      
      // Legacy document types
      passport: ['passportNumber', 'fullName', 'dateOfBirth', 'address', 'issueDate', 'validity', 'issuingAuthority'],
      bank_passbook: ['accountNumber', 'fullName', 'bankName', 'ifscCode', 'address'],
      salary_slip: ['fullName', 'employeeId', 'employerName', 'monthYear', 'grossSalary'],
      property_document: ['fullName', 'propertyNumber', 'surveyNumber', 'area', 'address'],
      educational_certificate: ['fullName', 'certificateNumber', 'institutionName', 'issueDate', 'grade'],
      medical_certificate: ['fullName', 'certificateNumber', 'doctorName', 'hospitalName', 'issueDate'],
      other: ['fullName', 'dateOfBirth', 'address']
    };
    
    return fieldMappings[documentType] || ['fullName', 'dateOfBirth', 'address'];
  };

  // Get field label
  const getFieldLabel = (fieldName) => {
    const labels = {
      // Common fields
      fullName: 'Full Name',
      dateOfBirth: 'Date of Birth',
      gender: 'Gender',
      address: 'Address',
      
      // Aadhaar Card
      aadhaarNumber: 'Aadhaar Number',
      
      // PAN Card
      panNumber: 'PAN Number',
      fatherName: "Father's Name",
      
      // Voter ID
      voterIdNumber: 'EPIC Number',
      motherName: "Mother's Name",
      spouseName: "Spouse's Name",
      
      // Ration Card
      rationCardNumber: 'Ration Card Number',
      cardType: 'Card Type (APL/BPL/AAY/PHH)',
      headOfFamily: 'Head of Family',
      familyMembers: 'Family Member Names',
      fpsNumber: 'FPS (Ration Shop) Number',
      
      // Birth Certificate
      childName: "Child's Name",
      placeOfBirth: 'Place of Birth',
      registrationNumber: 'Registration Number',
      
      // Death Certificate
      deceasedName: "Deceased Person's Name",
      dateOfDeath: 'Date of Death',
      placeOfDeath: 'Place of Death',
      age: 'Age',
      causeOfDeath: 'Cause of Death',
      
      // Income Certificate
      annualIncome: 'Annual Income (₹)',
      incomeSource: 'Income Source',
      certificateNumber: 'Certificate Number',
      issueDate: 'Issue Date',
      validity: 'Validity',
      
      // Caste Certificate
      caste: 'Caste / Community',
      religion: 'Religion',
      issuingAuthority: 'Issuing Authority',
      
      // Community Certificate
      community: 'Community',
      
      // Domicile Certificate
      permanentAddress: 'Permanent Address',
      yearsOfResidence: 'Years of Residence',
      
      // Residence Certificate
      localBody: 'Local Body',
      periodOfResidence: 'Period of Residence',
      
      // Marriage Certificate
      husbandName: "Husband's Name",
      wifeName: "Wife's Name",
      dateOfMarriage: 'Date of Marriage',
      placeOfMarriage: 'Place of Marriage',
      
      // Driving License
      licenseNumber: 'License Number',
      vehicleClass: 'Vehicle Class',
      
      // SSLC Certificate
      studentName: 'Student Name',
      registerNumber: 'Register Number',
      schoolName: 'School Name',
      yearOfPassing: 'Year of Passing',
      marksGrade: 'Marks / Grade',
      
      // Pension Certificate
      pensionerName: 'Pensioner Name',
      pensionType: 'Pension Type',
      pensionId: 'Pension ID',
      bankAccountDetails: 'Bank Account Details',
      amount: 'Amount',
      
      // Legacy document types
      passportNumber: 'Passport Number',
      accountNumber: 'Account Number',
      bankName: 'Bank Name',
      ifscCode: 'IFSC Code',
      employeeId: 'Employee ID',
      employerName: 'Employer Name',
      monthYear: 'Month/Year',
      grossSalary: 'Gross Salary',
      propertyNumber: 'Property Number',
      surveyNumber: 'Survey Number',
      area: 'Area',
      institutionName: 'Institution Name',
      grade: 'Grade/Percentage',
      doctorName: "Doctor's Name",
      hospitalName: 'Hospital Name'
    };
    
    return labels[fieldName] || fieldName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  };

  // Get input type for field
  const getInputType = (fieldName) => {
    if (['dateOfBirth', 'dateOfDeath', 'dateOfMarriage', 'issueDate', 'validity'].includes(fieldName)) return 'date';
    if (['annualIncome', 'amount', 'age', 'yearsOfResidence', 'yearOfPassing'].includes(fieldName)) return 'number';
    if (fieldName === 'familyMembers') return 'textarea';
    return 'text';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading Document Locker...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Shield className="w-8 h-8 mr-3 text-blue-600" />
                Document Locker
              </h1>
              <p className="text-gray-600 mt-2">
                Secure storage for your important documents with AI-powered data extraction
              </p>
            </div>
            {isUnlocked && (
              <div className="flex space-x-3">
                <button
                  onClick={runCrossValidation}
                  disabled={processing || documents.length < 2}
                  className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Cross-Validate Documents
                </button>
                <button
                  onClick={() => setShowMyDetails(true)}
                  className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  My Details
                </button>
                <button
                  onClick={() => setShowUpload(true)}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Upload Document
                </button>
                <button
                  onClick={lockAndExit}
                  className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  title="Lock and exit the document locker"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Lock & Exit
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Error/Success/Warning Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {warning && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
              <div>
                <p className="text-yellow-800 font-semibold">Warning: Fake Document Detected</p>
                <p className="text-yellow-700 text-sm mt-1">{warning}</p>
                <p className="text-yellow-600 text-xs mt-2">
                  This document has been uploaded but may not be accepted for official purposes. 
                  Please verify the authenticity of this document.
                </p>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              <p className="text-green-800">{success}</p>
            </div>
          </div>
        )}

        {/* Main Content */}
        {!lockerExists ? (
          /* Create Locker */
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <Lock className="w-16 h-16 text-blue-600 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Create Your Document Locker</h2>
              <p className="text-gray-600 mb-6">
                Set up a secure locker to store your important documents with an additional PIN for enhanced security.
              </p>
              <button
                onClick={() => setShowCreateLocker(true)}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Locker
              </button>
            </div>
          </div>
        ) : !isUnlocked ? (
          /* Unlock Locker */
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-lg shadow-md p-8">
              <div className="text-center mb-6">
                <Unlock className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900">Unlock Your Locker</h2>
                <p className="text-gray-600 mt-2">Enter your PIN to access your documents</p>
              </div>
              
              <form onSubmit={unlockLocker}>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Locker PIN
                  </label>
                  <input
                    type="password"
                    value={unlockForm.pin}
                    onChange={(e) => setUnlockForm({ ...unlockForm, pin: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your PIN"
                    maxLength="6"
                    required
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={processing}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {processing ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Unlock className="w-4 h-4 mr-2" />
                  )}
                  Unlock Locker
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* Document Management */
          <div>
            {/* Search and Filter */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search documents..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="sm:w-48">
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Documents</option>
                    {documentTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Documents Grid */}
            {filteredDocuments.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Documents Found</h3>
                <p className="text-gray-600 mb-6">
                  {documents.length === 0 
                    ? "Start by uploading your first document to the locker."
                    : "No documents match your search criteria."
                  }
                </p>
                {documents.length === 0 && (
                  <button
                    onClick={() => setShowUpload(true)}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Upload First Document
                  </button>
                )}
                {isDevelopment && (
                  <div className="mt-4 p-4 bg-gray-100 rounded-lg text-left">
                    <p className="text-sm text-gray-600 mb-2">Debug Info:</p>
                    <p className="text-xs text-gray-500">Current PIN: {currentPin ? '✓ Available' : '✗ Missing'}</p>
                    <p className="text-xs text-gray-500">Documents: {documents.length}</p>
                    <p className="text-xs text-gray-500">Filtered: {filteredDocuments.length}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDocuments.map((document) => {
                  const typeInfo = getDocumentTypeInfo(document.documentType);
                  const validationScore = document.validationResults?.overallScore || 0;
                  
                  return (
                    <div key={document._id} className="bg-white rounded-lg shadow-md overflow-hidden">
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center">
                            <span className="text-2xl mr-3">{typeInfo.icon}</span>
                            <div>
                              <h3 className="font-semibold text-gray-900 truncate">{document.name}</h3>
                              <p className="text-sm text-gray-600">{typeInfo.label}</p>
                            </div>
                          </div>
                          <div className={`flex items-center ${getValidationColor(validationScore)}`}>
                            {getValidationIcon(validationScore)}
                            <span className="text-sm ml-1">{validationScore}%</span>
                          </div>
                        </div>
                        
                        {document.extractedData?.fullName && (
                          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm text-gray-600">Extracted Name:</p>
                                <p className="font-medium text-gray-900">{document.extractedData.fullName}</p>
                              </div>
                              {document.extractedData.isVerified && (
                                <div className="flex items-center text-green-600">
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  <span className="text-xs">Verified</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                          <span>Uploaded {new Date(document.createdAt).toLocaleDateString()}</span>
                          <span>{(document.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                        </div>
                        
                        <div className="flex space-x-2">
                          <button
                            onClick={() => viewDocument(document._id)}
                            className="flex-1 bg-blue-50 text-blue-600 py-2 px-3 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </button>
                          <button
                            onClick={() => verifyOCRData(document._id)}
                            className="flex-1 bg-purple-50 text-purple-600 py-2 px-3 rounded-lg hover:bg-purple-100 transition-colors flex items-center justify-center"
                          >
                            {document.extractedData?.isVerified ? (
                              <>
                                <Edit3 className="w-4 h-4 mr-1" />
                                Edit
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Verify
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => openReplaceDocument(document)}
                            className="flex-1 bg-orange-50 text-orange-600 py-2 px-3 rounded-lg hover:bg-orange-100 transition-colors flex items-center justify-center"
                            title="Replace document file"
                          >
                            <Upload className="w-4 h-4 mr-1" />
                            Replace
                          </button>
                          <button
                            onClick={() => downloadDocument(document._id, document.originalName)}
                            className="bg-green-50 text-green-600 py-2 px-3 rounded-lg hover:bg-green-100 transition-colors flex items-center justify-center"
                            title="Download document"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteDocument(document._id)}
                            className="bg-red-50 text-red-600 py-2 px-3 rounded-lg hover:bg-red-100 transition-colors"
                            title="Delete document"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Create Locker Modal */}
        {showCreateLocker && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Create Document Locker</h2>
                <button
                  onClick={() => setShowCreateLocker(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={createLocker}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Create PIN (4-6 digits)
                  </label>
                  <input
                    type="password"
                    value={createForm.pin}
                    onChange={(e) => setCreateForm({ ...createForm, pin: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter PIN"
                    maxLength="6"
                    required
                  />
                </div>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm PIN
                  </label>
                  <input
                    type="password"
                    value={createForm.confirmPin}
                    onChange={(e) => setCreateForm({ ...createForm, confirmPin: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Confirm PIN"
                    maxLength="6"
                    required
                  />
                </div>
                
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateLocker(false)}
                    className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={processing}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {processing ? 'Creating...' : 'Create Locker'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Upload Document Modal */}
        {showUpload && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Upload Document</h2>
                <button
                  onClick={() => setShowUpload(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={uploadDocument}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Document File *
                  </label>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/bmp,image/tiff,.pdf"
                    onChange={handleFileSelect}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Supported formats: JPEG, PNG, PDF (Max 10MB)
                  </p>
                  
                  {/* Document Validation Status */}
                  {documentValidation.isValidating && (
                    <div className="mt-2 flex items-center text-blue-600">
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      <span className="text-sm">{documentValidation.message}</span>
                    </div>
                  )}
                  
                  {documentValidation.isValid === true && !documentValidation.isValidating && (
                    <div className="mt-2 flex items-center text-green-600">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      <span className="text-sm">{documentValidation.message}</span>
                    </div>
                  )}
                  
                  {documentValidation.isValid === false && !documentValidation.isValidating && (
                    <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start">
                        <AlertTriangle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-red-800">Fake Document Detected</p>
                          <p className="text-xs text-red-700 mt-1">{documentValidation.message}</p>
                          <p className="text-xs text-red-600 mt-2">
                            This document cannot be uploaded. Please provide an authentic government document.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Document Type *
                  </label>
                  <select
                    value={uploadForm.documentType}
                    onChange={(e) => setUploadForm({ ...uploadForm, documentType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select document type</option>
                    {documentTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Document Name
                  </label>
                  <input
                    type="text"
                    value={uploadForm.name}
                    onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Optional custom name"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags
                  </label>
                  <input
                    type="text"
                    value={uploadForm.tags}
                    onChange={(e) => setUploadForm({ ...uploadForm, tags: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Comma-separated tags (optional)"
                  />
                </div>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Locker PIN *
                  </label>
                  <input
                    type="password"
                    value={uploadForm.pin}
                    onChange={(e) => setUploadForm({ ...uploadForm, pin: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your PIN"
                    maxLength="6"
                    required
                  />
                </div>
                
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUpload(false);
                      setDocumentValidation({ isValidating: false, isValid: null, message: '' });
                    }}
                    className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={processing || documentValidation.isValidating || documentValidation.isValid === false}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    title={documentValidation.isValid === false ? 'Cannot upload fake documents' : ''}
                  >
                    {processing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Processing...
                      </>
                    ) : documentValidation.isValidating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Validating...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload & Process
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Replace Document Modal */}
        {showReplaceDocument && replaceDocumentData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-lg w-full mx-4">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Replace Document</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Upload a new version of: {replaceDocumentData.name}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowReplaceDocument(false);
                    setReplaceDocumentData(null);
                    setReplaceForm({ file: null, performOCR: true });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={replaceDocument}>
                <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-start">
                    <AlertTriangle className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Important:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>The old document file will be replaced</li>
                        <li>Document type and name will remain the same</li>
                        <li>OCR will be re-run on the new file</li>
                        <li>You'll need to verify the extracted data again</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Document File *
                  </label>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/bmp,image/tiff,.pdf"
                    onChange={(e) => setReplaceForm({ ...replaceForm, file: e.target.files[0] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Supported formats: JPEG, PNG, PDF (Max 10MB)
                  </p>
                  {replaceForm.file && (
                    <p className="text-sm text-green-600 mt-2">
                      ✓ Selected: {replaceForm.file.name} ({(replaceForm.file.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    OCR Processing
                  </label>
                  <div className="space-y-2">
                    <label className={`flex items-start p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                      replaceForm.performOCR 
                        ? 'border-orange-600 bg-orange-50' 
                        : 'border-gray-300 bg-white hover:border-gray-400'
                    }`}>
                      <input
                        type="radio"
                        name="performOCR"
                        checked={replaceForm.performOCR}
                        onChange={() => setReplaceForm({ ...replaceForm, performOCR: true })}
                        className="mt-1 mr-3"
                      />
                      <div>
                        <p className="font-medium text-gray-900">Process with OCR</p>
                        <p className="text-sm text-gray-600">Extract text and data from the document</p>
                      </div>
                    </label>
                    
                    <label className={`flex items-start p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                      !replaceForm.performOCR 
                        ? 'border-gray-600 bg-gray-50' 
                        : 'border-gray-300 bg-white hover:border-gray-400'
                    }`}>
                      <input
                        type="radio"
                        name="performOCR"
                        checked={!replaceForm.performOCR}
                        onChange={() => setReplaceForm({ ...replaceForm, performOCR: false })}
                        className="mt-1 mr-3"
                      />
                      <div>
                        <p className="font-medium text-gray-900">Skip OCR</p>
                        <p className="text-sm text-gray-600">Just replace the file, keep existing data</p>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowReplaceDocument(false);
                      setReplaceDocumentData(null);
                      setReplaceForm({ file: null, performOCR: true });
                    }}
                    className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={processing || !replaceForm.file}
                    className="flex-1 bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                  >
                    {processing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {replaceForm.performOCR ? 'Replacing & Processing...' : 'Replacing...'}
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Replace Document
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Document Details Modal */}
        {showDocumentDetails && selectedDocument && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-8 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Document Details</h2>
                <button
                  onClick={() => setShowDocumentDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              {/* Document Image Preview */}
              {selectedDocument.fileUrl && (
                <div className="mb-6 bg-gray-100 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3">Document Preview</h3>
                  <div className="bg-white rounded-lg overflow-hidden shadow-inner">
                    <img 
                      src={selectedDocument.fileUrl} 
                      alt={selectedDocument.name}
                      className="w-full h-auto max-h-[500px] object-contain"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div className="hidden items-center justify-center p-8 text-gray-500">
                      <div className="text-center">
                        <FileText className="w-16 h-16 mx-auto mb-2 text-gray-400" />
                        <p>Preview not available</p>
                        <p className="text-sm">Use the download button to view the document</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Document Info */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Document Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Name:</label>
                      <p className="text-gray-900">{selectedDocument.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Type:</label>
                      <p className="text-gray-900">{getDocumentTypeInfo(selectedDocument.documentType).label}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Size:</label>
                      <p className="text-gray-900">{(selectedDocument.fileSize / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Uploaded:</label>
                      <p className="text-gray-900">{new Date(selectedDocument.createdAt).toLocaleString()}</p>
                    </div>
                    {selectedDocument.tags && selectedDocument.tags.length > 0 && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Tags:</label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {selectedDocument.tags.map((tag, index) => (
                            <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Extracted Data */}
                {selectedDocument.extractedData && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Extracted Information</h3>
                      {selectedDocument.extractedData.isVerified && (
                        <div className="flex items-center text-green-600">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          <span className="text-sm font-medium">Verified</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-3">
                      {/* Display only relevant fields for this document type */}
                      {getRelevantFields(selectedDocument.documentType).map(fieldName => {
                        if (fieldName === 'address') {
                          const address = selectedDocument.extractedData.address;
                          if (!address || (!address.line1 && !address.city && !address.state)) return null;
                          
                          return (
                            <div key="address">
                              <label className="text-sm font-medium text-gray-600">Address:</label>
                              <div className="text-gray-900">
                                {address.line1 && <p>{address.line1}</p>}
                                {address.line2 && <p>{address.line2}</p>}
                                {address.city && <p>{address.city}</p>}
                                {address.state && <p>{address.state}</p>}
                                {address.pincode && <p>PIN: {address.pincode}</p>}
                                {address.country && <p>{address.country}</p>}
                              </div>
                            </div>
                          );
                        }
                        
                        const value = selectedDocument.extractedData[fieldName];
                        if (!value) return null;
                        
                        let displayValue = value;
                        if (fieldName.includes('Date')) {
                          displayValue = new Date(value).toLocaleDateString();
                        }
                        
                        return (
                          <div key={fieldName}>
                            <label className="text-sm font-medium text-gray-600">{getFieldLabel(fieldName)}:</label>
                            <p className="text-gray-900">{displayValue}</p>
                          </div>
                        );
                      })}
                      
                      {/* OCR Confidence */}
                      {selectedDocument.extractedData.confidence && (
                        <div className="pt-3 border-t">
                          <label className="text-sm font-medium text-gray-600">OCR Confidence:</label>
                          <p className="text-gray-900">{selectedDocument.extractedData.confidence.toFixed(1)}%</p>
                        </div>
                      )}
                      
                      {/* Verification timestamp */}
                      {selectedDocument.extractedData.isVerified && selectedDocument.extractedData.verifiedAt && (
                        <div className="pt-3 border-t">
                          <label className="text-sm font-medium text-gray-600">Verified On:</label>
                          <p className="text-gray-900 text-sm">{new Date(selectedDocument.extractedData.verifiedAt).toLocaleString()}</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Edit button */}
                    <button
                      onClick={() => {
                        setOCRVerificationData(selectedDocument);
                        setShowOCRVerification(true);
                        setShowDocumentDetails(false);
                      }}
                      className="mt-4 w-full bg-blue-50 text-blue-600 py-2 px-4 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center"
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      {selectedDocument.extractedData.isVerified ? 'Edit Verified Data' : 'Verify & Edit Data'}
                    </button>
                  </div>
                )}
              </div>

              {/* Validation Results */}
              {selectedDocument.validationResults && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-4">Validation Results</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-medium">Overall Score:</span>
                      <div className={`flex items-center ${getValidationColor(selectedDocument.validationResults.overallScore)}`}>
                        {getValidationIcon(selectedDocument.validationResults.overallScore)}
                        <span className="ml-2 font-semibold">{selectedDocument.validationResults.overallScore}%</span>
                      </div>
                    </div>
                    
                    {selectedDocument.validationResults.documentValidity && (
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Document Validity:</span>
                          <span className={selectedDocument.validationResults.documentValidity.isValid ? 'text-green-600' : 'text-red-600'}>
                            {selectedDocument.validationResults.documentValidity.isValid ? 'Valid' : 'Invalid'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Expiry Status:</span>
                          <span className={
                            selectedDocument.validationResults.documentValidity.expiryStatus === 'valid' ? 'text-green-600' :
                            selectedDocument.validationResults.documentValidity.expiryStatus === 'expiring_soon' ? 'text-yellow-600' :
                            'text-red-600'
                          }>
                            {selectedDocument.validationResults.documentValidity.expiryStatus.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* My Details Modal */}
        {showMyDetails && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">My Verified Details</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Changes made to common fields (name, date of birth, address) will automatically sync across all documents
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowMyDetails(false);
                    setDetailsSearchTerm('');
                    setEditingField(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Search Bar */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by field name, value, or document type..."
                    value={detailsSearchTerm}
                    onChange={(e) => setDetailsSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Details List */}
              <div className="space-y-4">
                {documents
                  .map(document => {
                    const typeInfo = getDocumentTypeInfo(document.documentType);
                    const relevantFields = getRelevantFields(document.documentType);
                    
                    // Get all available data from the document
                    const extractedData = document.extractedData || {};
                    
                    // Filter fields based on search
                    const fieldsToShow = relevantFields.filter(fieldName => {
                      if (!detailsSearchTerm) return true;
                      
                      const searchLower = detailsSearchTerm.toLowerCase();
                      const fieldLabel = getFieldLabel(fieldName).toLowerCase();
                      const fieldValue = extractedData[fieldName];
                      
                      // Check if field name matches
                      if (fieldLabel.includes(searchLower)) return true;
                      
                      // Check if document type matches
                      if (typeInfo.label.toLowerCase().includes(searchLower)) return true;
                      
                      // Check if value matches
                      if (fieldValue && String(fieldValue).toLowerCase().includes(searchLower)) return true;
                      
                      // Check address fields
                      if (fieldName === 'address' && extractedData.address) {
                        const addressStr = Object.values(extractedData.address).filter(v => v).join(' ').toLowerCase();
                        if (addressStr.includes(searchLower)) return true;
                      }
                      
                      return false;
                    });

                    // If search term exists and no fields match, don't show this document
                    if (detailsSearchTerm && fieldsToShow.length === 0) return null;

                    return (
                      <div key={document._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                        {/* Document Header */}
                        <div className="flex items-center justify-between mb-4 pb-4 border-b">
                          <div className="flex items-center">
                            <span className="text-2xl mr-3">{typeInfo.icon}</span>
                            <div>
                              <h3 className="font-semibold text-gray-900">{document.name}</h3>
                              <p className="text-sm text-gray-600">{typeInfo.label}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {extractedData.isVerified && (
                              <div className="flex items-center text-green-600">
                                <CheckCircle className="w-5 h-5 mr-1" />
                                <span className="text-sm font-medium">Verified</span>
                              </div>
                            )}
                            <button
                              onClick={() => {
                                setOCRVerificationData(document);
                                setShowOCRVerification(true);
                                setShowMyDetails(false);
                              }}
                              className="text-purple-600 hover:text-purple-700 text-sm flex items-center px-3 py-1 border border-purple-200 rounded-lg hover:bg-purple-50"
                            >
                              <Edit3 className="w-3 h-3 mr-1" />
                              {extractedData.isVerified ? 'Edit Data' : 'Add Data'}
                            </button>
                          </div>
                        </div>

                        {/* Data Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {fieldsToShow.map(fieldName => {
                            if (fieldName === 'address') {
                              const address = extractedData.address || {};
                              const hasAddressData = address.line1 || address.city || address.state || address.pincode;

                              return (
                                <div key={`${document._id}-address`} className="md:col-span-2 bg-gray-50 rounded-lg p-4">
                                  <label className="text-sm font-medium text-gray-700 mb-2 block">Address:</label>
                                  {hasAddressData ? (
                                    <div className="space-y-1 text-sm text-gray-900">
                                      {address.line1 && <p>{address.line1}</p>}
                                      {address.line2 && <p>{address.line2}</p>}
                                      {(address.city || address.state || address.pincode) && (
                                        <p>
                                          {[address.city, address.state, address.pincode].filter(Boolean).join(', ')}
                                        </p>
                                      )}
                                      {address.country && <p>{address.country}</p>}
                                    </div>
                                  ) : (
                                    <div>
                                      <p className="text-sm text-gray-500 italic mb-2">No address data available</p>
                                      <button
                                        onClick={() => {
                                          // Open verification modal for manual entry
                                          setOCRVerificationData(document);
                                          setShowOCRVerification(true);
                                          setShowMyDetails(false);
                                        }}
                                        className="text-blue-600 hover:text-blue-700 text-sm flex items-center"
                                      >
                                        <Plus className="w-3 h-3 mr-1" />
                                        Add Address
                                      </button>
                                    </div>
                                  )}
                                  <button
                                    onClick={() => {
                                      setOCRVerificationData(document);
                                      setShowOCRVerification(true);
                                      setShowMyDetails(false);
                                    }}
                                    className="mt-2 text-purple-600 hover:text-purple-700 text-sm flex items-center"
                                  >
                                    <Edit3 className="w-3 h-3 mr-1" />
                                    {hasAddressData ? 'Edit' : 'Add Manually'}
                                  </button>
                                </div>
                              );
                            }

                            const value = extractedData[fieldName];
                            let displayValue = value;
                            
                            if (fieldName.includes('Date') && value) {
                              displayValue = new Date(value).toLocaleDateString();
                            }

                            const fieldKey = `${document._id}-${fieldName}`;
                            const isEditing = editingField === fieldKey;
                            const hasValue = value !== undefined && value !== null && value !== '';

                            return (
                              <div key={fieldKey} className="bg-gray-50 rounded-lg p-4">
                                <label className="text-sm font-medium text-gray-700 mb-1 block">
                                  {getFieldLabel(fieldName)}:
                                </label>
                                {isEditing ? (
                                  <div className="flex items-center space-x-2">
                                    {getInputType(fieldName) === 'textarea' ? (
                                      <textarea
                                        value={editingValue}
                                        onChange={(e) => setEditingValue(e.target.value)}
                                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                                        rows="3"
                                        autoFocus
                                      />
                                    ) : (
                                      <input
                                        type={getInputType(fieldName)}
                                        value={editingValue}
                                        onChange={(e) => setEditingValue(e.target.value)}
                                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                                        autoFocus
                                      />
                                    )}
                                    <button
                                      onClick={async () => {
                                        // Save the edited value
                                        const updatedData = {
                                          ...extractedData,
                                          [fieldName]: fieldName.includes('Date') ? new Date(editingValue) : editingValue,
                                          isVerified: true,
                                          verifiedAt: new Date(),
                                          verifiedBy: user.userId
                                        };
                                        
                                        // Update the current document
                                        await updateOCRData(document._id, updatedData);
                                        
                                        // Sync the field across all documents automatically
                                        const fieldValue = fieldName.includes('Date') ? new Date(editingValue) : editingValue;
                                        await syncFieldAcrossDocuments(fieldName, fieldValue, document._id);
                                        
                                        setEditingField(null);
                                        setEditingValue('');
                                      }}
                                      className="text-green-600 hover:text-green-700"
                                    >
                                      <CheckCircle className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        setEditingField(null);
                                        setEditingValue('');
                                      }}
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-between">
                                    {hasValue ? (
                                      <p className="text-gray-900 text-sm">{displayValue}</p>
                                    ) : (
                                      <div className="flex-1">
                                        <p className="text-gray-500 text-sm italic mb-2">No data available</p>
                                        <button
                                          onClick={async () => {
                                            // Start manual editing - no auto-fill button needed
                                            setEditingField(fieldKey);
                                            setEditingValue('');
                                          }}
                                          className="text-blue-600 hover:text-blue-700 text-xs flex items-center"
                                        >
                                          <Plus className="w-3 h-3 mr-1" />
                                          Add Data
                                        </button>
                                      </div>
                                    )}
                                    <button
                                      onClick={() => {
                                        setEditingField(fieldKey);
                                        if (fieldName.includes('Date') && value) {
                                          setEditingValue(new Date(value).toISOString().split('T')[0]);
                                        } else {
                                          setEditingValue(value || '');
                                        }
                                      }}
                                      className="text-purple-600 hover:text-purple-700 text-sm flex items-center"
                                    >
                                      <Edit3 className="w-3 h-3 mr-1" />
                                      {hasValue ? 'Edit' : 'Add'}
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Verification Info */}
                        {extractedData.verifiedAt && (
                          <div className="mt-4 pt-4 border-t text-xs text-gray-500">
                            Verified on {new Date(extractedData.verifiedAt).toLocaleString()}
                          </div>
                        )}
                      </div>
                    );
                  })}

                {/* No Documents Message */}
                {documents.length === 0 && (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">No documents uploaded yet</p>
                    <p className="text-sm text-gray-500 mt-2">Upload documents to see your details here</p>
                  </div>
                )}

                {/* No Search Results */}
                {detailsSearchTerm && documents.filter(doc => {
                  const typeInfo = getDocumentTypeInfo(doc.documentType);
                  const searchLower = detailsSearchTerm.toLowerCase();
                  const extractedData = doc.extractedData || {};
                  
                  // Check document type
                  if (typeInfo.label.toLowerCase().includes(searchLower)) return true;
                  
                  // Check field values
                  return Object.values(extractedData).some(val => 
                    val && String(val).toLowerCase().includes(searchLower)
                  );
                }).length === 0 && documents.length > 0 && (
                  <div className="text-center py-12">
                    <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">No results found for "{detailsSearchTerm}"</p>
                    <p className="text-sm text-gray-500 mt-2">Try a different search term</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* OCR Verification Modal */}
        {showOCRVerification && ocrVerificationData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">OCR Data Verification & Editing</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Common fields will be automatically synchronized across all your documents
                  </p>
                </div>
                <button
                  onClick={() => setShowOCRVerification(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Raw OCR Text - Read Only */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-blue-600">Raw OCR Extracted Text</h3>
                  <div className="bg-blue-50 rounded-lg p-4 space-y-4 max-h-96 overflow-y-auto">
                    {/* Document Type */}
                    <div>
                      <label className="text-sm font-medium text-gray-600">Document Type:</label>
                      <p className="text-gray-900 capitalize">{ocrVerificationData.documentType.replace('_', ' ')}</p>
                    </div>
                    
                    {/* OCR Confidence */}
                    {ocrVerificationData.extractedData?.confidence && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">OCR Confidence:</label>
                        <div className="flex items-center gap-2">
                          <p className="text-gray-900">{ocrVerificationData.extractedData.confidence.toFixed(1)}%</p>
                          {ocrVerificationData.extractedData.confidence >= 75 ? (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">High</span>
                          ) : ocrVerificationData.extractedData.confidence >= 60 ? (
                            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">Medium</span>
                          ) : (
                            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">Low</span>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Raw Text Display */}
                    <div>
                      <label className="text-sm font-medium text-gray-600 mb-2 block">
                        Extracted Text from Document:
                      </label>
                      <div className="bg-white border border-gray-300 rounded p-3 font-mono text-sm text-gray-800 whitespace-pre-wrap max-h-64 overflow-y-auto">
                        {ocrVerificationData.extractedData?.rawText || 'No text extracted'}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        This is the raw text extracted from your document. Use the form on the right to correct any errors.
                      </p>
                    </div>
                    
                    {/* Verification Status */}
                    {ocrVerificationData.extractedData?.isVerified && (
                      <div className="pt-3 border-t">
                        <div className="flex items-center text-green-600">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          <span className="text-sm font-medium">Verified</span>
                        </div>
                        {ocrVerificationData.extractedData.verifiedAt && (
                          <p className="text-xs text-gray-500 mt-1">
                            Verified on {new Date(ocrVerificationData.extractedData.verifiedAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Editable Verification Form */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-green-600">Edit & Verify Data</h3>
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    
                    // Build updated data object with only relevant fields
                    const updatedData = {
                      ...ocrVerificationData.extractedData,
                      isVerified: true,
                      verifiedAt: new Date(),
                      verifiedBy: user.userId
                    };
                    
                    // Get relevant fields for this document type
                    const relevantFields = getRelevantFields(ocrVerificationData.documentType);
                    
                    // Update each relevant field
                    relevantFields.forEach(fieldName => {
                      if (fieldName === 'address') {
                        // Handle address separately
                        const addressFields = ['addressLine1', 'addressLine2', 'city', 'state', 'pincode', 'country'];
                        const address = {};
                        let hasAddressData = false;
                        
                        addressFields.forEach(addrField => {
                          const value = formData.get(addrField);
                          if (value) {
                            hasAddressData = true;
                            const key = addrField.replace('address', '').replace('Line', 'line');
                            address[key.charAt(0).toLowerCase() + key.slice(1)] = value;
                          }
                        });
                        
                        if (hasAddressData) {
                          updatedData.address = {
                            line1: address.line1 || '',
                            line2: address.line2 || '',
                            city: address.city || '',
                            state: address.state || '',
                            pincode: address.pincode || '',
                            country: address.country || 'India'
                          };
                        }
                      } else {
                        const value = formData.get(fieldName);
                        if (value !== null && value !== '') {
                          // Handle date fields
                          if (fieldName.includes('Date')) {
                            updatedData[fieldName] = new Date(value);
                          } else {
                            updatedData[fieldName] = value;
                          }
                        }
                      }
                    });
                    
                    // Update OCR data with automatic synchronization
                    await updateOCRData(ocrVerificationData._id, updatedData);
                  }}>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {/* Render editable fields based on document type */}
                      {getRelevantFields(ocrVerificationData.documentType).map(fieldName => {
                        if (fieldName === 'address') {
                          const address = ocrVerificationData.extractedData?.address || {};
                          return (
                            <div key="address" className="border-t pt-4">
                              <h4 className="font-medium text-gray-900 mb-3">Address Information</h4>
                              <div className="grid grid-cols-1 gap-3">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1:</label>
                                  <input
                                    type="text"
                                    name="addressLine1"
                                    defaultValue={address.line1 || ''}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Enter address line 1"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2:</label>
                                  <input
                                    type="text"
                                    name="addressLine2"
                                    defaultValue={address.line2 || ''}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Enter address line 2"
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">City:</label>
                                    <input
                                      type="text"
                                      name="city"
                                      defaultValue={address.city || ''}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                      placeholder="Enter city"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">State:</label>
                                    <input
                                      type="text"
                                      name="state"
                                      defaultValue={address.state || ''}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                      placeholder="Enter state"
                                    />
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">PIN Code:</label>
                                    <input
                                      type="text"
                                      name="pincode"
                                      defaultValue={address.pincode || ''}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                      placeholder="Enter PIN code"
                                      maxLength="6"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Country:</label>
                                    <input
                                      type="text"
                                      name="country"
                                      defaultValue={address.country || 'India'}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                      placeholder="Enter country"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        
                        const value = ocrVerificationData.extractedData?.[fieldName];
                        const inputType = getInputType(fieldName);
                        let inputValue = value || '';
                        
                        if (inputType === 'date' && value) {
                          inputValue = new Date(value).toISOString().split('T')[0];
                        }
                        
                        return (
                          <div key={fieldName}>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {getFieldLabel(fieldName)}:
                            </label>
                            <input
                              type={inputType}
                              name={fieldName}
                              defaultValue={inputValue}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder={`Enter ${getFieldLabel(fieldName).toLowerCase()}`}
                              maxLength={fieldName === 'aadhaarNumber' ? '12' : fieldName === 'panNumber' ? '10' : undefined}
                              style={fieldName === 'panNumber' ? { textTransform: 'uppercase' } : undefined}
                            />
                          </div>
                        );
                      })}
                    </div>
                    
                    <div className="flex space-x-3 mt-6 pt-4 border-t">
                      <button
                        type="button"
                        onClick={() => setShowOCRVerification(false)}
                        className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={processing}
                        className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                      >
                        {processing ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Save & Sync Data
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Raw OCR Text Section */}
              <div className="mt-8 border-t pt-6">
                <h3 className="text-lg font-semibold mb-4 text-purple-600">Raw OCR Text</h3>
                <div className="bg-purple-50 rounded-lg p-4">
                  <textarea
                    readOnly
                    className="w-full h-32 p-3 border border-purple-200 rounded-lg bg-white text-sm font-mono resize-none"
                    placeholder="Raw OCR text will appear here..."
                    value={ocrVerificationData.extractedData?.rawText || 'No raw text available'}
                  />
                  <p className="text-xs text-purple-600 mt-2">
                    This is the raw text extracted by OCR. Use this to manually verify and correct the structured data above.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cross-Validation Results Modal */}
        {showCrossValidation && crossValidationResults && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Cross-Document Validation Results</h2>
                <button
                  onClick={() => setShowCrossValidation(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Overall Summary */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Validation Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg p-4 text-center">
                      <div className={`text-2xl font-bold ${getValidationColor(crossValidationResults.overallScore)}`}>
                        {crossValidationResults.overallScore}%
                      </div>
                      <div className="text-sm text-gray-600">Overall Score</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {crossValidationResults.consistentFields || 0}
                      </div>
                      <div className="text-sm text-gray-600">Consistent Fields</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {crossValidationResults.inconsistentFields || 0}
                      </div>
                      <div className="text-sm text-gray-600">Issues Found</div>
                    </div>
                  </div>
                </div>

                {/* Detailed Results */}
                {crossValidationResults.validationDetails && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Detailed Analysis</h3>
                    
                    {/* Name Consistency */}
                    {crossValidationResults.validationDetails.nameConsistency && (
                      <div className="bg-white border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">Name Consistency</h4>
                          <div className={`flex items-center ${getValidationColor(crossValidationResults.validationDetails.nameConsistency.score)}`}>
                            {getValidationIcon(crossValidationResults.validationDetails.nameConsistency.score)}
                            <span className="ml-2">{crossValidationResults.validationDetails.nameConsistency.score}%</span>
                          </div>
                        </div>
                        {crossValidationResults.validationDetails.nameConsistency.issues.length > 0 && (
                          <div className="space-y-1">
                            {crossValidationResults.validationDetails.nameConsistency.issues.map((issue, index) => (
                              <div key={index} className="text-sm text-red-600 flex items-center">
                                <AlertTriangle className="w-4 h-4 mr-2" />
                                {issue}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* DOB Consistency */}
                    {crossValidationResults.validationDetails.dobConsistency && (
                      <div className="bg-white border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">Date of Birth Consistency</h4>
                          <div className={`flex items-center ${getValidationColor(crossValidationResults.validationDetails.dobConsistency.score)}`}>
                            {getValidationIcon(crossValidationResults.validationDetails.dobConsistency.score)}
                            <span className="ml-2">{crossValidationResults.validationDetails.dobConsistency.score}%</span>
                          </div>
                        </div>
                        {crossValidationResults.validationDetails.dobConsistency.issues.length > 0 && (
                          <div className="space-y-1">
                            {crossValidationResults.validationDetails.dobConsistency.issues.map((issue, index) => (
                              <div key={index} className="text-sm text-red-600 flex items-center">
                                <AlertTriangle className="w-4 h-4 mr-2" />
                                {issue}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Address Consistency */}
                    {crossValidationResults.validationDetails.addressConsistency && (
                      <div className="bg-white border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">Address Consistency</h4>
                          <div className={`flex items-center ${getValidationColor(crossValidationResults.validationDetails.addressConsistency.score)}`}>
                            {getValidationIcon(crossValidationResults.validationDetails.addressConsistency.score)}
                            <span className="ml-2">{crossValidationResults.validationDetails.addressConsistency.score}%</span>
                          </div>
                        </div>
                        {crossValidationResults.validationDetails.addressConsistency.issues.length > 0 && (
                          <div className="space-y-1">
                            {crossValidationResults.validationDetails.addressConsistency.issues.map((issue, index) => (
                              <div key={index} className="text-sm text-red-600 flex items-center">
                                <AlertTriangle className="w-4 h-4 mr-2" />
                                {issue}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Recommendations */}
                {crossValidationResults.recommendations && crossValidationResults.recommendations.length > 0 && (
                  <div className="bg-blue-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4 text-blue-900">Recommendations</h3>
                    <div className="space-y-2">
                      {crossValidationResults.recommendations.map((recommendation, index) => (
                        <div key={index} className="flex items-start">
                          <CheckCircle className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
                          <span className="text-blue-800">{recommendation}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentLocker;