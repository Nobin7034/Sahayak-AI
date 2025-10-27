import React, { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'
import { auth, googleProvider } from '../firebase'
import { signInWithPopup, onAuthStateChanged, signOut as firebaseSignOut, GoogleAuthProvider } from 'firebase/auth'

const AuthContext = createContext()

// Set up axios defaults
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
axios.defaults.baseURL = API_BASE_URL

// Attach auth token to every request
// - For /api/admin/*: ONLY use backend JWT (manual login)
// - For other routes: prefer backend JWT, fallback to Firebase ID token
axios.interceptors.request.use(async (config) => {
  try {
    config.headers = config.headers || {}

    const isAdminApi = typeof config.url === 'string' && config.url.startsWith('/admin')
    const jwtToken = localStorage.getItem('token')

    if (isAdminApi) {
      // Admin endpoints must use backend JWT
      if (jwtToken) {
        config.headers.Authorization = `Bearer ${jwtToken}`
      } else if (config?.headers?.Authorization) {
        delete config.headers.Authorization
      }
      return config
    }

    // Non-admin endpoints
    if (jwtToken) {
      config.headers.Authorization = `Bearer ${jwtToken}`
      return config
    }

    const currentUser = auth.currentUser
    if (currentUser) {
      const token = await currentUser.getIdToken(false)
      config.headers.Authorization = `Bearer ${token}`
    } else if (config?.headers?.Authorization) {
      delete config.headers.Authorization
    }
  } catch (e) {
    // noop: let request proceed without token
  }
  return config
})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initializeAuth = () => {
      console.log('AuthContext - Initializing auth...')

      // Listen to Firebase auth state changes
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        console.log('Firebase auth state changed:', !!firebaseUser)

        if (firebaseUser) {
          console.log('Firebase user found:', firebaseUser.email)

          // Check if we have backend auth
          const token = localStorage.getItem('token')
          const storedUser = localStorage.getItem('user')

          if (token && storedUser) {
            try {
              // Set axios default header
              axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
              console.log('AuthContext - Set authorization header')

              // Verify token is still valid
              const response = await axios.get('/auth/me')
              console.log('AuthContext - Token verification response:', response.data)

              if (response.data.success) {
                setUser(response.data.user)
                console.log('AuthContext - User set from token verification:', response.data.user)
              } else {
                // Token invalid, clear storage
                console.log('AuthContext - Token verification failed, clearing storage')
                localStorage.removeItem('token')
                localStorage.removeItem('user')
                delete axios.defaults.headers.common['Authorization']
              }
            } catch (error) {
              console.error('AuthContext - Token verification failed:', error)
              localStorage.removeItem('token')
              localStorage.removeItem('user')
              delete axios.defaults.headers.common['Authorization']
            }
          } else {
            console.log('AuthContext - Firebase user but no backend auth, syncing with backend using Firebase ID token')
            try {
              // Get fresh Firebase ID token
              const firebaseIdToken = await auth.currentUser.getIdToken(true)

              // Send Firebase ID token to backend for verification/login
              // Backend will handle role assignment (always 'user' for new accounts)
              const response = await axios.post('/auth/google', {
                token: firebaseIdToken
                // No role parameter - backend assigns role automatically
              })

              console.log('AuthContext - Auto-sync with backend response:', response.data)

              if (response.data.success) {
                const { user: backendUser } = response.data

                // Store user data only (no backend token now)
                localStorage.setItem('user', JSON.stringify(backendUser))

                // Set axios default header to Firebase ID token for subsequent calls
                axios.defaults.headers.common['Authorization'] = `Bearer ${firebaseIdToken}`

                setUser(backendUser)
                console.log('AuthContext - User set from auto-sync:', backendUser)
              } else {
                console.log('AuthContext - Auto-sync failed, user may need to sign in again')
                await firebaseSignOut(auth)
              }
            } catch (error) {
              console.error('AuthContext - Auto-sync failed:', error)
              await firebaseSignOut(auth)
            }
          }
        } else {
          // No Firebase user, check local storage
          const token = localStorage.getItem('token')
          const storedUser = localStorage.getItem('user')

          console.log('AuthContext - Token exists:', !!token)
          console.log('AuthContext - Stored user exists:', !!storedUser)

          if (token && storedUser) {
            try {
              // Set axios default header
              axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
              console.log('AuthContext - Set authorization header')

              // Verify token is still valid
              const response = await axios.get('/auth/me')
              console.log('AuthContext - Token verification response:', response.data)

              if (response.data.success) {
                setUser(response.data.user)
                console.log('AuthContext - User set from token verification:', response.data.user)
              } else {
                // Token invalid, clear storage
                console.log('AuthContext - Token verification failed, clearing storage')
                localStorage.removeItem('token')
                localStorage.removeItem('user')
                delete axios.defaults.headers.common['Authorization']
              }
            } catch (error) {
              console.error('AuthContext - Token verification failed:', error)
              localStorage.removeItem('token')
              localStorage.removeItem('user')
              delete axios.defaults.headers.common['Authorization']
            }
          } else {
            console.log('AuthContext - No token or stored user found')
          }
        }

        setLoading(false)
      })

      return unsubscribe
    }

    const unsubscribe = initializeAuth()
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe()
      }
    }
  }, [])

  const login = async (email, password) => {
    try {
      console.log('Attempting login with automatic role detection:', { email })
      
      // Try admin login first
      try {
        const adminResponse = await axios.post('/auth/login', {
          email,
          password,
          role: 'admin'
        })

        if (adminResponse.data.success) {
          const { token, user } = adminResponse.data
          
          console.log('AuthContext - Admin login successful:', user)
          
          // Store token and user data
          localStorage.setItem('token', token)
          localStorage.setItem('user', JSON.stringify(user))
          
          // Set axios default header
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
          
          setUser(user)
          return { success: true, token, user }
        }
      } catch (adminError) {
        console.log('Admin login failed, trying user login:', adminError.response?.data?.message)
      }

      // Try user login
      const userResponse = await axios.post('/auth/login', {
        email,
        password,
        role: 'user'
      })

      console.log('User login response:', userResponse.data)

      if (userResponse.data.success) {
        const { token, user } = userResponse.data
        
        console.log('AuthContext - User login successful:', user)
        
        // Store token and user data
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))
        
        // Set axios default header
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
        
        setUser(user)
        return { success: true, token, user }
      } else {
        console.log('User login failed:', userResponse.data.message)
        return { success: false, error: userResponse.data.message }
      }
    } catch (error) {
      console.error('Login error:', error)
      console.error('Error response:', error.response?.data)
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed. Please try again.' 
      }
    }
  }

  const register = async (userData) => {
    try {
      // Combine firstName and lastName into name for backend
      const registrationData = {
        ...userData,
        name: `${userData.firstName} ${userData.lastName}`.trim()
      }
      
      // Remove firstName and lastName as backend doesn't expect them
      delete registrationData.firstName
      delete registrationData.lastName
      
      console.log('Registration data being sent:', registrationData)
      
      const response = await axios.post('/auth/register', registrationData)

      if (response.data.success) {
        const { token, user } = response.data
        
        // Store token and user data
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))
        
        // Set axios default header
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
        
        setUser(user)
        return { success: true }
      } else {
        return { success: false, error: response.data.message }
      }
    } catch (error) {
      console.error('Registration error:', error)
      return { 
        success: false, 
        error: error.response?.data?.message || 'Registration failed. Please try again.' 
      }
    }
  }

  const googleSignIn = async () => {
    try {
      console.log('Attempting Google sign-in with Firebase...')

      const result = await signInWithPopup(auth, googleProvider)
      const user = result.user

      console.log('Firebase Google sign-in successful:', user)

            // Always use Firebase ID token only
      const idToken = await user.getIdToken(/* forceRefresh */ true)

      // Send Firebase ID token to backend for verification/login
      // Backend will handle role assignment (always 'user' for new accounts)
      const response = await axios.post('/auth/google', {
        token: idToken
        // No role parameter - backend assigns role automatically
      })

      console.log('Backend Google sign-in response:', response.data)

      if (response.data.success) {
        const { user: backendUser } = response.data

        // Store user data only
        localStorage.setItem('user', JSON.stringify(backendUser))

        // Set axios default header to Firebase ID token
        axios.defaults.headers.common['Authorization'] = `Bearer ${idToken}`

        setUser(backendUser)
        return { success: true, user: backendUser }
      } else {
        console.log('Backend Google sign-in failed:', response.data.message)
        return { success: false, error: response.data.message }
      }
    } catch (error) {
      console.error('Google sign-in error:', error)
      return {
        success: false,
        error: error.message || 'Google sign-in failed. Please try again.'
      }
    }
  }

  const logout = async () => {
    try {
      await firebaseSignOut(auth)
      console.log('Firebase sign-out successful')
    } catch (error) {
      console.error('Firebase sign-out error:', error)
    }

    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    delete axios.defaults.headers.common['Authorization']
  }

  const isAdmin = () => {
    return user?.role === 'admin'
  }

  const isUser = () => {
    return user?.role === 'user'
  }

  const value = {
    user,
    login,
    register,
    googleSignIn,
    logout,
    loading,
    isAdmin,
    isUser
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}