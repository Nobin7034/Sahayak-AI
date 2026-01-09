import React, { useState, useEffect } from 'react'
import { useParams, Navigate, useNavigate } from 'react-router-dom'
import { ArrowLeft, Clock, IndianRupee, FileText, Image, CheckCircle, Calendar, Loader2, Eye, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import axios from 'axios'

const ServiceDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [service, setService] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState({ open: false, title: '', url: '' })

  useEffect(() => {
    fetchService()
  }, [id])

  const fetchService = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`/api/services/${id}`)
      if (response.data.success) {
        setService(response.data.data)
      } else {
        setError('Service not found')
      }
    } catch (error) {
      console.error('Service fetch error:', error)
      setError('Failed to fetch service details')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-lg text-gray-600">Loading service details...</p>
        </div>
      </div>
    )
  }

  if (error || !service) {
    return <Navigate to="/services" replace />
  }

  const handleBookAppointment = () => {
    navigate(`/centers?service=${service._id}`)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            to="/services"
            className="inline-flex items-center text-primary hover:text-blue-700 font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Services
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="card p-8 mb-8">
              <div className="mb-6">
                <span className="inline-block bg-primary/10 text-primary text-sm px-3 py-1 rounded-full mb-4">
                  {service.category}
                </span>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">{service.name}</h1>
                <p className="text-lg text-gray-600">{service.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg">
                  <IndianRupee className="w-6 h-6 text-secondary" />
                  <div>
                    <div className="font-semibold text-gray-900">Service Fee</div>
                    <div className="text-secondary font-bold">
                      {service.fee === 0 ? 'Free of Cost' : `₹${service.fee}`}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-4 bg-orange-50 rounded-lg">
                  <Clock className="w-6 h-6 text-orange-500" />
                  <div>
                    <div className="font-semibold text-gray-900">Processing Time</div>
                    <div className="text-orange-600 font-bold">{service.processingTime}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Pre-Check Rules */}
            {service.preCheckRules && service.preCheckRules.length > 0 && (
              <div className="card p-6 mb-8 border-l-4 border-yellow-400 bg-yellow-50">
                <div className="flex items-center space-x-2 mb-3">
                  <CheckCircle className="w-5 h-5 text-yellow-600" />
                  <h2 className="text-xl font-bold text-gray-900">Pre-Check Rules</h2>
                </div>
                <ul className="list-disc ml-6 text-gray-800 space-y-1">
                  {service.preCheckRules.map((rule, idx) => (
                    <li key={idx}>{rule}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Upfront Service Charge Notice */}
            {typeof service.serviceCharge === 'number' && service.serviceCharge > 0 && (
              <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-1">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-blue-900">Service Charge Payable Now</span>
                </div>
                <p className="text-blue-800 text-sm">Pay ₹{service.serviceCharge} now to confirm your booking. Remaining amount (₹{Math.max((service.fee||0) - (service.serviceCharge||0), 0)}) is payable after service completion.</p>
              </div>
            )}

            {/* Document Requirements */}
            <div className="card p-8">
              <div className="flex items-center space-x-2 mb-6">
                <FileText className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-bold text-gray-900">Documents</h2>
              </div>
              
              <p className="text-gray-600 mb-8">
                Primary documents marked Mandatory are required. If you don't have a primary document, you may provide one of its Alternatives where available.
              </p>

              <div className="space-y-6">
                {/* Prefer new documents with images; fallback to legacy list */}
                {service.documents && service.documents.length > 0 ? (
                  service.documents.map((d, index) => {
                    const preview = d.imageUrl || d?.template?.imageUrl
                    return (
                      <div key={index} className="border border-gray-200 rounded-lg p-6">
                        <div className="flex items-start space-x-4">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1 bg-red-100 text-red-600">
                            <span className="text-xs font-bold">!</span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">{d.name}</h3>
                              <span className={`text-xs px-2 py-1 rounded-full ${d.requirement === 'optional' ? 'bg-gray-100 text-gray-700' : 'bg-red-100 text-red-700'}`}>
                                {d.requirement === 'optional' ? 'Optional' : 'Mandatory'}
                              </span>
                            </div>
                            {d.notes && <p className="text-gray-600 mb-4">{d.notes}</p>}
                            <div className="mt-2 flex items-center gap-3">
                              <span className="text-xs text-gray-600">Preview:</span>
                              <button
                                type="button"
                                className="inline-flex items-center text-primary hover:text-blue-700 text-sm"
                                onClick={() => {
                                  const url = d.imageUrl || d?.template?.imageUrl
                                  if (!url) return
                                  setPreview({ open: true, title: d.name, url })
                                }}
                                disabled={!(d.imageUrl || d?.template?.imageUrl)}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View sample
                              </button>
                              {!(d.imageUrl || d?.template?.imageUrl) && (
                                <span className="text-xs text-gray-400">No sample available</span>
                              )}
                            </div>

                            {/* Alternatives */}
                            {(d.alternatives && d.alternatives.length > 0) && (
                              <div className="mt-5 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                                <div className="text-sm font-medium text-gray-800 mb-2">Alternatives (any one)</div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {d.alternatives.map((a, aidx) => {
                                    const aPreview = a.imageUrl || a?.template?.imageUrl
                                    return (
                                      <div key={aidx} className="border rounded p-3">
                                        <div className="flex items-start justify-between">
                                          <div>
                                            <div className="font-semibold text-gray-900">{a.name}</div>
                                            {a.notes && <div className="text-xs text-gray-600">{a.notes}</div>}
                                          </div>
                                          <button
                                            type="button"
                                            className="inline-flex items-center text-primary hover:text-blue-700 text-xs"
                                            onClick={() => {
                                              const url = aPreview
                                              if (!url) return
                                              setPreview({ open: true, title: a.name, url })
                                            }}
                                            disabled={!aPreview}
                                          >
                                            <Eye className="w-4 h-4 mr-1" />
                                            View sample
                                          </button>
                                        </div>
                                        {!aPreview && (
                                          <div className="text-xs text-gray-400 mt-1">No sample available</div>
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                                <div className="text-xs text-gray-600 mt-3">
                                  If the primary document is not available, you may provide any one of the alternatives above.
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  service.requiredDocuments && service.requiredDocuments.length > 0 ? (
                    service.requiredDocuments.map((doc, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-6">
                        <div className="flex items-start space-x-4">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1 bg-red-100 text-red-600">
                            <span className="text-xs font-bold">!</span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">{doc}</h3>
                              <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700">Required</span>
                            </div>
                            <p className="text-gray-600 mb-4">Please ensure this document is original or self-attested copy.</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">No specific documents required for this service.</div>
                  )
                )}
              </div>

              <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-blue-900">Important Note</span>
                </div>
                <p className="text-blue-800 text-sm">
                  All documents must be original or self-attested copies. Ensure all information 
                  is clearly visible and matches your application details exactly.
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-24">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Book Appointment</h3>
              
              <div className="space-y-4">
                <button
                  onClick={handleBookAppointment}
                  className="w-full btn-primary flex items-center justify-center"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Book Appointment
                </button>
                
                <div className="text-sm text-gray-600">
                  <p className="mb-2">
                    <strong>Service Fee:</strong> {service.fee === 0 ? 'Free' : `₹${service.fee}`}
                  </p>
                  <p className="mb-2">
                    <strong>Processing Time:</strong> {service.processingTime}
                  </p>
                  <p>
                    <strong>Documents Required:</strong> {service.requiredDocuments?.length || 0}
                  </p>
                </div>

                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold text-blue-900">Quick Tip</span>
                  </div>
                  <p className="text-blue-800 text-sm">
                    Have all required documents ready before your appointment to ensure smooth processing.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Preview Modal */}
      {preview.open && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">{preview.title}</h3>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setPreview({ open: false, title: '', url: '' })}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <img src={preview.url} alt={preview.title} className="max-h-[70vh] w-auto max-w-full object-contain rounded border mx-auto" />
              <div className="text-xs text-gray-500 mt-2">Sample document image</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ServiceDetails