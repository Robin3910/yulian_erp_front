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
          <el-form-item label="店铺ID" prop="shopId" class="w-full">
            <el-input
              v-model="queryParams.shopId"
              placeholder="请输入店铺ID"
              clearable
              @keyup.enter="handleQuery"

            />
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
        <el-col :span="24" :lg="6" >
          <el-form-item label="订单状态" prop="orderStatus"  class="w-full">
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
        <el-col :span="24" :lg="6" >
          <el-form-item label="类目" prop="orderStatus"  class="w-full">
            <el-select
              v-model="queryParams.categoryId"
              placeholder="请选择类目"
              clearable

            >
              <el-option v-for="(item,index) in categoryList" :key="index" :label="item.categoryName" :value="item.id"/>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="24" :lg="6">

          <el-form-item>
            <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
            <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>

          </el-form-item>

        </el-col>
      </el-row>








    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="店铺ID" align="center" prop="shopId" min-width="150" />
      <el-table-column label="订单编号" align="center" prop="orderNo" />
      <el-table-column label="商品图片" align="center" prop="productImgUrl" >
        <template #default="{row}">
          <el-image :preview-teleported="true" :src="row.productImgUrl" :preview-src-list="[row.productImgUrl]"/>
        </template>
      </el-table-column>
      <el-table-column label="商品标题" align="center" prop="productTitle" min-width="200" />
      <el-table-column label="SKU信息" align="center" prop="productTitle" min-width="200" >
        <template #default="{row}">
         <div class="text-left">
           <div>SKU编号:{{row.sku}}</div>
           <div>SKC编号:{{row.skc}}</div>
           <div>定制SKU:{{row.customSku}}</div>
         </div>
        </template>
      </el-table-column>
      <el-table-column label="类目名称" align="center" prop="categoryName" min-width="150" />
      <el-table-column label="定制图片列表" align="center" prop="customImageUrls" >
        <template #default="{row}">
          <div class="text-left" v-if="row.customImageUrls">
            <div v-for="(item,index) in row.customImageUrls.split(',')" :key="index">
              <el-image :preview-teleported="true" :src="item" :preview-src-list="[item]"/>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="定制文字列表" align="center" prop="customTextList" />

      <el-table-column label="订单状态" align="center" prop="orderStatus" min-width="150" >
        <template #default="{row}">
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

      <el-table-column
        label="创建时间"
        align="center"
        prop="createTime"
        :formatter="dateFormatter"
        width="180px"
      />
      <el-table-column label="物流信息" align="center" prop="shippingInfo" />
      <el-table-column label="操作" fixed="right" align="center" min-width="120px"/>
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
import {DICT_TYPE} from "@/utils/dict";
import { dateFormatter } from '@/utils/formatTime'
import { OrderApi, OrderVO } from '@/api/temu/order'
import {TemuCommonApi} from "@/api/temu/ommon";
import {getStrDictOptions} from "@/utils/dict";

/** 订单 列表 */
defineOptions({ name: 'TemuOrderIndex' })


const loading = ref(true) // 列表的加载中
const list = ref<OrderVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const categoryList = ref<any[]>([])
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
  originalInfo: undefined,
})
const queryFormRef = ref() // 搜索的表单

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await OrderApi.getOrderPage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}
//获取分类列表
const getProductCategoryList = async () => {
  const data = await TemuCommonApi.getProductCategoryList()
  categoryList.value =  data.list
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




/** 初始化 **/
onMounted(() => {
  getList()
  getProductCategoryList()
})
</script>
