import React, { useEffect, useState } from 'react'
import { useParams, Navigate, Link } from 'react-router-dom'
import { ArrowLeft, Calendar, Share2, Bookmark } from 'lucide-react'
import axios from 'axios'

const withBaseUploads = (url) => {
  if (!url) return ''
  const norm = url.replace(/\\/g, '/');
  if (norm.startsWith('http')) return norm
  if (norm.startsWith('/uploads')) return `http://localhost:5000${norm}`
  if (norm.startsWith('uploads')) return `http://localhost:5000/${norm}`
  return norm
}

const NewsDetail = () => {
  const { id } = useParams()
  const [news, setNews] = useState(null)
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOne = async () => {
      try {
        const res = await axios.get(`/news/${id}`)
        if (res.data.success) {
          const item = res.data.data
          setNews(item)
          // fetch related by category
          const relRes = await axios.get('/news', { params: { category: item.category, limit: 5 } })
          if (relRes.data.success) {
            const list = relRes.data.data.news.filter(n => n._id !== item._id).slice(0, 2)
            setRelated(list)
          }
        }
      } catch (e) {
        console.error('Failed to load news detail', e)
      } finally {
        setLoading(false)
      }
    }
    fetchOne()
  }, [id])

  if (loading) return null
  if (!news) return <Navigate to="/news" replace />

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            to="/news"
            className="inline-flex items-center text-primary hover:text-blue-700 font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to News
          </Link>
        </div>

        <article className="card overflow-hidden">
          {news.imageUrl && (
            <img
              src={withBaseUploads(news.imageUrl)}
              alt={news.imageAlt || news.title}
              className="w-full h-64 md:h-80 object-cover"
            />
          )}
          
          <div className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Calendar className="w-4 h-4" />
                <span>{new Date(news.publishDate).toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</span>
              </div>
              
              <div className="flex items-center space-x-4">
                <button className="flex items-center space-x-1 text-gray-600 hover:text-primary transition-colors">
                  <Share2 className="w-4 h-4" />
                  <span>Share</span>
                </button>
                <button className="flex items-center space-x-1 text-gray-600 hover:text-primary transition-colors">
                  <Bookmark className="w-4 h-4" />
                  <span>Save</span>
                </button>
              </div>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">{news.title}</h1>
            
            <div className="prose prose-lg max-w-none">
              {news.summary && (
                <p className="text-lg text-gray-700 leading-relaxed mb-6">{news.summary}</p>
              )}
              
              {news.content && (
                <div className="space-y-4 text-gray-700">
                  {news.content.split('\n').map((paragraph, index) => (
                    <p key={index} className="leading-relaxed">{paragraph}</p>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-8 pt-8 border-t border-gray-200">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  Need Help with Government Services?
                </h3>
                <p className="text-blue-800 mb-4">
                  Our team is here to assist you with any questions about government services and applications.
                </p>
                <Link
                  to="/services"
                  className="inline-flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Browse Services
                </Link>
              </div>
            </div>
          </div>
        </article>

        {/* Related News */}
        {related.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Related News</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {related.map((relatedNews) => (
                <Link
                  key={relatedNews._id}
                  to={`/news/${relatedNews._id}`}
                  className="card overflow-hidden hover:shadow-xl transition-shadow"
                >
                  {relatedNews.imageUrl && (
                    <img
                      src={withBaseUploads(relatedNews.imageUrl)}
                      alt={relatedNews.imageAlt || relatedNews.title}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <div className="p-6">
                    <div className="text-sm text-gray-500 mb-2">{new Date(relatedNews.publishDate).toLocaleDateString('en-IN')}</div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{relatedNews.title}</h3>
                    <p className="text-gray-600 text-sm">{relatedNews.summary}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default NewsDetail