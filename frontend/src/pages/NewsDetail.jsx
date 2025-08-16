import React from 'react'
import { useParams, Navigate, Link } from 'react-router-dom'
import { ArrowLeft, Calendar, Share2, Bookmark } from 'lucide-react'
import { newsData } from '../data/mockData'

const NewsDetail = () => {
  const { id } = useParams()
  const news = newsData.find(n => n.id === parseInt(id))

  if (!news) {
    return <Navigate to="/news" replace />
  }

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
          <img
            src={news.image}
            alt={news.title}
            className="w-full h-64 md:h-80 object-cover"
          />
          
          <div className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Calendar className="w-4 h-4" />
                <span>{new Date(news.date).toLocaleDateString('en-IN', {
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
              <p className="text-lg text-gray-700 leading-relaxed mb-6">{news.excerpt}</p>
              
              <div className="space-y-4 text-gray-700">
                {news.content.split('\n').map((paragraph, index) => (
                  <p key={index} className="leading-relaxed">{paragraph}</p>
                ))}
              </div>
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
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Related News</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {newsData.filter(n => n.id !== news.id).slice(0, 2).map((relatedNews) => (
              <Link
                key={relatedNews.id}
                to={`/news/${relatedNews.id}`}
                className="card overflow-hidden hover:shadow-xl transition-shadow"
              >
                <img
                  src={relatedNews.image}
                  alt={relatedNews.title}
                  className="w-full h-48 object-cover"
                />
                <div className="p-6">
                  <div className="text-sm text-gray-500 mb-2">{relatedNews.date}</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{relatedNews.title}</h3>
                  <p className="text-gray-600 text-sm">{relatedNews.excerpt}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default NewsDetail