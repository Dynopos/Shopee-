export interface ShopeeAccount {
  id: string
  user_id: string
  shop_id: number
  shop_name: string
  access_token: string
  refresh_token: string
  token_expires_at: string
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  user_id: string
  shopee_account_id?: string
  shopee_item_id?: number
  title: string
  description: string
  price: number
  stock: number
  category_id?: number
  image_url?: string
  shopee_image_id?: string
  status: 'draft' | 'uploading' | 'live' | 'failed'
  created_at: string
  updated_at: string
}

export interface AIGeneratedListing {
  id: string
  user_id: string
  product_id?: string
  image_url: string
  title: string
  description: string
  keywords: string[]
  category: string
  suggested_price: number
  stock_quantity: number
  highlights: string[]
  created_at: string
}

export interface UploadLog {
  id: string
  user_id: string
  product_id: string
  action: string
  status: 'success' | 'failed'
  request_payload?: Record<string, unknown>
  response_payload?: Record<string, unknown>
  error_message?: string
  created_at: string
}

export interface ListingFormData {
  title: string
  description: string
  keywords: string[]
  category: string
  price: number
  stock: number
  highlights: string[]
  imageUrl: string
}
