<template>
  <Dialog :title="'SKC管理 - ' + oldTypeMap[oldType]" v-model="dialogVisible" width="800px">
    <div class="flex flex-col gap-4">
      <!-- 头部信息卡片 -->
      <div class="info-card">
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-2">
            <Icon icon="ep:shop" class="text-xl text-primary" />
            <span class="font-medium">店铺ID: {{ shopId }}</span>
          </div>
          <div class="flex items-center gap-2">
            <Icon icon="ep:document" class="text-xl text-success" />
            <span class="font-medium">SKC数量: {{ total }}</span>
          </div>
        </div>
      </div>

      <!-- 操作栏 -->
      <div class="action-bar">
        <el-button 
          type="danger" 
          :icon="Delete"
          :disabled="!selectedSkcs.length"
          @click="handleBatchDelete"
        >
          批量删除 ({{ selectedSkcs.length }})
        </el-button>
        <el-button type="primary" :icon="Plus" @click="handleAdd">
          新增SKC
        </el-button>
      </div>

      <!-- SKC列表 -->
      <el-table 
        :data="pageList" 
        v-loading="loading"
        :header-cell-style="{ 
          background: 'var(--el-color-primary-light-8)', 
          color: 'var(--el-color-primary-dark-2)', 
          fontWeight: 'bold',
          fontSize: '14px'
        }"
        :cell-style="{ fontSize: '14px' }"
        border
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column type="index" label="序号" width="80" align="center">
          <template #default="{ $index }">
            {{ (currentPage - 1) * pageSize + $index + 1 }}
          </template>
        </el-table-column>
        <el-table-column prop="skc" label="SKC" min-width="200">
          <template #default="{ row }">
            <div class="skc-cell">
              <span class="skc-text" :class="getTextColorClass(row.oldType)">
                {{ row.skc }}
              </span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" align="center" fixed="right">
          <template #default="{ row }">
            <el-button 
              type="danger" 
              link
              :icon="Delete"
              @click="handleDelete([row.skc])"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="flex justify-end mt-2">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          background
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 新增SKC表单 -->
    <el-dialog
      v-model="addDialogVisible"
      title="新增SKC"
      append-to-body
      width="400px"
      destroy-on-close
      class="add-skc-dialog"
    >
      <el-form
        ref="addFormRef"
        :model="addForm"
        :rules="addFormRules"
        label-width="60px"
        class="mt-4"
      >
        <el-form-item label="SKC" prop="skc">
          <el-input 
            v-model="addForm.skc" 
            placeholder="请输入SKC" 
            clearable 
            :maxlength="50"
            show-word-limit
          >
            <template #prefix>
              <Icon icon="ep:key" class="text-gray-400" />
            </template>
          </el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addDialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="submitAdd" :loading="submitting">确 定</el-button>
      </template>
    </el-dialog>
  </Dialog>
</template>

<script setup lang="ts">
import { Dialog } from '@/components/Dialog'
import { Icon } from '@/components/Icon'
import { ShopApi, ShopOldTypeVO, ShopOldTypeDeleteDTO } from '@/api/temu/shop'
import { ElMessageBox } from 'element-plus'
import { Delete, Plus } from '@element-plus/icons-vue'

const message = useMessage() // 消息弹窗

const oldTypeMap = {
  '0': '0+',
  '1': '3+',
  '2': '14+'
}

const props = defineProps<{
  shopId: number
  oldType: string
}>()

const emit = defineEmits(['success'])

const dialogVisible = ref(false)
const loading = ref(false)
const submitting = ref(false)
const skcList = ref<ShopOldTypeVO[]>([])
const selectedSkcs = ref<string[]>([])

// 分页相关
const currentPage = ref(1)
const pageSize = ref(10)
const total = computed(() => skcList.value.length)
const pageList = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return skcList.value.slice(start, end)
})

// 分页事件处理
const handleSizeChange = (val: number) => {
  pageSize.value = val
  currentPage.value = 1
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
}

// 表格选择变化
const handleSelectionChange = (selection: ShopOldTypeVO[]) => {
  selectedSkcs.value = selection.map(item => item.skc)
}

// 批量删除
const handleBatchDelete = () => {
  handleDelete(selectedSkcs.value)
}

// 新增SKC相关
const addDialogVisible = ref(false)
const addFormRef = ref()
const addForm = ref({
  skc: ''
})
const addFormRules = {
  skc: [
    { required: true, message: '请输入SKC', trigger: 'blur' },
    { pattern: /^[A-Za-z0-9-_]+$/, message: 'SKC只能包含字母、数字、横线和下划线', trigger: 'blur' }
  ]
}

// 加载SKC列表
const loadSkcList = async () => {
  loading.value = true
  try {
    const response = await ShopApi.getShopOldType(props.shopId)
    // 过滤出当前oldType的数据
    skcList.value = response.filter(item => item.oldType === props.oldType)
    // 重置分页
    currentPage.value = 1
  } catch (error) {
    console.error('获取SKC列表失败:', error)
    message.error('获取SKC列表失败')
  } finally {
    loading.value = false
  }
}

// 打开对话框
const open = async () => {
  dialogVisible.value = true
  await loadSkcList()
}

// 新增SKC
const handleAdd = () => {
  addForm.value = {
    skc: ''
  }
  addDialogVisible.value = true
}

// 提交新增
const submitAdd = async () => {
  await addFormRef.value.validate()
  
  submitting.value = true
  try {
    // 检查SKC是否重复
    if (skcList.value.some(item => item.skc === addForm.value.skc)) {
      message.error('SKC不能重复，请重新输入！')
      return
    }

    // 获取当前oldType的oldTypeUrl
    const currentOldTypeUrl = skcList.value.length > 0 
      ? skcList.value[0].oldTypeUrl
      : ''

    const data: ShopOldTypeVO[] = [{
      shopId: props.shopId,
      oldType: props.oldType,
      skc: addForm.value.skc,
      oldTypeUrl: currentOldTypeUrl
    }]
    
    await ShopApi.createShopOldType(data)
    message.success('新增成功')
    addDialogVisible.value = false
    await loadSkcList()
    emit('success')
  } catch (error) {
    console.error('新增SKC失败:', error)
    message.error('SKC不能重复，新增SKC失败！')
  } finally {
    submitting.value = false
  }
}

// 删除SKC
const handleDelete = async (skcList: string[]) => {
  if (!skcList.length) return

  try {
    await ElMessageBox.confirm(
      `确认要删除选中的 ${skcList.length} 个SKC吗？`, 
      '提示', 
      {
        type: 'warning',
        confirmButtonText: '确定',
        cancelButtonText: '取消'
      }
    )

    const data: ShopOldTypeDeleteDTO = {
      shopId: props.shopId,
      oldType: props.oldType,
      skcList
    }

    await ShopApi.deleteShopOldType(data)
    message.success('删除成功')
    await loadSkcList()
    selectedSkcs.value = [] // 清空选中
    emit('success')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除SKC失败:', error)
      message.error('删除SKC失败')
    }
  }
}

// 获取文本颜色类名
const getTextColorClass = (type: string): string => {
  const types: { [key: string]: string } = {
    '0': 'text-primary',
    '1': 'text-success',
    '2': 'text-warning'
  }
  return types[type] || 'text-info'
}

// 表格行样式
const tableRowClassName = ({ rowIndex }: { rowIndex: number }) => {
  return rowIndex % 2 === 0 ? 'even-row' : 'odd-row'
}

defineExpose({ open })
</script>

<style scoped>
.info-card {
  background-color: var(--el-color-primary-light-9);
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.text-primary {
  color: var(--el-color-primary);
}

.text-success {
  color: var(--el-color-success);
}

.text-warning {
  color: var(--el-color-warning);
}

.text-info {
  color: var(--el-color-info);
}

:deep(.el-table) {
  border-radius: 8px;
  overflow: hidden;
  --el-table-border-color: var(--el-color-primary-light-7);
}

:deep(.even-row) {
  background-color: var(--el-color-primary-light-9);
}

:deep(.odd-row) {
  background-color: white;
}

:deep(.el-table__row:hover) {
  background-color: var(--el-color-primary-light-8) !important;
}

:deep(.add-skc-dialog .el-dialog__body) {
  padding-top: 0;
}

.skc-cell {
  padding: 4px 0;
  display: flex;
  justify-content: center;
}

.skc-text {
  font-size: 18px;
  font-weight: 600;
  letter-spacing: 0.5px;
}
</style> 