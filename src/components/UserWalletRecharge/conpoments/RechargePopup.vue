<template>
  <el-dialog v-model="dialogVisible" title="账户充值" width="30%" :before-close="handleClose">
    <el-form :model="formData" ref="formRef">
      <el-form-item
        label="充值金额"
        prop="payPrice"
        :rules="[
          { required: true, message: '请输入充值金额', trigger: 'blur' },
          {
            validator: (_rule, value, callback) => {
              if (value < 0) {
                callback(new Error('充值金额不能小于0'))
              } else {
                callback()
              }
            },
            trigger: 'blur'
          }
        ]"
      >
        <el-input
          clearable
          @input="handleInput"
          @change="handleInput"
          @blur="handleInput"
          v-model="formData.payPrice"
          type="text"
          :rows="4"
          placeholder="请输入充值金额"
        />
      </el-form-item>
      <el-form-item
        label="充值方式"
        prop="channelCode"
        :rules="[{ required: true, message: '请选择充值方式', trigger: 'blur' }]"
      >
        <el-radio-group v-model="formData.channelCode">
          <el-radio v-for="item in channelList" :key="item.value" :label="item.value">
            {{ item.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleConfirm" :loading="loading"> 确认支付 </el-button>
      </span>
    </template>
  </el-dialog>
</template>
<script setup lang="ts">
import { reactive } from 'vue'
import {
  createWalletOrder,
  getEnableCodeList,
  submitPayWalletOrder
} from '@/api/pay/wallet/recharge/index'

defineOptions({
  name: 'RechargePopup'
})
// 定义props
const loading = ref(false)
const dialogVisible = defineModel<boolean>()
const formEl = useTemplateRef('formRef')
const emit = defineEmits(['confirm'])
const formData = reactive<{
  channelCode: undefined | string | number
  payPrice: undefined | number
}>({
  channelCode: undefined,
  payPrice: undefined
})

const channelList = ref([])
const handleClose = () => {
  dialogVisible.value = false
}
const handleConfirm = () => {
  if (formEl && formEl.value) {
    formEl.value.validate(async (valid: boolean) => {
      if (valid) {
        loading.value = true
        try {
          /** 创建订单 */
          let { payOrderId } = await createWalletOrder({
            payPrice: (formData.payPrice as number) * 100
          })
          /** 提交订单 */
          let { displayContent,displayMode } = await submitPayWalletOrder({
            id: payOrderId,
            channelCode: formData.channelCode as string
          })
          emit('confirm', {
            payOrderId,
            displayContent,
            displayMode,
            channelName: channelList.value.find((item: any) => item.value === formData.channelCode)
              ?.label
          })
          loading.value = false
          // 弹窗关闭
          dialogVisible.value = false
        } finally {
          loading.value = false
        }
      }
    })
    return
  }
}

const handleInput = () => {
  console.log(formData.payPrice)
  //  限制只能输入正整数
  if (formData.payPrice) {
    formData.payPrice = Number(formData.payPrice.toString().replace(/[^0-9]/g, ''))
  }
}
const fetchRechargeChannel = async () => {
  const mapData = {
    alipay_qr: '支付宝扫码支付',
    wx_native: '微信扫码支付'
  }
  let res = await getEnableCodeList({ appId: 8 })
  channelList.value = res.map((item: any) => {
    return {
      label: mapData[item],
      value: item
    }
  })
}
onMounted(() => {
  fetchRechargeChannel()
})
</script>

<style scoped lang="scss"></style>
