import React, { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const AuthContext = createContext()

// Set up axios defaults
const API_BASE_URL = 'http://localhost:5000/api'
axios.defaults.baseURL = API_BASE_URL

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
    const initializeAuth = async () => {
      const token = localStorage.getItem('token')
      const storedUser = localStorage.getItem('user')
      
      console.log('AuthContext - Initializing auth...')
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
      setLoading(false)
    }

    initializeAuth()
  }, [])

  const login = async (email, password, role = 'user') => {
    try {
      console.log('Attempting login with:', { email, role })
      
      const response = await axios.post('/auth/login', {
        email,
        password,
        role
      })

      console.log('Login response:', response.data)

      if (response.data.success) {
        const { token, user } = response.data
        
        console.log('AuthContext - Storing token:', token)
        console.log('AuthContext - Storing user:', user)
        
        // Store token and user data
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))
        
        // Set axios default header
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
        
        setUser(user)
        return { success: true, token, user }
      } else {
        console.log('Login failed:', response.data.message)
        return { success: false, error: response.data.message }
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

  const logout = () => {
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