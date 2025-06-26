<template>
  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form class="-mb-15px" :model="queryParams" ref="queryFormRef" :inline="true" label-width="68px">
      <!-- <el-form-item label="工作人员ID，关联system_users表id" prop="workerId">
        <el-input
          v-model="queryParams.workerId"
          placeholder="请输入工作人员ID，关联system_users表id"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item> -->
      <el-form-item label="昵称" prop="workerName">
        <el-input v-model="queryParams.workerName" placeholder="请输入昵称" clearable @keyup.enter="handleQuery"
          class="!w-240px" />
      </el-form-item>
      <!-- <el-form-item label="人员类型" prop="workerType">
        <el-select v-model="queryParams.workerType" placeholder="请选择类型" clearable class="!w-240px">
          <el-option label="请选择字典生成" value="" />
        </el-select>
      </el-form-item> -->
      <el-form-item label="任务类型" prop="taskType">
        <el-select v-model="queryParams.taskType" placeholder="请选择任务类型" clearable class="!w-240px">
          <el-option label="作图" :value="1" />
          <el-option label="生产" :value="2" />
          <el-option label="发货" :value="3" />
        </el-select>
      </el-form-item>
      <!-- <el-form-item label="任务状态" prop="taskStatus">
        <el-select v-model="queryParams.taskStatus" placeholder="请选择任务状态" clearable class="!w-240px">
          <el-option label="请选择字典生成" value="" />
        </el-select>
      </el-form-item> -->
      <!-- <el-form-item label="关联订单ID，对应temu_order表id" prop="orderId">
        <el-input v-model="queryParams.orderId" placeholder="请输入关联订单ID，对应temu_order表id" clearable
          @keyup.enter="handleQuery" class="!w-240px" />
      </el-form-item>
      <el-form-item label="批次订单ID，对应temu_order_batch_task表batch_order_id" prop="batchOrderId">
        <el-input v-model="queryParams.batchOrderId" placeholder="请输入批次订单ID，对应temu_order_batch_task表batch_order_id"
          clearable @keyup.enter="handleQuery" class="!w-240px" />
      </el-form-item> -->
      <el-form-item label="订单编号" prop="orderNo">
        <el-input v-model="queryParams.orderNo" placeholder="请输入订单编号" clearable @keyup.enter="handleQuery"
          class="!w-240px" />
      </el-form-item>
      <el-form-item label="定制SKU" prop="customSku">
        <el-input v-model="queryParams.customSku" placeholder="请输入定制SKU" clearable @keyup.enter="handleQuery"
          class="!w-240px" />
      </el-form-item>
      <!-- <el-form-item label="处理SKU数量，对应temu_order表quantity" prop="skuQuantity">
        <el-input v-model="queryParams.skuQuantity" placeholder="请输入处理SKU数量，对应temu_order表quantity" clearable
          @keyup.enter="handleQuery" class="!w-240px" />
      </el-form-item> -->
      <el-form-item label="完成时间" prop="taskCompleteTime">
        <el-date-picker v-model="queryParams.taskCompleteTime" value-format="YYYY-MM-DD HH:mm:ss" type="daterange"
          start-placeholder="开始日期" end-placeholder="结束日期"
          :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]" class="!w-220px" />
      </el-form-item>
      <!-- <el-form-item label="创建时间" prop="createTime">
        <el-date-picker v-model="queryParams.createTime" value-format="YYYY-MM-DD HH:mm:ss" type="daterange"
          start-placeholder="开始日期" end-placeholder="结束日期"
          :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]" class="!w-220px" />
      </el-form-item> -->
      <el-form-item label="店铺" prop="shopId">
        <el-select v-model="queryParams.shopId" placeholder="请选择店铺" clearable filterable class="!w-240px">
          <el-option v-for="item in shopList" :key="item.shopId" :label="item.shopName" :value="item.shopId" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery">
          <Icon icon="ep:search" class="mr-5px" /> 搜索
        </el-button>
        <el-button @click="resetQuery">
          <Icon icon="ep:refresh" class="mr-5px" /> 重置
        </el-button>
        <!-- <el-button type="primary" plain @click="openForm('create')" v-hasPermi="['temu:worker-task:create']">
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button> -->
        <el-button type="success" plain @click="handleExport" :loading="exportLoading"
          v-hasPermi="['temu:worker-task:export']">
          <Icon icon="ep:download" class="mr-5px" /> 导出
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="ID" align="center" prop="id" />
      <el-table-column label="工作人员ID" align="center" prop="workerId" />
      <el-table-column label="工作人员昵称" align="center" prop="workerName" />
      <!-- <el-table-column label="工作人员类型" align="center" prop="workerType" /> -->
      <el-table-column label="任务类型" align="center" prop="taskType">
        <template #default="{ row }">
          <span v-if="row.taskType === 1">作图</span>
          <span v-else-if="row.taskType === 2">生产</span>
          <span v-else-if="row.taskType === 3">发货</span>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="任务状态" align="center" prop="taskStatus">
        <template #default="{ row }">
          <span v-if="row.taskStatus === 0">待处理</span>
          <span v-else-if="row.taskStatus === 1">已完成</span>
          <span v-else-if="row.taskStatus === 2">已取消</span>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <!-- <el-table-column label="关联订单ID" align="center" prop="orderId" /> -->
      <el-table-column label="订单编号" align="center" prop="orderNo" />
      <!-- <el-table-column label="批次订单ID" align="center" prop="batchOrderId" /> -->
      <el-table-column label="定制SKU" align="center" prop="customSku" />
      <el-table-column label="处理定制SKU总数量" align="center" prop="skuQuantity" />
      <el-table-column label="任务完成时间" align="center" prop="taskCompleteTime" :formatter="dateFormatter" width="180px" />
      <!-- <el-table-column label="创建时间" align="center" prop="createTime" :formatter="dateFormatter" width="180px" /> -->
      <el-table-column label="店铺信息" align="center" min-width="140">
        <template #default="{ row }">
          <div class="text-left">
            <div class="font-bold text-center">{{ row.shopName }}</div>
            <div class="flex items-center justify-center">{{ row.shopId }}</div>
          </div>
        </template>
      </el-table-column>
      <!-- <el-table-column label="操作" align="center" min-width="120px">
        <template #default="scope">
          <el-button link type="primary" @click="openForm('update', scope.row.id)"
            v-hasPermi="['temu:worker-task:update']">
            编辑
          </el-button>
          <el-button link type="danger" @click="handleDelete(scope.row.id)" v-hasPermi="['temu:worker-task:delete']">
            删除
          </el-button>
        </template>
</el-table-column> -->
    </el-table>
    <!-- 分页 -->
    <Pagination :total="total" v-model:page="queryParams.pageNo" v-model:limit="queryParams.pageSize"
      @pagination="getList" />
  </ContentWrap>

  <!-- 表单弹窗：添加/修改 -->
  <WorkerTaskForm ref="formRef" @success="getList" />
</template>

<script setup lang="ts">
import { dateFormatter } from '@/utils/formatTime'
import download from '@/utils/download'
import { WorkerTaskApi, WorkerTaskVO } from '@/api/temu/workertask'
import WorkerTaskForm from './WorkerTaskForm.vue'

/** 工作人员任务记录 列表 */
defineOptions({ name: 'TemuWorkerTask' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const list = ref<WorkerTaskVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  workerId: undefined,
  workerName: undefined,
  workerType: undefined,
  taskType: undefined,
  taskStatus: undefined,
  orderId: undefined,
  orderNo: undefined,
  batchOrderId: undefined,
  customSku: undefined,
  skuQuantity: undefined,
  taskCompleteTime: [],
  createTime: [],
  shopId: undefined,
})
const queryFormRef = ref() // 搜索的表单
const exportLoading = ref(false) // 导出的加载中
const shopList = ref<any[]>([])

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await WorkerTaskApi.getWorkerTaskPage(queryParams)
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
    await WorkerTaskApi.deleteWorkerTask(id)
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
    const data = await WorkerTaskApi.exportWorkerTask(queryParams)
    download.excel(data, '工作人员任务记录.xls')
  } catch {
  } finally {
    exportLoading.value = false
  }
}

/** 获取店铺列表 */
const getShopList = async () => {
  const data = await import('@/api/temu/common').then(m => m.TemuCommonApi.getShopList())
  shopList.value = data.list
}

/** 初始化 **/
onMounted(() => {
  getList()
  getShopList()
})
</script>