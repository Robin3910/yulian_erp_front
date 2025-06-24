<template>
  <el-dialog v-model="dialogVisible" title="分配任务（可修改人员）" width="30%" :before-close="handleClose">
    <el-form :model="formData" ref="formRef">
      <el-form-item label="已选择批次数量：" prop="remark">
        <span>{{ formData.orderIds.length || 0 }}</span>
      </el-form-item>
      <el-form-item
        label="选择作图员："
        prop="artStaffUserId"
        :rules="[{ required: false, message: '请选择作图员', trigger: 'blur' }]"
      >
        <el-select
          v-model="formData.artStaffUserId"
          placeholder="(选填)"
          style="width: 100%"
          filterable
          clearable
        >
          <el-option
            v-for="item in artStaffList"
            :key="item.id"
            :label="item.nickname"
            :value="item.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item
        label="选择生产员："
        prop="productionStaffUserId"
        :rules="[{ required: false, message: '请选择生产员', trigger: 'blur' }]"
      >
        <el-select
          v-model="formData.productionStaffUserId"
          placeholder="(选填)"
          style="width: 100%"
          filterable
          clearable
        >
          <el-option
            v-for="item in productionStaffList"
            :key="item.id"
            :label="item.nickname"
            :value="item.id"
          />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleConfirm"> 确认 </el-button>
      </span>
    </template>
  </el-dialog>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { TemuCommonApi } from '@/api/temu/common'

const formEl = useTemplateRef('formRef')
const emit = defineEmits(['confirm', 'close'])
defineOptions({
  name: 'OrderBatchTaskDispatchPopup'
})
const dialogVisible = ref(false)
const formData = reactive({
  orderIds: [],
  artStaffUserId: '',
  productionStaffUserId: ''
})
/**
 * 获取作图用户列表
 */
const artStaffList = ref<any[]>()
/**
 * 获取生产用户列表
 */
const productionStaffList = ref<any[]>()
const setVisible = (visible: boolean) => {
  dialogVisible.value = visible
}
defineExpose({
  formData,
  setVisible
})
const handleClose = () => {
  dialogVisible.value = false
  emit('close')
}
const handleConfirm = () => {
  if (formEl && formEl.value) {
    formEl.value.validate((valid) => {
      if (valid) {
        handleClose()
        emit('confirm', formData)
      }
    })
    return
  }
}
const fetchData = async (key: string) => {
  return await TemuCommonApi.getUserListByRoleKey(key)
}
watch(
  () => dialogVisible.value,
  async (value) => {
    if (value) {
      // 作图员用户
      artStaffList.value = await fetchData('art_staff')
      // 生产用户
      productionStaffList.value = await fetchData('production_staff')
    }
  }
)
</script>

<style scoped lang="scss"></style>
