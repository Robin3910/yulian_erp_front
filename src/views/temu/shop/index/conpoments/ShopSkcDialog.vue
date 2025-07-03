<template>
  <Dialog :title="'SKC管理  ---' + oldTypeMap[oldType]" v-model="dialogVisible" width="800px">
    <div class="flex flex-col gap-4">
      <!-- 头部信息卡片 -->
      <div class="info-card">
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-2">
            <span class="font-medium" style="font-weight: bold">店铺ID:</span>
            <span class="font-bold bg-gray-200 px-2 py-1 rounded"> {{ shopId }}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="font-medium">SKC数量: </span>
            <span class="font-bold bg-gray-200 px-2 py-1 rounded">{{ total }}</span>
          </div>
        </div>
      </div>

      <!-- 搜索框和操作栏 -->
      <div class="action-bar">
        <div class="flex items-center gap-4">
          <div class="search-box">
            <el-input
              v-model="searchKeyword"
              placeholder="请输入SKC关键字"
              clearable
              @input="handleSearch"
              @clear="handleSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </div>
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
          <el-button type="success" @click="handleExportAllSkc">导出全部SKC</el-button>
        </div>
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
        <el-table-column prop="skc" label="SKC" min-width="200" align="center">
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

      <!-- 底部关闭按钮 -->
      <div class="flex justify-center mt-4">
        <el-button @click="dialogVisible = false">关 闭</el-button>
      </div>
    </div>

    <!-- 新增SKC表单 -->
    <el-dialog
      v-model="addDialogVisible"
      title="新增SKC"
      append-to-body
      width="500px"
      destroy-on-close
      class="add-skc-dialog"
    >
      <!-- 修改提示消息的显示条件 -->
      <div v-if="props.showUploadTip" class="tip-message">
        <el-alert
          title="没有SKC信息，请先填写SKC，再上传合规图！"
          type="warning"
          :closable="false"
          show-icon
        />
      </div>
      <el-form
        ref="addFormRef"
        :model="addForm"
        :rules="addFormRules"
        label-width="60px"
        class="mt-4"
      >
        <el-form-item label="SKC" prop="skc">
          <el-input 
            ref="skcInputRef"
            v-model="addForm.skc" 
            type="textarea"
            :rows="10"
            placeholder="请输入SKC，支持以下格式：
1. 单个SKC直接输入
2. 多个SKC请换行输入，例如：
4394941741
2177902582
2520686281
也支持空格分隔的格式" 
            clearable
            @input="handleSkcInput"
          />
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
import { ElMessageBox, ElNotification, ElLoading } from 'element-plus'
import { Delete, Plus, Search } from '@element-plus/icons-vue'
import { h } from 'vue'

const message = useMessage() // 消息弹窗

const oldTypeMap = {
  '0': '0+',
  '1': '3+',
  '2': '14+'
}

const props = defineProps<{
  shopId: number
  oldType: string
  showUploadTip?: boolean // 新增属性，用于控制是否显示上传提示
}>()

const emit = defineEmits(['success'])

const dialogVisible = ref(false)
const loading = ref(false)
const submitting = ref(false)
const skcList = ref<ShopOldTypeVO[]>([])
const allShopSkcs = ref<ShopOldTypeVO[]>([]) // 存储所有合规单类型的SKC
const selectedSkcs = ref<string[]>([])

// 分页相关
const currentPage = ref(1)
const pageSize = ref(10)
const searchKeyword = ref('')
const filteredSkcList = ref<ShopOldTypeVO[]>([])

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
    { 
      validator: (rule: any, value: string, callback: any) => {
        if (!value) {
          callback()
          return
        }
        
        // 分割输入的SKC（支持换行和空格分隔）
        const skcs = value.split(/[\n\s]+/).filter(item => item.trim())
        
        // 验证每个SKC的格式
        const invalidSkcs = skcs.filter(skc => !/^[A-Za-z0-9-_]+$/.test(skc))
        
        if (invalidSkcs.length > 0) {
          callback(new Error(`以下SKC格式不正确（只能包含字母、数字、横线和下划线）：\n${invalidSkcs.join('\n')}`))
          return
        }
        
        callback()
      },
      trigger: 'blur'
    }
  ]
}

// 新增 skcInputRef
const skcInputRef = ref()

// 添加输入处理函数
const handleSkcInput = (value: string) => {
  // 当有输入内容时，立即验证
  if (value) {
    addFormRef.value?.validateField('skc')
  }
}

// 加载所有合规单类型的SKC列表
const loadAllShopSkcs = async () => {
  try {
    const response = await ShopApi.getShopOldType(props.shopId)
    allShopSkcs.value = response
  } catch (error) {
    console.error('获取所有SKC列表失败:', error)
  }
}

// 加载SKC列表
const loadSkcList = async () => {
  loading.value = true
  try {
    await loadAllShopSkcs() // 先加载所有SKC
    // 过滤出当前oldType的数据
    skcList.value = allShopSkcs.value.filter(item => item.oldType === props.oldType)
    // 初始化过滤后的列表
    filteredSkcList.value = skcList.value
    // 重置分页
    currentPage.value = 1
    // 重置搜索关键字
    searchKeyword.value = ''
  } catch (error) {
    console.error('获取SKC列表失败:', error)
    message.error('获取SKC列表失败')
  } finally {
    loading.value = false
  }
}

// 检查SKC是否在任何合规单类型中存在
const checkSkcExists = (skc: string): boolean => {
  return allShopSkcs.value.some(item => item.skc === skc)
}

// 打开对话框
const open = async () => {
  dialogVisible.value = true
  await loadSkcList()
  // 如果没有SKC数据，打开新增对话框
  if (total.value === 0) {
    handleAdd()
  }
}

// 新增SKC
const handleAdd = () => {
  addForm.value = {
    skc: ''
  }
  addDialogVisible.value = true
  // 在下一个事件循环中聚焦输入框
  nextTick(() => {
    skcInputRef.value?.focus()
  })
}

// 提交新增
const submitAdd = async () => {
  submitting.value = true
  const loadingInstance = ElLoading.service({
    lock: true,
    text: '正在批量新增SKC，请稍候...',
    background: 'rgba(0, 0, 0, 0.3)'
  })
  try {
    await addFormRef.value.validate()
    
    // 分割并过滤输入的SKC
    const skcs = addForm.value.skc.split(/[\n\s]+/).filter(item => item.trim())
    
    // 检查重复的SKC
    const skcMap = new Map()
    const duplicates = []
    skcs.forEach(skc => {
      if (skcMap.has(skc)) {
        if (!duplicates.includes(skc)) {
          duplicates.push(skc)
        }
      } else {
        skcMap.set(skc, true)
      }
    })
    
    // 使用 Map 的 keys 获取唯一的 SKC 列表
    const uniqueSkcs = Array.from(skcMap.keys())
    
    if (duplicates.length > 0) {
      ElNotification({
        title: '输入的SKC中存在重复项，已自动去重',
        message: h('div', {}, [
          h('div', '以下SKC出现重复：'),
          h('div', { style: 'margin-top: 8px; color: var(--el-color-warning)' }, duplicates.join(', '))
        ]),
        type: 'warning',
        duration: 5000,
        position: 'top-right'
      })
    }

    // 获取当前oldType的oldTypeUrl
    const currentOldTypeUrl = skcList.value.length > 0 
      ? skcList.value[0].oldTypeUrl
      : ''

    // 构建批量创建数据
    const data: ShopOldTypeVO[] = uniqueSkcs.map(skc => ({
      shopId: props.shopId,
      oldType: props.oldType,
      skc: skc,
      oldTypeUrl: currentOldTypeUrl
    }))
    
    await ShopApi.createShopOldType(data)
    message.success('新增成功')
    addDialogVisible.value = false
    await loadSkcList()
    emit('success')
  } catch (error) {
    console.error('新增SKC失败:', error)
    message.error('新增SKC失败')
  } finally {
    submitting.value = false
    loadingInstance.close()
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

// 处理搜索
const handleSearch = () => {
  const keyword = searchKeyword.value.trim().toLowerCase()
  if (!keyword) {
    filteredSkcList.value = skcList.value
  } else {
    filteredSkcList.value = skcList.value.filter(item => 
      item.skc.toLowerCase().includes(keyword)
    )
  }
  // 重置分页到第一页
  currentPage.value = 1
}

// 修改pageList计算属性
const pageList = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredSkcList.value.slice(start, end)
})

// 修改total计算属性
const total = computed(() => filteredSkcList.value.length)

// 批量导出全部SKC
const handleExportAllSkc = () => {
  // 获取所有SKC字符串
  const allSkcArr = skcList.value.map(item => item.skc).filter(Boolean)
  if (!allSkcArr.length) {
    message.warning('没有可导出的SKC')
    return
  }
  const content = allSkcArr.join('\n')
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `shop_${props.shopId}_skc.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  message.success('导出成功')
}

defineExpose({ open })
</script>

<style scoped>
.info-card {
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  border: 1px solid #e9ecef;
}

.search-box {
  width: 300px;
}

.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  gap: 16px;
}

.text-primary {
  color: #495057;
}

.text-success {
  color: #495057;
}

.text-warning {
  color: #495057;
}

.text-info {
  color: #495057;
}

:deep(.el-table) {
  border-radius: 8px;
  overflow: hidden;
  --el-table-border-color: #dee2e6;
  --el-table-header-bg-color: #9ec5ec;
  --el-table-header-text-color: #ffffff;
  --el-table-row-hover-bg-color: #e9ecef;
}

:deep(.el-table th) {
  background-color: #e7ebf0 !important;
  color: #495057 !important;
  font-weight: 500;
}

:deep(.even-row) {
  background-color: #f8f9fa;
}

:deep(.odd-row) {
  background-color: #ffffff;
}

:deep(.el-table__row:hover) {
  background-color: #e9ecef !important;
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
  font-weight: 500;
  letter-spacing: 0.5px;
}

:deep(.el-input__prefix) {
  color: var(--el-text-color-secondary);
}

.tip-message {
  margin-bottom: 16px;
}
</style> 