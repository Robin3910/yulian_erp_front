<template>
  <ContentWrap>
    <!-- 查询表单 -->
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="80px"
    >
      <el-row :gutter="20">
        <el-col :span="24" :lg="6">
          <el-form-item label="订单编号" prop="orderNo" class="w-full">
            <el-input
              v-model="queryParams.orderNo"
              placeholder="请输入订单编号"
              clearable
              @keyup.enter="handleQuery"
            />
          </el-form-item>
        </el-col>
        
        <el-col :span="24" :lg="6">
          <el-form-item label="返单原因" prop="repeatReason" class="w-full">
            <el-select v-model="queryParams.repeatReason" placeholder="请选择返单原因" clearable>
              <el-option
                v-for="item in repeatReasons"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="24" :lg="6">
          <el-form-item label="SKU编号" prop="sku" class="w-full">
            <el-input
              v-model="queryParams.sku"
              placeholder="请输入SKU编号"
              clearable
              @keyup.enter="handleQuery"
            />
          </el-form-item>
        </el-col>
        <el-col :span="24" :lg="6">
          <el-form-item label="SKC编号" prop="skc" class="w-full">
            <el-input
              v-model="queryParams.skc"
              placeholder="请输入SKC编号"
              clearable
              @keyup.enter="handleQuery"
            />
          </el-form-item>
        </el-col>
        <el-col :span="24" :lg="6">
          <el-form-item label="定制SKU" prop="customSku" class="w-full">
            <el-input
              v-model="queryParams.customSku"
              placeholder="请输入定制SKU"
              clearable
              @keyup.enter="handleQuery"
            />
          </el-form-item>
        </el-col>
        <el-col :span="24" :lg="6">
          <el-form-item label="创建时间" prop="bookingTime" class="w-full">
            <el-date-picker
              v-model="queryParams.bookingTime"
              format="YYYY-MM-DD HH:mm"
              value-format="YYYY-MM-DD HH:mm:00"
              type="datetimerange"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
            />
          </el-form-item>
        </el-col>
        <el-col :span="24" :lg="24">
          <el-form-item>
            <el-button @click="handleQuery">
              <Icon icon="ep:search" class="mr-5px" />
              搜索
            </el-button>
            <el-button @click="resetQuery">
              <Icon icon="ep:refresh" class="mr-5px" />
              重置
            </el-button>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap class="sticky-header flex-1 overflow-hidden">
    <el-table
      v-loading="loading"
      :data="list"
      :stripe="true"
      :show-overflow-tooltip="true"
      row-key="id"
      ref="tableRef"
      height="calc(100vh - 220px)"
      fixed-header
    >
      <el-table-column label="订单编号/返单时间" align="center" min-width="180" fixed="left">
        <template #default="{ row }">
          <div class="flex flex-col items-center">
            <div class="font-bold mb-2 flex items-center">{{ row.orderNo }}</div>
           
            <div class="mt-2 text-gray-500 text-sm">
              {{ row.createdAt ? dayjs(row.createdAt).format('YYYY-MM-DD HH:mm:ss') : '' }}
            </div>
          </div>
        </template>
      </el-table-column>
      <!-- 店铺信息 -->
      <el-table-column label="店铺信息" align="center" min-width="140">
        <template #default="{ row }">
          <div class="text-left">
            <div class="font-bold text-center">{{ row.aliasName }}</div>
            <div class="flex items-center justify-center">
              {{ row.shopId }}
            </div>
          </div>
        </template>
      </el-table-column>
      <!-- 产品图片 -->
      <el-table-column label="产品图片" align="center" prop="productImgUrl" width="115">
        <template #default="{ row }">
          <div class="text-left">
            <el-image
              class="w-80px h-80px"
              :hide-on-click-modal="true"
              :preview-teleported="true"
              :src="row.productImgUrl"
              :preview-src-list="[row.productImgUrl]"
            />
          </div>
        </template>
      </el-table-column>
      <!-- 商品信息 -->
      <el-table-column label="商品信息" align="center" min-width="200">
        <template #default="{ row }">
          
            <div class="product-title mb-2">
              <span class="font-bold">名称：</span>{{ row.productTitle }}
            </div>
            <div class="product-title mb-2">
              <span class="font-bold">属性：</span>{{ row.productProperties || '--' }}
            </div>
           
        </template>
      </el-table-column>
     
      <!-- SKU信息 -->
      <el-table-column label="SKU信息" align="center" min-width="275">
        <template #default="{ row }">
          <div class="sku-info">
            <div class="sku-item">
              <span class="label">SKU编号：</span>
              <span>{{ row.sku || '-' }}</span>
            </div>
            <div class="sku-item">
              <span class="label">SKC编号：</span>
              <span>{{ row.skc || '-' }}</span>
            </div>
            <div class="sku-item custom-sku-wrapper">
              <span class="label" style="font-weight: bold;">定制SKU：</span>
              <div class="custom-sku-content">
                <span v-if="row.customSku" class="custom-sku">{{ row.customSku }}</span>
                <span v-else>-</span>
                
              </div>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="作图人" align="center" min-width="100">
        <template #default="{ row }">
          <span>{{ row.drawUserName || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="生产人" align="center" min-width="100">
        <template #default="{ row }">
          <span>{{ row.produceUserName || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="发货人" align="center" min-width="100">
        <template #default="{ row }">
          <span>{{ row.shipUserName || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="返单原因" align="center" min-width="120">
        <template #default="{ row }">
          <div v-if="row.isEditingReason" class="flex items-center">
            <el-select 
              v-model="row.repeatReason" 
              placeholder="请选择返单原因" 
              @change="handleRepeatReasonChange(row)"
              style="width: 100%"
            >
              <el-option
                v-for="item in repeatReasons"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
            <el-button 
              type="primary" 
              size="small" 
              @click="cancelEditReason(row)"
              style="margin-left: 8px;"
            >
              取消
            </el-button>
          </div>
          <div v-else class="flex items-center justify-center">
            <span class="mr-2">{{ getRepeatReasonLabel(row.repeatReason) }}</span>
            <el-button 
              type="primary" 
              size="small" 
              @click="startEditReason(row)"
            >
              修改
            </el-button>
          </div>
        </template>
      </el-table-column>
     
    </el-table>
    <!-- 分页 -->
    <Pagination
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />
  </ContentWrap>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElTable } from 'element-plus'
import { OrderApi } from '@/api/temu/order'
import dayjs from 'dayjs'

const loading = ref(true)
const list = ref<any[]>([])
const total = ref(0)
const tableRef = ref<InstanceType<typeof ElTable>>()
const queryFormRef = ref()

// 返单原因枚举
const repeatReasons = [
  { label: '贴错标', value: 0 },
  { label: '图做错', value: 1 },
  { label: '尺寸错', value: 2 },
  { label: '包装问题', value: 3 },
  { label: 'temu问题', value: 4 }
]



const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  orderNo: undefined,
  sku: undefined,
  skc: undefined,
  customSku: undefined,
  repeatReason: undefined,
  bookingTime: []
})



const getList = async () => {
  loading.value = true
  try {
    // 查询返单数据，接口为/temu/order-return/page
    const data = await OrderApi.getOrderReturnPage(queryParams)
    const orders = data.list || []    
    console.log(orders);
    
    // 为每一行数据添加编辑状态标识
    list.value = orders.map(item => ({
      ...item,
      isEditingReason: false
    }))
    total.value = data.total
  } finally {
    loading.value = false
  }
}

const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

const resetQuery = () => {
  queryFormRef.value?.resetFields()
  handleQuery()
}


// 获取返单原因标签
const getRepeatReasonLabel = (value: number) => {
  const reason = repeatReasons.find(item => item.value === value)
  return reason ? reason.label : '--'
}

// 开始编辑返单原因
const startEditReason = (row: any) => {
  row.isEditingReason = true
}

// 取消编辑返单原因
const cancelEditReason = (row: any) => {
  row.isEditingReason = false
}

// 处理返单原因变化
const handleRepeatReasonChange = async (row: any) => {
  try {
    console.log(row.id);

    // 调用API更新返单原因
    await OrderApi.updateOrderReturnReason({
      id: row.id,
      repeatReason: row.repeatReason
    })
    
    // 更新成功后退出编辑模式
    row.isEditingReason = false
    
    console.log('返单原因已更新:', row.orderNo, row.repeatReason)
    // 可以添加成功提示
    ElMessage.success('返单原因更新成功')
  } catch (error) {
    console.error('更新返单原因失败:', error)
    // 可以添加错误提示
    ElMessage.error('更新返单原因失败')
  }
}

onMounted(() => {
  getList()
})
</script>

<style lang="scss" scoped>
.sticky-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: var(--app-content-bg-color);
}
.status-tag {
  font-size: 13px;
  padding: 6px 5px;
  border-radius: 4px;
  font-weight: 500;
  min-width: 90px;
}
.product-title {
  font-weight: bold;
}
 .sku-item {
    font-size: 14px;
    color: var(--el-text-color-regular);
    margin-top: 4px;
    line-height: 1.4;

    &:first-child {
      margin-top: 0;
    }

    .label {
      color: var(--el-text-color-secondary);
      margin-right: 4px;
    }

    &.custom-sku-wrapper {
      text-align: center;
      display: flex;
      align-items: center;
      justify-content: center;

      .custom-sku-content {
        display: flex;
        align-items: center;
        flex: 1;

        .custom-sku {
          font-weight: 700;
          color: #409EFF;
          background-color: #ecf5ff;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 14px;
        }

        .copy-button {
          padding: 2px;
          height: 24px;
          font-size: 16px;
          color: #909399;

          &:hover {
            color: #409EFF;
          }

          .el-icon {
            margin: 0;
          }
        }
      }
    }
  }
/* 定制SKU样式 */

.custom-sku-content {
  
  margin-left: 4px;
}
.custom-sku {
  user-select: all;
}
.copy-button {
  padding: 0 4px;
  font-size: 16px;
  cursor: pointer;
}
.sku-info {
  display: flex;
  flex-direction: column;
  align-items: center; // 让所有sku-item居中
}
</style>
