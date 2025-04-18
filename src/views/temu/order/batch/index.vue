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
      <el-form-item label="批次编号" prop="batchNo">
        <el-input
          v-model="queryParams.batchNo"
          placeholder="请输入批次编号"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="创建时间" prop="createTime">
        <el-date-picker
          v-model="queryParams.createTime"
          value-format="YYYY-MM-DD HH:mm:ss"
          type="daterange"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
          class="!w-220px"
        />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery">
          <Icon icon="ep:search" class="mr-5px" />
          搜索
        </el-button>
        <el-button @click="resetQuery">
          <Icon icon="ep:refresh" class="mr-5px" />
          重置
        </el-button>
        <el-button
          type="primary"
          plain
          @click="openForm('create')"
          v-hasPermi="['temu:order-batch:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" />
          新增
        </el-button>
        <el-button
          type="success"
          plain
          @click="handleExport"
          :loading="exportLoading"
          v-hasPermi="['temu:order-batch:export']"
        >
          <Icon icon="ep:download" class="mr-5px" />
          导出
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true" :default-expand-all="true">

      <el-table-column type="expand">
        <template #default="scope">
          <div >
            <el-table
              v-loading="loading"
              :data="scope.row.orderList"
              :stripe="true"
              :show-overflow-tooltip="true"
            >

              <!--订单编号-->
              <el-table-column label="订单编号" align="center" prop="orderNo" min-width="150"/>
              <!--店铺信息-->
              <el-table-column label="店铺信息" align="center" prop="shopId" min-width="150">
                <template #default="{ row }">
                  <div class="text-left">
                    <div>{{ row.shopName }}</div>
                    <div>{{ row.shopId }}</div>
                  </div>
                </template>
              </el-table-column>
              <!-- 产品图片 -->
              <el-table-column label="产品图片" align="center" prop="productImgUrl" width="120">
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
              <el-table-column label="商品信息" align="center" prop="productImgUrl" min-width="280">
                <template #default="{ row }">
                  <div class="text-left">
                    <div class="truncate mb-2 font-bold   ">产品标题：{{ row.productTitle }}</div>
                    <div class="flex items-start mb-2">
                      <div>定制文字列表:</div>
                      <div class="ml-2">{{ row.customTextList||'--'}}</div>
                    </div>
                    <!-- 商品属性 -->
                    <div class="flex items-start mb-2">
                      <div>商品属性:</div>
                      <div class="ml-2">{{ row.productProperties||'--'}}</div>
                    </div>

                  </div>
                </template>
              </el-table-column>
              <el-table-column label="类目名称" align="center" prop="categoryName" min-width="230">
                <template #default="{ row }">
                  <div>{{ row.categoryName }}</div>
                </template>
              </el-table-column>
              <!-- 定制图片 -->
              <el-table-column label="定制图片" align="center" prop="customImageUrls" min-width="180">
                <template #default="{ row }">
                  <div class=" flex flex-wrap " v-if="row.customImageUrls">
                    <div v-for="(item, index) in row.customImageUrls.split(',')" :key="index" class="ml-2">
                      <el-image
                        class="w-60px h-60px"
                        :hide-on-click-modal="true"
                        :preview-teleported="true"
                        :src="item"
                        :preview-src-list="[item]"
                      />
                    </div>
                  </div>
                </template>
              </el-table-column>
              <!--合成预览-->
              <el-table-column label="合成预览" align="center" prop="effectiveImgUrl" min-width="120">
                <template #default="{ row }">
                  <div class="text-left">
                    <el-image
                      class="w-60px h-60px"
                      v-if="row.effectiveImgUrl"
                      :hide-on-click-modal="true"
                      :preview-teleported="true"
                      :preview-src-list="[row.effectiveImgUrl]"
                      :src="row.effectiveImgUrl"
                    />
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="价格信息" min-width="120">
                <template #default="{ row }">
                  <div>
                    <div>
                      <div>数量：{{ row.quantity || '--' }}</div>
                      <div>单价：{{ row.unitPrice?'￥'+row.unitPrice.toFixed(2): '--' }}</div>
                      <div>总价：{{ row.totalPrice?'￥'+row.totalPrice.toFixed(2) : '--' }}</div>
                    </div>
                  </div>
                </template>
              </el-table-column>

              <el-table-column label="SKU信息" align="center" prop="productTitle" min-width="200">
                <template #default="{ row }">
                  <div class="text-left">
                    <div>SKU编号:{{ row.sku }}</div>
                    <div>SKC编号:{{ row.skc }}</div>
                    <div>定制SKU:{{ row.customSku }}</div>
                  </div>
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
                :show-overflow-tooltip="false"
                width="150px"
              />

              <el-table-column label="物流信息" align="center" prop="shippingInfo" />
            </el-table>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="批次编号" align="center" prop="batchNo" >
        <template #default="{ row }">
          <div class="text-left">
            <div>{{ row.batchNo }}</div>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="文件地址" align="center" prop="fileUrl" />
      <el-table-column
        label="创建时间"
        align="center"
        prop="createTime"
        :formatter="dateFormatter"

      />
      <el-table-column label="操作" align="center" min-width="120px">
        <template #default="scope">
          <el-button
            link
            type="primary"
            @click="openForm('update', scope.row.id)"
            v-hasPermi="['temu:order-batch:update']"
          >
            编辑
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['temu:order-batch:delete']"
          >
            删除
          </el-button>
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
import { dateFormatter } from '@/utils/formatTime'
import download from '@/utils/download'
import { OrderBatchApi, OrderBatchVO } from '@/api/temu/order-batch/index'
import {DICT_TYPE} from "@/utils/dict";

/** 订单批次 列表 */
defineOptions({ name: 'BatchOrderPopup' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const list = ref<OrderBatchVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  batchNo: undefined,
  fileUrl: undefined,
  status: undefined,
  createTime: []
})
const queryFormRef = ref() // 搜索的表单
const exportLoading = ref(false) // 导出的加载中

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await OrderBatchApi.getOrderBatchPage(queryParams)
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
    await OrderBatchApi.deleteOrderBatch(id)
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
  } catch {}
}

/** 导出按钮操作 */
const handleExport = async () => {
  try {
    // 导出的二次确认
    await message.exportConfirm()
    // 发起导出
    exportLoading.value = true
    const data = await OrderBatchApi.exportOrderBatch(queryParams)
    download.excel(data, '订单批次.xls')
  } catch {
  } finally {
    exportLoading.value = false
  }
}

/** 初始化 **/
onMounted(() => {
  getList()
})
</script>
