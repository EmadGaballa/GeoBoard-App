// ======================================================
// GEOBOARD — NEWS ROUTES
// ======================================================

import { Router } from 'express'
import { newsController } from './news.controller.js'

const router = Router()

router.get('/', (req, res, next) => newsController.getNews(req, res, next))
router.get('/search', (req, res, next) => newsController.search(req, res, next))

export default router