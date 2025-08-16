// Mock data for the application
export const newsData = [
  {
    id: 1,
    title: "New Digital Certificate Service Launched",
    excerpt: "Kerala Government launches new digital certificate service for faster document processing.",
    content: "The Kerala Government has announced the launch of a new digital certificate service that will significantly reduce the time required for document processing. Citizens can now apply for various certificates online and receive them digitally, eliminating the need for physical visits to government offices.",
    date: "2025-01-10",
    image: "https://images.pexels.com/photos/7172858/pexels-photo-7172858.jpeg?auto=compress&cs=tinysrgb&w=600"
  },
  {
    id: 2,
    title: "Akshaya Centers Now Accept Online Payments",
    excerpt: "All Akshaya centers across Kerala now support UPI and online payment methods.",
    content: "In a major step towards digitalization, all Akshaya centers across Kerala now accept online payments including UPI, credit cards, and internet banking. This initiative aims to provide seamless service delivery and reduce the need for cash transactions.",
    date: "2025-01-08",
    image: "https://images.pexels.com/photos/7172831/pexels-photo-7172831.jpeg?auto=compress&cs=tinysrgb&w=600"
  },
  {
    id: 3,
    title: "Extended Service Hours During Festival Season",
    excerpt: "Akshaya centers will have extended working hours during the upcoming festival season.",
    content: "To accommodate the increased demand during the festival season, Akshaya centers will operate with extended hours. Centers will be open from 8 AM to 8 PM on weekdays and 9 AM to 5 PM on weekends.",
    date: "2025-01-05",
    image: "https://images.pexels.com/photos/6863183/pexels-photo-6863183.jpeg?auto=compress&cs=tinysrgb&w=600"
  }
]

export const servicesData = [
  {
    id: 1,
    name: "Birth Certificate",
    description: "Apply for official birth certificate",
    category: "Civil Registration",
    fee: 50,
    processingTime: "7-10 days",
    documents: [
      {
        name: "Hospital Birth Record",
        required: true,
        description: "Original birth record from the hospital where birth occurred",
        demoImage: "https://images.pexels.com/photos/263402/pexels-photo-263402.jpeg?auto=compress&cs=tinysrgb&w=400"
      },
      {
        name: "Parent's ID Proof",
        required: true,
        description: "Aadhaar Card or Passport of either parent",
        demoImage: "https://images.pexels.com/photos/6801648/pexels-photo-6801648.jpeg?auto=compress&cs=tinysrgb&w=400"
      },
      {
        name: "Address Proof",
        required: true,
        description: "Utility bill or rental agreement as address proof",
        demoImage: "https://images.pexels.com/photos/4386321/pexels-photo-4386321.jpeg?auto=compress&cs=tinysrgb&w=400"
      }
    ]
  },
  {
    id: 2,
    name: "Income Certificate",
    description: "Official income certificate for various purposes",
    category: "Revenue",
    fee: 25,
    processingTime: "5-7 days",
    documents: [
      {
        name: "Salary Certificate",
        required: true,
        description: "Latest salary certificate from employer",
        demoImage: "https://images.pexels.com/photos/6863183/pexels-photo-6863183.jpeg?auto=compress&cs=tinysrgb&w=400"
      },
      {
        name: "Bank Statements",
        required: true,
        description: "Last 6 months bank statements",
        demoImage: "https://images.pexels.com/photos/4386321/pexels-photo-4386321.jpeg?auto=compress&cs=tinysrgb&w=400"
      },
      {
        name: "Aadhaar Card",
        required: true,
        description: "Copy of Aadhaar card",
        demoImage: "https://images.pexels.com/photos/6801648/pexels-photo-6801648.jpeg?auto=compress&cs=tinysrgb&w=400"
      }
    ]
  },
  {
    id: 3,
    name: "Aadhaar Enrollment",
    description: "New Aadhaar card registration and enrollment",
    category: "Identity",
    fee: 0,
    processingTime: "15-20 days",
    documents: [
      {
        name: "Proof of Identity",
        required: true,
        description: "Passport, PAN Card, or Driving License",
        demoImage: "https://images.pexels.com/photos/6801648/pexels-photo-6801648.jpeg?auto=compress&cs=tinysrgb&w=400"
      },
      {
        name: "Proof of Address",
        required: true,
        description: "Utility bill, bank statement, or rental agreement",
        demoImage: "https://images.pexels.com/photos/4386321/pexels-photo-4386321.jpeg?auto=compress&cs=tinysrgb&w=400"
      },
      {
        name: "Date of Birth Proof",
        required: true,
        description: "Birth certificate, school certificate, or passport",
        demoImage: "https://images.pexels.com/photos/263402/pexels-photo-263402.jpeg?auto=compress&cs=tinysrgb&w=400"
      }
    ]
  },
  {
    id: 4,
    name: "Ration Card",
    description: "Apply for new ration card or renewal",
    category: "Civil Supplies",
    fee: 0,
    processingTime: "10-15 days",
    documents: [
      {
        name: "Family Photo",
        required: true,
        description: "Recent family photograph",
        demoImage: "https://images.pexels.com/photos/1153213/pexels-photo-1153213.jpeg?auto=compress&cs=tinysrgb&w=400"
      },
      {
        name: "Income Certificate",
        required: true,
        description: "Latest income certificate",
        demoImage: "https://images.pexels.com/photos/6863183/pexels-photo-6863183.jpeg?auto=compress&cs=tinysrgb&w=400"
      },
      {
        name: "Address Proof",
        required: true,
        description: "Utility bill or house tax receipt",
        demoImage: "https://images.pexels.com/photos/4386321/pexels-photo-4386321.jpeg?auto=compress&cs=tinysrgb&w=400"
      }
    ]
  }
]

export const akshayaCenters = [
  {
    id: 1,
    name: "Akshaya Center Thiruvananthapuram",
    address: "TC 25/1234, Medical College Road, Thiruvananthapuram",
    phone: "+91 471-2345678",
    email: "tvm.akshaya@kerala.gov.in",
    hours: "9:00 AM - 6:00 PM",
    services: ["All Government Services", "Digital Payments", "Document Verification"],
    rating: 4.5
  },
  {
    id: 2,
    name: "Akshaya Center Kochi",
    address: "NH 47, Kaloor, Kochi, Ernakulam",
    phone: "+91 484-2345678",
    email: "kochi.akshaya@kerala.gov.in",
    hours: "9:00 AM - 6:00 PM",
    services: ["Certificate Services", "Registration", "Online Applications"],
    rating: 4.3
  },
  {
    id: 3,
    name: "Akshaya Center Kozhikode",
    address: "Mavoor Road, Kozhikode",
    phone: "+91 495-2345678",
    email: "kozhikode.akshaya@kerala.gov.in",
    hours: "9:00 AM - 6:00 PM",
    services: ["Civil Registration", "Revenue Services", "Digital Services"],
    rating: 4.6
  }
]