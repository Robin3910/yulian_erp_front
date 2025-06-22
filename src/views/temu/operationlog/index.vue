<template>
  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form class="-mb-15px" :model="queryParams" ref="queryFormRef" :inline="true" label-width="68px">
      <el-form-item label="用户名" prop="userName">
        <el-input v-model="queryParams.userName" placeholder="请输入用户名" clearable @keyup.enter="handleQuery"
          class="!w-240px" />
      </el-form-item>
      <el-form-item label="操作时间" prop="operationTime">
        <el-date-picker v-model="queryParams.operationTime" value-format="YYYY-MM-DD HH:mm:ss" type="daterange"
          start-placeholder="开始日期" end-placeholder="结束日期"
          :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]" class="!w-220px" />
      </el-form-item>
      <el-form-item label="操作模块 " prop="module">
        <el-input v-model="queryParams.module" placeholder="请输入操作模块 " clearable @keyup.enter="handleQuery"
          class="!w-240px" />
      </el-form-item>
      <el-form-item label="操作 IP" prop="ipAddress">
        <el-input v-model="queryParams.ipAddress" placeholder="请输入操作 IP 地址" clearable @keyup.enter="handleQuery"
          class="!w-240px" />
      </el-form-item>
      <el-form-item label="类名" prop="className">
        <el-input v-model="queryParams.className" placeholder="请输入类名" clearable @keyup.enter="handleQuery"
          class="!w-240px" />
      </el-form-item>
      <el-form-item label="方法名" prop="methodName">
        <el-input v-model="queryParams.methodName" placeholder="请输入方法名" clearable @keyup.enter="handleQuery"
          class="!w-240px" />
      </el-form-item>
      <el-form-item label="请求参数" prop="requestParams">
        <el-input v-model="queryParams.requestParams" placeholder="请输入请求参数" clearable @keyup.enter="handleQuery"
          class="!w-240px" />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery">
          <Icon icon="ep:search" class="mr-5px" /> 搜索
        </el-button>
        <el-button @click="resetQuery">
          <Icon icon="ep:refresh" class="mr-5px" /> 重置
        </el-button>
        <!-- <el-button type="primary" plain @click="openForm('create')" v-hasPermi="['temu:operation-log:create']">
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button> -->
        <el-button type="success" plain @click="handleExport" :loading="exportLoading"
          v-hasPermi="['temu:operation-log:export']">
          <Icon icon="ep:download" class="mr-5px" /> 导出
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="用户名" align="center" prop="userName" />
      <el-table-column label="操作时间" align="center" prop="operationTime" :formatter="dateFormatter" width="180px" />
      <el-table-column label="操作模块 " align="center" prop="module" />
      <el-table-column label="操作类型" align="center" prop="operationType" />
      <el-table-column label="操作 IP 地址" align="center" prop="ipAddress" />
      <el-table-column label="类名" align="center" prop="className" />
      <el-table-column label="方法名" align="center" prop="methodName" />
      <el-table-column label="操作" align="center" min-width="120px">
        <template #default="scope">
          <!-- <el-button link type="primary" @click="openForm('update', scope.row.id)"
            v-hasPermi="['temu:operation-log:update']">
            编辑
          </el-button> -->
          <el-button link type="primary" @click="handleViewParams(scope.row)" v-hasPermi="['temu:operation-log:query']">
            查看参数
          </el-button>
          <el-button link type="danger" @click="handleDelete(scope.row.id)" v-hasPermi="['temu:operation-log:delete']">
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <!-- 分页 -->
    <Pagination :total="total" v-model:page="queryParams.pageNo" v-model:limit="queryParams.pageSize"
      @pagination="getList" />
  </ContentWrap>

  <!-- 表单弹窗：添加/修改 -->
  <OperationLogForm ref="formRef" @success="getList" />

  <!-- 查看参数弹窗 -->
  <el-dialog v-model="paramsDialogVisible" title="请求参数详情" width="800px" destroy-on-close>
    <div class="params-content">
      <pre v-if="currentParams" class="params-text">{{ formatParams(currentParams) }}</pre>
      <div v-else class="no-params">暂无请求参数</div>
    </div>
    <template #footer>
      <el-button @click="paramsDialogVisible = false">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { dateFormatter } from '@/utils/formatTime'
import download from '@/utils/download'
import { OperationLogApi, OperationLogVO } from '@/api/temu/operationlog'
import OperationLogForm from './OperationLogForm.vue'

/** 操作日志 列表 */
defineOptions({ name: 'TemuOperationLog' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const list = ref<OperationLogVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  userName: undefined,
  operationTime: [],
  module: undefined,
  ipAddress: undefined,
  className: undefined,
  methodName: undefined,
  requestParams: undefined,
})
const queryFormRef = ref() // 搜索的表单
const exportLoading = ref(false) // 导出的加载中

// 查看参数相关
const paramsDialogVisible = ref(false)
const currentParams = ref<string>('')

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await OperationLogApi.getOperationLogPage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value.resetFields()
  handleQuery()
}

/** 添加/修改操作 */
const formRef = ref()
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id)
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 发起删除
    await OperationLogApi.deleteOperationLog(id)
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
  } catch { }
}

/** 导出按钮操作 */
const handleExport = async () => {
  try {
    // 导出的二次确认
    await message.exportConfirm()
    // 发起导出
    exportLoading.value = true
    const data = await OperationLogApi.exportOperationLog(queryParams)
    download.excel(data, '操作日志.xls')
  } catch {
  } finally {
    exportLoading.value = false
  }
}

/** 查看参数按钮操作 */
const handleViewParams = (row: any) => {
  currentParams.value = row.requestParams || ''
  paramsDialogVisible.value = true
}

/** 格式化参数显示 */
const formatParams = (params: string) => {
  try {
    // 尝试解析JSON并格式化
    const parsed = JSON.parse(params)
    return JSON.stringify(parsed, null, 2)
  } catch {
    // 如果不是JSON，直接返回原内容
    return params
  }
}

/** 初始化 **/
onMounted(() => {
  getList()
})
</script>

<style lang="scss" scoped>
.params-content {
  max-height: 500px;
  overflow-y: auto;

  .params-text {
    background-color: #f5f5f5;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 16px;
    margin: 0;
    font-family: 'Courier New', monospace;
    font-size: 14px;
    line-height: 1.5;
    white-space: pre-wrap;
    word-wrap: break-word;
    color: #333;
  }

  .no-params {
    text-align: center;
    color: #999;
    padding: 40px;
    font-size: 16px;
  }
}

// 暗黑模式适配
:deep(.dark) {
  .params-content {
    .params-text {
      background-color: #2b2b2b;
      border-color: #444;
      color: #e0e0e0;
    }

    .no-params {
      color: #666;
    }
  }
}
</style>