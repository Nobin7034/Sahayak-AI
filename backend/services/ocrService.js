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
        'eng+hin', // English and Hindi support
        {
          ...this.tesseractOptions,
          ...options
        }
      );
      
      // Clean up processed image if it's different from original
      if (processedImagePath !== imagePath) {
        fs.unlinkSync(processedImagePath);
      }
      
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
      const processedPath = imagePath.replace(/\.(jpg|jpeg|png)$/i, '_processed.png');
      
      await sharp(imagePath)
        .resize(2000, null, { 
          withoutEnlargement: true,
          fit: 'inside'
        })
        .grayscale()
        .normalize()
        .sharpen()
        .png({ quality: 90 })
        .toFile(processedPath);
      
      return processedPath;
    } catch (error) {
      console.error('Image preprocessing failed:', error);
      return imagePath; // Return original if preprocessing fails
    }
  }

  /**
   * Extract structured data from Aadhaar card
   */
  extractAadhaarData(ocrResult) {
    const text = ocrResult.text;
    const data = {};
    
    // Extract Aadhaar number (12 digits)
    const aadhaarMatch = text.match(/\b\d{4}\s*\d{4}\s*\d{4}\b/);
    if (aadhaarMatch) {
      data.aadhaarNumber = aadhaarMatch[0].replace(/\s/g, '');
    }
    
    // Extract name (usually after "Name:" or before DOB)
    const namePatterns = [
      /(?:Name[:\s]*|नाम[:\s]*)(.*?)(?:\n|Date of Birth|DOB|जन्म)/i,
      /^([A-Z\s]+)$/m
    ];
    
    for (const pattern of namePatterns) {
      const nameMatch = text.match(pattern);
      if (nameMatch && nameMatch[1]) {
        data.fullName = nameMatch[1].trim();
        break;
      }
    }
    
    // Extract Date of Birth
    const dobPatterns = [
      /(?:DOB|Date of Birth|जन्म तिथि)[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/i,
      /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/
    ];
    
    for (const pattern of dobPatterns) {
      const dobMatch = text.match(pattern);
      if (dobMatch) {
        data.dateOfBirth = this.parseDate(dobMatch[1]);
        break;
      }
    }
    
    // Extract gender
    const genderMatch = text.match(/(?:Gender|लिंग)[:\s]*(Male|Female|पुरुष|महिला)/i);
    if (genderMatch) {
      data.gender = genderMatch[1].toLowerCase().includes('male') || genderMatch[1].includes('पुरुष') ? 'Male' : 'Female';
    }
    
    // Extract father's name
    const fatherMatch = text.match(/(?:Father|पिता)[:\s]*(.*?)(?:\n|Address|पता)/i);
    if (fatherMatch) {
      data.fatherName = fatherMatch[1].trim();
    }
    
    // Extract address
    const addressMatch = text.match(/(?:Address|पता)[:\s]*(.*?)(?:\n.*?PIN|$)/is);
    if (addressMatch) {
      data.address = this.parseAddress(addressMatch[1]);
    }
    
    // Extract PIN code
    const pinMatch = text.match(/PIN[:\s]*(\d{6})/i) || text.match(/(\d{6})/);
    if (pinMatch) {
      data.address = data.address || {};
      data.address.pincode = pinMatch[1];
    }
    
    // Extract mobile number
    const mobileMatch = text.match(/(?:Mobile|Mob)[:\s]*(\d{10})/i);
    if (mobileMatch) {
      data.mobileNumber = mobileMatch[1];
    }
    
    return {
      ...data,
      rawText: text,
      confidence: ocrResult.confidence
    };
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
    const data = {};
    
    // Extract ration card number
    const rationMatch = text.match(/(?:Card No|कार्ड संख्या)[:\s]*([A-Z0-9]+)/i);
    if (rationMatch) {
      data.rationCardNumber = rationMatch[1];
    }
    
    // Extract head of family name
    const nameMatch = text.match(/(?:Head of Family|मुखिया)[:\s]*(.*?)(?:\n|Father)/i);
    if (nameMatch) {
      data.fullName = nameMatch[1].trim();
    }
    
    // Extract address
    const addressMatch = text.match(/(?:Address|पता)[:\s]*(.*?)(?:\n.*?PIN|$)/is);
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
        case 'caste_certificate':
        case 'community_certificate':
        case 'domicile_certificate':
        case 'residence_certificate':
        case 'marriage_certificate':
        case 'sslc_certificate':
        case 'pension_certificate':
          // Use generic extraction for these document types
          extractedData = this.extractGenericData(ocrResult);
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

    // Extract any name
    const nameMatch = text.match(/(?:Name)[:\s]*([A-Z][A-Za-z\s]+)/i);
    if (nameMatch) {
      data.fullName = nameMatch[1].trim();
    }

    // Extract any date
    const dateMatch = text.match(/(?:Date)[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i);
    if (dateMatch) {
      data.dateOfBirth = this.parseDate(dateMatch[1]);
    }

    // Extract any number/ID
    const numberMatch = text.match(/(?:Number|No|ID|#)[:\s]*([A-Z0-9\/-]+)/i);
    if (numberMatch) {
      data.certificateNumber = numberMatch[1].trim();
    }

    data.rawText = text;
    data.confidence = ocrResult.confidence;

    return data;
  }
}

export default new OCRService();