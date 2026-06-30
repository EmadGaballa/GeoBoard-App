// ======================================================
// GEOBOARD — GLOBAL ERROR HANDLING MIDDLEWARE
// ======================================================

import { Request, Response, NextFunction } from 'express'
import { AppError } from '../common/errors.js'
import { ZodError } from 'zod'

export function errorHandler(
  err: Error | AppError | ZodError,
  _req: Request,
  res: Response,
  _next: NextFunction, // eslint-disable-line @typescript-eslint/no-unused-vars
): void {
  console.log('[ErrorHandler] Handling error:', err.constructor.name)
  console.log('[ErrorHandler] Error message:', err.message)
  
  // Zod validation errors — return 400 with field-level details
  if (err instanceof ZodError) {
    console.log('[ErrorHandler] ZodError detected')
    const details = (err.issues||[]).map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }))

    res.status(400).json({
      success: false,
      error: details[0]?.message || 'Validation failed',
      details,
      meta: { timestamp: new Date().toISOString() },
    })
    return
  }

  if (err instanceof AppError) {
    console.log('[ErrorHandler] AppError detected, status:', err.statusCode)
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      meta: { timestamp: new Date().toISOString() },
    })
    return
  }

  // Unexpected errors
  console.error('[ErrorHandler] Unhandled error:', err)
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