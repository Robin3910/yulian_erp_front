export interface OrderResult {
  id: number
  orderNo: string
  productTitle: string
  orderStatus: number
  sku: string
  skc: string
  customSku: string
  quantity: number
  originalQuantity: number
  productProperties: string
  customImageUrls: string
  customTextList: string | null
  productImgUrl: string
  effectiveImgUrl: string
  complianceGoodsMergedUrl: string
  productId: string
  score: number
  shopName: string
  aliasName: string
  trackingNumber: string
  dailySequence?: number
  shippingTime?: number
  isCompleteProducerTask?: number
  sortingSequence?: String
  bookingTime?: number
  goodsSnNo?: String
}

export interface OrderNoGroup {
  orderNo: string
  orderList: OrderResult[]
  expressImageUrl: string
  expressOutsideImageUrl: string
  expressSkuImageUrl: string
}

export interface ShippingOrder {
  id: number
  orderNoList: OrderNoGroup[]
  trackingNumber: string
  shopId: number
  shopName: string
  expressImageUrl: string
  expressOutsideImageUrl: string
  expressSkuImageUrl: string
  shippingStatus: string | null
  createTime: number
  updateTime: number
  complianceGoodsMergedUrl: string | null
  dailySequence?: number | undefined
  shippingTime?: number | undefined
  shippedOperatorNickname?: string | null
}

export type ShippingOrderNullable = ShippingOrder | null 
