// ======================================================
// GEOBOARD — EMAIL SERVICE (Resend)
// ======================================================

import { Resend } from 'resend'

class EmailService {
  private resend: Resend | null = null

  private getClient(): Resend | null {
    if (this.resend) return this.resend
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) return null
    this.resend = new Resend(apiKey)
    return this.resend
  }

  async sendPasswordResetEmail(to: string, resetUrl: string, expiresInMinutes = 20): Promise<void> {
    const apiKey = process.env.RESEND_API_KEY
    const from = 'onboarding@resend.dev'
    console.log('')
    console.log('+------------------------------------------------------+')
    console.log('¦          ?? PASSWORD RESET REQUEST                    ¦')
    console.log('¦------------------------------------------------------¦')
    console.log('¦  To:  ' + to.padEnd(40) + '¦')
    console.log('¦  ??  RESET LINK (copy into browser):                  ¦')
    console.log('¦  ' + resetUrl.padEnd(52) + '¦')
    console.log('¦  ?  Expires in ' + String(expiresInMinutes).padEnd(2) + ' minutes                          ¦')
    console.log('+------------------------------------------------------+')
    console.log('')
    if (!apiKey) {
      console.warn('[Email] RESEND_API_KEY not configured. Reset link is printed above for development.')
      return
    }
    try {
      const client = this.getClient()!
      const { data, error } = await client.emails.send({
        from,
        to,
        subject: 'Reset Your GeoBoard Password',
        html: this.buildEmailHtml(resetUrl, expiresInMinutes),
      })
      if (error) console.error('[Email] Resend API error:', error)
      else console.log('[Email] Sent via Resend. Message ID:', data?.id)
    } catch (error) {
      console.error('[Email] Send failed:', error instanceof Error ? error.message : error)
    }
  }

  private buildEmailHtml(resetUrl: string, expiresInMinutes: number): string {
    return '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Reset Your Password</title><style>body{font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px}.container{background:#f9f9f9;border-radius:8px;padding:30px;margin:20px 0}.button{display:inline-block;padding:12px 30px;background:#4CAF50;color:white;text-decoration:none;border-radius:5px;margin:20px 0;font-weight:bold}.footer{margin-top:30px;padding-top:20px;border-top:1px solid #ddd;font-size:12px;color:#777}.warning{background:#fff3cd;border-left:4px solid #ffc107;padding:10px;margin:15px 0}</style></head><body><div class="container"><h1>Reset Your Password</h1><p>Hello,</p><p>We received a request to reset your password for your GeoBoard account. If you made this request, click the button below:</p><a href="' + resetUrl + '" class="button">Reset Password</a><p>Or copy: <span style="word-break:break-all;color:#4CAF50">' + resetUrl + '</span></p><div class="warning"><strong>?? Important:</strong> This link expires in ' + expiresInMinutes + ' minutes.</div><p>If you didn\'t request this, ignore this email.</p><div class="footer"><p>GeoBoard - Automated message</p></div></div></body></html>'
  }
}

export const emailService = new EmailService()
