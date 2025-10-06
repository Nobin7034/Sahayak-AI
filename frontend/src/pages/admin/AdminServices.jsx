import React, { useState, useEffect } from 'react'
import { Plus, Search, Edit, Trash2, Eye, ToggleLeft, ToggleRight } from 'lucide-react'
import axios from 'axios'

const AdminServices = () => {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingService, setEditingService] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    fee: '',
    processingTime: '',
    requiredDocuments: '',
    documents: [], // [{ name, imageUrl, templateId, notes }]
    isActive: true
  })

  useEffect(() => {
    fetchServices()
  }, [])

  // Document templates for reuse
  const [templates, setTemplates] = useState([])

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const res = await axios.get('/admin/document-templates')
        if (res.data.success) setTemplates(res.data.data)
      } catch (e) {
        console.warn('Failed to load document templates', e)
      }
    }
    loadTemplates()
  }, [])

  const fetchServices = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/admin/services')
      if (response.data.success) {
        setServices(response.data.data)
      } else {
        setError('Failed to fetch services')
      }
    } catch (error) {
      console.error('Fetch services error:', error)
      setError('Failed to fetch services')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const serviceData = {
        ...formData,
        fee: parseFloat(formData.fee),
        requiredDocuments: formData.requiredDocuments.split(',').map(doc => doc.trim()).filter(doc => doc),
        // Map UI documents to API shape
        documents: (formData.documents || []).map(d => ({
          name: d.name,
          requirement: d.requirement || 'mandatory',
          notes: d.notes,
          imageUrl: d.imageUrl || undefined,
          template: d.templateId || undefined,
          alternatives: (d.alternatives || []).map(a => ({
            name: a.name,
            notes: a.notes,
            imageUrl: a.imageUrl || undefined,
            template: a.templateId || undefined,
          }))
        }))
      }

      let response
      if (editingService) {
        response = await axios.put(`/admin/services/${editingService._id}`, serviceData)
      } else {
        response = await axios.post('/admin/services', serviceData)
      }

      if (response.data.success) {
        fetchServices()
        setShowModal(false)
        resetForm()
      }
    } catch (error) {
      console.error('Save service error:', error)
      alert('Failed to save service')
    }
  }

  const handleEdit = (service) => {
    setEditingService(service)
    setFormData({
      name: service.name,
      description: service.description,
      category: service.category,
      fee: service.fee.toString(),
      processingTime: service.processingTime,
      requiredDocuments: (service.requiredDocuments || []).join(', '),
      documents: (service.documents || []).map(d => ({
        name: d.name,
        requirement: d.requirement || 'mandatory',
        notes: d.notes || '',
        imageUrl: d.imageUrl || d?.template?.imageUrl || '',
        templateId: d?.template?._id || (typeof d.template === 'string' ? d.template : undefined),
        alternatives: (d.alternatives || []).map(a => ({
          name: a.name,
          notes: a.notes || '',
          imageUrl: a.imageUrl || a?.template?.imageUrl || '',
          templateId: a?.template?._id || (typeof a.template === 'string' ? a.template : undefined)
        }))
      })),
      isActive: service.isActive
    })
    setShowModal(true)
  }

  const handleDelete = async (serviceId) => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      try {
        const response = await axios.delete(`/admin/services/${serviceId}`)
        if (response.data.success) {
          fetchServices()
        }
      } catch (error) {
        console.error('Delete service error:', error)
        alert('Failed to delete service')
      }
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: '',
      fee: '',
      processingTime: '',
      requiredDocuments: '',
      isActive: true
    })
    setEditingService(null)
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading services...</p>
        </div>
      </div>
    )
  }



  // Handlers to manage documents in form
  const addEmptyDocument = () => {
    setFormData(prev => ({ ...prev, documents: [...(prev.documents || []), { name: '', requirement: 'mandatory', notes: '', imageUrl: '', templateId: '', alternatives: [] }] }))
  }
  const updateDocument = (idx, patch) => {
    setFormData(prev => {
      const docs = [...(prev.documents || [])]
      docs[idx] = { ...docs[idx], ...patch }
      return { ...prev, documents: docs }
    })
  }
  const removeDocument = (idx) => {
    setFormData(prev => ({ ...prev, documents: (prev.documents || []).filter((_, i) => i !== idx) }))
  }

  const addAlternative = (docIdx) => {
    setFormData(prev => {
      const docs = [...(prev.documents || [])]
      const current = docs[docIdx] || {}
      const alts = [...(current.alternatives || [])]
      alts.push({ name: '', notes: '', templateId: '', imageUrl: '' })
      docs[docIdx] = { ...current, alternatives: alts }
      return { ...prev, documents: docs }
    })
  }

  const updateAlternative = (docIdx, altIdx, patch) => {
    setFormData(prev => {
      const docs = [...(prev.documents || [])]
      const current = docs[docIdx] || {}
      const alts = [...(current.alternatives || [])]
      alts[altIdx] = { ...alts[altIdx], ...patch }
      docs[docIdx] = { ...current, alternatives: alts }
      return { ...prev, documents: docs }
    })
  }

  const removeAlternative = (docIdx, altIdx) => {
    setFormData(prev => {
      const docs = [...(prev.documents || [])]
      const current = docs[docIdx] || {}
      const alts = (current.alternatives || []).filter((_, i) => i !== altIdx)
      docs[docIdx] = { ...current, alternatives: alts }
      return { ...prev, documents: docs }
    })
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Service Management</h1>
          <p className="text-gray-600 mt-1">Manage government services and their details</p>
        </div>
        <button
          onClick={() => {
            resetForm()
            setShowModal(true)
          }}
          className="btn-primary flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Service
        </button>
      </div>

      {/* Search */}
      <div className="card p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search services..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.map((service) => (
          <div key={service._id} className="card p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{service.name}</h3>
                <p className="text-sm text-gray-600 mb-2">{service.description}</p>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    {service.category}
                  </span>
                  <span className="font-medium">₹{service.fee}</span>
                </div>
              </div>
              <div className="flex items-center">
                {service.isActive ? (
                  <ToggleRight className="h-5 w-5 text-green-500" />
                ) : (
                  <ToggleLeft className="h-5 w-5 text-gray-400" />
                )}
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Processing Time:</span> {service.processingTime}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                <span className="font-medium">Visits:</span> {service.visitCount}
              </p>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(service)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                  title="Edit Service"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                  title="View Details"
                >
                  <Eye className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(service._id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  title="Delete Service"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${
                service.isActive 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {service.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {filteredServices.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No services found</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingService ? 'Edit Service' : 'Add New Service'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Service Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <input
                      type="text"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fee (₹)
                    </label>
                    <input
                      type="number"
                      name="fee"
                      value={formData.fee}
                      onChange={handleChange}
                      required
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Processing Time
                  </label>
                  <input
                    type="text"
                    name="processingTime"
                    value={formData.processingTime}
                    onChange={handleChange}
                    required
                    placeholder="e.g., 7-10 days"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Required Documents (legacy, optional)
                  </label>
                  <textarea
                    name="requiredDocuments"
                    value={formData.requiredDocuments}
                    onChange={handleChange}
                    rows={2}
                    placeholder="Comma separated names for backward compatibility"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>

                {/* New: Documents with sample images */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">Documents with sample images</label>
                    <button type="button" className="btn-secondary text-sm" onClick={addEmptyDocument}>Add Document</button>
                  </div>

                  {(formData.documents || []).length === 0 && (
                    <div className="text-sm text-gray-500">No documents added yet.</div>
                  )}

                  <div className="space-y-4">
                    {(formData.documents || []).map((d, idx) => (
                      <div key={idx} className="border rounded-md p-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Document Name</label>
                            <input
                              type="text"
                              value={d.name}
                              onChange={(e) => updateDocument(idx, { name: e.target.value })}
                              className="w-full px-3 py-2 border rounded"
                              placeholder="e.g., Aadhaar Card"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Requirement</label>
                            <select
                              value={d.requirement || 'mandatory'}
                              onChange={(e) => updateDocument(idx, { requirement: e.target.value })}
                              className="w-full px-3 py-2 border rounded"
                            >
                              <option value="mandatory">Mandatory</option>
                              <option value="optional">Optional</option>
                            </select>
                            <div className="text-xs text-gray-500 mt-1">Controls whether this primary document is mandatory or optional.</div>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Notes (optional)</label>
                            <input
                              type="text"
                              value={d.notes}
                              onChange={(e) => updateDocument(idx, { notes: e.target.value })}
                              className="w-full px-3 py-2 border rounded"
                              placeholder="Any special instruction"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Use saved template</label>
                            <select
                              value={d.templateId || ''}
                              onChange={(e) => updateDocument(idx, { templateId: e.target.value, imageUrl: '' })}
                              className="w-full px-3 py-2 border rounded"
                            >
                              <option value="">None</option>
                              {templates.map(t => (
                                <option key={t._id} value={t._id}>{t.title}</option>
                              ))}
                            </select>
                            <div className="text-xs text-gray-500 mt-1">Selecting a template will use its image</div>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Upload from your PC</label>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={async (e) => {
                                const file = e.target.files?.[0]
                                if (!file) return
                                const fd = new FormData()
                                fd.append('image', file)
                                try {
                                  const res = await axios.post('/admin/document-templates/upload', fd, {
                                    headers: { 'Content-Type': 'multipart/form-data' }
                                  })
                                  if (res.data?.success && res.data?.imageUrl) {
                                    updateDocument(idx, { imageUrl: res.data.imageUrl, templateId: '' })
                                  } else {
                                    alert('Upload failed')
                                  }
                                } catch (err) {
                                  console.error('Upload failed', err)
                                  alert('Upload failed')
                                }
                              }}
                              className="w-full px-3 py-2 border rounded"
                            />
                            <div className="text-xs text-gray-500 mt-1">The file will be stored in backend/uploads and accessible by URL.</div>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Or paste direct image URL</label>
                            <input
                              type="url"
                              value={d.imageUrl}
                              onChange={(e) => updateDocument(idx, { imageUrl: e.target.value, templateId: '' })}
                              className="w-full px-3 py-2 border rounded"
                              placeholder="http://localhost:5000/uploads/..."
                            />
                            <div className="text-xs text-gray-500 mt-1">Paste any accessible image URL. If you uploaded above, it already set the URL.</div>
                          </div>
                        </div>

                        {(d.imageUrl || (d.templateId && templates.find(t => t._id === d.templateId)?.imageUrl)) && (
                          <div className="mt-3">
                            <img
                              src={d.imageUrl || templates.find(t => t._id === d.templateId)?.imageUrl}
                              alt="preview"
                              className="w-48 h-auto rounded border"
                            />
                          </div>
                        )}

                        {/* Save as reusable template when using a direct URL */}
                        {d.imageUrl && !d.templateId && (
                          <div className="mt-3 flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="Template title"
                              value={d._templateTitle || d.name}
                              onChange={(e) => updateDocument(idx, { _templateTitle: e.target.value })}
                              className="flex-1 px-3 py-2 border rounded"
                            />
                            <button
                              type="button"
                              className="btn-secondary text-sm"
                              onClick={async () => {
                                try {
                                  const payload = { title: d._templateTitle || d.name || 'Document', imageUrl: d.imageUrl }
                                  const res = await axios.post('/admin/document-templates', payload)
                                  if (res.data?.success && res.data?.data) {
                                    setTemplates(prev => [res.data.data, ...prev])
                                    updateDocument(idx, { templateId: res.data.data._id, imageUrl: '', _templateTitle: '' })
                                  } else {
                                    alert('Failed to save template')
                                  }
                                } catch (err) {
                                  console.error('Failed to save template', err)
                                  alert('Failed to save template')
                                }
                              }}
                            >
                              Save as reusable template
                            </button>
                          </div>
                        )}

                        {/* Alternatives Section */}
                        <div className="mt-4 border-t pt-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-800">Alternatives</span>
                            <button type="button" className="btn-secondary text-xs" onClick={() => addAlternative(idx)}>Add Alternative</button>
                          </div>
                          {(d.alternatives || []).length === 0 && (
                            <div className="text-xs text-gray-500">No alternatives added.</div>
                          )}
                          <div className="space-y-3">
                            {(d.alternatives || []).map((alt, aidx) => (
                              <div key={aidx} className="rounded border p-3">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-xs text-gray-600 mb-1">Alternative Name</label>
                                    <input
                                      type="text"
                                      value={alt.name}
                                      onChange={(e) => updateAlternative(idx, aidx, { name: e.target.value })}
                                      className="w-full px-3 py-2 border rounded"
                                      placeholder="e.g., Voter ID"
                                      required
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs text-gray-600 mb-1">Notes (optional)</label>
                                    <input
                                      type="text"
                                      value={alt.notes || ''}
                                      onChange={(e) => updateAlternative(idx, aidx, { notes: e.target.value })}
                                      className="w-full px-3 py-2 border rounded"
                                      placeholder="Any special instruction"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs text-gray-600 mb-1">Use saved template</label>
                                    <select
                                      value={alt.templateId || ''}
                                      onChange={(e) => updateAlternative(idx, aidx, { templateId: e.target.value, imageUrl: '' })}
                                      className="w-full px-3 py-2 border rounded"
                                    >
                                      <option value="">None</option>
                                      {templates.map(t => (
                                        <option key={t._id} value={t._id}>{t.title}</option>
                                      ))}
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-xs text-gray-600 mb-1">Upload from your PC</label>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={async (e) => {
                                        const file = e.target.files?.[0]
                                        if (!file) return
                                        const fd = new FormData()
                                        fd.append('image', file)
                                        try {
                                          const res = await axios.post('/admin/document-templates/upload', fd, {
                                            headers: { 'Content-Type': 'multipart/form-data' }
                                          })
                                          if (res.data?.success && res.data?.imageUrl) {
                                            updateAlternative(idx, aidx, { imageUrl: res.data.imageUrl, templateId: '' })
                                          } else {
                                            alert('Upload failed')
                                          }
                                        } catch (err) {
                                          console.error('Upload failed', err)
                                          alert('Upload failed')
                                        }
                                      }}
                                      className="w-full px-3 py-2 border rounded"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs text-gray-600 mb-1">Or paste direct image URL</label>
                                    <input
                                      type="url"
                                      value={alt.imageUrl || ''}
                                      onChange={(e) => updateAlternative(idx, aidx, { imageUrl: e.target.value, templateId: '' })}
                                      className="w-full px-3 py-2 border rounded"
                                      placeholder="http://localhost:5000/uploads/..."
                                    />
                                  </div>
                                </div>
                                {(alt.imageUrl || (alt.templateId && templates.find(t => t._id === alt.templateId)?.imageUrl)) && (
                                  <div className="mt-3">
                                    <img
                                      src={alt.imageUrl || templates.find(t => t._id === alt.templateId)?.imageUrl}
                                      alt="preview"
                                      className="w-40 h-auto rounded border"
                                    />
                                  </div>
                                )}
                                <div className="mt-2 text-right">
                                  <button type="button" className="text-red-600 text-xs" onClick={() => removeAlternative(idx, aidx)}>Remove alternative</button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="mt-3 text-right">
                          <button type="button" className="text-red-600 text-sm" onClick={() => removeDocument(idx)}>Remove</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    Active Service
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      resetForm()
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    {editingService ? 'Update Service' : 'Create Service'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminServices