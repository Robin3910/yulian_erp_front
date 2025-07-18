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
      <el-col :span="4">
        <el-button @click="onReset" type="default">重置</el-button>
        <el-button @click="onBatchDelete" type="danger" :disabled="!multipleSelection.length" style="margin-left: 8px;">批量删除</el-button>
      </el-col>
    </el-row>

    <!-- 列表区 -->
    <el-table :data="tableData" @selection-change="onSelectionChange" style="margin-top: 16px;" border>
      <el-table-column type="selection" width="55" />
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="batchCategoryId" label="批次ID" width="150" />
      <el-table-column prop="categoryId" label="类目ID" width="120" />
      <el-table-column prop="categoryName" label="类目名字" width="150" />
      <el-table-column prop="createTime" label="创建时间" width="180" />
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
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getBatchCategoryList,
  getBatchCategoryListByCategory,
  deleteBatchCategories,
  updateBatchCategoryId
} from '@/api/temu/product-category/batchCategory'

const searchBatchId = ref('')
const searchCategoryId = ref('')
const tableData = ref<any[]>([])
const multipleSelection = ref<any[]>([])

const editDialogVisible = ref(false)
const editForm = ref({ batchCategoryId: '', categoryId: 0 })

// 查询
const fetchData = async () => {
  let res
  if (searchBatchId.value) {
    res = await getBatchCategoryList(searchBatchId.value)
  } else if (searchCategoryId.value) {
    res = await getBatchCategoryListByCategory(Number(searchCategoryId.value))
  } else {
    res = await getBatchCategoryList()
  }
  tableData.value = res || []
  
}
fetchData()

const onSearchByBatch = () => {
  searchCategoryId.value = ''
  fetchData()
}
const onSearchByCategory = () => {
  searchBatchId.value = ''
  fetchData()
}
const onReset = () => {
  searchBatchId.value = ''
  searchCategoryId.value = ''
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
