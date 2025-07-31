<template>
  <el-dialog
    v-model="dialogVisible"
    title="订单返工"
    width="500px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      v-loading="formLoading"
    >
      <el-form-item label="定制SKU" prop="customSku">
        <el-input v-model="formData.customSku" placeholder="请输入定制SKU" disabled />
      </el-form-item>
      
      <el-form-item label="返工原因" prop="reworkReason">
        <el-select 
          v-model="formData.reworkReason" 
          placeholder="请选择返工原因"
          style="width: 100%"
          @change="handleReasonChange"
        >
          <el-option label="图案规格不符" value="图案规格不符" />
          <el-option label="图案有误" value="图案有误" />
          <el-option label="自定义" value="custom" />
        </el-select>
      </el-form-item>
      
      <el-form-item 
        v-if="formData.reworkReason === 'custom'" 
        label="自定义原因" 
        prop="customReason"
      >
        <el-input 
          v-model="formData.customReason" 
          type="textarea" 
          :rows="3"
          placeholder="请输入自定义返工原因"
          maxlength="500"
          show-word-limit
        />
      </el-form-item>
    </el-form>
    
    <template #footer>
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" @click="handleSubmit" :loading="formLoading">
        提交
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage, ElForm, ElFormItem } from 'element-plus'
import { TemuOrderReworkApi, TemuOrderReworkCreateReqVO } from '@/api/temu/rework'

const dialogVisible = ref(false)
const formLoading = ref(false)
const formRef = ref<InstanceType<typeof ElForm>>()

const formData = reactive({
  customSku: '',
  reworkReason: '',
  customReason: '',
  orderNo: '',
})

const formRules = reactive({
  reworkReason: [
    { required: true, message: '请选择返工原因', trigger: 'change' }
  ],
  customReason: [
    { required: true, message: '请输入自定义返工原因', trigger: 'blur' }
  ]
})

// 打开弹窗
const open = ( orderNo: string,customSku: string) => {
  dialogVisible.value = true
  formRef.value?.resetFields()           // 先重置表单
  formData.customSku = customSku
  formData.orderNo = orderNo
  formData.reworkReason = ''
  formData.customReason = ''
}

// 处理返工原因变化
const handleReasonChange = (value: string) => {
  if (value !== 'custom') {
    formData.customReason = ''
  }
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    
    formLoading.value = true
    
    // 确定最终的返工原因
    let finalReason = formData.reworkReason
    if (formData.reworkReason === 'custom') {
      if (!formData.customReason.trim()) {
        ElMessage.error('请输入自定义返工原因')
        return
      }
      finalReason = formData.customReason
    }
    
    const data: TemuOrderReworkCreateReqVO = {
      orderNo: formData.orderNo,
      customSku: formData.customSku,
      reworkReason: finalReason
    }
    
    await TemuOrderReworkApi.createRework(data)
    
    ElMessage.success('返工申请提交成功')
    dialogVisible.value = false
    emit('success')
  } catch (error) {
    ElMessage.error('创建返工记录失败')
  } finally {
    formLoading.value = false
  }
}

// 取消
const handleCancel = () => {
  dialogVisible.value = false
}

const emit = defineEmits(['success'])

defineExpose({ open })
</script>

<style scoped>
.el-form-item {
  margin-bottom: 20px;
}
</style> 
