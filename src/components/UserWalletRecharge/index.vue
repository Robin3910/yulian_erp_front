<template>
  <div>
    <span class="mr-2 font-400">账户余额: ￥{{ balanceRef.toFixed(2) }}</span>
    <span class="text-[var(--el-color-primary)] cursor-pointer" @click="dialogVisible = true"
      >充值</span
    >
  </div>
  <RechargePopup v-if="dialogVisible" v-model="dialogVisible" @confirm="handleConfirm" />
  <PayCodePopup
    v-if="showQRCode"
    v-model="showQRCode"
    :code-url="codeUrl"
    :payOrderId="payOrderIdRef"
    :title="title"
    @close="handleClose"
  />
</template>
<script setup lang="ts">
import PayCodePopup from './conpoments/PayCodePopup.vue'
import RechargePopup from './conpoments/RechargePopup.vue'
import { getMyWallet } from '@/api/pay/wallet/recharge'

defineOptions({
  name: 'UserWalletRecharge'
})
const showQRCode = ref(false)
const payOrderIdRef = ref('')
const codeUrl = ref('')
const dialogVisible = ref(false)
const title = ref('')
const balanceRef = ref(0)
const handleConfirm = async ({ payOrderId, displayContent, channelName }) => {
  payOrderIdRef.value = payOrderId
  codeUrl.value = displayContent
  showQRCode.value = true
  title.value = '请使用' + channelName
}
const fetchMyWallet = async () => {
  let { balance } = await getMyWallet()
  balanceRef.value = balance / 100
}
const handleClose = () => {
  setTimeout(() => {
    fetchMyWallet()
  }, 3000)
}
onMounted(() => {
  // 每分钟执行一次钱包余额的拉取
  let cb = () => {
    setTimeout(() => {
      fetchMyWallet()
      cb()
    }, 60000)
  }
  fetchMyWallet()
  cb()
})
</script>
<style scoped lang="scss"></style>
