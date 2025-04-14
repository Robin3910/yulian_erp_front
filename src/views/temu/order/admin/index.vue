<template>
  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="68px"
    >
      <el-row :gutter="20">
        <el-col :span="24" :lg="6">
          <el-form-item label="店铺" prop="shopId" class="w-full">
            <el-select filterable v-model="queryParams.shopId" placeholder="请选择店铺" clearable>
              <el-option
                v-for="(item, index) in shopList"
                :key="index"
                :label="item.shopName"
                :value="item.shopId"
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
          <el-form-item label="订单状态" prop="orderStatus" class="w-full">
            <el-select v-model="queryParams.orderStatus" placeholder="请选择订单状态" clearable>
              <el-option
                v-for="dict in getStrDictOptions(DICT_TYPE.TEMU_ORDER_STATUS)"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="24" :lg="6">
          <el-form-item label="类目" prop="orderStatus" class="w-full">
            <el-select
              filterable
              v-model="queryParams.categoryId"
              placeholder="请选择类目"
              clearable
            >
              <el-option
                v-for="(item, index) in categoryList"
                :key="index"
                :label="item.categoryName"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="24" :lg="6">
          <el-form-item label="创建时间" prop="bookingTime" class="w-full">
            <el-date-picker
              v-model="queryParams.bookingTime"
              value-format="YYYY-MM-DD HH:mm:ss"
              type="daterange"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
            />
          </el-form-item>
        </el-col>
        <el-col :span="24" :lg="6">
          <el-form-item>
            <el-button @click="handleQuery">
              <Icon icon="ep:search" class="mr-5px" />
              搜索
            </el-button>
            <el-button @click="resetQuery">
              <Icon icon="ep:refresh" class="mr-5px" />
              重置
            </el-button>
            <el-button @click="handleBatchSetStatus">
              <Icon icon="ep:refresh" class="mr-5px" />
              批量设置状态
            </el-button>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table
      v-loading="loading"
      :data="list"
      :stripe="true"
      :show-overflow-tooltip="true"
      @selection-change="handleSelectionChange"
    >
      <!--选择-->
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="店铺ID" align="center" prop="shopId" min-width="150">
        <template #default="{ row }">
          <div class="text-left">
            <div>{{ row.shopName }}</div>
            <div>{{ row.shopId }}</div>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="订单编号" align="center" prop="orderNo" />
      <el-table-column label="商品图片" align="center" prop="productImgUrl">
        <template #default="{ row }">
          <el-image
            :hide-on-click-modal="true"
            :preview-teleported="true"
            :src="row.productImgUrl"
            :preview-src-list="[row.productImgUrl]"
          />
        </template>
      </el-table-column>
      <el-table-column label="商品标题" align="center" prop="productTitle" min-width="200" />
      <el-table-column label="商品属性" align="center" prop="productProperties" min-width="200" />
      <el-table-column label="SKU信息" align="center" prop="productTitle" min-width="200">
        <template #default="{ row }">
          <div class="text-left">
            <div>SKU编号:{{ row.sku }}</div>
            <div>SKC编号:{{ row.skc }}</div>
            <div>定制SKU:{{ row.customSku }}</div>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="类目名称" align="center" prop="categoryName" min-width="300">
        <template #default="{ row }">
          <div class="text-left">
            <el-select
              class="!w-[150px]"
              filterable
              v-model="row.categoryId"
              placeholder="请选择类目"
              clearable
            >
              <el-option
                v-for="(item, index) in categoryList"
                :key="index"
                :label="item.categoryName"
                :value="item.id.toString()"
              />
            </el-select>
            <el-popconfirm
              title="是否更新类目?"
              placement="top-start"
              @confirm="handleUpdateCategory(row)"
            >
              <template #reference>
                <el-button class="ml-1" type="primary">更新</el-button>
              </template>
            </el-popconfirm>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="定制图片列表" align="center" prop="customImageUrls">
        <template #default="{ row }">
          <div class="text-left" v-if="row.customImageUrls">
            <div v-for="(item, index) in row.customImageUrls.split(',')" :key="index">
              <el-image
                :hide-on-click-modal="true"
                :preview-teleported="true"
                :src="item"
                :preview-src-list="[item]"
              />
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="定制文字列表" align="center" prop="customTextList" />
      <el-table-column label="合成预览图" align="center" prop="effectiveImgUrl">
        <template #default="{ row }">
          <el-image
            v-if="row.effectiveImgUrl"
            :hide-on-click-modal="true"
            :preview-teleported="true"
            :src="row.effectiveImgUrl"
            :preview-src-list="[row.effectiveImgUrl]"
          />
        </template>
      </el-table-column>
      <el-table-column label="订单状态" align="center" prop="orderStatus" min-width="150">
        <template #default="{ row }">
          <dict-tag :type="DICT_TYPE.TEMU_ORDER_STATUS" :value="row.orderStatus" />
        </template>
      </el-table-column>

      <el-table-column
        label="预定单创建时间"
        align="center"
        prop="bookingTime"
        :formatter="dateFormatter"
        width="180px"
      />

      <el-table-column label="物流信息" align="center" prop="shippingInfo" />
      <el-table-column label="操作" fixed="right" align="center" min-width="120px">
        <template #default="{ row }">
          <el-popconfirm
            title="确认是否修改当前订单状态?"
            placement="top-start"
            @confirm="
              handleUpdateRowStatus({
                id: row.id,
                orderStatus: 1
              })
            "
          >
            <template #reference>
              <el-button v-if="row.orderStatus === 0" size="small" type="primary">
                生产中
              </el-button>
            </template>
          </el-popconfirm>
          <el-popconfirm
            title="确认是否修改当前订单状态?"
            placement="top-start"
            @confirm="
              handleUpdateRowStatus({
                id: row.id,
                orderStatus: 2
              })
            "
          >
            <template #reference>
              <el-button v-if="row.orderStatus === 1" size="small" type="primary">
                已生产
              </el-button>
            </template>
          </el-popconfirm>
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
  <!--状态修改确认弹窗-->
  <OrderStatusPopup ref="orderStatusPopup" @confirm="handleUpdateStatus" />
</template>

<script setup lang="ts">
import OrderStatusPopup from '@/views/temu/order/index/components/OrderStatusPopup.vue'
import { DICT_TYPE } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import { OrderApi, OrderVO } from '@/api/temu/order'
import { TemuCommonApi } from '@/api/temu/common'
import { getStrDictOptions } from '@/utils/dict'
import { ElMessage } from 'element-plus'

/** 订单 列表 */
defineOptions({ name: 'TemuOrderAdmin' })

const loading = ref(true) // 列表的加载中
const list = ref<OrderVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const categoryList = ref<any[]>([])

// 店铺列表
const shopList = ref<any[]>([])
// 多选
const selectedRows = ref<any[]>([])
// 批量修改弹窗引用
const orderStatusPopup = useTemplateRef('orderStatusPopup')
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  orderNo: undefined,
  productTitle: undefined,
  orderStatus: undefined,
  sku: undefined,
  skc: undefined,
  salePrice: undefined,
  customSku: undefined,
  quantity: undefined,
  productProperties: undefined,
  bookingTime: [],
  shopId: undefined,
  createTime: [],
  customImageUrls: undefined,
  customTextList: undefined,
  productImgUrl: undefined,
  categoryId: undefined,
  categoryName: undefined,
  shippingInfo: undefined,
  originalInfo: undefined
})
const queryFormRef = ref() // 搜索的表单

/** 查询列表 */
const getList = async () => {
  console.log('>>>>>>>>>>>>>我是管理员')
  loading.value = true
  try {
    const data = await OrderApi.getOrderPageByAdmin(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}
//获取分类列表
const getProductCategoryList = async () => {
  const data = await TemuCommonApi.getProductCategoryList()
  categoryList.value = data.list
}
// 获取店铺列表
const getShopList = async () => {
  const data = await TemuCommonApi.getShopList()
  shopList.value = data.list
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

// 处理多选
const handleSelectionChange = (selection: OrderVO[]) => {
  console.log(selection)
  selectedRows.value = selection
}
// 批量设置状态
const handleBatchSetStatus = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请选择要操作的订单')
    return
  }
  if (orderStatusPopup && orderStatusPopup.value) {
    console.log('>>>>>>>>orderStatusPopup.value', orderStatusPopup.value)
    orderStatusPopup.value.setVisible(true)
  }
}
// 处理状态修改确认弹窗的回调
const handleUpdateStatus = async (status: number) => {
  //检查所有已经选择的订单状态是否一致
  if (selectedRows.value.length > 0) {
    const statusList = selectedRows.value.map((item) => item.orderStatus)
    if (new Set(statusList).size > 1) {
      ElMessage.warning('已选择的订单状态不一致，请重新选择')
      return
    }
  }
  await OrderApi.updateOrderStatus(
    selectedRows.value.map((item) => {
      return {
        id: item.id,
        orderStatus: status
      }
    })
  )
  ElMessage.success('操作成功')
  getList()
}
// 更新单个订单状态
const handleUpdateRowStatus = async (row: { id: number; orderStatus: number }) => {
  await OrderApi.updateOrderStatus([row])
  ElMessage.success('操作成功')
  getList()
}
const handleUpdateCategory = async (row: { id: number; categoryId: number }) => {
  await OrderApi.updateOrderCategory({
    id: row.id,
    categoryId: row.categoryId
  })
  ElMessage.success('操作成功')
  getList()
}

/** 初始化 **/
onMounted(() => {
  getList()
  getProductCategoryList()
  getShopList()
})
</script>
