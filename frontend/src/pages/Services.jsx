import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, Filter, Clock, IndianRupee, ArrowRight, Loader2 } from 'lucide-react'
import axios from 'axios'

const Services = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/services')
      if (response.data.success) {
        setServices(response.data.data)
      } else {
        setError('Failed to fetch services')
      }
    } catch (error) {
      console.error('Services fetch error:', error)
      setError('Failed to fetch services')
    } finally {
      setLoading(false)
    }
  }

  const categories = ['all', ...new Set(services.map(service => service.category))]

  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || service.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-lg text-gray-600">Loading services...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={fetchServices}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Government Services</h1>
          <p className="text-lg text-gray-600">
            Browse and apply for various government services with detailed document requirements
          </p>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search services..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
            </div>
            
            <div className="lg:w-64">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary appearance-none bg-white"
                >
                  <option value="all">All Categories</option>
                  {categories.filter(cat => cat !== 'all').map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredServices.map((service) => {
            // Pick a preview image from the first document (direct image or template image)
            const firstDoc = (service.documents && service.documents[0]) || null
            const preview = firstDoc ? (firstDoc.imageUrl || firstDoc?.template?.imageUrl) : null
            return (
              <div key={service._id} className="card overflow-hidden">

                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{service.name}</h3>
                      <span className="inline-block bg-primary/10 text-primary text-sm px-3 py-1 rounded-full">
                        {service.category}
                      </span>
                    </div>
                  </div>

                  <p className="text-gray-600 mb-6">{service.description}</p>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        <IndianRupee className="w-4 h-4 text-secondary" />
                        <span className="text-gray-600">Fee:</span>
                      </div>
                      <span className="font-semibold text-secondary">
                        {service.fee === 0 ? 'Free' : `₹${service.fee}`}
                      </span>
                    </div>

                    {typeof service.serviceCharge === 'number' && service.serviceCharge > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2">
                          <IndianRupee className="w-4 h-4 text-blue-600" />
                          <span className="text-gray-600">Service Charge:</span>
                        </div>
                        <span className="font-semibold text-blue-600">₹{service.serviceCharge}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-orange-500" />
                        <span className="text-gray-600">Processing Time:</span>
                      </div>
                      <span className="font-semibold text-orange-600">{service.processingTime}</span>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-2">Required Documents:</h4>
                    {service.documents && service.documents.length > 0 ? (
                      <ul className="text-sm text-gray-600 list-disc ml-5 space-y-1">
                        {service.documents.slice(0, 3).map((d, i) => (
                          <li key={i}>{d.name}</li>
                        ))}
                        {service.documents.length > 3 && (
                          <li className="text-gray-500">+{service.documents.length - 3} more</li>
                        )}
                      </ul>
                    ) : (
                      <div className="text-sm text-gray-600">
                        {service.requiredDocuments?.length || 0} documents required
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Link
                      to={`/service/${service._id}`}
                      className="w-full btn-secondary flex items-center justify-center"
                    >
                      View Details
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Link>
                    <Link
                      to={`/centers?service=${service._id}`}
                      className="w-full btn-primary flex items-center justify-center"
                    >
                      Select Center & Book
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {filteredServices.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-2">No services found</div>
            <p className="text-gray-400">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Services