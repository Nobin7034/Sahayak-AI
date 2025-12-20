import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, MapPin, Phone, Star, Calendar, FileText, Shield, Users, Languages } from 'lucide-react'
import axios from 'axios'
import centerService from '../services/centerService'
import { getImageUrl } from '../config/api'
import { useLanguage } from '../contexts/LanguageContext'
import { t } from '../data/translations'

const LandingPage = () => {
  const { language, toggleLanguage } = useLanguage()
  const [latest, setLatest] = useState([])
  const [centers, setCenters] = useState([])
  const [loadingCenters, setLoadingCenters] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get('/news/latest/3')
        if (res.data.success) setLatest(res.data.data)
      } catch (e) {
        console.error('Failed to load latest news', e)
      }
    }
    load()
  }, [])

  useEffect(() => {
    const loadCenters = async () => {
      try {
        setLoadingCenters(true)
        const response = await centerService.getAllCenters()
        setCenters(response.centers || [])
      } catch (error) {
        console.error('Failed to load centers:', error)
        setCenters([])
      } finally {
        setLoadingCenters(false)
      }
    }
    loadCenters()
  }, [])
  return (
    <div className="min-h-screen">
      {/* Language Toggle Button */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={toggleLanguage}
          className="flex items-center space-x-2 bg-white shadow-lg hover:shadow-xl transition-all duration-300 px-4 py-2 rounded-full border border-gray-200 hover:border-primary group"
          title={language === 'en' ? 'Switch to Malayalam / മലയാളത്തിലേക്ക് മാറുക' : 'Switch to English / ഇംഗ്ലീഷിലേക്ക് മാറുക'}
        >
          <Languages className="w-5 h-5 text-gray-600 group-hover:text-primary transition-colors" />
          <span className="text-sm font-semibold text-gray-700 group-hover:text-primary transition-colors">
            {language === 'en' ? 'English' : 'മലയാളം'}
          </span>
        </button>
      </div>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary to-secondary text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              {t('landing.heroTitle', language)}
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              {t('landing.heroSubtitle', language)}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="bg-white text-primary px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center justify-center"
              >
                {t('landing.getStarted', language)} <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link
                to="/login"
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-primary transition-colors"
              >
                {t('landing.login', language)}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('landing.whyChooseAkshaya', language)}</h2>
            <p className="text-lg text-gray-600">{t('landing.experience', language)}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t('landing.easyAppointments', language)}</h3>
              <p className="text-gray-600">{t('landing.easyAppointmentsDesc', language)}</p>
            </div>
            
            <div className="text-center">
              <div className="bg-secondary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t('landing.documentGuidance', language)}</h3>
              <p className="text-gray-600">{t('landing.documentGuidanceDesc', language)}</p>
            </div>
            
            <div className="text-center">
              <div className="bg-accent/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t('landing.secureReliable', language)}</h3>
              <p className="text-gray-600">{t('landing.secureReliableDesc', language)}</p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t('landing.support247', language)}</h3>
              <p className="text-gray-600">{t('landing.support247Desc', language)}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Latest News Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('landing.latestNews', language)}</h2>
              <p className="text-lg text-gray-600">{t('landing.stayUpdated', language)}</p>
            </div>
            <Link
              to="/news"
              className="hidden md:inline-flex items-center text-primary hover:text-blue-700 font-semibold"
            >
              {t('landing.viewAllNews', language)} <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {latest.map((news) => (
              <article key={news._id} className="card overflow-hidden">
                {news.imageUrl && (
                  <img
                    src={getImageUrl(news.imageUrl)}
                    alt={news.imageAlt || news.title}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-6">
                  <div className="text-sm text-gray-500 mb-2">{new Date(news.publishDate).toLocaleDateString('en-IN')}</div>
                  <h3 className="text-xl font-semibold mb-3 text-gray-900">{news.title}</h3>
                  <p className="text-gray-600 mb-4">{news.summary}</p>
                  <Link
                    to={`/news/${news._id}`}
                    className="text-primary hover:text-blue-700 font-semibold inline-flex items-center"
                  >
                    {t('landing.readMore', language)} <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </div>
              </article>
            ))}
          </div>

          <div className="text-center mt-8 md:hidden">
            <Link
              to="/news"
              className="inline-flex items-center text-primary hover:text-blue-700 font-semibold"
            >
              {t('landing.viewAllNews', language)} <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Akshaya Centers Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('landing.findCenters', language)}</h2>
            <p className="text-lg text-gray-600">{t('landing.locateNearest', language)}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loadingCenters ? (
              // Loading skeleton
              Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="card p-6 animate-pulse">
                  <div className="h-6 bg-gray-200 rounded mb-3"></div>
                  <div className="space-y-2 mb-4">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="h-16 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))
            ) : centers.length > 0 ? (
              centers.slice(0, 3).map((center) => (
                <div key={center._id} className="card p-6">
                  <h3 className="text-xl font-semibold mb-3 text-gray-900">{center.name}</h3>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-start space-x-2">
                      <MapPin className="w-4 h-4 text-gray-500 mt-1 flex-shrink-0" />
                      <span className="text-sm text-gray-600">
                        {center.address?.street && `${center.address.street}, `}
                        {center.address?.city}, {center.address?.district}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">{center.contact?.phone || 'Phone not available'}</span>
                    </div>
                    {center.metadata?.rating > 0 && (
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          <span className="text-sm font-semibold">{center.metadata.rating.toFixed(1)}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-900 mb-2">{t('landing.servicesAvailable', language)}</h4>
                    <div className="flex flex-wrap gap-1">
                      {center.services && center.services.length > 0 ? (
                        center.services.slice(0, 3).map((service, index) => (
                          <span
                            key={service._id || index}
                            className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full"
                          >
                            {service.name}
                          </span>
                        ))
                      ) : (
                        <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                          Services available
                        </span>
                      )}
                      {center.services && center.services.length > 3 && (
                        <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                          +{center.services.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-sm text-gray-600 mb-4">
                    <strong>{t('landing.hours', language)}</strong> 
                    {center.operatingHours?.monday ? 
                      ` ${center.operatingHours.monday.open} - ${center.operatingHours.monday.close}` : 
                      ' 9:00 AM - 6:00 PM'
                    }
                  </div>

                  <Link
                    to="/center-finder"
                    className="inline-flex items-center text-primary hover:text-primary-dark text-sm font-medium"
                  >
                    View Details
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </div>
              ))
            ) : (
              // No centers available
              <div className="col-span-full text-center py-12">
                <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Centers Available</h3>
                <p className="text-gray-600 mb-4">
                  No Akshaya centers are currently registered in the system.
                </p>
                <Link
                  to="/register"
                  className="inline-flex items-center text-primary hover:text-primary-dark font-medium"
                >
                  Register as Staff
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            )}
          </div>

          {/* View All Centers Link */}
          {centers.length > 3 && (
            <div className="text-center mt-8">
              <Link
                to="/center-finder"
                className="inline-flex items-center bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark transition-colors"
              >
                View All {centers.length} Centers
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">{t('landing.readyToStart', language)}</h2>
          <p className="text-xl text-gray-300 mb-8">
            {t('landing.joinUsers', language)}
          </p>
          <Link
            to="/register"
            className="btn-primary text-lg px-8 py-3"
          >
            {t('landing.createAccount', language)}
          </Link>
        </div>
      </section>
    </div>
  )
}

export default LandingPage