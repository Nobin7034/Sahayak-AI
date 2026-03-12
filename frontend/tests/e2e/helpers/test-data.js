export const testUsers = {
  regular: {
    email: 'testuser@example.com',
    password: 'Test@123',
    name: 'Test User',
    phone: '9876543210'
  },
  admin: {
    email: 'admin@example.com',
    password: 'Admin@123',
    name: 'Admin User'
  },
  staff: {
    email: 'staff@example.com',
    password: 'Staff@123',
    name: 'Staff User'
  }
};

export const testService = {
  name: 'Test Service',
  description: 'Test service description',
  category: 'Government',
  price: 500,
  duration: 30
};

export const testAppointment = {
  date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 4 days from now
  time: '10:00',
  notes: 'Test appointment notes'
};

export const testCenter = {
  name: 'Test Center',
  address: 'Test Address, Test City',
  pincode: '560001',
  phone: '9876543210',
  email: 'testcenter@example.com'
};

export const testNews = {
  title: 'Test News Article',
  content: 'This is a test news article content',
  category: 'Announcement'
};
