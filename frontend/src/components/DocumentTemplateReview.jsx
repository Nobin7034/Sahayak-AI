import React, { useState } from 'react';
import { CheckCircle, AlertTriangle, Edit3, X, Save } from 'lucide-react';

const DOC_META = {
  aadhaar_card:          { label:'Aadhaar Card', icon:'🆔' },
  pan_card:              { label:'PAN Card', icon:'💳' },
  passport:              { label:'Passport', icon:'✈️' },
  voter_id:              { label:'Voter ID (EPIC)', icon:'🗳️' },
  driving_license:       { label:'Driving License', icon:'🚗' },
  ration_card:           { label:'Ration Card', icon:'🍚' },
  birth_certificate:     { label:'Birth Certificate', icon:'👶' },
  death_certificate:     { label:'Death Certificate', icon:'📋' },
  marriage_certificate:  { label:'Marriage Certificate', icon:'💒' },
  income_certificate:    { label:'Income Certificate', icon:'💰' },
  caste_certificate:     { label:'Caste Certificate', icon:'📜' },
  community_certificate: { label:'Community Certificate', icon:'🏛️' },
  domicile_certificate:  { label:'Domicile Certificate', icon:'🏠' },
  residence_certificate: { label:'Residence Certificate', icon:'🏘️' },
  sslc_certificate:      { label:'SSLC / 10th Certificate', icon:'🎓' },
  pension_certificate:   { label:'Pension Certificate', icon:'👴' },
  disability_certificate:{ label:'Disability Certificate', icon:'♿' },
  employment_certificate:{ label:'Employment Certificate', icon:'💼' },
  land_record:           { label:'Land Record / Patta', icon:'🌾' },
  medical_certificate:   { label:'Medical Certificate', icon:'🏥' },
  bank_passbook:         { label:'Bank Passbook', icon:'🏦' },
  educational_certificate:{ label:'Educational Certificate', icon:'📚' },
  other:                 { label:'Other Document', icon:'📄' },
};

// Field definitions per document type
const TEMPLATES = {
  aadhaar_card:[
    {k:'aadhaarNumber',l:'Aadhaar Number',t:'text',r:true},
    {k:'fullName',l:'Full Name',t:'text',r:true},
    {k:'dateOfBirth',l:'Date of Birth',t:'date',r:true},
    {k:'gender',l:'Gender',t:'select',opts:['Male','Female','Other'],r:true},
    {k:'mobileNumber',l:'Mobile Number',t:'text',r:false},
    {k:'fatherName',l:"Father's / Husband's Name",t:'text',r:false},
    {k:'address',l:'Address',t:'address',r:true},
  ],
  pan_card:[
    {k:'panNumber',l:'PAN Number',t:'text',r:true},
    {k:'fullName',l:'Full Name',t:'text',r:true},
    {k:'fatherName',l:"Father's Name",t:'text',r:true},
    {k:'dateOfBirth',l:'Date of Birth',t:'date',r:true},
  ],
  passport:[
    {k:'passportNumber',l:'Passport Number',t:'text',r:true},
    {k:'fullName',l:'Full Name',t:'text',r:true},
    {k:'nationality',l:'Nationality',t:'text',r:true},
    {k:'dateOfBirth',l:'Date of Birth',t:'date',r:true},
    {k:'gender',l:'Gender',t:'select',opts:['Male','Female','Other'],r:true},
    {k:'placeOfBirth',l:'Place of Birth',t:'text',r:true},
    {k:'issueDate',l:'Date of Issue',t:'date',r:true},
    {k:'expiryDate',l:'Date of Expiry',t:'date',r:true},
    {k:'issuingAuthority',l:'Place of Issue',t:'text',r:false},
    {k:'address',l:'Address',t:'address',r:false},
  ],
  voter_id:[
    {k:'voterIdNumber',l:'EPIC Number',t:'text',r:true},
    {k:'fullName',l:'Full Name',t:'text',r:true},
    {k:'fatherName',l:"Father's / Husband's Name",t:'text',r:false},
    {k:'motherName',l:"Mother's Name",t:'text',r:false},
    {k:'spouseName',l:"Spouse's Name",t:'text',r:false},
    {k:'dateOfBirth',l:'Date of Birth',t:'date',r:false},
    {k:'age',l:'Age',t:'number',r:false},
    {k:'gender',l:'Gender',t:'select',opts:['Male','Female','Other'],r:true},
    {k:'address',l:'Address',t:'address',r:true},
  ],
  driving_license:[
    {k:'licenseNumber',l:'License Number',t:'text',r:true},
    {k:'fullName',l:'Full Name',t:'text',r:true},
    {k:'dateOfBirth',l:'Date of Birth',t:'date',r:true},
    {k:'fatherName',l:"Father's / Husband's Name",t:'text',r:false},
    {k:'bloodGroup',l:'Blood Group',t:'text',r:false},
    {k:'vehicleClass',l:'Vehicle Class',t:'text',r:false},
    {k:'issueDate',l:'Date of Issue',t:'date',r:false},
    {k:'expiryDate',l:'Valid Till',t:'date',r:false},
    {k:'issuingAuthority',l:'Issuing RTO',t:'text',r:false},
    {k:'address',l:'Address',t:'address',r:false},
  ],
  ration_card:[
    {k:'rationCardNumber',l:'Ration Card Number',t:'text',r:true},
    {k:'cardType',l:'Card Type',t:'select',opts:['APL','BPL','AAY','PHH','NPHH'],r:false},
    {k:'fullName',l:'Head of Family Name',t:'text',r:true},
    {k:'familyMembers',l:'Family Members',t:'textarea',r:false},
    {k:'fpsNumber',l:'FPS (Ration Shop) Number',t:'text',r:false},
    {k:'address',l:'Address',t:'address',r:true},
  ],
  birth_certificate:[
    {k:'registrationNumber',l:'Registration Number',t:'text',r:true},
    {k:'childName',l:"Child's Name",t:'text',r:true},
    {k:'dateOfBirth',l:'Date of Birth',t:'date',r:true},
    {k:'gender',l:'Gender',t:'select',opts:['Male','Female','Other'],r:true},
    {k:'placeOfBirth',l:'Place of Birth',t:'text',r:true},
    {k:'fatherName',l:"Father's Name",t:'text',r:true},
    {k:'motherName',l:"Mother's Name",t:'text',r:true},
    {k:'issueDate',l:'Date of Issue',t:'date',r:false},
    {k:'issuingAuthority',l:'Registrar / Issuing Authority',t:'text',r:false},
    {k:'address',l:'Permanent Address',t:'address',r:false},
  ],
  death_certificate:[
    {k:'registrationNumber',l:'Registration Number',t:'text',r:true},
    {k:'deceasedName',l:"Deceased Person's Name",t:'text',r:true},
    {k:'dateOfDeath',l:'Date of Death',t:'date',r:true},
    {k:'placeOfDeath',l:'Place of Death',t:'text',r:true},
    {k:'age',l:'Age at Death',t:'number',r:false},
    {k:'gender',l:'Gender',t:'select',opts:['Male','Female','Other'],r:false},
    {k:'causeOfDeath',l:'Cause of Death',t:'text',r:false},
    {k:'fatherName',l:"Father's / Husband's Name",t:'text',r:false},
    {k:'issueDate',l:'Date of Issue',t:'date',r:false},
    {k:'issuingAuthority',l:'Registrar / Issuing Authority',t:'text',r:false},
    {k:'address',l:'Permanent Address',t:'address',r:false},
  ],
  marriage_certificate:[
    {k:'registrationNumber',l:'Registration Number',t:'text',r:true},
    {k:'husbandName',l:"Husband's Name",t:'text',r:true},
    {k:'wifeName',l:"Wife's Name",t:'text',r:true},
    {k:'dateOfMarriage',l:'Date of Marriage',t:'date',r:true},
    {k:'placeOfMarriage',l:'Place of Marriage',t:'text',r:false},
    {k:'issueDate',l:'Date of Issue',t:'date',r:false},
    {k:'issuingAuthority',l:'Registrar / Issuing Authority',t:'text',r:false},
    {k:'address',l:'Address',t:'address',r:false},
  ],
  income_certificate:[
    {k:'certificateNumber',l:'Certificate Number',t:'text',r:true},
    {k:'fullName',l:'Full Name',t:'text',r:true},
    {k:'fatherName',l:"Father's / Husband's Name",t:'text',r:false},
    {k:'annualIncome',l:'Annual Income (₹)',t:'number',r:true},
    {k:'incomeSource',l:'Source of Income',t:'text',r:false},
    {k:'issueDate',l:'Date of Issue',t:'date',r:false},
    {k:'expiryDate',l:'Valid Till',t:'date',r:false},
    {k:'issuingAuthority',l:'Issuing Authority',t:'text',r:false},
    {k:'address',l:'Address',t:'address',r:false},
  ],
  caste_certificate:[
    {k:'certificateNumber',l:'Certificate Number',t:'text',r:true},
    {k:'fullName',l:'Full Name',t:'text',r:true},
    {k:'fatherName',l:"Father's Name",t:'text',r:true},
    {k:'caste',l:'Caste / Sub-Caste',t:'text',r:true},
    {k:'religion',l:'Religion',t:'text',r:false},
    {k:'issueDate',l:'Date of Issue',t:'date',r:false},
    {k:'issuingAuthority',l:'Issuing Authority',t:'text',r:false},
    {k:'address',l:'Address',t:'address',r:false},
  ],
  community_certificate:[
    {k:'certificateNumber',l:'Certificate Number',t:'text',r:true},
    {k:'fullName',l:'Full Name',t:'text',r:true},
    {k:'fatherName',l:"Father's Name",t:'text',r:false},
    {k:'community',l:'Community',t:'text',r:true},
    {k:'religion',l:'Religion',t:'text',r:false},
    {k:'issueDate',l:'Date of Issue',t:'date',r:false},
    {k:'issuingAuthority',l:'Issuing Authority',t:'text',r:false},
    {k:'address',l:'Address',t:'address',r:false},
  ],
  domicile_certificate:[
    {k:'certificateNumber',l:'Certificate Number',t:'text',r:true},
    {k:'fullName',l:'Full Name',t:'text',r:true},
    {k:'fatherName',l:"Father's Name",t:'text',r:false},
    {k:'motherName',l:"Mother's Name",t:'text',r:false},
    {k:'dateOfBirth',l:'Date of Birth',t:'date',r:false},
    {k:'permanentAddress',l:'Permanent Address',t:'text',r:true},
    {k:'yearsOfResidence',l:'Years of Residence',t:'number',r:false},
    {k:'issueDate',l:'Date of Issue',t:'date',r:false},
    {k:'issuingAuthority',l:'Issuing Authority',t:'text',r:false},
    {k:'address',l:'Address',t:'address',r:false},
  ],
  residence_certificate:[
    {k:'certificateNumber',l:'Certificate Number',t:'text',r:true},
    {k:'fullName',l:'Full Name',t:'text',r:true},
    {k:'fatherName',l:"Father's / Husband's Name",t:'text',r:false},
    {k:'localBody',l:'Local Body / Panchayat / Municipality',t:'text',r:false},
    {k:'periodOfResidence',l:'Period of Residence',t:'text',r:false},
    {k:'issueDate',l:'Date of Issue',t:'date',r:false},
    {k:'issuingAuthority',l:'Issuing Authority',t:'text',r:false},
    {k:'address',l:'Address',t:'address',r:true},
  ],
  sslc_certificate:[
    {k:'registerNumber',l:'Register Number',t:'text',r:true},
    {k:'studentName',l:"Student's Name",t:'text',r:true},
    {k:'dateOfBirth',l:'Date of Birth',t:'date',r:false},
    {k:'fatherName',l:"Father's Name",t:'text',r:false},
    {k:'motherName',l:"Mother's Name",t:'text',r:false},
    {k:'schoolName',l:'School Name',t:'text',r:true},
    {k:'yearOfPassing',l:'Year of Passing',t:'number',r:true},
    {k:'marksGrade',l:'Marks / Grade',t:'text',r:false},
  ],
  pension_certificate:[
    {k:'pensionId',l:'Pension ID / PPO Number',t:'text',r:true},
    {k:'pensionerName',l:"Pensioner's Name",t:'text',r:true},
    {k:'pensionType',l:'Pension Type',t:'text',r:false},
    {k:'aadhaarNumber',l:'Aadhaar Number',t:'text',r:false},
    {k:'bankAccountDetails',l:'Bank Account Details',t:'textarea',r:false},
    {k:'amount',l:'Monthly Pension Amount (₹)',t:'number',r:false},
    {k:'issueDate',l:'Date of Issue',t:'date',r:false},
    {k:'address',l:'Address',t:'address',r:false},
  ],
  disability_certificate:[
    {k:'certificateNumber',l:'Certificate Number',t:'text',r:true},
    {k:'fullName',l:'Full Name',t:'text',r:true},
    {k:'fatherName',l:"Father's / Guardian's Name",t:'text',r:false},
    {k:'dateOfBirth',l:'Date of Birth',t:'date',r:false},
    {k:'disabilityType',l:'Type of Disability',t:'text',r:true},
    {k:'disabilityPercentage',l:'Disability Percentage (%)',t:'number',r:false},
    {k:'issueDate',l:'Date of Issue',t:'date',r:false},
    {k:'expiryDate',l:'Valid Till',t:'date',r:false},
    {k:'issuingAuthority',l:'Issuing Medical Authority',t:'text',r:false},
    {k:'address',l:'Address',t:'address',r:false},
  ],
  employment_certificate:[
    {k:'certificateNumber',l:'Certificate Number',t:'text',r:false},
    {k:'fullName',l:'Employee Name',t:'text',r:true},
    {k:'employeeId',l:'Employee ID',t:'text',r:false},
    {k:'employerName',l:'Employer / Organization Name',t:'text',r:true},
    {k:'designation',l:'Designation',t:'text',r:false},
    {k:'issueDate',l:'Date of Issue',t:'date',r:false},
    {k:'address',l:'Address',t:'address',r:false},
  ],
  land_record:[
    {k:'surveyNumber',l:'Survey / Patta Number',t:'text',r:true},
    {k:'fullName',l:"Owner's Name",t:'text',r:true},
    {k:'fatherName',l:"Father's Name",t:'text',r:false},
    {k:'area',l:'Land Area',t:'text',r:false},
    {k:'landType',l:'Land Type',t:'text',r:false},
    {k:'issueDate',l:'Date of Issue',t:'date',r:false},
    {k:'issuingAuthority',l:'Issuing Authority',t:'text',r:false},
    {k:'address',l:'Land Location / Address',t:'address',r:false},
  ],
  medical_certificate:[
    {k:'certificateNumber',l:'Certificate Number',t:'text',r:false},
    {k:'fullName',l:"Patient's Name",t:'text',r:true},
    {k:'dateOfBirth',l:'Date of Birth',t:'date',r:false},
    {k:'doctorName',l:"Doctor's Name",t:'text',r:true},
    {k:'hospitalName',l:'Hospital / Clinic Name',t:'text',r:true},
    {k:'issueDate',l:'Date of Issue',t:'date',r:true},
    {k:'address',l:'Address',t:'address',r:false},
  ],
  bank_passbook:[
    {k:'accountNumber',l:'Account Number',t:'text',r:true},
    {k:'fullName',l:"Account Holder's Name",t:'text',r:true},
    {k:'bankName',l:'Bank Name',t:'text',r:true},
    {k:'ifscCode',l:'IFSC Code',t:'text',r:false},
    {k:'branchName',l:'Branch Name',t:'text',r:false},
    {k:'address',l:'Address',t:'address',r:false},
  ],
  educational_certificate:[
    {k:'certificateNumber',l:'Certificate / Roll Number',t:'text',r:false},
    {k:'fullName',l:"Student's Name",t:'text',r:true},
    {k:'dateOfBirth',l:'Date of Birth',t:'date',r:false},
    {k:'institutionName',l:'Institution / University Name',t:'text',r:true},
    {k:'courseName',l:'Course / Degree',t:'text',r:false},
    {k:'yearOfPassing',l:'Year of Passing',t:'number',r:false},
    {k:'marksGrade',l:'Marks / Grade / CGPA',t:'text',r:false},
    {k:'issueDate',l:'Date of Issue',t:'date',r:false},
  ],
  other:[
    {k:'fullName',l:'Full Name',t:'text',r:false},
    {k:'dateOfBirth',l:'Date of Birth',t:'date',r:false},
    {k:'certificateNumber',l:'Document / Certificate Number',t:'text',r:false},
    {k:'issueDate',l:'Date of Issue',t:'date',r:false},
    {k:'issuingAuthority',l:'Issuing Authority',t:'text',r:false},
    {k:'address',l:'Address',t:'address',r:false},
  ],
};

const DATE_FIELDS = ['dateOfBirth','dateOfDeath','dateOfMarriage','issueDate','expiryDate','validity'];
const NUMBER_FIELDS = ['annualIncome','amount','age','yearsOfResidence','yearOfPassing','disabilityPercentage'];

function fmtDate(v) {
  if (!v) return '';
  try { return new Date(v).toISOString().split('T')[0]; } catch { return ''; }
}
function fmtDisplay(k, v) {
  if (v === null || v === undefined || v === '') return null;
  if (DATE_FIELDS.includes(k)) { try { return new Date(v).toLocaleDateString('en-IN'); } catch { return String(v); } }
  if (k === 'address' && typeof v === 'object') return [v.line1,v.line2,v.city,v.state,v.pincode].filter(Boolean).join(', ');
  return String(v);
}

function AddressEditor({ value={}, onChange }) {
  const set = (k,v) => onChange({...value,[k]:v});
  const rows = [['line1','Street / House No'],['line2','Area / Locality'],['city','City / District'],['state','State'],['pincode','PIN Code'],['country','Country']];
  return (
    <div className="grid grid-cols-2 gap-2 mt-1">
      {rows.map(([k,ph]) => (
        <input key={k} placeholder={ph} value={value[k]||''} onChange={e=>set(k,e.target.value)}
          className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-400" />
      ))}
    </div>
  );
}

function FieldRow({ field, value, editing, onEdit, onSave, onCancel, ediVal, onEdiChange }) {
  const display = fmtDisplay(field.k, value);
  const isEmpty = display === null;
  return (
    <div className={`p-3 rounded-lg border ${isEmpty && field.r ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50'}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
          {field.l}{field.r && <span className="text-red-500 ml-1">*</span>}
        </span>
        {!editing && (
          <button onClick={onEdit} className="text-blue-500 hover:text-blue-700 p-0.5 rounded">
            <Edit3 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      {editing ? (
        <div className="space-y-1">
          {field.t === 'address' ? (
            <AddressEditor value={ediVal||{}} onChange={onEdiChange} />
          ) : field.t === 'select' ? (
            <select value={ediVal||''} onChange={e=>onEdiChange(e.target.value)}
              className="w-full px-2 py-1 border border-blue-300 rounded text-sm">
              <option value="">Select…</option>
              {(field.opts||[]).map(o=><option key={o} value={o}>{o}</option>)}
            </select>
          ) : field.t === 'textarea' ? (
            <textarea rows={3} value={ediVal||''} onChange={e=>onEdiChange(e.target.value)}
              className="w-full px-2 py-1 border border-blue-300 rounded text-sm" />
          ) : (
            <input type={field.t}
              value={field.t==='date' ? fmtDate(ediVal) : (ediVal??'')}
              onChange={e=>onEdiChange(field.t==='date' ? new Date(e.target.value) : e.target.value)}
              className="w-full px-2 py-1 border border-blue-300 rounded text-sm" />
          )}
          <div className="flex gap-2 mt-1">
            <button onClick={onSave} className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700">
              <Save className="w-3 h-3" /> Save
            </button>
            <button onClick={onCancel} className="flex items-center gap-1 px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300">
              <X className="w-3 h-3" /> Cancel
            </button>
          </div>
        </div>
      ) : (
        isEmpty
          ? <span className="text-xs text-gray-400 italic">{field.r ? 'Required — click ✏ to add' : 'Not extracted — click ✏ to add'}</span>
          : <p className="text-sm text-gray-900 break-words">{display}</p>
      )}
    </div>
  );
}

/**
 * DocumentTemplateReview
 * Props:
 *   document   – LockerDocument object with extractedData
 *   onSave(d)  – called with updated extractedData
 *   onClose()  – dismiss modal
 *   processing – bool
 */
export default function DocumentTemplateReview({ document, onSave, onClose, processing }) {
  const meta = DOC_META[document?.documentType] || { label:'Document', icon:'📄' };
  const fields = TEMPLATES[document?.documentType] || TEMPLATES.other;

  const [data, setData] = useState(() => ({...(document?.extractedData||{})}));
  const [editKey, setEditKey] = useState(null);
  const [ediVal, setEdiVal] = useState(null);

  const startEdit = k => { setEditKey(k); setEdiVal(data[k] ?? (k==='address'?{}:'')); };
  const commit    = k => { setData(p=>({...p,[k]:ediVal})); setEditKey(null); setEdiVal(null); };
  const cancel    = () => { setEditKey(null); setEdiVal(null); };

  const filled = fields.filter(f => {
    const v = data[f.k];
    if (!v && v!==0) return false;
    if (typeof v==='object' && !Array.isArray(v)) return Object.values(v).some(Boolean);
    return String(v).trim()!=='';
  }).length;
  const pct = Math.round((filled/fields.length)*100);
  const missingRequired = fields.filter(f=>f.r).filter(f=>!fmtDisplay(f.k,data[f.k])).length;

  if (!document) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{meta.icon}</span>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{meta.label}</h2>
              <p className="text-xs text-gray-500">Review and complete extracted data before saving</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded"><X className="w-5 h-5" /></button>
        </div>

        <div className="px-6 py-3 bg-gray-50 border-b">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-600">Data Completeness</span>
            <span className={`text-xs font-semibold ${pct>=80?'text-green-600':pct>=50?'text-yellow-600':'text-red-600'}`}>
              {filled} / {fields.length} fields ({pct}%)
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className={`h-2 rounded-full transition-all ${pct>=80?'bg-green-500':pct>=50?'bg-yellow-500':'bg-red-500'}`}
              style={{width:`${pct}%`}} />
          </div>
          {document.extractedData?.confidence && (
            <p className="text-xs text-gray-500 mt-1">OCR confidence: {document.extractedData.confidence.toFixed(1)}%</p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {fields.map(field => (
              <div key={field.k} className={['address','familyMembers','bankAccountDetails'].includes(field.k)?'sm:col-span-2':''}>
                <FieldRow field={field} value={data[field.k]}
                  editing={editKey===field.k}
                  onEdit={()=>startEdit(field.k)}
                  onSave={()=>commit(field.k)}
                  onCancel={cancel}
                  ediVal={ediVal}
                  onEdiChange={setEdiVal} />
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 py-4 border-t flex items-center justify-between bg-gray-50 rounded-b-xl">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            {missingRequired===0
              ? <><CheckCircle className="w-4 h-4 text-green-500" /> All required fields filled</>
              : <><AlertTriangle className="w-4 h-4 text-yellow-500" /> {missingRequired} required field(s) missing</>}
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm">Cancel</button>
            <button onClick={()=>onSave({...data,isVerified:true,verifiedAt:new Date()})} disabled={processing}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm">
              {processing
                ? <><span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> Saving…</>
                : <><CheckCircle className="w-4 h-4" /> Save & Verify</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
