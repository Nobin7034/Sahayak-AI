import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, MapPin, Phone, Star, Calendar, FileText, Shield, Users, Languages } from 'lucide-react'
import axios from 'axios'
import { akshayaCenters } from '../data/mockData'
import { getImageUrl } from '../config/api'
import { useLanguage } from '../contexts/LanguageContext'
import { t } from '../data/translations'

const LandingPage = () => {
  const { language, toggleLanguage } = useLanguage()
  const [latest, setLatest] = useState([])
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
            {akshayaCenters.map((center) => (
              <div key={center.id} className="card p-6">
                <h3 className="text-xl font-semibold mb-3 text-gray-900">{center.name}</h3>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-start space-x-2">
                    <MapPin className="w-4 h-4 text-gray-500 mt-1 flex-shrink-0" />
                    <span className="text-sm text-gray-600">{center.address}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">{center.phone}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="text-sm font-semibold">{center.rating}</span>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="font-semibold text-gray-900 mb-2">{t('landing.servicesAvailable', language)}</h4>
                  <div className="flex flex-wrap gap-1">
                    {center.services.map((service, index) => (
                      <span
                        key={index}
                        className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full"
                      >
                        {service}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="text-sm text-gray-600">
                  <strong>{t('landing.hours', language)}</strong> {center.hours}
                </div>
              </div>
            ))}
          </div>
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