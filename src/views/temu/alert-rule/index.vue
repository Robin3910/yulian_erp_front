<template>
  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form class="-mb-15px" :model="queryParams" ref="queryFormRef" :inline="true" label-width="68px">
      <el-row :gutter="20">
        <el-col :span="24" :lg="6">
          <el-form-item label="规则名称" prop="name" class="w-full">
            <el-input v-model="queryParams.name" placeholder="请输入规则名称" clearable @keyup.enter="handleQuery" />
          </el-form-item>
        </el-col>
        <el-col :span="24" :lg="6">
          <el-form-item label="状态" prop="status" class="w-full">
            <el-select v-model="queryParams.status" placeholder="请选择状态" clearable>
              <el-option :key="1" label="启用" :value="1" />
              <el-option :key="0" label="禁用" :value="0" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="24" :lg="6">
          <el-form-item label="创建时间" prop="createTime">
            <el-date-picker v-model="queryParams.createTime" value-format="YYYY-MM-DD HH:mm:ss"
              type="daterange" start-placeholder="开始日期" end-placeholder="结束日期"
              :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]" class="!w-240px" />
          </el-form-item>
        </el-col>
        <el-col :span="24" :lg="6">
          <el-form-item class="w-full">
            <el-button @click="handleQuery">
              <Icon icon="ep:search" class="mr-5px" />
              搜索
            </el-button>
            <el-button @click="resetQuery">
              <Icon icon="ep:refresh" class="mr-5px" />
              重置
            </el-button>
            <el-button type="primary" @click="openForm(undefined)">
              <Icon icon="ep:plus" class="mr-5px" />
              新增
            </el-button>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true"
      :header-cell-style="{ background: 'var(--el-fill-color-light)' }">
      <!-- 规则名称 -->
      <el-table-column label="规则名称" align="center" prop="name" min-width="150" show-overflow-tooltip />
      <!-- 规则描述 -->
      <el-table-column label="规则描述" align="center" prop="description" min-width="180" show-overflow-tooltip />
      <!-- 阈值 -->
      <el-table-column label="阈值" align="center" prop="threshold" min-width="100" />
      <!-- 比较类型 -->
      <el-table-column label="比较类型" align="center" min-width="100">
        <template #default="{ row }">
          {{ getCompareTypeText(row.compareType) }}
        </template>
      </el-table-column>
      <!-- CRON表达式 -->
      <el-table-column label="CRON表达式" align="center" prop="cronExpression" min-width="150" show-overflow-tooltip />
      <!-- 状态 -->
      <el-table-column label="状态" align="center" min-width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'">
            {{ row.status === 1 ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <!-- 上次执行时间 -->
      <el-table-column label="上次执行时间" align="center" min-width="150">
        <template #default="{ row }">
          {{ row.lastExecuteTime ? formatDate(new Date(parseInt(row.lastExecuteTime)), 'YYYY-MM-DD HH:mm:ss') : '-' }}
        </template>
      </el-table-column>
      <!-- 创建时间 -->
      <el-table-column label="创建时间" align="center" min-width="150">
        <template #default="{ row }">
          {{ row.createTime ? formatDate(new Date(parseInt(row.createTime)), 'YYYY-MM-DD HH:mm:ss') : '-' }}
        </template>
      </el-table-column>
      <!-- 操作 -->
      <el-table-column label="操作" align="center" width="250" fixed="right">
        <template #default="scope">
          <el-button type="primary" link @click="openForm(scope.row)">
            <Icon icon="ep:edit" class="mr-1px" />
            修改
          </el-button>
          <el-button type="danger" link @click="handleDelete(scope.row)">
            <Icon icon="ep:delete" class="mr-1px" />
            删除
          </el-button>
          <el-button type="warning" link @click="handleTest(scope.row)">
            <Icon icon="ep:magic-stick" class="mr-1px" />
            测试
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <!-- 分页 -->
    <Pagination v-model:total="total" v-model:page="queryParams.pageNo" v-model:limit="queryParams.pageSize"
      @pagination="getList" />
  </ContentWrap>

  <!-- 表单弹窗 -->
  <AlertRuleForm ref="formRef" @success="getList" />
  
  <!-- 测试结果弹窗 -->
  <el-dialog v-model="testDialogVisible" title="测试结果" width="600px" append-to-body>
    <div class="test-result">
      <div class="text-lg font-bold mb-4">SQL查询结果值：{{ testResult }}</div>
      <div v-if="testAlertTriggered" class="alert-triggered">
        <el-alert type="error" :closable="false">
          <template #title>
            <span class="text-lg">触发告警！</span>
          </template>
          <template #default>
            <div class="mt-2">
              当前结果值 <span class="font-bold">{{ testResult }}</span> 
              {{ getCompareTypeText(testRule?.compareType || 0) }}
              阈值 <span class="font-bold">{{ testRule?.threshold }}</span>，
              将触发告警通知！
            </div>
          </template>
        </el-alert>
      </div>
      <div v-else class="alert-not-triggered">
        <el-alert type="success" :closable="false">
          <template #title>
            <span class="text-lg">未触发告警</span>
          </template>
          <template #default>
            <div class="mt-2">
              当前结果值 <span class="font-bold">{{ testResult }}</span> 
              {{ getNotCompareTypeText(testRule?.compareType || 0) }}
              阈值 <span class="font-bold">{{ testRule?.threshold }}</span>，
              不会触发告警通知。
            </div>
          </template>
        </el-alert>
      </div>
    </div>
    <template #footer>
      <el-button @click="testDialogVisible = false">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { TemuAlertRuleApi, TemuAlertRuleRespVO } from '@/api/temu/alert-rule'
import AlertRuleForm from './components/AlertRuleForm.vue'
import { formatDate } from '@/utils/formatTime'

defineOptions({ name: 'AlertRule' })
const message = useMessage() // 消息弹窗

// 列表相关变量
const loading = ref(true) // 列表的加载中
const list = ref<TemuAlertRuleRespVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  name: undefined,
  status: undefined,
  createTime: []
})
const queryFormRef = ref() // 搜索的表单

// 表单相关变量
const formRef = ref()

// 测试相关变量
const testDialogVisible = ref(false)
const testResult = ref(0)
const testRule = ref<TemuAlertRuleRespVO>()
const testAlertTriggered = ref(false)

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await TemuAlertRuleApi.getAlertRulePage(queryParams)
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

/** 打开表单 */
const openForm = (data?: TemuAlertRuleRespVO) => {
  formRef.value.open(data)
}

/** 删除按钮操作 */
const handleDelete = async (row: TemuAlertRuleRespVO) => {
  try {
    // 确认是否删除
    await ElMessageBox.confirm(`是否确认删除规则名称为"${row.name}"的数据项?`, '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    // 执行删除
    await TemuAlertRuleApi.deleteAlertRule(row.id)
    message.success('删除成功')
    
    // 刷新列表
    await getList()
  } catch (error) {
    // 用户取消删除，不做处理
  }
}

/** 测试按钮操作 */
const handleTest = async (row: TemuAlertRuleRespVO) => {
  try {
    loading.value = true
    const result = await TemuAlertRuleApi.testAlertRule(row.id)
    
    // 保存测试结果和规则
    testResult.value = result
    testRule.value = row
    
    // 判断是否触发告警
    switch (row.compareType) {
      case 1: // 大于
        testAlertTriggered.value = result > row.threshold
        break
      case 2: // 等于
        testAlertTriggered.value = result === row.threshold
        break
      case 3: // 小于
        testAlertTriggered.value = result < row.threshold
        break
      case 4: // 大于等于
        testAlertTriggered.value = result >= row.threshold
        break
      case 5: // 小于等于
        testAlertTriggered.value = result <= row.threshold
        break
      case 6: // 不等于
        testAlertTriggered.value = result !== row.threshold
        break
      default:
        testAlertTriggered.value = false
    }
    
    // 显示测试结果对话框
    testDialogVisible.value = true
  } catch (error: any) {
    message.error('测试执行失败：' + error.message)
  } finally {
    loading.value = false
  }
}

/** 获取比较类型文本 */
const getCompareTypeText = (type: number) => {
  switch (type) {
    case 1: return '大于'
    case 2: return '等于'
    case 3: return '小于'
    case 4: return '大于等于'
    case 5: return '小于等于'
    case 6: return '不等于'
    default: return '未知'
  }
}

/** 获取反向比较类型文本 */
const getNotCompareTypeText = (type: number) => {
  switch (type) {
    case 1: return '不大于'
    case 2: return '不等于'
    case 3: return '不小于'
    case 4: return '小于'
    case 5: return '大于'
    case 6: return '等于'
    default: return '未知'
  }
}

/** 初始化 */
onMounted(() => {
  getList()
})
</script>

<style lang="scss" scoped>
.test-result {
  padding: 16px;
  
  .alert-triggered, .alert-not-triggered {
    margin-top: 16px;
  }
}
</style> 