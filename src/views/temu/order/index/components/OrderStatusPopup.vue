<template>
  <el-dialog
    v-model="dialogVisible"
    title="批量设置订单状态"
    width="30%"
    :before-close="handleClose"
  >
    <el-form :model="formData" ref="formRef">
      <el-form-item
        label="订单状态"
        prop="orderStatus"
        :rules="[{ required: true, message: '请选择订单状态', trigger: 'change' }]"
      >
        <el-select v-model="formData.orderStatus" placeholder="请选择订单状态" clearable>
          <el-option
            v-for="dict in getStrDictOptions(DICT_TYPE.TEMU_ORDER_STATUS)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleConfirm"> 确认 </el-button>
      </span>
    </template>
  </el-dialog>
</template>
<script setup lang="ts">
import { DICT_TYPE, getStrDictOptions } from '@/utils/dict'
import { ref } from 'vue'
const formEl = useTemplateRef('formRef')
const emit = defineEmits(['confirm'])
defineOptions({
  name: 'OrderStatusPopup'
})
const dialogVisible = ref(false)
const formData = reactive({
  orderStatus: ''
})

watch(dialogVisible, (val) => {
  if (val){
    formData.orderStatus = ''
    if(formEl&&formEl.value){
      formEl.value.clearValidate()

    }
  }
})
const setVisible = (visible: boolean) => {
  dialogVisible.value = visible
}
const handleClose = () => {
  dialogVisible.value = false
}
const handleConfirm = () => {
  if(formEl&&formEl.value){
    formEl.value.validate((valid) => {
      if (valid) {
        dialogVisible.value = false
        emit('confirm', formData.orderStatus)
      }
    })
    return
  }
}
defineExpose({
  dialogVisible,
  setVisible
})
</script>

<style scoped lang="scss"></style>
