// Test script to verify document name matching logic

// Simulate the normalization function
function normalizeDocumentNameToType(documentName) {
  if (!documentName) return null;
  
  const nameToTypeMap = {
    'aadhaar card': 'aadhaar_card',
    'aadhar card': 'aadhaar_card',
    'pan card': 'pan_card',
    'voter id': 'voter_id',
    'voter id card': 'voter_id',
    'driving license': 'driving_license',
    'driving licence': 'driving_license',
    'passport': 'passport',
    'ration card': 'ration_card',
    'birth certificate': 'birth_certificate',
    'photo': 'photo',
    'photograph': 'photo',
    'passport photo': 'photo',
  };
  
  const normalized = documentName.toLowerCase().trim();
  return nameToTypeMap[normalized] || normalized.replace(/\s+/g, '_');
}

// Test cases
const testCases = [
  { input: 'Aadhar Card', expected: 'aadhaar_card' },
  { input: 'Aadhaar Card', expected: 'aadhaar_card' },
  { input: 'AADHAR CARD', expected: 'aadhaar_card' },
  { input: 'PAN Card', expected: 'pan_card' },
  { input: 'pan card', expected: 'pan_card' },
  { input: 'Photo', expected: 'photo' },
  { input: 'Photograph', expected: 'photo' },
  { input: 'Passport Photo', expected: 'photo' },
  { input: 'Voter ID', expected: 'voter_id' },
  { input: 'Driving License', expected: 'driving_license' },
  { input: 'Birth Certificate', expected: 'birth_certificate' },
  { input: 'Custom Document', expected: 'custom_document' },
];

console.log('=== Document Name Normalization Tests ===\n');

let passed = 0;
let failed = 0;

testCases.forEach((test, index) => {
  const result = normalizeDocumentNameToType(test.input);
  const success = result === test.expected;
  
  if (success) {
    console.log(`✅ Test ${index + 1}: "${test.input}" → "${result}"`);
    passed++;
  } else {
    console.log(`❌ Test ${index + 1}: "${test.input}" → "${result}" (expected: "${test.expected}")`);
    failed++;
  }
});

console.log(`\n=== Results ===`);
console.log(`Passed: ${passed}/${testCases.length}`);
console.log(`Failed: ${failed}/${testCases.length}`);

if (failed === 0) {
  console.log('\n🎉 All tests passed!');
} else {
  console.log('\n⚠️  Some tests failed. Please review the normalization logic.');
}

// Test matching logic
console.log('\n=== Document Matching Tests ===\n');

const lockerDocuments = [
  { _id: '1', name: 'My Aadhaar Card', documentType: 'aadhaar_card' },
  { _id: '2', name: 'PAN Card Copy', documentType: 'pan_card' },
  { _id: '3', name: 'Passport Size Photo', documentType: 'photo' },
];

const requiredDocuments = [
  { documentName: 'Aadhar Card' },
  { documentName: 'Photo' },
  { documentName: 'Voter ID' },
];

requiredDocuments.forEach((reqDoc, index) => {
  const docName = reqDoc.documentName;
  const normalizedType = normalizeDocumentNameToType(docName);
  
  const found = lockerDocuments.find(doc => {
    const typeMatch = doc.documentType === normalizedType;
    const nameMatch = doc.name && doc.name.toLowerCase().includes(docName.toLowerCase());
    const reverseNameMatch = docName.toLowerCase().includes(doc.documentType?.replace(/_/g, ' '));
    
    return typeMatch || nameMatch || reverseNameMatch;
  });
  
  if (found) {
    console.log(`✅ Match ${index + 1}: "${docName}" → Found "${found.name}" (type: ${found.documentType})`);
  } else {
    console.log(`❌ Match ${index + 1}: "${docName}" → Not found in locker`);
  }
});

console.log('\n=== Test Complete ===');
