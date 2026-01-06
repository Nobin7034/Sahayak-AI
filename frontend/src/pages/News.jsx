import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, ArrowRight, Search } from 'lucide-react'
import axios from 'axios'
import { getImageUrl } from '../config/api'

const News = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [items, setItems] = useState([])
  const [external, setExternal] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const [localRes, extRes] = await Promise.all([
          axios.get('/api/news'),
          axios.get('/api/news/external/kerala', { params: { source: 'rss', limit: 6 } })
        ])
        if (localRes.data.success) setItems(localRes.data.data.news)
        if (extRes.data.success) setExternal(extRes.data.data)
      } catch (e) {
        console.error('Failed to load news', e)
      } finally {
        setLoading(false)
      }
    }
    fetchNews()
  }, [])

  const filteredNews = items.filter(news =>
    news.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    news.summary.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Government News & Updates</h1>
          <p className="text-lg text-gray-600">
            Stay informed about the latest government announcements, policy changes, and service updates
          </p>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search news..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
        </div>

        {/* News Grid */}
        <div className="space-y-8">
          {filteredNews.map((news) => (
            <article key={news._id} className="card overflow-hidden">
              <div className="md:flex">
                <div className="md:w-1/3">
                  {news.imageUrl && (
                    <img
                      src={getImageUrl(news.imageUrl)}
                      alt={news.imageAlt || news.title}
                      className="w-full h-64 md:h-full object-cover"
                    />
                  )}
                </div>
                <div className="md:w-2/3 p-8">
                  <div className="flex items-center space-x-2 text-sm text-gray-500 mb-3">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(news.publishDate).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}</span>
                  </div>
                  
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">{news.title}</h2>
                  <p className="text-gray-600 mb-6 leading-relaxed">{news.summary}</p>
                  
                  <Link
                    to={`/news/${news._id}`}
                    className="inline-flex items-center text-primary hover:text-blue-700 font-semibold"
                  >
                    Read Full Article <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </div>
              </div>
            </article>
          ))}

          {/* External Kerala news */}
          {external.length > 0 && (
            <div className="pt-6 border-t">
              <h3 className="text-lg font-semibold mb-4">Latest Kerala Government News (external)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {external.map((n, idx) => (
                  <a key={idx} href={n.link} target="_blank" rel="noopener noreferrer" className="card p-4 hover:shadow-lg transition-shadow">
                    {n.imageUrl && (
                      <img src={n.imageUrl} alt={n.title} className="w-full h-40 object-cover rounded mb-3" />
                    )}
                    <div className="text-sm text-gray-500 mb-1">{n.publishDate ? new Date(n.publishDate).toLocaleDateString('en-IN') : ''}</div>
                    <div className="font-semibold text-gray-900 mb-2">{n.title}</div>
                    <div className="text-gray-600 text-sm">{n.summary}</div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {filteredNews.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-2">No news found</div>
            <p className="text-gray-400">Try adjusting your search criteria</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default News