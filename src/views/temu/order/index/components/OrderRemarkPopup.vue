<template v-if="dialogVisible">
  <el-dialog v-model="dialogVisible" title="设置备注" width="30%" :before-close="handleClose">
    <el-form :model="formData" ref="formRef">
      <el-form-item
        label="备注"
        prop="remark"
        :rules="[{ required: true, message: '请输入备注', trigger: 'blur' }]"
      >
        <el-input v-model="formData.remark" type="textarea" :rows="4" placeholder="请输入备注" />
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
import { ref } from 'vue'

const formEl = useTemplateRef('formRef')
const emit = defineEmits(['confirm'])
defineOptions({
  name: 'OrderRemarkPopup'
})
const dialogVisible = ref(false)
const formData = reactive({
  orderId: '',
  remark: ''
})
const setVisible = (visible: boolean) => {
  dialogVisible.value = visible
}
defineExpose({
  formData,
  setVisible
})
const handleClose = () => {
  dialogVisible.value = false
}
const handleConfirm = () => {
  if (formEl && formEl.value) {
    formEl.value.validate((valid) => {
      if (valid) {
        dialogVisible.value = false
        emit('confirm', formData)
      }
    })
    return
  }
}


</script>

<style scoped lang="scss"></style>
