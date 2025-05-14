<template>
  <div>
    <el-dialog
      v-model="dialogVisible"
      :title="title"
      width="30%"
      :before-close="handleClose"
    >
      <div class="flex justify-center align-center">
        <el-image :src="imgUrl" />
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleClose">我没有完成支付</el-button>
          <el-button type="primary" @click="handleConfirm"> 确认支付完成{{time}} </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>
<script lang="ts" setup>
import QRCode from 'qrcode'
import { getPayWalletOrderInfo } from '@/api/pay/wallet/recharge'
import { ElMessage } from 'element-plus'

defineOptions({
  name: 'PayCodePopup'
})
const emit =defineEmits(['close'])
const prop = defineProps({
  codeUrl: {
    type: String,
    default: ''
  },
  payOrderId: {
    type: String,
    default: ''
  },
  title: {
    type: String,
    default: ''
  }
})
const lock = ref(false)
const imgUrl = ref('')
const time = ref("")
// 定义props
const dialogVisible = defineModel<boolean>()

const fetchOrderInfo = async () => {
  console.log('>>>>>>>>订单信息',  prop)
  return  await getPayWalletOrderInfo(prop.payOrderId,true)
}
const handleConfirm = () => {
  if (lock.value) return
  lock.value = true
  // 调用方法，启动10秒倒计时
  startCountdown(16)
}
const handleClose = () => {
  dialogVisible.value = false
  emit('close')
}
let interval:  NodeJS.Timeout=null as unknown as NodeJS.Timeout;
function startCountdown(duration: number): void {
  let timer: number = duration
   interval = setInterval(async () => {
    if (timer > 0) {
      timer--
      let  {status}=await fetchOrderInfo()
      // 完成支付
      if(status==10){
        clearInterval(interval)
        dialogVisible.value = false
        ElMessage.success('支付成功！')
        emit('close')
      }
      if(status==20||status==30){
        clearInterval(interval)
        dialogVisible.value = false
        ElMessage.error('支付已取消！')
        emit('close')
      }
      time.value = "("+timer + "秒)"
      return
    }
    clearInterval(interval)
    console.log('倒计时结束！')
    lock.value = false
    time.value=""
  }, 1000)
}
onMounted(() => {
  QRCode.toDataURL(prop.codeUrl)
    .then((url) => {
      imgUrl.value = url
    })
    .catch((err) => {
      console.error(err)
    })
})
onUnmounted(() => {
  console.log('组件销毁')
  clearInterval(interval)
})
</script>
<style scoped></style>
