<template>
  <div class="batch-category-manage">
    <!-- 查询区 -->
    <el-row :gutter="16" align="middle" class="search-row">
      <el-col :span="6">
        <el-input v-model="searchBatchId" placeholder="按批次ID查询" clearable style="width: 180px;" />
        <el-button @click="onSearchByBatch" type="primary" style="margin-left: 8px;">按批次查询</el-button>
      </el-col>
      <el-col :span="6">
        <el-input v-model="searchCategoryId" placeholder="按类目ID查询" clearable style="width: 180px;" />
        <el-button @click="onSearchByCategory" type="primary" style="margin-left: 8px;">按类目查询</el-button>
      </el-col>
      <el-col :span="6">
        <el-input v-model="searchCategoryName" placeholder="按类目名称查询" clearable style="width: 180px;" />
        <el-button @click="onSearchByCategoryName" type="primary" style="margin-left: 8px;">按类目名称查询</el-button>
      </el-col>
      <el-col :span="4">
        <el-button @click="onReset" type="default">重置</el-button>
        <el-button @click="onBatchDelete" type="danger" :disabled="!multipleSelection.length" style="margin-left: 8px;">批量删除</el-button>
      </el-col>
    </el-row>

    <!-- 列表区 -->
    <el-table :data="tableData" @selection-change="onSelectionChange" style="margin-top: 16px;" border>
      <el-table-column type="selection" width="55" />
      <!-- <el-table-column prop="id" label="ID" width="80" /> -->
      <el-table-column prop="batchCategoryId" label="批次ID" width="150" />
      <el-table-column prop="categoryId" label="类目ID" width="120" />
      <el-table-column prop="categoryName" label="类目名称" width="180" />
      <el-table-column label="创建时间" width="180">
        <template #default="{ row }">
          {{ formatTime(row.createTime) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120">
        <template #default="scope">
          <el-button size="small" @click="onEdit(scope.row)">编辑</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 编辑弹窗 -->
    <el-dialog v-model="editDialogVisible" title="编辑批次ID" width="400px">
      <el-form label-width="80px">
        <el-form-item label="批次ID">
          <el-input v-model="editForm.batchCategoryId" />
        </el-form-item>
        <el-form-item label="类目ID">
          <el-input v-model="editForm.categoryId" disabled />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="onEditSave">保存</el-button>
      </template>
    </el-dialog>

    <!-- 分页 -->
    <el-pagination
      style="margin-top: 16px; text-align: right"
      background
      layout="total, sizes, prev, pager, next, jumper"
      :total="total"
      :current-page="pageNo"
      :page-size="pageSize"
      @current-change="handleCurrentChange"
      @size-change="handleSizeChange"
      :page-sizes="[10, 20, 50, 100]"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getBatchCategoryPage,
  deleteBatchCategories,
  updateBatchCategoryId
} from '@/api/temu/product-category/batchCategory'

// 格式化时间
function formatTime(timestamp: number | null) {
  if (!timestamp) return '-'
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  const second = String(date.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`
}

const searchBatchId = ref('')
const searchCategoryId = ref('')
const searchCategoryName = ref('')
const tableData = ref<any[]>([])
const multipleSelection = ref<any[]>([])

const pageNo = ref(1)
const pageSize = ref(10)
const total = ref(0)

const editDialogVisible = ref(false)
const editForm = ref({ batchCategoryId: '', categoryId: 0 })

// 查询
const fetchData = async () => {
  const params: any = {
    pageNo: pageNo.value,
    pageSize: pageSize.value
  }
  if (searchBatchId.value) params.batchCategoryId = searchBatchId.value
  if (searchCategoryId.value) params.categoryId = searchCategoryId.value
  if (searchCategoryName.value) params.categoryName = searchCategoryName.value

  const res = await getBatchCategoryPage(params)
  tableData.value = res?.list || []
  total.value = res?.total || 0
}

onMounted(() => {
  fetchData()
})

const onSearchByBatch = () => {
  searchCategoryId.value = ''
  searchCategoryName.value = ''
  pageNo.value = 1
  fetchData()
}
const onSearchByCategory = () => {
  searchBatchId.value = ''
  searchCategoryName.value = ''
  pageNo.value = 1
  fetchData()
}
const onSearchByCategoryName = () => {
  searchBatchId.value = ''
  searchCategoryId.value = ''
  pageNo.value = 1
  fetchData()
}
const onReset = () => {
  searchBatchId.value = ''
  searchCategoryId.value = ''
  searchCategoryName.value = ''
  pageNo.value = 1
  fetchData()
}

// 多选
const onSelectionChange = (val: any[]) => {
  multipleSelection.value = val
}

// 批量删除
const onBatchDelete = async () => {
  if (!multipleSelection.value.length) return
  try {
    await ElMessageBox.confirm('确定要删除选中的数据吗？', '提示', { type: 'warning' })
    await deleteBatchCategories(multipleSelection.value.map(i => i.id))
    ElMessage.success('删除成功')
    fetchData()
  } catch (e) {}
}

// 编辑
const onEdit = (row: any) => {
  editForm.value = { ...row }
  editDialogVisible.value = true
}
const onEditSave = async () => {
  try {
    await updateBatchCategoryId(editForm.value.batchCategoryId, editForm.value.categoryId)
    ElMessage.success('保存成功')
    editDialogVisible.value = false
    fetchData()
  } catch (e) {}
}

const handleCurrentChange = (val: number) => {
  pageNo.value = val
  fetchData()
}
const handleSizeChange = (val: number) => {
  pageSize.value = val
  pageNo.value = 1
  fetchData()
}
</script>

<style scoped>
.batch-category-manage {
  padding: 24px;
}
.search-row .el-col {
  display: flex;
  align-items: center;
}
</style> 
