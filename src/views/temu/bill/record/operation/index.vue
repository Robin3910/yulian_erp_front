<template>
  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form class="-mb-15px" :model="queryParams" ref="queryFormRef" :inline="true" label-width="90px">
      <el-form-item label="用户编号" prop="userId">
        <el-input v-model="queryParams.userId" placeholder="请输入用户编号" clearable @keyup.enter="handleQuery"
          class="!w-200px" />
      </el-form-item>
      <el-form-item label="用户昵称" prop="nickname">
        <el-input v-model="queryParams.nickname" placeholder="请输入用户昵称" clearable @keyup.enter="handleQuery"
          class="!w-200px" />
      </el-form-item>
      <el-form-item label="充值时间" prop="rechargeTime">
        <el-date-picker v-model="queryParams.rechargeTime" value-format="YYYY-MM-DD HH:mm:ss" type="daterange"
          start-placeholder="开始日期" end-placeholder="结束日期"
          :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]" class="!w-220px" />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery">
          <Icon icon="ep:search" class="mr-5px" /> 搜索
        </el-button>
        <el-button @click="resetQuery">
          <Icon icon="ep:refresh" class="mr-5px" /> 重置
        </el-button>
        <el-button type="success" plain @click="handleExport" :loading="exportLoading">
          <Icon icon="ep:download" class="mr-5px" /> 导出
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="用户ID" align="center" prop="userId" />
      <el-table-column label="用户昵称" align="center" prop="nickname" />
      <el-table-column label="充值时间" align="center" prop="rechargeTime" :formatter="dateFormatter" width="180px" />
      <el-table-column label="充值金额（元）" align="center" prop="amount">
        <template #default="{ row }">
          {{ formatAmount(row.amount) }}
        </template>
      </el-table-column>
      <el-table-column label="操作IP地址" align="center" prop="ip" />
      <el-table-column label="支付状态" align="center" prop="payStatus">
        <template #default="{ row }">
          <el-tag v-if="row.payStatus === 0" type="danger" size="small">未支付</el-tag>
          <el-tag v-else-if="row.payStatus === 10" type="success" size="small">支付成功</el-tag>
          <el-tag v-else-if="row.payStatus === 20" type="warning" size="small">已退款</el-tag>
          <el-tag v-else-if="row.payStatus === 30" type="info" size="small">支付关闭</el-tag>
          <span v-else>-</span>
        </template>
      </el-table-column>
    </el-table>
    <!-- 分页 -->
    <Pagination :total="total" v-model:page="queryParams.pageNo" v-model:limit="queryParams.pageSize"
      @pagination="getList" />
  </ContentWrap>
</template>

<script setup lang="ts">
import { dateFormatter } from '@/utils/formatTime'
import download from '@/utils/download'
import { ref, reactive } from 'vue'
import { UserRechargeRecordApi } from '@/api/temu/operationlog'

defineOptions({ name: 'TemuRecord' })

const loading = ref(false)
const list = ref<any[]>([])
const total = ref(0)
const exportLoading = ref(false)
const queryFormRef = ref()
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  userId: undefined,
  nickname: undefined,
  rechargeTime: []
})

/** 格式化金额，保留两位小数 */
const formatAmount = (amount: number) => {
  if (amount === null || amount === undefined) return '0.00'
  return Number(amount).toFixed(2)
}

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    // 调用后端分页接口
    const data = await UserRechargeRecordApi.getUserRechargeRecordPage(queryParams)
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
  Object.assign(queryParams, {
    pageNo: 1,
    pageSize: 10,
    userId: undefined,
    nickname: undefined,
    rechargeTime: []
  })
  getList()
}

/** 导出Excel */
const handleExport = async () => {
  exportLoading.value = true
  try {
    const blob = await UserRechargeRecordApi.exportUserRechargeRecord(queryParams)
    download.excel(blob, '用户充值记录.xlsx')
  } finally {
    exportLoading.value = false
  }
}

// 页面加载时自动查询
getList()
</script>
