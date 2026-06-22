// ======================================================
// GEOBOARD — GLOBAL ERROR HANDLING MIDDLEWARE
// ======================================================

import { Request, Response, NextFunction } from 'express'
import { AppError } from '../common/errors.js'

export function errorHandler(
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      meta: { timestamp: new Date().toISOString() },
    })
    return
  }

  // Unexpected errors
  console.error('Unhandled error:', err)
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    meta: { timestamp: new Date().toISOString() },
  })
}

// 404 handler for unknown routes
export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    meta: { timestamp: new Date().toISOString() },
  })
}