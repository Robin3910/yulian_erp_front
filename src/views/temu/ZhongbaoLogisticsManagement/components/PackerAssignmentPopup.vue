<template>
  <el-dialog v-model="dialogVisible" title="分配打包人" width="30%" :before-close="handleClose">
    <el-form :model="formData" ref="formRef" v-loading="loading">
      <el-form-item label="已选择中包序号：" prop="sortingSequences">
        <span>{{ formData.sortingSequences.length }} 个</span>
      </el-form-item>
      <el-form-item
        label="选择打包人："
        prop="packerId"
        :rules="[{ required: true, message: '请选择打包人', trigger: 'change' }]"
      >
        <el-select
          v-model="formData.packerId"
          placeholder="请选择打包人"
          style="width: 100%"
          filterable
          clearable
        >
          <el-option
            v-for="item in packerList"
            :key="item.id"
            :label="item.nickname"
            :value="item.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="是否替换发货人：" prop="replaceShippedOperator">
        <el-radio-group v-model="formData.replaceShippedOperator">
          <el-radio :label="true">是</el-radio>
          <el-radio :label="false">否</el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleConfirm" :loading="loading">确认</el-button>
      </span>
    </template>
  </el-dialog>
</template>
<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { TemuCommonApi } from '@/api/temu/common'
import { OrderApi } from '@/api/temu/order'
import { ElMessage } from 'element-plus'

const formEl = useTemplateRef('formRef')
const emit = defineEmits(['confirm', 'close'])
defineOptions({
  name: 'PackerAssignmentPopup'
})

const dialogVisible = ref(false)
const loading = ref(false)
const formData = reactive({
  sortingSequences: [] as string[],
  packerId: undefined as number | undefined,
  replaceShippedOperator: false // 默认为"否"
})

// 打包人员列表
const packerList = ref<any[]>([])

// 设置弹窗可见性
const setVisible = (visible: boolean) => {
  dialogVisible.value = visible
}

// 暴露给父组件的属性和方法
defineExpose({
  formData,
  setVisible
})

// 关闭弹窗
const handleClose = () => {
  dialogVisible.value = false
  emit('close')
}

// 确认提交
const handleConfirm = async () => {
  if (formEl && formEl.value) {
    formEl.value.validate(async (valid) => {
      if (valid) {
        if (formData.sortingSequences.length === 0) {
          ElMessage.warning('没有选择中包序号')
          return
        }
        
        if (!formData.packerId) {
          ElMessage.warning('请选择打包人')
          return
        }
        
        loading.value = true
        
        try {
          // 准备调用新接口的参数
          const params = {
            sortingSequenceList: formData.sortingSequences, // 中包序号集合
            senderId: formData.packerId,                   // 打包人ID
            conditionFlag: formData.replaceShippedOperator  // 是否替换发货人
          }
          
          // 调用后端接口
          await OrderApi.batchInsert(params)
          
          handleClose()
          emit('confirm', params)
          ElMessage.success('分配打包人成功')
        } catch (error) {
          console.error('分配打包人失败:', error)
          ElMessage.error('分配打包人失败')
        } finally {
          loading.value = false
        }
      }
    })
  }
}

// 获取打包人员列表
const fetchData = async (key: string) => {
  try {
    return await TemuCommonApi.getUserListByRoleKey(key)
  } catch (error) {
    console.error('获取用户列表失败:', error)
    ElMessage.error('获取用户列表失败')
    return []
  }
}

// 监听弹窗显示状态，加载数据
watch(
  () => dialogVisible.value,
  async (value) => {
    if (value) {
      loading.value = true
      try {
        // 获取打包人员列表
        packerList.value = await fetchData('production_staff')
      } catch (error) {
        console.error('获取打包人员列表失败:', error)
        ElMessage.error('获取打包人员列表失败')
      } finally {
        loading.value = false
      }
    }
  }
)
</script>

<style scoped lang="scss">
/* 不再需要样式 */
</style> 