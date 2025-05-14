import request from '@/config/axios'

type WalletRechargePackageVO = {
  payPrice: number
}
type WalletSubmitVO = {
  id: number
  channelCode: string
}
// 渠道类型

// 获得渠道列表
export const getEnableCodeList = async (params: { appId: number }) => {
  return await request.get({ url: '/pay/wallet/get-enable-code-list', params })
}
// 提交创建钱包支付订单
export const createWalletOrder = async (data: WalletRechargePackageVO) => {
  return await request.post({ url: '/pay/wallet/create-order', data })
}
// 提交支付订单
export const submitPayWalletOrder = async (data: WalletSubmitVO) => {
  return await request.post({ url: '/pay/wallet/submit-pay-order', data })
}
// 获取支付订单信息
export const getPayWalletOrderInfo = async (id: string, sync?: boolean) => {
  return await request.get({ url: '/pay/wallet/get-pay-order-info', params: { id, sync } })
}
// 获取我的钱包
export const getMyWallet = async () => {
  return await request.get({ url: '/pay/wallet/get-my-wallet' })
}
