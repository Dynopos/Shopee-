import crypto from 'crypto'

// Shopee Open Platform v2 base URL
// Sandbox: https://partner.test-stable.shopeemobile.com
// Production: https://partner.shopeemobile.com
const SHOPEE_BASE_URL = 'https://partner.shopeemobile.com'

const PARTNER_ID = parseInt(process.env.SHOPEE_PARTNER_ID || '0')
const PARTNER_KEY = process.env.SHOPEE_PARTNER_KEY || ''
const REDIRECT_URL = process.env.SHOPEE_REDIRECT_URL || ''

/**
 * Shopee v2 HMAC-SHA256 signature.
 * base_string = partner_id + path + timestamp [+ access_token + shop_id]
 * Docs: https://open.shopee.com/documents/v2/v2.auth
 */
function sign(path: string, timestamp: number, accessToken?: string, shopId?: number): string {
  let base = `${PARTNER_ID}${path}${timestamp}`
  if (accessToken) base += accessToken
  if (shopId) base += shopId
  return crypto.createHmac('sha256', PARTNER_KEY).update(base).digest('hex')
}

export interface ShopeeTokenResponse {
  access_token: string
  refresh_token: string
  expire_in: number
  shop_id: number
  error?: string
  message?: string
}

export interface ShopeeImageUploadResponse {
  image_id: string
  image_url: string
}

export interface ShopeeCreateProductParams {
  shop_id: number
  access_token: string
  item_name: string
  description: string
  price: number
  stock: number
  category_id: number
  image_ids: string[]
  item_status: 'NORMAL' | 'UNLIST'
}

export interface ShopeeCreateProductResponse {
  item_id: number
}

/**
 * Build the Shopee OAuth URL to redirect the seller to.
 * Real endpoint: GET https://partner.shopeemobile.com/api/v2/shop/auth_partner
 * Docs: https://open.shopee.com/documents/v2/v2.shop.auth_partner
 */
export function getAuthorizationUrl(): string {
  const path = '/api/v2/shop/auth_partner'
  const timestamp = Math.floor(Date.now() / 1000)
  const params = new URLSearchParams({
    partner_id: PARTNER_ID.toString(),
    timestamp: timestamp.toString(),
    sign: sign(path, timestamp),
    redirect: REDIRECT_URL,
  })
  return `${SHOPEE_BASE_URL}${path}?${params.toString()}`
}

/**
 * Exchange the authorization code received in callback for access + refresh tokens.
 * Real endpoint: POST https://partner.shopeemobile.com/api/v2/auth/token/get
 * Docs: https://open.shopee.com/documents/v2/v2.auth.token.get
 * Body: { code, shop_id, partner_id }
 */
export async function exchangeCodeForToken(
  code: string,
  shopId: number
): Promise<ShopeeTokenResponse> {
  const path = '/api/v2/auth/token/get'
  const timestamp = Math.floor(Date.now() / 1000)
  const url = `${SHOPEE_BASE_URL}${path}?partner_id=${PARTNER_ID}&timestamp=${timestamp}&sign=${sign(path, timestamp)}`

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, shop_id: shopId, partner_id: PARTNER_ID }),
  })

  if (!res.ok) throw new Error(`Shopee token exchange HTTP ${res.status}: ${res.statusText}`)

  const data = await res.json()
  if (data.error) throw new Error(`Shopee: ${data.error} — ${data.message}`)
  return data
}

/**
 * Refresh an expired access token using the refresh token.
 * Real endpoint: POST https://partner.shopeemobile.com/api/v2/auth/access_token/get
 * Docs: https://open.shopee.com/documents/v2/v2.auth.access_token.get
 * Body: { refresh_token, shop_id, partner_id }
 */
export async function refreshAccessToken(
  refreshToken: string,
  shopId: number
): Promise<ShopeeTokenResponse> {
  const path = '/api/v2/auth/access_token/get'
  const timestamp = Math.floor(Date.now() / 1000)
  const url = `${SHOPEE_BASE_URL}${path}?partner_id=${PARTNER_ID}&timestamp=${timestamp}&sign=${sign(path, timestamp)}`

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken, shop_id: shopId, partner_id: PARTNER_ID }),
  })

  if (!res.ok) throw new Error(`Shopee token refresh HTTP ${res.status}: ${res.statusText}`)

  const data = await res.json()
  if (data.error) throw new Error(`Shopee: ${data.error} — ${data.message}`)
  return data
}

/**
 * Upload a product image to Shopee Media Space.
 * Real endpoint: POST https://partner.shopeemobile.com/api/v2/media_space/upload_image
 * Docs: https://open.shopee.com/documents/v2/v2.media_space.upload_image
 * Must be multipart/form-data with field name "image".
 * Returns image_id used when creating a product.
 */
export async function uploadImageToShopee(
  imageBuffer: Buffer,
  filename: string,
  accessToken: string,
  shopId: number
): Promise<ShopeeImageUploadResponse> {
  const path = '/api/v2/media_space/upload_image'
  const timestamp = Math.floor(Date.now() / 1000)
  const url = [
    `${SHOPEE_BASE_URL}${path}`,
    `?partner_id=${PARTNER_ID}`,
    `&timestamp=${timestamp}`,
    `&sign=${sign(path, timestamp, accessToken, shopId)}`,
    `&access_token=${accessToken}`,
    `&shop_id=${shopId}`,
  ].join('')

  const form = new FormData()
  form.append('image', new Blob([imageBuffer], { type: 'image/jpeg' }), filename)

  const res = await fetch(url, { method: 'POST', body: form })
  if (!res.ok) throw new Error(`Shopee image upload HTTP ${res.status}: ${res.statusText}`)

  const data = await res.json()
  if (data.error) throw new Error(`Shopee: ${data.error} — ${data.message}`)

  return {
    image_id: data.response?.image_id,
    image_url: data.response?.image_url,
  }
}

/**
 * Create a product listing on Shopee.
 * Real endpoint: POST https://partner.shopeemobile.com/api/v2/product/add_item
 * Docs: https://open.shopee.com/documents/v2/v2.product.add_item
 *
 * Notes:
 * - category_id must be a valid Shopee leaf category (use v2.product.get_category).
 * - logistic_id must match channels enabled for your shop.
 * - price is in local currency (IDR = whole number).
 * - weight is in kg.
 */
export async function createShopeeProduct(
  params: ShopeeCreateProductParams
): Promise<ShopeeCreateProductResponse> {
  const { shop_id, access_token, ...body } = params
  const path = '/api/v2/product/add_item'
  const timestamp = Math.floor(Date.now() / 1000)
  const url = [
    `${SHOPEE_BASE_URL}${path}`,
    `?partner_id=${PARTNER_ID}`,
    `&timestamp=${timestamp}`,
    `&sign=${sign(path, timestamp, access_token, shop_id)}`,
    `&access_token=${access_token}`,
    `&shop_id=${shop_id}`,
  ].join('')

  const payload = {
    original_price: body.price,
    description: body.description,
    item_name: body.item_name,
    normal_stock: body.stock,
    category_id: body.category_id,
    image: { image_id_list: body.image_ids },
    // TODO: Replace logistic_id with a real channel ID from your partner account.
    // Fetch available channels via v2.logistics.get_channel_list.
    logistic_info: [{ logistic_id: 1, enabled: true }],
    weight: 0.5,
    item_status: body.item_status,
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) throw new Error(`Shopee add_item HTTP ${res.status}: ${res.statusText}`)

  const data = await res.json()
  if (data.error) throw new Error(`Shopee: ${data.error} — ${data.message}`)

  return { item_id: data.response?.item_id }
}
