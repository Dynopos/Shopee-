import crypto from 'crypto'

export function generateShopeeSignature(
  partnerId: number,
  partnerKey: string,
  path: string,
  timestamp: number,
  accessToken?: string,
  shopId?: number
): string {
  let base = `${partnerId}${path}${timestamp}`
  if (accessToken) base += accessToken
  if (shopId) base += shopId
  return crypto.createHmac('sha256', partnerKey).update(base).digest('hex')
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function formatPriceIDR(price: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(price)
}
