import Tesseract from 'tesseract.js';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

class OCRService {
  constructor() {
    this.tesseractOptions = {
      logger: m => console.log('OCR Progress:', m)
    };
  }

  /**
   * Extract text from image using Tesseract.js
   */
  async extractText(imagePath, options = {}) {
    try {
      // Preprocess image for better OCR accuracy
      const processedImagePath = await this.preprocessImage(imagePath);
      
      const { data } = await Tesseract.recognize(
        processedImagePath,
        'eng+hin',
        {
          logger: m => {
            if (m.status === 'recognizing text') {
              console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
            }
          },
          // Do NOT use char_whitelist — it strips valid characters and kills accuracy
          tessedit_pageseg_mode: Tesseract.PSM.AUTO,
          preserve_interword_spaces: '1',
          ...options
        }
      );
      
      // Clean up processed image if it's different from original
      if (processedImagePath !== imagePath) {
        try { fs.unlinkSync(processedImagePath); } catch {}
      }
      
      console.log(`OCR Confidence: ${data.confidence.toFixed(2)}%`);
      
      return {
        text: data.text,
        confidence: data.confidence,
        words: data.words,
        lines: data.lines,
        paragraphs: data.paragraphs
      };
    } catch (error) {
      console.error('OCR extraction failed:', error);
      throw new Error('Failed to extract text from image');
    }
  }

  /**
   * Preprocess image for better OCR accuracy
   */
  async preprocessImage(imagePath) {
    try {
      const processedPath = imagePath.replace(/\.(jpg|jpeg|png|webp)$/i, '_processed.png');
      
      const metadata = await sharp(imagePath).metadata();
      
      // Scale up small images — Tesseract works best at ~300 DPI equivalent
      // For typical document photos, target ~2400px wide
      const targetWidth = Math.min(Math.max(metadata.width * 2, 2400), 4800);
      
      await sharp(imagePath)
        .resize(targetWidth, null, {
          withoutEnlargement: false,
          fit: 'inside',
          kernel: sharp.kernel.lanczos3
        })
        .grayscale()
        // Normalize histogram for even lighting
        .normalize()
        // Mild sharpening only — aggressive sharpening creates artifacts
        .sharpen({ sigma: 0.8, m1: 0.5, m2: 3 })
        .png({ quality: 100, compressionLevel: 0 })
        .toFile(processedPath);
      
      return processedPath;
    } catch (error) {
      console.error('Image preprocessing failed:', error);
      return imagePath;
    }
  }

  /**
   * Extract structured data from Aadhaar card
   */
  extractAadhaarData(ocrResult) {
    const text = ocrResult.text;
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const data = {};
    
    // Aadhaar number — 12 digits, possibly space-separated in groups of 4
    const aadhaarMatch = text.match(/\b(\d{4}[\s\-]?\d{4}[\s\-]?\d{4})\b/);
    if (aadhaarMatch) {
      data.aadhaarNumber = aadhaarMatch[1].replace(/[\s\-]/g, '');
    }
    
    // Name — try labeled patterns first, then fall back to all-caps lines
    const namePatterns = [
      /(?:Name|नाम)\s*[:\s]+([A-Za-z][A-Za-z\s]{2,40}?)(?:\r?\n|$)/i,
      /(?:^|\n)([A-Z][A-Z\s]{4,30})(?:\r?\n|Male|Female|DOB|Date)/m,
    ];
    for (const p of namePatterns) {
      const m = text.match(p);
      if (m?.[1]?.trim().length > 2) { data.fullName = m[1].trim(); break; }
    }
    // Fallback: first all-caps line that looks like a name
    if (!data.fullName) {
      for (const line of lines) {
        if (/^[A-Z][A-Z\s]{4,35}$/.test(line) && !/GOVERNMENT|INDIA|UNIQUE|AUTHORITY|AADHAAR/i.test(line)) {
          data.fullName = line; break;
        }
      }
    }
    
    // DOB
    const dobPatterns = [
      /(?:DOB|Date of Birth|जन्म तिथि|Year of Birth)\s*[:\s]+(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/i,
      /(?:DOB|Date of Birth)\s*[:\s]+(\d{4})/i,
      /\b(\d{2}[\/\-]\d{2}[\/\-]\d{4})\b/,
    ];
    for (const p of dobPatterns) {
      const m = text.match(p); if (m) { data.dateOfBirth = this.parseDate(m[1]); break; }
    }
    
    // Gender
    const genderMatch = text.match(/\b(Male|Female|MALE|FEMALE|पुरुष|महिला)\b/);
    if (genderMatch) {
      const g = genderMatch[1].toLowerCase();
      data.gender = (g === 'male' || g === 'पुरुष') ? 'Male' : 'Female';
    }
    
    // Father name
    const fatherMatch = text.match(/(?:S\/O|D\/O|Father|पिता)\s*[:\s]+([A-Za-z\s]{3,40}?)(?:\r?\n|Address|$)/i);
    if (fatherMatch) data.fatherName = fatherMatch[1].trim();
    
    // Address — everything after "Address" label until PIN
    const addressMatch = text.match(/(?:Address|पता)\s*[:\s]+([\s\S]{10,200}?)(?:\d{6}|$)/i);
    if (addressMatch) data.address = this.parseAddress(addressMatch[1]);
    
    // PIN code
    const pinMatch = text.match(/\b(\d{6})\b/);
    if (pinMatch) {
      if (!data.address) data.address = {};
      if (typeof data.address === 'object') data.address.pincode = pinMatch[1];
    }
    
    return { ...data, rawText: text, confidence: ocrResult.confidence };
  }

  /**
   * Extract structured data from PAN card
   */
  extractPANData(ocrResult) {
    const text = ocrResult.text;
    const data = {};
    
    // Extract PAN number
    const panMatch = text.match(/([A-Z]{5}\d{4}[A-Z])/);
    if (panMatch) {
      data.panNumber = panMatch[1];
    }
    
    // Extract name
    const nameMatch = text.match(/Name[:\s]*(.*?)(?:\n|Father)/i) || 
                     text.match(/^([A-Z\s]+)$/m);
    if (nameMatch) {
      data.fullName = nameMatch[1].trim();
    }
    
    // Extract father's name
    const fatherMatch = text.match(/Father['\s]*s?\s*Name[:\s]*(.*?)(?:\n|Date)/i);
    if (fatherMatch) {
      data.fatherName = fatherMatch[1].trim();
    }
    
    // Extract Date of Birth
    const dobMatch = text.match(/(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/);
    if (dobMatch) {
      data.dateOfBirth = this.parseDate(dobMatch[1]);
    }
    
    // Extract signature indicator
    const signatureMatch = text.match(/Signature/i);
    if (signatureMatch) {
      data.hasSignature = true;
    }
    
    // Extract photo indicator
    const photoMatch = text.match(/Photo/i);
    if (photoMatch) {
      data.hasPhoto = true;
    }
    
    return {
      ...data,
      rawText: text,
      confidence: ocrResult.confidence
    };
  }

  /**
   * Extract structured data from Ration card
   */
  extractRationCardData(ocrResult) {
    const text = ocrResult.text;
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const data = {};
    
    // Ration card number — various formats
    const rationMatch = text.match(/(?:Card\s*(?:No|Number)|RC\s*No|Ration\s*Card\s*No|कार्ड\s*(?:संख्या|नं))\s*[:\s]+([A-Z0-9\/\-]+)/i)
      || text.match(/\b([A-Z]{2,4}[\/\-]?\d{6,12})\b/);
    if (rationMatch) data.rationCardNumber = rationMatch[1].trim();
    
    // Head of family name
    const namePatterns = [
      /(?:Head\s*of\s*Family|HoF|मुखिया|Name\s*of\s*Head)\s*[:\s]+([A-Za-z\s]{3,40}?)(?:\r?\n|Father|Address|$)/i,
      /(?:Name|नाम)\s*[:\s]+([A-Za-z\s]{3,40}?)(?:\r?\n|$)/i,
    ];
    for (const p of namePatterns) {
      const m = text.match(p);
      if (m?.[1]?.trim().length > 2) { data.fullName = m[1].trim(); break; }
    }
    // Fallback: first reasonable all-caps line
    if (!data.fullName) {
      for (const line of lines) {
        if (/^[A-Z][A-Z\s]{4,35}$/.test(line) && !/GOVERNMENT|INDIA|RATION|CARD|STATE/i.test(line)) {
          data.fullName = line; break;
        }
      }
    }
    
    // Address
    const addressMatch = text.match(/(?:Address|पता|Residence)\s*[:\s]+([\s\S]{5,200}?)(?:\d{6}|$)/i);
    if (addressMatch) data.address = this.parseAddress(addressMatch[1]);
    
    // PIN code
    const pinMatch = text.match(/\b(\d{6})\b/);
    if (pinMatch) {
      if (!data.address) data.address = {};
      if (typeof data.address === 'object') data.address.pincode = pinMatch[1];
    }
    
    // Category (APL/BPL/AAY etc.)
    const categoryMatch = text.match(/\b(APL|BPL|AAY|PHH|NPHH|Antyodaya)\b/i);
    if (categoryMatch) data.category = categoryMatch[1].toUpperCase();
    
    return { ...data, rawText: text, confidence: ocrResult.confidence };
  }

  /**
   * Extract structured data from Income Certificate
   */
  extractIncomeCertificateData(ocrResult) {
    const text = ocrResult.text;
    const data = {};
    
    // Extract certificate number
    const certMatch = text.match(/(?:Certificate No|प्रमाण पत्र संख्या)[:\s]*([A-Z0-9\/\-]+)/i);
    if (certMatch) {
      data.certificateNumber = certMatch[1];
    }
    
    // Extract name
    const nameMatch = text.match(/(?:Name|नाम)[:\s]*(.*?)(?:\n|Father|Son|Daughter)/i);
    if (nameMatch) {
      data.fullName = nameMatch[1].trim();
    }
    
    // Extract father's name
    const fatherMatch = text.match(/(?:Father|Son of|Daughter of|पिता)[:\s]*(.*?)(?:\n|Resident|Income)/i);
    if (fatherMatch) {
      data.fatherName = fatherMatch[1].trim();
    }
    
    // Extract income amount
    const incomeMatch = text.match(/(?:Income|आय)[:\s]*(?:Rs\.?|₹)?\s*(\d+(?:,\d+)*)/i);
    if (incomeMatch) {
      data.annualIncome = incomeMatch[1].replace(/,/g, '');
    }
    
    // Extract issue date
    const issueDateMatch = text.match(/(?:Issued on|Date)[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/i);
    if (issueDateMatch) {
      data.issueDate = this.parseDate(issueDateMatch[1]);
    }
    
    // Extract validity
    const validityMatch = text.match(/(?:Valid till|Valid up to)[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/i);
    if (validityMatch) {
      data.expiryDate = this.parseDate(validityMatch[1]);
    }
    
    // Extract issuing authority
    const authorityMatch = text.match(/(?:Issued by|Authority)[:\s]*(.*?)(?:\n|Date)/i);
    if (authorityMatch) {
      data.issuingAuthority = authorityMatch[1].trim();
    }
    
    // Extract address
    const addressMatch = text.match(/(?:Resident of|Address)[:\s]*(.*?)(?:\n.*?Income|$)/is);
    if (addressMatch) {
      data.address = this.parseAddress(addressMatch[1]);
    }
    
    return {
      ...data,
      rawText: text,
      confidence: ocrResult.confidence
    };
  }

  /**
   * Parse address string into structured format
   */
  parseAddress(addressText) {
    const lines = addressText.split('\n').map(line => line.trim()).filter(line => line);
    
    return {
      line1: lines[0] || '',
      line2: lines[1] || '',
      city: this.extractCity(addressText),
      state: this.extractState(addressText),
      pincode: this.extractPincode(addressText),
      country: 'India'
    };
  }

  /**
   * Extract city from address text
   */
  extractCity(text) {
    // Common city patterns
    const cityMatch = text.match(/(?:City|District)[:\s]*([A-Za-z\s]+)/i);
    return cityMatch ? cityMatch[1].trim() : '';
  }

  /**
   * Extract state from address text
   */
  extractState(text) {
    const indianStates = [
      'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
      'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
      'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
      'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
      'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
    ];
    
    for (const state of indianStates) {
      if (text.toLowerCase().includes(state.toLowerCase())) {
        return state;
      }
    }
    
    return '';
  }

  /**
   * Extract pincode from text
   */
  extractPincode(text) {
    const pincodeMatch = text.match(/\b(\d{6})\b/);
    return pincodeMatch ? pincodeMatch[1] : '';
  }

  /**
   * Extract structured data from Driving License
   */
  extractDrivingLicenseData(ocrResult) {
    const text = ocrResult.text;
    const data = {};
    
    // Extract license number
    const licenseMatch = text.match(/(?:DL No|License No)[:\s]*([A-Z0-9\-\/]+)/i);
    if (licenseMatch) {
      data.licenseNumber = licenseMatch[1];
    }
    
    // Extract name
    const nameMatch = text.match(/(?:Name)[:\s]*(.*?)(?:\n|DOB|Date)/i);
    if (nameMatch) {
      data.fullName = nameMatch[1].trim();
    }
    
    // Extract Date of Birth
    const dobMatch = text.match(/(?:DOB|Date of Birth)[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/i);
    if (dobMatch) {
      data.dateOfBirth = this.parseDate(dobMatch[1]);
    }
    
    // Extract issue date
    const issueDateMatch = text.match(/(?:Issue Date|Issued)[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/i);
    if (issueDateMatch) {
      data.issueDate = this.parseDate(issueDateMatch[1]);
    }
    
    // Extract validity
    const validityMatch = text.match(/(?:Valid Till|Valid Upto)[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/i);
    if (validityMatch) {
      data.expiryDate = this.parseDate(validityMatch[1]);
    }
    
    // Extract address
    const addressMatch = text.match(/(?:Address)[:\s]*(.*?)(?:\n.*?PIN|$)/is);
    if (addressMatch) {
      data.address = this.parseAddress(addressMatch[1]);
    }
    
    return {
      ...data,
      rawText: text,
      confidence: ocrResult.confidence
    };
  }

  /**
   * Extract structured data from Voter ID
   */
  extractVoterIdData(ocrResult) {
    const text = ocrResult.text;
    const data = {};
    
    // Extract voter ID number
    const voterIdMatch = text.match(/([A-Z]{3}\d{7})/);
    if (voterIdMatch) {
      data.voterIdNumber = voterIdMatch[1];
    }
    
    // Extract name
    const nameMatch = text.match(/(?:Name)[:\s]*(.*?)(?:\n|Father|Husband)/i);
    if (nameMatch) {
      data.fullName = nameMatch[1].trim();
    }
    
    // Extract father's/husband's name
    const relationMatch = text.match(/(?:Father|Husband)[:\s]*(.*?)(?:\n|Age|DOB)/i);
    if (relationMatch) {
      data.fatherName = relationMatch[1].trim();
    }
    
    // Extract age
    const ageMatch = text.match(/(?:Age)[:\s]*(\d+)/i);
    if (ageMatch) {
      data.age = parseInt(ageMatch[1]);
    }
    
    // Extract address
    const addressMatch = text.match(/(?:Address)[:\s]*(.*?)(?:\n.*?PIN|$)/is);
    if (addressMatch) {
      data.address = this.parseAddress(addressMatch[1]);
    }
    
    return {
      ...data,
      rawText: text,
      confidence: ocrResult.confidence
    };
  }
  parseDate(dateString) {
    try {
      // Handle various date formats
      const formats = [
        /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/,  // DD/MM/YYYY or DD-MM-YYYY
        /(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/   // YYYY/MM/DD or YYYY-MM-DD
      ];
      
      for (const format of formats) {
        const match = dateString.match(format);
        if (match) {
          const [, part1, part2, part3] = match;
          
          // Assume DD/MM/YYYY format for Indian documents
          if (part3.length === 4) {
            return new Date(part3, part2 - 1, part1);
          } else {
            return new Date(part1, part2 - 1, part3);
          }
        }
      }
      
      return new Date(dateString);
    } catch (error) {
      console.error('Date parsing failed:', error);
      return null;
    }
  }

  /**
   * Process document based on type
   */
  async processDocument(imagePath, documentType) {
    try {
      const ocrResult = await this.extractText(imagePath);
      
      let extractedData;
      switch (documentType) {
        case 'aadhaar_card':
          extractedData = this.extractAadhaarData(ocrResult);
          break;
        case 'pan_card':
          extractedData = this.extractPANData(ocrResult);
          break;
        case 'ration_card':
          extractedData = this.extractRationCardData(ocrResult);
          break;
        case 'income_certificate':
          extractedData = this.extractIncomeCertificateData(ocrResult);
          break;
        case 'driving_license':
          extractedData = this.extractDrivingLicenseData(ocrResult);
          break;
        case 'voter_id':
          extractedData = this.extractVoterIdData(ocrResult);
          break;
        case 'birth_certificate':
          extractedData = this.extractBirthCertificateData(ocrResult);
          break;
        case 'death_certificate':
          extractedData = this.extractDeathCertificateData(ocrResult);
          break;
        case 'caste_certificate':
          extractedData = this.extractCasteCertificateData(ocrResult);
          break;
        case 'community_certificate':
          extractedData = this.extractCommunityCertificateData(ocrResult);
          break;
        case 'domicile_certificate':
          extractedData = this.extractDomicileCertificateData(ocrResult);
          break;
        case 'residence_certificate':
          extractedData = this.extractResidenceCertificateData(ocrResult);
          break;
        case 'marriage_certificate':
          extractedData = this.extractMarriageCertificateData(ocrResult);
          break;
        case 'sslc_certificate':
          extractedData = this.extractSSLCData(ocrResult);
          break;
        case 'pension_certificate':
          extractedData = this.extractPensionCertificateData(ocrResult);
          break;
        case 'passport':
          extractedData = this.extractPassportData(ocrResult);
          break;
        case 'disability_certificate':
          extractedData = this.extractDisabilityCertificateData(ocrResult);
          break;
        case 'employment_certificate':
          extractedData = this.extractEmploymentCertificateData(ocrResult);
          break;
        case 'land_record':
          extractedData = this.extractLandRecordData(ocrResult);
          break;
        case 'bank_passbook':
          extractedData = this.extractBankPassbookData(ocrResult);
          break;
        case 'educational_certificate':
          extractedData = this.extractEducationalCertificateData(ocrResult);
          break;
        default:
          extractedData = {
            rawText: ocrResult.text,
            confidence: ocrResult.confidence
          };
      }
      
      return extractedData;
    } catch (error) {
      console.error('Document processing failed:', error);
      throw error;
    }
  }

  /**
   * Extract structured data from Passport
   */
  extractPassportData(ocrResult) {
    const text = ocrResult.text;
    const data = {};

    // Extract passport number (format: varies by country, typically alphanumeric)
    const passportMatch = text.match(/(?:Passport\s*(?:No|Number|#)?[:\s]*)?([A-Z]\d{7,8})/i);
    if (passportMatch) {
      data.passportNumber = passportMatch[1].toUpperCase();
    }

    // Extract name
    const nameMatch = text.match(/(?:Name|Given\s*Names?)[:\s]*([A-Z\s]+)/i);
    if (nameMatch) {
      data.fullName = nameMatch[1].trim();
    }

    // Extract date of birth
    const dobMatch = text.match(/(?:Date\s*of\s*Birth|DOB|Birth)[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i);
    if (dobMatch) {
      data.dateOfBirth = this.parseDate(dobMatch[1]);
    }

    // Extract issue date
    const issueDateMatch = text.match(/(?:Date\s*of\s*Issue|Issue\s*Date)[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i);
    if (issueDateMatch) {
      data.issueDate = this.parseDate(issueDateMatch[1]);
    }

    // Extract expiry date
    const expiryMatch = text.match(/(?:Date\s*of\s*Expiry|Expiry\s*Date|Valid\s*Until)[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i);
    if (expiryMatch) {
      data.expiryDate = this.parseDate(expiryMatch[1]);
    }

    // Extract place of birth
    const pobMatch = text.match(/(?:Place\s*of\s*Birth)[:\s]*([A-Z\s,]+)/i);
    if (pobMatch) {
      data.address = data.address || {};
      data.address.city = pobMatch[1].trim();
    }

    // Extract issuing authority
    const authorityMatch = text.match(/(?:Place\s*of\s*Issue)[:\s]*([A-Z\s]+)/i);
    if (authorityMatch) {
      data.issuingAuthority = authorityMatch[1].trim();
    }

    data.rawText = text;
    data.confidence = ocrResult.confidence;

    return data;
  }

  /**
   * Extract structured data from Birth Certificate
   */
  extractBirthCertificateData(ocrResult) {
    const text = ocrResult.text;
    const data = {};

    // Extract certificate number
    const certMatch = text.match(/(?:Certificate\s*(?:No|Number|#)?|Registration\s*(?:No|Number))[:\s]*([A-Z0-9\/-]+)/i);
    if (certMatch) {
      data.certificateNumber = certMatch[1].trim();
    }

    // Extract child's name
    const nameMatch = text.match(/(?:Name\s*of\s*(?:Child|Baby)|Child'?s?\s*Name)[:\s]*([A-Z\s]+)/i);
    if (nameMatch) {
      data.fullName = nameMatch[1].trim();
    }

    // Extract date of birth
    const dobMatch = text.match(/(?:Date\s*of\s*Birth|DOB|Born\s*on)[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i);
    if (dobMatch) {
      data.dateOfBirth = this.parseDate(dobMatch[1]);
    }

    // Extract father's name
    const fatherMatch = text.match(/(?:Father'?s?\s*Name)[:\s]*([A-Z\s]+)/i);
    if (fatherMatch) {
      data.fatherName = fatherMatch[1].trim();
    }

    // Extract mother's name
    const motherMatch = text.match(/(?:Mother'?s?\s*Name)[:\s]*([A-Z\s]+)/i);
    if (motherMatch) {
      data.motherName = motherMatch[1].trim();
    }

    // Extract place of birth
    const placeMatch = text.match(/(?:Place\s*of\s*Birth)[:\s]*([A-Z\s,]+)/i);
    if (placeMatch) {
      data.address = data.address || {};
      data.address.city = placeMatch[1].trim();
    }

    // Extract issue date
    const issueDateMatch = text.match(/(?:Date\s*of\s*Issue|Issue\s*Date|Issued\s*on)[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i);
    if (issueDateMatch) {
      data.issueDate = this.parseDate(issueDateMatch[1]);
    }

    // Extract issuing authority
    const authorityMatch = text.match(/(?:Registrar|Issued\s*by)[:\s]*([A-Z\s]+)/i);
    if (authorityMatch) {
      data.issuingAuthority = authorityMatch[1].trim();
    }

    data.rawText = text;
    data.confidence = ocrResult.confidence;

    return data;
  }

  /**
   * Extract generic data for other document types
   */
  extractGenericData(ocrResult) {
    const text = ocrResult.text;
    const data = {};

    // Try to extract common fields

    // Extract any name (multiple patterns)
    const namePatterns = [
      /(?:Name|Student\s*Name|Pensioner\s*Name|Husband\s*Name|Wife\s*Name|Father\s*Name|Mother\s*Name)[:\s]*([A-Z][A-Za-z\s]+?)(?:\n|Date|DOB|Gender|Male|Female|Address|$)/i,
      /(?:^|\n)([A-Z][A-Za-z]+\s+[A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)?)\s*(?:\n|Male|Female|Date)/i
    ];
    
    for (const pattern of namePatterns) {
      const nameMatch = text.match(pattern);
      if (nameMatch && nameMatch[1]) {
        data.fullName = nameMatch[1].trim();
        break;
      }
    }

    // Extract date of birth
    const dobPatterns = [
      /(?:Date\s*of\s*Birth|DOB|Birth\s*Date)[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
      /(?:Year\s*of\s*Birth)[:\s]*(\d{4})/i
    ];
    
    for (const pattern of dobPatterns) {
      const dobMatch = text.match(pattern);
      if (dobMatch) {
        data.dateOfBirth = this.parseDate(dobMatch[1]);
        break;
      }
    }

    // Extract gender
    const genderMatch = text.match(/\b(Male|Female|M|F)\b/i);
    if (genderMatch) {
      const gender = genderMatch[1].toUpperCase();
      data.gender = gender === 'M' ? 'Male' : gender === 'F' ? 'Female' : gender;
    }

    // Extract address
    const addressMatch = text.match(/(?:Address|Residence)[:\s]*([A-Za-z0-9\s,.-]+?)(?:\n\n|PIN|Pincode|State|$)/i);
    if (addressMatch) {
      const addressText = addressMatch[1].trim();
      data.address = this.parseAddress(addressText);
    }

    // Extract any number/ID/certificate number
    const numberPatterns = [
      /(?:Certificate\s*Number|Cert\s*No|Registration\s*Number|Reg\s*No)[:\s]*([A-Z0-9\/-]+)/i,
      /(?:Number|No|ID|#)[:\s]*([A-Z0-9\/-]{6,})/i,
      /(?:Register\s*Number)[:\s]*([A-Z0-9\/-]+)/i
    ];
    
    for (const pattern of numberPatterns) {
      const numberMatch = text.match(pattern);
      if (numberMatch) {
        data.certificateNumber = numberMatch[1].trim();
        break;
      }
    }

    // Extract year of passing (for educational certificates)
    const yearMatch = text.match(/(?:Year\s*of\s*Passing|Passed\s*in)[:\s]*(\d{4})/i);
    if (yearMatch) {
      data.yearOfPassing = parseInt(yearMatch[1]);
    }

    // Extract school/institution name
    const schoolMatch = text.match(/(?:School|Institution|College)[:\s]*([A-Za-z\s]+?)(?:\n|$)/i);
    if (schoolMatch) {
      data.schoolName = schoolMatch[1].trim();
    }

    // Extract marks/grade
    const marksMatch = text.match(/(?:Marks|Grade|CGPA)[:\s]*([A-Z0-9.+\s]+?)(?:\n|$)/i);
    if (marksMatch) {
      data.marksGrade = marksMatch[1].trim();
    }

    // Extract pension type
    const pensionMatch = text.match(/(?:Pension\s*Type|Type\s*of\s*Pension)[:\s]*([A-Za-z\s]+?)(?:\n|$)/i);
    if (pensionMatch) {
      data.pensionType = pensionMatch[1].trim();
    }

    // Extract amount
    const amountMatch = text.match(/(?:Amount|Pension\s*Amount|Monthly\s*Pension)[:\s]*(?:Rs\.?|₹)?\s*([0-9,]+)/i);
    if (amountMatch) {
      data.amount = parseFloat(amountMatch[1].replace(/,/g, ''));
    }

    data.rawText = text;
    data.confidence = ocrResult.confidence;

    return data;
  }

  /** Extract Death Certificate data */
  extractDeathCertificateData(ocrResult) {
    const text = ocrResult.text;
    const data = {};
    const certMatch = text.match(/(?:Certificate\s*(?:No|Number)|Registration\s*(?:No|Number))[:\s]*([A-Z0-9\/\-]+)/i);
    if (certMatch) data.registrationNumber = certMatch[1].trim();
    const nameMatch = text.match(/(?:Name\s*of\s*(?:Deceased|Dead\s*Person)|Deceased)[:\s]*([A-Za-z\s]{3,40}?)(?:\r?\n|Father|Age|Date|$)/i);
    if (nameMatch) data.deceasedName = nameMatch[1].trim();
    const dodMatch = text.match(/(?:Date\s*of\s*Death|Death\s*Date)[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i);
    if (dodMatch) data.dateOfDeath = this.parseDate(dodMatch[1]);
    const placeMatch = text.match(/(?:Place\s*of\s*Death)[:\s]*([A-Za-z\s,]+?)(?:\r?\n|$)/i);
    if (placeMatch) data.placeOfDeath = placeMatch[1].trim();
    const ageMatch = text.match(/(?:Age)[:\s]*(\d+)/i);
    if (ageMatch) data.age = parseInt(ageMatch[1]);
    const genderMatch = text.match(/\b(Male|Female|MALE|FEMALE)\b/);
    if (genderMatch) data.gender = genderMatch[1].charAt(0).toUpperCase() + genderMatch[1].slice(1).toLowerCase();
    const causeMatch = text.match(/(?:Cause\s*of\s*Death)[:\s]*([A-Za-z\s,]+?)(?:\r?\n|$)/i);
    if (causeMatch) data.causeOfDeath = causeMatch[1].trim();
    const fatherMatch = text.match(/(?:Father|Husband|S\/O|H\/O)[:\s]*([A-Za-z\s]{3,40}?)(?:\r?\n|$)/i);
    if (fatherMatch) data.fatherName = fatherMatch[1].trim();
    const issueDateMatch = text.match(/(?:Date\s*of\s*Issue|Issued\s*on)[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i);
    if (issueDateMatch) data.issueDate = this.parseDate(issueDateMatch[1]);
    const authorityMatch = text.match(/(?:Registrar|Issued\s*by)[:\s]*([A-Za-z\s]+?)(?:\r?\n|$)/i);
    if (authorityMatch) data.issuingAuthority = authorityMatch[1].trim();
    const addressMatch = text.match(/(?:Address|Residence)[:\s]+([\s\S]{5,150}?)(?:\d{6}|$)/i);
    if (addressMatch) data.address = this.parseAddress(addressMatch[1]);
    data.rawText = text; data.confidence = ocrResult.confidence;
    return data;
  }

  /** Extract Caste Certificate data */
  extractCasteCertificateData(ocrResult) {
    const text = ocrResult.text;
    const data = {};
    const certMatch = text.match(/(?:Certificate\s*(?:No|Number))[:\s]*([A-Z0-9\/\-]+)/i);
    if (certMatch) data.certificateNumber = certMatch[1].trim();
    const nameMatch = text.match(/(?:Name|नाम)[:\s]*([A-Za-z\s]{3,40}?)(?:\r?\n|Father|Son|Daughter|$)/i);
    if (nameMatch) data.fullName = nameMatch[1].trim();
    const fatherMatch = text.match(/(?:Father|Son\s*of|Daughter\s*of|S\/O|D\/O)[:\s]*([A-Za-z\s]{3,40}?)(?:\r?\n|$)/i);
    if (fatherMatch) data.fatherName = fatherMatch[1].trim();
    const casteMatch = text.match(/(?:Caste|Community|जाति)[:\s]*([A-Za-z\s\/]+?)(?:\r?\n|Religion|$)/i);
    if (casteMatch) data.caste = casteMatch[1].trim();
    const religionMatch = text.match(/(?:Religion|धर्म)[:\s]*([A-Za-z\s]+?)(?:\r?\n|$)/i);
    if (religionMatch) data.religion = religionMatch[1].trim();
    const issueDateMatch = text.match(/(?:Date\s*of\s*Issue|Issued\s*on|Date)[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i);
    if (issueDateMatch) data.issueDate = this.parseDate(issueDateMatch[1]);
    const authorityMatch = text.match(/(?:Issued\s*by|Authority|Tahsildar|Revenue)[:\s]*([A-Za-z\s]+?)(?:\r?\n|$)/i);
    if (authorityMatch) data.issuingAuthority = authorityMatch[1].trim();
    const addressMatch = text.match(/(?:Address|Resident\s*of)[:\s]+([\s\S]{5,150}?)(?:\d{6}|$)/i);
    if (addressMatch) data.address = this.parseAddress(addressMatch[1]);
    data.rawText = text; data.confidence = ocrResult.confidence;
    return data;
  }

  /** Extract Community Certificate data */
  extractCommunityCertificateData(ocrResult) {
    const text = ocrResult.text;
    const data = {};
    const certMatch = text.match(/(?:Certificate\s*(?:No|Number))[:\s]*([A-Z0-9\/\-]+)/i);
    if (certMatch) data.certificateNumber = certMatch[1].trim();
    const nameMatch = text.match(/(?:Name)[:\s]*([A-Za-z\s]{3,40}?)(?:\r?\n|Father|$)/i);
    if (nameMatch) data.fullName = nameMatch[1].trim();
    const fatherMatch = text.match(/(?:Father|S\/O|D\/O)[:\s]*([A-Za-z\s]{3,40}?)(?:\r?\n|$)/i);
    if (fatherMatch) data.fatherName = fatherMatch[1].trim();
    const communityMatch = text.match(/(?:Community|belongs\s*to)[:\s]*([A-Za-z\s\/]+?)(?:\r?\n|Religion|$)/i);
    if (communityMatch) data.community = communityMatch[1].trim();
    const religionMatch = text.match(/(?:Religion)[:\s]*([A-Za-z\s]+?)(?:\r?\n|$)/i);
    if (religionMatch) data.religion = religionMatch[1].trim();
    const issueDateMatch = text.match(/(?:Date\s*of\s*Issue|Date)[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i);
    if (issueDateMatch) data.issueDate = this.parseDate(issueDateMatch[1]);
    const authorityMatch = text.match(/(?:Issued\s*by|Authority)[:\s]*([A-Za-z\s]+?)(?:\r?\n|$)/i);
    if (authorityMatch) data.issuingAuthority = authorityMatch[1].trim();
    const addressMatch = text.match(/(?:Address|Resident\s*of)[:\s]+([\s\S]{5,150}?)(?:\d{6}|$)/i);
    if (addressMatch) data.address = this.parseAddress(addressMatch[1]);
    data.rawText = text; data.confidence = ocrResult.confidence;
    return data;
  }

  /** Extract Domicile Certificate data */
  extractDomicileCertificateData(ocrResult) {
    const text = ocrResult.text;
    const data = {};
    const certMatch = text.match(/(?:Certificate\s*(?:No|Number))[:\s]*([A-Z0-9\/\-]+)/i);
    if (certMatch) data.certificateNumber = certMatch[1].trim();
    const nameMatch = text.match(/(?:Name)[:\s]*([A-Za-z\s]{3,40}?)(?:\r?\n|Father|$)/i);
    if (nameMatch) data.fullName = nameMatch[1].trim();
    const fatherMatch = text.match(/(?:Father|S\/O)[:\s]*([A-Za-z\s]{3,40}?)(?:\r?\n|$)/i);
    if (fatherMatch) data.fatherName = fatherMatch[1].trim();
    const motherMatch = text.match(/(?:Mother|M\/O)[:\s]*([A-Za-z\s]{3,40}?)(?:\r?\n|$)/i);
    if (motherMatch) data.motherName = motherMatch[1].trim();
    const dobMatch = text.match(/(?:Date\s*of\s*Birth|DOB)[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i);
    if (dobMatch) data.dateOfBirth = this.parseDate(dobMatch[1]);
    const yearsMatch = text.match(/(?:residing|resident|domicile)\s*(?:for|since)?\s*(\d+)\s*years?/i);
    if (yearsMatch) data.yearsOfResidence = parseInt(yearsMatch[1]);
    const addressMatch = text.match(/(?:Permanent\s*Address|Address|Resident\s*of)[:\s]+([\s\S]{5,200}?)(?:\d{6}|$)/i);
    if (addressMatch) data.permanentAddress = addressMatch[1].trim().replace(/\n/g, ', ');
    const issueDateMatch = text.match(/(?:Date\s*of\s*Issue|Date)[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i);
    if (issueDateMatch) data.issueDate = this.parseDate(issueDateMatch[1]);
    const authorityMatch = text.match(/(?:Issued\s*by|Authority|Tahsildar)[:\s]*([A-Za-z\s]+?)(?:\r?\n|$)/i);
    if (authorityMatch) data.issuingAuthority = authorityMatch[1].trim();
    data.rawText = text; data.confidence = ocrResult.confidence;
    return data;
  }

  /** Extract Residence Certificate data */
  extractResidenceCertificateData(ocrResult) {
    const text = ocrResult.text;
    const data = {};
    const certMatch = text.match(/(?:Certificate\s*(?:No|Number))[:\s]*([A-Z0-9\/\-]+)/i);
    if (certMatch) data.certificateNumber = certMatch[1].trim();
    const nameMatch = text.match(/(?:Name)[:\s]*([A-Za-z\s]{3,40}?)(?:\r?\n|Father|$)/i);
    if (nameMatch) data.fullName = nameMatch[1].trim();
    const fatherMatch = text.match(/(?:Father|Husband|S\/O|H\/O)[:\s]*([A-Za-z\s]{3,40}?)(?:\r?\n|$)/i);
    if (fatherMatch) data.fatherName = fatherMatch[1].trim();
    const localBodyMatch = text.match(/(?:Panchayat|Municipality|Corporation|Local\s*Body)[:\s]*([A-Za-z\s]+?)(?:\r?\n|$)/i);
    if (localBodyMatch) data.localBody = localBodyMatch[1].trim();
    const periodMatch = text.match(/(?:Period\s*of\s*Residence|residing\s*since)[:\s]*([A-Za-z0-9\s\-\/]+?)(?:\r?\n|$)/i);
    if (periodMatch) data.periodOfResidence = periodMatch[1].trim();
    const issueDateMatch = text.match(/(?:Date\s*of\s*Issue|Date)[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i);
    if (issueDateMatch) data.issueDate = this.parseDate(issueDateMatch[1]);
    const authorityMatch = text.match(/(?:Issued\s*by|Authority)[:\s]*([A-Za-z\s]+?)(?:\r?\n|$)/i);
    if (authorityMatch) data.issuingAuthority = authorityMatch[1].trim();
    const addressMatch = text.match(/(?:Address|Resident\s*of)[:\s]+([\s\S]{5,150}?)(?:\d{6}|$)/i);
    if (addressMatch) data.address = this.parseAddress(addressMatch[1]);
    data.rawText = text; data.confidence = ocrResult.confidence;
    return data;
  }

  /** Extract Marriage Certificate data */
  extractMarriageCertificateData(ocrResult) {
    const text = ocrResult.text;
    const data = {};
    const regMatch = text.match(/(?:Registration\s*(?:No|Number)|Reg\s*No)[:\s]*([A-Z0-9\/\-]+)/i);
    if (regMatch) data.registrationNumber = regMatch[1].trim();
    const husbandMatch = text.match(/(?:Husband|Groom|Bridegroom)['\s]*s?\s*Name[:\s]*([A-Za-z\s]{3,40}?)(?:\r?\n|Wife|Bride|Date|$)/i);
    if (husbandMatch) data.husbandName = husbandMatch[1].trim();
    const wifeMatch = text.match(/(?:Wife|Bride)['\s]*s?\s*Name[:\s]*([A-Za-z\s]{3,40}?)(?:\r?\n|Date|Place|$)/i);
    if (wifeMatch) data.wifeName = wifeMatch[1].trim();
    const domMatch = text.match(/(?:Date\s*of\s*Marriage|Marriage\s*Date)[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i);
    if (domMatch) data.dateOfMarriage = this.parseDate(domMatch[1]);
    const placeMatch = text.match(/(?:Place\s*of\s*Marriage|Venue)[:\s]*([A-Za-z\s,]+?)(?:\r?\n|$)/i);
    if (placeMatch) data.placeOfMarriage = placeMatch[1].trim();
    const issueDateMatch = text.match(/(?:Date\s*of\s*Issue|Issued\s*on)[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i);
    if (issueDateMatch) data.issueDate = this.parseDate(issueDateMatch[1]);
    const authorityMatch = text.match(/(?:Registrar|Issued\s*by)[:\s]*([A-Za-z\s]+?)(?:\r?\n|$)/i);
    if (authorityMatch) data.issuingAuthority = authorityMatch[1].trim();
    data.rawText = text; data.confidence = ocrResult.confidence;
    return data;
  }

  /** Extract SSLC / 10th Certificate data */
  extractSSLCData(ocrResult) {
    const text = ocrResult.text;
    const data = {};
    const regMatch = text.match(/(?:Register\s*(?:No|Number)|Roll\s*(?:No|Number))[:\s]*([A-Z0-9\/\-]+)/i);
    if (regMatch) data.registerNumber = regMatch[1].trim();
    const nameMatch = text.match(/(?:Name\s*of\s*(?:Student|Candidate)|Student['\s]*s?\s*Name)[:\s]*([A-Za-z\s]{3,40}?)(?:\r?\n|DOB|Date|Father|$)/i);
    if (nameMatch) data.studentName = nameMatch[1].trim();
    const dobMatch = text.match(/(?:Date\s*of\s*Birth|DOB)[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i);
    if (dobMatch) data.dateOfBirth = this.parseDate(dobMatch[1]);
    const fatherMatch = text.match(/(?:Father)['\s]*s?\s*Name[:\s]*([A-Za-z\s]{3,40}?)(?:\r?\n|Mother|$)/i);
    if (fatherMatch) data.fatherName = fatherMatch[1].trim();
    const motherMatch = text.match(/(?:Mother)['\s]*s?\s*Name[:\s]*([A-Za-z\s]{3,40}?)(?:\r?\n|$)/i);
    if (motherMatch) data.motherName = motherMatch[1].trim();
    const schoolMatch = text.match(/(?:School|Institution)[:\s]*([A-Za-z\s,]+?)(?:\r?\n|$)/i);
    if (schoolMatch) data.schoolName = schoolMatch[1].trim();
    const yearMatch = text.match(/(?:Year\s*of\s*Passing|Passed\s*in|Month\s*&\s*Year)[:\s]*(?:[A-Za-z]+\s*)?(\d{4})/i);
    if (yearMatch) data.yearOfPassing = parseInt(yearMatch[1]);
    const marksMatch = text.match(/(?:Total\s*Marks|Percentage|Grade|Result)[:\s]*([A-Z0-9.%\s]+?)(?:\r?\n|$)/i);
    if (marksMatch) data.marksGrade = marksMatch[1].trim();
    data.rawText = text; data.confidence = ocrResult.confidence;
    return data;
  }

  /** Extract Pension Certificate data */
  extractPensionCertificateData(ocrResult) {
    const text = ocrResult.text;
    const data = {};
    const pensionIdMatch = text.match(/(?:PPO\s*(?:No|Number)|Pension\s*(?:ID|No|Number))[:\s]*([A-Z0-9\/\-]+)/i);
    if (pensionIdMatch) data.pensionId = pensionIdMatch[1].trim();
    const nameMatch = text.match(/(?:Name\s*of\s*Pensioner|Pensioner['\s]*s?\s*Name|Name)[:\s]*([A-Za-z\s]{3,40}?)(?:\r?\n|$)/i);
    if (nameMatch) data.pensionerName = nameMatch[1].trim();
    const typeMatch = text.match(/(?:Type\s*of\s*Pension|Pension\s*Type)[:\s]*([A-Za-z\s]+?)(?:\r?\n|$)/i);
    if (typeMatch) data.pensionType = typeMatch[1].trim();
    const aadhaarMatch = text.match(/\b(\d{4}[\s\-]?\d{4}[\s\-]?\d{4})\b/);
    if (aadhaarMatch) data.aadhaarNumber = aadhaarMatch[1].replace(/[\s\-]/g, '');
    const bankMatch = text.match(/(?:Bank\s*Account|Account\s*(?:No|Number))[:\s]*([A-Z0-9\s]+?)(?:\r?\n|$)/i);
    if (bankMatch) data.bankAccountDetails = bankMatch[1].trim();
    const amountMatch = text.match(/(?:Monthly\s*Pension|Pension\s*Amount|Amount)[:\s]*(?:Rs\.?|₹)?\s*([0-9,]+)/i);
    if (amountMatch) data.amount = parseFloat(amountMatch[1].replace(/,/g, ''));
    const issueDateMatch = text.match(/(?:Date\s*of\s*Issue|Date)[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i);
    if (issueDateMatch) data.issueDate = this.parseDate(issueDateMatch[1]);
    const addressMatch = text.match(/(?:Address)[:\s]+([\s\S]{5,150}?)(?:\d{6}|$)/i);
    if (addressMatch) data.address = this.parseAddress(addressMatch[1]);
    data.rawText = text; data.confidence = ocrResult.confidence;
    return data;
  }

  /** Extract Disability Certificate data */
  extractDisabilityCertificateData(ocrResult) {
    const text = ocrResult.text;
    const data = {};
    const certMatch = text.match(/(?:Certificate\s*(?:No|Number))[:\s]*([A-Z0-9\/\-]+)/i);
    if (certMatch) data.certificateNumber = certMatch[1].trim();
    const nameMatch = text.match(/(?:Name)[:\s]*([A-Za-z\s]{3,40}?)(?:\r?\n|Father|Guardian|$)/i);
    if (nameMatch) data.fullName = nameMatch[1].trim();
    const fatherMatch = text.match(/(?:Father|Guardian)['\s]*s?\s*Name[:\s]*([A-Za-z\s]{3,40}?)(?:\r?\n|$)/i);
    if (fatherMatch) data.fatherName = fatherMatch[1].trim();
    const dobMatch = text.match(/(?:Date\s*of\s*Birth|DOB)[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i);
    if (dobMatch) data.dateOfBirth = this.parseDate(dobMatch[1]);
    const disTypeMatch = text.match(/(?:Type\s*of\s*Disability|Nature\s*of\s*Disability|Disability)[:\s]*([A-Za-z\s,]+?)(?:\r?\n|Percentage|%|$)/i);
    if (disTypeMatch) data.disabilityType = disTypeMatch[1].trim();
    const percentMatch = text.match(/(\d+)\s*%/);
    if (percentMatch) data.disabilityPercentage = parseInt(percentMatch[1]);
    const issueDateMatch = text.match(/(?:Date\s*of\s*Issue|Date)[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i);
    if (issueDateMatch) data.issueDate = this.parseDate(issueDateMatch[1]);
    const expiryMatch = text.match(/(?:Valid\s*Till|Expiry\s*Date)[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i);
    if (expiryMatch) data.expiryDate = this.parseDate(expiryMatch[1]);
    const authorityMatch = text.match(/(?:Medical\s*Authority|Issued\s*by|Hospital)[:\s]*([A-Za-z\s]+?)(?:\r?\n|$)/i);
    if (authorityMatch) data.issuingAuthority = authorityMatch[1].trim();
    const addressMatch = text.match(/(?:Address)[:\s]+([\s\S]{5,150}?)(?:\d{6}|$)/i);
    if (addressMatch) data.address = this.parseAddress(addressMatch[1]);
    data.rawText = text; data.confidence = ocrResult.confidence;
    return data;
  }

  /** Extract Employment / Experience Certificate data */
  extractEmploymentCertificateData(ocrResult) {
    const text = ocrResult.text;
    const data = {};
    const certMatch = text.match(/(?:Certificate\s*(?:No|Number))[:\s]*([A-Z0-9\/\-]+)/i);
    if (certMatch) data.certificateNumber = certMatch[1].trim();
    const nameMatch = text.match(/(?:Employee\s*Name|Name\s*of\s*Employee|Name)[:\s]*([A-Za-z\s]{3,40}?)(?:\r?\n|Employee\s*ID|Designation|$)/i);
    if (nameMatch) data.fullName = nameMatch[1].trim();
    const empIdMatch = text.match(/(?:Employee\s*(?:ID|Code|No))[:\s]*([A-Z0-9\/\-]+)/i);
    if (empIdMatch) data.employeeId = empIdMatch[1].trim();
    const employerMatch = text.match(/(?:Organization|Company|Employer|Firm)[:\s]*([A-Za-z\s,\.]+?)(?:\r?\n|$)/i);
    if (employerMatch) data.employerName = employerMatch[1].trim();
    const designationMatch = text.match(/(?:Designation|Post|Position)[:\s]*([A-Za-z\s]+?)(?:\r?\n|$)/i);
    if (designationMatch) data.designation = designationMatch[1].trim();
    const issueDateMatch = text.match(/(?:Date\s*of\s*Issue|Date)[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i);
    if (issueDateMatch) data.issueDate = this.parseDate(issueDateMatch[1]);
    data.rawText = text; data.confidence = ocrResult.confidence;
    return data;
  }

  /** Extract Land Record / Patta data */
  extractLandRecordData(ocrResult) {
    const text = ocrResult.text;
    const data = {};
    const surveyMatch = text.match(/(?:Survey\s*(?:No|Number)|Patta\s*(?:No|Number))[:\s]*([A-Z0-9\/\-]+)/i);
    if (surveyMatch) data.surveyNumber = surveyMatch[1].trim();
    const nameMatch = text.match(/(?:Owner|Name)[:\s]*([A-Za-z\s]{3,40}?)(?:\r?\n|Father|$)/i);
    if (nameMatch) data.fullName = nameMatch[1].trim();
    const fatherMatch = text.match(/(?:Father|S\/O)[:\s]*([A-Za-z\s]{3,40}?)(?:\r?\n|$)/i);
    if (fatherMatch) data.fatherName = fatherMatch[1].trim();
    const areaMatch = text.match(/(?:Area|Extent)[:\s]*([0-9.]+\s*(?:Acres?|Hectares?|Cents?|Sq\.?\s*(?:Ft|Meters?)))/i);
    if (areaMatch) data.area = areaMatch[1].trim();
    const landTypeMatch = text.match(/(?:Land\s*Type|Classification|Nature)[:\s]*([A-Za-z\s]+?)(?:\r?\n|$)/i);
    if (landTypeMatch) data.landType = landTypeMatch[1].trim();
    const issueDateMatch = text.match(/(?:Date\s*of\s*Issue|Date)[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i);
    if (issueDateMatch) data.issueDate = this.parseDate(issueDateMatch[1]);
    const addressMatch = text.match(/(?:Village|Taluk|District|Location)[:\s]+([\s\S]{5,150}?)(?:\d{6}|$)/i);
    if (addressMatch) data.address = this.parseAddress(addressMatch[1]);
    data.rawText = text; data.confidence = ocrResult.confidence;
    return data;
  }

  /** Extract Bank Passbook data */
  extractBankPassbookData(ocrResult) {
    const text = ocrResult.text;
    const data = {};
    const accMatch = text.match(/(?:Account\s*(?:No|Number))[:\s]*([0-9\s]{9,18})/i);
    if (accMatch) data.accountNumber = accMatch[1].replace(/\s/g, '').trim();
    const nameMatch = text.match(/(?:Account\s*Holder|Name)[:\s]*([A-Za-z\s]{3,40}?)(?:\r?\n|$)/i);
    if (nameMatch) data.fullName = nameMatch[1].trim();
    const bankMatch = text.match(/(?:Bank\s*Name|Bank)[:\s]*([A-Za-z\s]+?)(?:\r?\n|Branch|IFSC|$)/i);
    if (bankMatch) data.bankName = bankMatch[1].trim();
    const ifscMatch = text.match(/(?:IFSC\s*(?:Code)?)[:\s]*([A-Z]{4}0[A-Z0-9]{6})/i);
    if (ifscMatch) data.ifscCode = ifscMatch[1].toUpperCase();
    const branchMatch = text.match(/(?:Branch)[:\s]*([A-Za-z\s,]+?)(?:\r?\n|IFSC|$)/i);
    if (branchMatch) data.branchName = branchMatch[1].trim();
    const addressMatch = text.match(/(?:Address)[:\s]+([\s\S]{5,150}?)(?:\d{6}|$)/i);
    if (addressMatch) data.address = this.parseAddress(addressMatch[1]);
    data.rawText = text; data.confidence = ocrResult.confidence;
    return data;
  }

  /** Extract Educational Certificate data */
  extractEducationalCertificateData(ocrResult) {
    const text = ocrResult.text;
    const data = {};
    const certMatch = text.match(/(?:Certificate\s*(?:No|Number)|Roll\s*(?:No|Number))[:\s]*([A-Z0-9\/\-]+)/i);
    if (certMatch) data.certificateNumber = certMatch[1].trim();
    const nameMatch = text.match(/(?:Name\s*of\s*(?:Student|Candidate)|Student['\s]*s?\s*Name|Name)[:\s]*([A-Za-z\s]{3,40}?)(?:\r?\n|DOB|Date|$)/i);
    if (nameMatch) data.fullName = nameMatch[1].trim();
    const dobMatch = text.match(/(?:Date\s*of\s*Birth|DOB)[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i);
    if (dobMatch) data.dateOfBirth = this.parseDate(dobMatch[1]);
    const institutionMatch = text.match(/(?:University|College|Institution|School)[:\s]*([A-Za-z\s,]+?)(?:\r?\n|$)/i);
    if (institutionMatch) data.institutionName = institutionMatch[1].trim();
    const courseMatch = text.match(/(?:Course|Degree|Programme|Program)[:\s]*([A-Za-z\s.]+?)(?:\r?\n|$)/i);
    if (courseMatch) data.courseName = courseMatch[1].trim();
    const yearMatch = text.match(/(?:Year\s*of\s*Passing|Passed\s*in)[:\s]*(?:[A-Za-z]+\s*)?(\d{4})/i);
    if (yearMatch) data.yearOfPassing = parseInt(yearMatch[1]);
    const marksMatch = text.match(/(?:Marks|Percentage|Grade|CGPA)[:\s]*([A-Z0-9.%\s]+?)(?:\r?\n|$)/i);
    if (marksMatch) data.marksGrade = marksMatch[1].trim();
    const issueDateMatch = text.match(/(?:Date\s*of\s*Issue|Date)[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i);
    if (issueDateMatch) data.issueDate = this.parseDate(issueDateMatch[1]);
    data.rawText = text; data.confidence = ocrResult.confidence;
    return data;
  }
}

export default new OCRService();
