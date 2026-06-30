// ======================================================
// API SERVICE: NEWS — via backend proxy
// ======================================================

import { apiClient } from '../apiClient'
import type { NewsArticle } from '../types'

const API_BASE = '/api/news'

export const fetchNewsData = async (
  category: string = 'business',
  pageSize: number = 12,
): Promise<NewsArticle[]> => {
  try {
    const response = await apiClient.get<{ success: boolean; data: NewsArticle[] }>(
      `${API_BASE}?category=${encodeURIComponent(category)}&pageSize=${pageSize}`
    )
    return response.data
  } catch (error) {
    console.error('Error fetching news:', error)
    return getMockNewsData(category)
  }
}

export const searchNews = async (
  query: string,
  pageSize: number = 12,
): Promise<NewsArticle[]> => {
  if (!query.trim()) return []
  try {
    const response = await apiClient.get<{ success: boolean; data: NewsArticle[] }>(
      `${API_BASE}/search?q=${encodeURIComponent(query.trim())}&pageSize=${pageSize}`
    )
    return response.data
  } catch (error) {
    console.error('Error searching news:', error)
    return []
  }
}

// ── Mock fallback ─────────────────────────────────────────

const PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80',
  'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&q=80',
  'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800&q=80',
  'https://images.unsplash.com/photo-1535320903710-d993d3d77d29?w=800&q=80',
]

const getMockNewsData = (category: string): NewsArticle[] => {
  const mockMap: Record<string, { title: string; desc: string }[]> = {
    technology: [
      { title: 'Quantum Computing Reaches New Milestone', desc: 'Researchers achieve record qubit stability, pushing us closer to practical quantum advantage.' },
      { title: 'AI Chips Race Heats Up in Silicon Valley', desc: 'Multiple startups unveil new neural-processing architectures designed to cut inference costs.' },
      { title: 'Open-Source LLM Beats Proprietary Rivals on Key Benchmarks', desc: 'A community-led model surprises the industry with state-of-the-art reasoning scores.' },
    ],
    business: [
      { title: 'Global Markets Steady Amid Rate Uncertainty', desc: 'Equities hold gains as investors parse mixed signals from central bank communications.' },
      { title: 'Merger Wave Continues in Pharma Sector', desc: 'Three major acquisitions announced this week as drugmakers consolidate pipelines.' },
      { title: 'Retail Earnings Beat Expectations Despite Inflation', desc: 'Consumer spending remains resilient; discretionary categories outperform forecasts.' },
    ],
    politics: [
      { title: 'G7 Leaders Agree on New Economic Framework', desc: 'The summit concludes with a joint communiqué addressing trade imbalances and tech governance.' },
      { title: 'Senate Committee Advances Sweeping Tech Bill', desc: 'Bipartisan support grows for landmark legislation targeting large digital platforms.' },
      { title: 'EU Prepares Fresh Sanctions Package', desc: 'Brussels signals coordinated action with allies on supply-chain security concerns.' },
    ],
    health: [
      { title: 'New Cancer Immunotherapy Shows 80% Response Rate', desc: 'Phase III trial results published in a leading journal offer fresh hope for hard-to-treat tumours.' },
      { title: 'WHO Declares End of Mpox Emergency', desc: 'Global surveillance continues as infection rates fall below epidemic thresholds worldwide.' },
      { title: 'Wearable Biosensors Can Now Predict Sepsis 6 Hours Early', desc: 'Clinical validation study demonstrates life-saving potential for ICU monitoring devices.' },
    ],
    sports: [
      { title: 'Champions League Final Sets Viewing Record', desc: 'An estimated 400 million tuned in for the dramatic penalty shootout conclusion.' },
      { title: 'World Athletics Introduces New Shoe Rules', desc: 'Governing body caps carbon-plate stack height following a season of record-breaking sprints.' },
      { title: 'NBA Draft Lottery Results Surprise Analysts', desc: 'An unexpected bounce puts a mid-market franchise in pole position for the top pick.' },
    ],
    entertainment: [
      { title: 'Cannes Jury Awards Palme d\'Or to Debut Director', desc: 'A first-time filmmaker from West Africa takes cinema\'s most prestigious prize.' },
      { title: 'Streaming Wars Heat Up as Bundle Subscriptions Surge', desc: 'Consolidation accelerates as platforms seek to reduce churn through content bundles.' },
      { title: 'AI-Composed Score Wins Grammy Controversy', desc: 'The Recording Academy faces calls to revisit eligibility rules after a historic nomination.' },
    ],
    world: [
      { title: 'Arctic Council Reaches Historic Climate Agreement', desc: 'Eight member nations sign binding emission targets for the fragile polar ecosystem.' },
      { title: 'Southeast Asia Growth Outpaces Global Average', desc: 'IMF upgrades regional forecasts as manufacturing reshoring accelerates.' },
      { title: 'Humanitarian Crisis in the Sahel Deepens', desc: 'Aid agencies warn of a record 40 million facing acute food insecurity this year.' },
    ],
    science: [
      { title: 'James Webb Telescope Images Oldest Known Galaxy', desc: 'The discovery pushes back our understanding of cosmic dawn by 200 million years.' },
      { title: 'CRISPR Treats Rare Genetic Disease in Children', desc: 'Trial participants show complete resolution of symptoms after a single-dose gene edit.' },
      { title: 'Deep-Sea Survey Finds 50 New Species', desc: 'Autonomous submarines map an unexplored hydrothermal vent field in the Pacific.' },
    ],
    environment: [
      { title: 'Coral Reef Restoration Hits 1 Million Square Meters', desc: 'International coalition surpasses a milestone in marine ecosystem recovery projects.' },
      { title: 'Carbon Capture Plant Breaks Cost Record', desc: 'New direct-air capture facility achieves $100/tonne threshold for the first time commercially.' },
      { title: 'Deforestation in Amazon Drops 40% Year-on-Year', desc: 'Satellite monitoring confirms sharp decline following enforcement crackdowns.' },
    ],
    education: [
      { title: 'UK Universities Face Deepening Funding Crisis', desc: 'Vice-chancellors warn bursary programmes for low-income students are at risk of cuts.' },
      { title: 'AI Tutors Close Learning Gaps in Pilot Study', desc: 'Personalised adaptive systems narrow attainment gaps in under-resourced schools.' },
      { title: 'Student Debt Relief Plan Advances in Congress', desc: 'A bipartisan proposal would cap repayments as a share of discretionary income.' },
    ],
  }

  const items = mockMap[category] ?? mockMap['business']
  return items.map((item, i) => ({
    id:          `mock-${category}-${i}-${Date.now()}`,
    title:       item.title,
    description: item.desc,
    image:       PLACEHOLDER_IMAGES[i % PLACEHOLDER_IMAGES.length],
    category,
    source:      ['Reuters', 'AP News', 'Bloomberg'][i % 3],
    publishedAt: new Date(Date.now() - i * 7200000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    url:         '#',
    isBreaking:  i === 0,
  }))
}