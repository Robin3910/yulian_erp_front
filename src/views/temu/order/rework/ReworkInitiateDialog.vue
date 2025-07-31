<template>
  <el-dialog v-model="dialogVisible" title="返工发起" width="400px" :close-on-click-modal="false">
    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px" v-loading="loading">
      <el-form-item label="定制SKU">
        <el-input v-model="formData.customSku" disabled />
      </el-form-item>
      <el-form-item label="返工发起人" prop="reworkInitiatorName">
        <el-input v-model="formData.reworkInitiatorName" placeholder="请输入返工发起人姓名" />
      </el-form-item>
      <el-form-item label="返工作图人" prop="reworkDrawUserName">
        <el-input v-model="formData.reworkDrawUserName" placeholder="请输入返工作图人姓名" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">提交</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { TemuOrderReworkApi } from '@/api/temu/rework'

const dialogVisible = ref(false)
const loading = ref(false)
const formRef = ref()
const formData = reactive({
  customSku: '',
  orderNo: '',
  reworkInitiatorName: '',
  reworkDrawUserName: ''
})
const formRules = {
  reworkInitiatorName: [
    { required: true, message: '请输入返工发起人姓名', trigger: 'blur' }
  ],
  reworkDrawUserName: [
    { required: true, message: '请输入返工作图人姓名', trigger: 'blur' }
  ]
}

const open = (orderNo: string, customSku: string, row?: any) => {
  dialogVisible.value = true
  formData.orderNo = orderNo
  formData.customSku = customSku
  formData.reworkInitiatorName = row?.reworkInitiatorName || ''
  formData.reworkDrawUserName = row?.reworkDrawUserName || ''
  formRef.value?.resetFields()
}

const emit = defineEmits(['success'])

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate()
  loading.value = true
  try {
    const resp = await TemuOrderReworkApi.initiateRework({
      customSku: formData.customSku,
      orderNo: formData.orderNo,
      reworkInitiatorName: formData.reworkInitiatorName,
      reworkDrawUserName: formData.reworkDrawUserName
    })
    ElMessage.success('返工发起成功')
    dialogVisible.value = false
    emit('success', resp)
  } catch (error) {
    console.error('返工发起失败', error)
    ElMessage.error('返工发起失败')
  } finally {
    loading.value = false
  }
}

defineExpose({ open })
</script> 