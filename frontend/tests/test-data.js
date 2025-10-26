// Test data configuration
export const testData = {
  validUser: {
    email: 'nobin@gmail.com',
    password: 'Nobin@7034',
    role: 'user'
  },
  validAdmin: {
    email: 'nobin@gmail.com',
    password: 'Nobin@7034',
    role: 'admin'
  },
  invalidCredentials: {
    email: 'invalid@example.com',
    password: 'wrongpassword',
    role: 'user'
  },
  invalidEmail: {
    email: 'invalid-email',
    password: 'Nobin@7034',
    role: 'user'
  },
  emptyFields: {
    email: '',
    password: '',
    role: 'user'
  }
};

export const selectors = {
  emailInput: '#email',
  passwordInput: '#password',
  roleUser: 'input[value="user"]',
  roleAdmin: 'input[value="admin"]',
  signInButton: 'button[type="submit"]',
  googleSignInButton: 'button:has-text("Sign in with Google")',
  forgotPasswordLink: 'a:has-text("Forgot Password")',
  signUpLink: 'a:has-text("Sign Up")',
  backToHomeLink: 'a:has-text("Back to Home")',
  errorMessage: '.bg-red-100',
  loadingText: 'text="Signing in..."',
  welcomeText: 'text="Welcome Back"',
  eyeIcon: 'button[type="button"]:has(svg)',
  logo: 'text="Sahayak AI"'
};

export const urls = {
  login: '/login',
  dashboard: '/dashboard',
  adminDashboard: '/admin/dashboard',
  register: '/register',
  home: '/'
};
