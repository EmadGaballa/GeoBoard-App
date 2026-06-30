import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { fetchNewsData, searchNews } from '../services/api/news'
import type { NewsArticle } from '../services/types'
import '../styles/News.css'

// ======================================================
// CONSTANTS
// ======================================================

const CATEGORIES = [
  'business',
  'technology',
  'politics',
  'health',
  'sports',
  'entertainment',
  'world',
  'science',
  'environment',
  'education',
]

const TICKER_ITEMS = [
  'Global markets steady amid rate uncertainty',
  'Tech sector leads Q2 earnings beats',
  'Climate summit reaches landmark accord',
  'Central banks signal coordinated pivot',
  'AI regulation framework proposed in Brussels',
  'Space agency confirms new mission timeline',
  'New medical breakthrough offers hope',
  'Renewable energy hits record capacity globally',
]

// Fallback images per category (Unsplash — no auth required)
const CATEGORY_FALLBACKS: Record<string, string> = {
  business:    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80',
  technology:  'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80',
  politics:    'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800&q=80',
  health:      'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80',
  sports:      'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&q=80',
  entertainment: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80',
  world:       'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80',
  science:     'https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=800&q=80',
  environment: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&q=80',
  education:   'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80',
  search:      'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80',
}

// ======================================================
// ANIMATION VARIANTS
// ======================================================

const fadeUp = {
  hidden:  { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.55, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] as const },
  }),
  exit: { opacity: 0, scale: 0.97, transition: { duration: 0.2 } },
}

const modalVariants = {
  hidden:  { opacity: 0, y: 24, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const } },
  exit:    { opacity: 0, y: 16, scale: 0.98, transition: { duration: 0.22 } },
}

// ======================================================
// HELPERS
// ======================================================

/** Render an <img> with a graceful category-based fallback */
const NewsImage: React.FC<{
  src: string | null
  alt: string
  className: string
  category: string
}> = ({ src, alt, className, category }) => {
  const fallback = CATEGORY_FALLBACKS[category] ?? CATEGORY_FALLBACKS['search']
  const [imgSrc, setImgSrc] = useState<string>(src || fallback)

  useEffect(() => {
    setImgSrc(src || fallback)
  }, [src, fallback])

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => setImgSrc(fallback)}
    />
  )
}

// ======================================================
// SUB-COMPONENTS
// ======================================================

const NewsTicker: React.FC = () => {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS]
  return (
    <div className="news-ticker-bar">
      <span className="news-ticker-label">LIVE</span>
      <div className="news-ticker-track">
        <div className="news-ticker-content">
          {items.map((text, i) => (
            <span key={i}>{text}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

const Tag: React.FC<{ variant?: 'category' | 'breaking' | 'source'; children: React.ReactNode }> = ({
  variant = 'category',
  children,
}) => <span className={`news-tag news-tag--${variant}`}>{children}</span>

const FeaturedCard: React.FC<{ article: NewsArticle; onRead: (a: NewsArticle) => void }> = ({
  article,
  onRead,
}) => (
  <motion.div
    className="news-featured"
    onClick={() => onRead(article)}
    whileHover={{ scale: 1.005 }}
    transition={{ duration: 0.25 }}
  >
    <NewsImage
      src={article.image}
      alt={article.title}
      className="news-featured-img"
      category={article.category}
    />
    <div className="news-featured-overlay" />
    <div className="news-featured-body">
      <div className="news-featured-eyebrow">
        {article.isBreaking && <Tag variant="breaking">Breaking</Tag>}
        <Tag variant="category">{article.category}</Tag>
        <Tag variant="source">{article.source}</Tag>
      </div>
      <h2 className="news-featured-title">{article.title}</h2>
      <p className="news-featured-desc">{article.description}</p>
      <div className="news-featured-meta">
        <span>{article.publishedAt}</span>
        <button
          className="news-read-btn"
          onClick={e => { e.stopPropagation(); onRead(article) }}
        >
          Read Signal <span className="arrow">→</span>
        </button>
      </div>
    </div>
  </motion.div>
)

const ArticleCard: React.FC<{ article: NewsArticle; onRead: (a: NewsArticle) => void; index: number }> = ({
  article,
  onRead,
  index,
}) => (
  <motion.div
    className="news-card"
    custom={index}
    variants={fadeUp}
    initial="hidden"
    animate="visible"
    exit="exit"
    onClick={() => onRead(article)}
    whileHover={{ y: -3 }}
    transition={{ duration: 0.2 }}
  >
    <div className="news-card-img-wrap">
      <NewsImage
        src={article.image}
        alt={article.title}
        className="news-card-img"
        category={article.category}
      />
    </div>
    <div className="news-card-eyebrow">
      {article.isBreaking && <Tag variant="breaking">Breaking</Tag>}
      <Tag variant="category">{article.category}</Tag>
    </div>
    <h3 className="news-card-title">{article.title}</h3>
    <p className="news-card-desc">{article.description}</p>
    <div className="news-card-footer">
      <span>{article.source} · {article.publishedAt}</span>
      <span className="news-card-footer-read">Read →</span>
    </div>
  </motion.div>
)

const ArticleListItem: React.FC<{ article: NewsArticle; index: number; onRead: (a: NewsArticle) => void }> = ({
  article,
  index,
  onRead,
}) => (
  <motion.div
    className="news-list-item"
    custom={index}
    variants={fadeUp}
    initial="hidden"
    animate="visible"
    exit="exit"
    onClick={() => onRead(article)}
  >
    <span className="news-list-num">{String(index + 1).padStart(2, '0')}</span>
    <div className="news-list-content">
      <h4 className="news-list-title">{article.title}</h4>
      <p className="news-list-meta">
        {article.source} · {article.publishedAt} · {article.category}
      </p>
    </div>
  </motion.div>
)

const ArticleModal: React.FC<{ article: NewsArticle | null; onClose: () => void }> = ({
  article,
  onClose,
}) => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <AnimatePresence>
      {article && (
        <motion.div
          className="news-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={e => { if (e.target === e.currentTarget) onClose() }}
        >
          <motion.div
            className="news-modal-panel"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="news-modal-header">
              <span className="news-modal-header-label">
                Intelligence Report · {article.category}
              </span>
              <button className="news-modal-close" onClick={onClose}>✕ Close</button>
            </div>

            <NewsImage
              src={article.image}
              alt={article.title}
              className="news-modal-img"
              category={article.category}
            />

            <div className="news-modal-body">
              <div className="news-modal-eyebrow">
                {article.isBreaking && <Tag variant="breaking">Breaking</Tag>}
                <Tag variant="category">{article.category}</Tag>
                <Tag variant="source">{article.source}</Tag>
              </div>
              <h2 className="news-modal-title">{article.title}</h2>
              <p className="news-modal-desc">{article.description}</p>
              {article.url && article.url !== '#' && (
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="news-modal-link"
                >
                  Open Full Report <span>→</span>
                </a>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ======================================================
// PAGE: News
// ======================================================

export const News: React.FC = () => {
  const [articles, setArticles]               = useState<NewsArticle[]>([])
  const [searchQuery, setSearchQuery]         = useState('')
  const [activeSearch, setActiveSearch]       = useState('') // committed search term
  const [selectedCategory, setSelectedCategory] = useState('business')
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null)
  const [loading, setLoading]                 = useState(true)
  const [searchLoading, setSearchLoading]     = useState(false)
  const searchTimeout                         = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Load category feed ────────────────────────────────
  useEffect(() => {
    if (activeSearch) return // don't reload category when searching
    const load = async () => {
      setLoading(true)
      try {
        const data = await fetchNewsData(selectedCategory, 15)
        setArticles(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [selectedCategory, activeSearch])

  // ── Debounced search (fires API after 600 ms pause) ───
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current)

    if (!searchQuery.trim()) {
      // User cleared the search box — go back to category feed
      setActiveSearch('')
      setArticles([]) // trigger category reload via the effect above
      return
    }

    searchTimeout.current = setTimeout(async () => {
      setSearchLoading(true)
      setActiveSearch(searchQuery)
      try {
        const data = await searchNews(searchQuery, 15)
        setArticles(data)
      } catch (err) {
        console.error(err)
      } finally {
        setSearchLoading(false)
      }
    }, 600)

    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current)
    }
  }, [searchQuery])

  const handleCategoryClick = (cat: string) => {
    setSelectedCategory(cat)
    setSearchQuery('')     // clear search when switching category
    setActiveSearch('')
  }

  const handleRead  = useCallback((a: NewsArticle) => setSelectedArticle(a), [])
  const handleClose = useCallback(() => setSelectedArticle(null), [])

  const dateline = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  }).toUpperCase()

  const featured  = articles[0]
  const secondary = articles.slice(1, 3)
  const listed    = articles.slice(3)

  const isLoading = loading || searchLoading

  return (
    <div className="news-page">
      <div className="news-inner">

        {/* ── Masthead ─────────────────────────────────── */}
        <motion.header
          className="news-masthead"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="news-masthead-top">
            <h1 className="news-logotype">Intel<span>.</span>Feed</h1>
            <span className="news-dateline">{dateline}</span>
          </div>
          <NewsTicker />
        </motion.header>

        {/* ── Search ───────────────────────────────────── */}
        <motion.div
          className="news-search-wrap"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <input
            type="text"
            className="news-search-input"
            placeholder="Search intelligence… (e.g. AI regulation, oil prices)"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          <span className="news-search-icon">⌕</span>
          {searchLoading && (
            <span className="news-search-spinner" aria-label="Searching…" />
          )}
          {searchQuery && (
            <button
              className="news-search-clear"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
          <div className="news-search-line" />
        </motion.div>

        {/* ── Category filters ──────────────────────────── */}
        {!activeSearch && (
          <motion.div
            className="news-filters"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            {CATEGORIES.map(cat => (
              <motion.button
                key={cat}
                className={`news-filter-btn ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => handleCategoryClick(cat)}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
              >
                {cat}
              </motion.button>
            ))}
          </motion.div>
        )}

        {/* Active search label */}
        {activeSearch && (
          <motion.div
            className="news-search-label"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            Results for <strong>"{activeSearch}"</strong>
            <button className="news-search-label-clear" onClick={() => setSearchQuery('')}>
              ← Back to {selectedCategory}
            </button>
          </motion.div>
        )}

        {/* ── Content ──────────────────────────────────── */}
        {isLoading ? (
          <div className="news-loading">
            <motion.div
              animate={{ opacity: [0.3, 0.8, 0.3] }}
              transition={{ duration: 1.4, repeat: Infinity }}
              className="news-loading-text"
            >
              {searchLoading ? `Searching for "${searchQuery}"…` : 'Fetching intelligence feed…'}
            </motion.div>
            <div className="news-skeleton-grid">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="news-skeleton-card" />
              ))}
            </div>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSearch || selectedCategory}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {articles.length === 0 ? (
                <div className="news-empty">
                  {activeSearch
                    ? `No results found for "${activeSearch}". Try different keywords.`
                    : 'No intelligence signals found.'}
                </div>
              ) : (
                <>
                  <div className="news-layout">
                    {featured && <FeaturedCard article={featured} onRead={handleRead} />}
                    <AnimatePresence mode="popLayout">
                      {secondary.map((article, i) => (
                        <ArticleCard key={article.id} article={article} index={i} onRead={handleRead} />
                      ))}
                    </AnimatePresence>
                  </div>

                  {listed.length > 0 && (
                    <div className="news-list">
                      <AnimatePresence mode="popLayout">
                        {listed.map((article, i) => (
                          <ArticleListItem key={article.id} article={article} index={i} onRead={handleRead} />
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        )}

      </div>

      <ArticleModal article={selectedArticle} onClose={handleClose} />
    </div>
  )
}