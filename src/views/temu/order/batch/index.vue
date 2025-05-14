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

      <el-form-item label="定制SKU" prop="customSku">
        <el-input
          v-model="queryParams.customSku"
          placeholder="请输入定制SKU"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>

      <el-form-item label="订单状态" prop="orderStatus">
        <el-select
          v-model="queryParams.status"
          placeholder="请选择订单状态"
          clearable
          class="!w-220px"
        >
          <el-option
            v-for="dict in getStrDictOptions(DICT_TYPE.TEMU_ORDER_BATCH_STATUS)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="分配状态" prop="orderStatus">
        <el-select
          v-model="queryParams.isDispatchTask"
          placeholder="请选择分配状态"
          clearable
          class="!w-220px"
        >
          <el-option
            v-for="dict in getStrDictOptions(DICT_TYPE.TEMU_ORDER_BATCH_DISPATCH_STATUS)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
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
        <el-button type="primary" @click="handlerDispatchTask">
          <Icon icon="ep:plus" class="mr-5px" />
          分配任务
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <div class="mb-10px flex justify-between">
      <div class="flex flex-col">
        <div class="flex gap-2">
          <el-button
            type="primary"
            @click="handlerPrintBatchGoodsSn"
            plain
            :disabled="selectedOrders.length === 0"
          >
            <Icon icon="ep:printer" class="mr-5px" />
            批量打印商品条码
          </el-button>
          <el-button
            type="warning"
            @click="handlerPrintBatchCompliance"
            plain
            :disabled="selectedOrders.length === 0"
          >
            <Icon icon="ep:printer" class="mr-5px" />
            批量打印合规单
          </el-button>
          <el-button
            type="success"
            @click="handlerPrintBatchMerged"
            plain
            :disabled="selectedOrders.length === 0"
          >
            <Icon icon="ep:printer" class="mr-5px" />
            批量打印条码+合规单
          </el-button>
        </div>
        <div v-if="selectedOrders.length > 0" class="mt-2 flex items-center selection-info">
          <el-tag type="info" class="mr-2 selection-tag">
            已选择 <span class="selection-count">{{ selectedRows.length }}</span> 个批次
          </el-tag>
          <el-tag type="info" class="mr-4 selection-tag">
            共 <span class="selection-count">{{ selectedOrders.length }}</span> 个订单
          </el-tag>
        </div>
      </div>
      <div class="flex gap-2">
        <el-button type="primary" @click="handlePrintBatch" plain>
          <Icon icon="ep:printer" class="mr-5px" />
          打印所有批次箱贴
        </el-button>
        <el-button type="success" @click="handlePrintPickingList" plain>
          <Icon icon="ep:document" class="mr-5px" />
          打印拣货单
        </el-button>
      </div>
    </div>
    <el-table
      v-loading="loading"
      :data="list"
      :stripe="true"
      :show-overflow-tooltip="true"
      :expand-row-keys="expandedRows"
      height="calc(100vh - 280px)"
      :header-cell-style="{ background: 'var(--el-bg-color)' }"
      row-key="id"
      @selection-change="handlerSelectionChange"
    >
      <!--选择-->
      <el-table-column reserve-selection type="selection" width="30" align="center" />
      <el-table-column type="expand" width="90">
        <template #header>
          <el-button
            :type="isAllExpanded ? 'primary' : 'info'"
            link
            @click="toggleAllExpand"
            class="expand-all-button"
          >
            <el-icon class="expand-icon" :class="{ 'is-expanded': isAllExpanded }">
              <ArrowDown />
            </el-icon>
            <span class="expand-text">{{ isAllExpanded ? '收起全部' : '展开全部' }}</span>
          </el-button>
        </template>
        <template #default="scope">
          <div>
            <el-table
              v-loading="loading"
              :data="scope.row.orderList"
              :stripe="true"
              :show-overflow-tooltip="true"
              :ref="
                (el) => {
                  if (el) registerTableRef(el, scope.row.batchNo)
                }
              "
            >
              <!--订单编号-->
              <el-table-column
                label="订单信息"
                align="center"
                prop="orderNo"
                min-width="280"
                class-name="order-info-column"
              >
                <template #default="{ row }">
                  <div class="text-left">
                    <div class="flex flex-col">
                      <div class="font-bold">订单号：{{ row.orderNo }}</div>
                      <div class="text-gray-500 mt-1">店铺名称：{{ row.shopName }}</div>
                      <div class="text-gray-500">店铺ID：{{ row.shopId }}</div>
                    </div>
                    <div class="mt-2 flex gap-2">
                      <el-tooltip
                        effect="dark"
                        content="当前商品条码尚未上传，请联系相关人员及时上传！"
                        placement="top"
                        :disabled="!!row.goodsSn"
                        popper-class="custom-tooltip"
                        :show-after="100"
                        :hide-after="200"
                        :enterable="false"
                        :offset="20"
                      >
                        <el-button
                          size="small"
                          :type="row.goodsSn ? 'primary' : 'default'"
                          plain
                          class="print-action-button"
                          :disabled="!row.goodsSn"
                          @click="handlerPrintGoodsSn(row, 1)"
                        >
                          <template #icon>
                            <el-icon class="print-icon">
                              <Printer />
                            </el-icon>
                          </template>
                          打印商品条码
                        </el-button>
                      </el-tooltip>
                      <el-tooltip
                        effect="dark"
                        content="当前合规单尚未上传，请联系相关人员及时上传！"
                        placement="top"
                        :disabled="!!row.complianceUrl"
                        popper-class="custom-tooltip"
                        :show-after="100"
                        :hide-after="200"
                        :enterable="false"
                        :offset="20"
                      >
                        <el-button
                          size="small"
                          :type="row.complianceUrl ? 'success' : 'default'"
                          plain
                          class="print-action-button"
                          :disabled="!row.complianceUrl"
                          @click="handlerPrintGoodsSn(row, 2)"
                        >
                          <template #icon>
                            <el-icon class="print-icon">
                              <Printer />
                            </el-icon>
                          </template>
                          打印合规单
                        </el-button>
                      </el-tooltip>
                    </div>
                    <div class="mt-2 flex justify-center">
                      <el-tooltip
                        effect="dark"
                        content="当前合并文件尚未上传，请联系相关人员及时上传！"
                        placement="top"
                        :disabled="!!row.complianceGoodsMergedUrl"
                        popper-class="custom-tooltip"
                        :show-after="100"
                        :hide-after="200"
                        :enterable="false"
                        :offset="20"
                      >
                        <el-button
                          size="small"
                          :type="row.complianceGoodsMergedUrl ? 'warning' : 'default'"
                          plain
                          class="print-action-button"
                          :disabled="!row.complianceGoodsMergedUrl"
                          @click="handlerPrintGoodsSn(row, 3)"
                        >
                          <template #icon>
                            <el-icon class="print-icon">
                              <Printer />
                            </el-icon>
                          </template>
                          打印条码+合规单
                        </el-button>
                      </el-tooltip>
                    </div>
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
              <el-table-column label="商品信息" align="center" prop="productImgUrl" min-width="240">
                <template #default="{ row }">
                  <div class="text-left">
                    <div class="truncate mb-2 font-bold">产品标题：{{ row.productTitle }}</div>

                    <!-- 商品属性 -->
                    <div class="flex items-start mb-2">
                      <div>商品属性:</div>
                      <div class="ml-2">{{ row.productProperties || '--' }}</div>
                    </div>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="类目名称" align="center" prop="categoryName" min-width="150">
                <template #default="{ row }">
                  <div>{{ row.categoryName }}</div>
                </template>
              </el-table-column>
              <!-- 添加定制文字列 -->
              <el-table-column
                label="定制文字"
                align="center"
                prop="customTextList"
                min-width="180"
              >
                <template #default="{ row }">
                  <div class="text-center">{{ row.customTextList || '--' }}</div>
                </template>
              </el-table-column>
              <!-- 定制图片 -->
              <el-table-column
                label="定制图片"
                align="center"
                prop="customImageUrls"
                min-width="180"
              >
                <template #default="{ row }">
                  <div class="flex flex-wrap" v-if="row.customImageUrls">
                    <div
                      v-for="(item, index) in row.customImageUrls.split(',')"
                      :key="index"
                      class="ml-2"
                    >
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
              <el-table-column
                label="合成预览"
                align="center"
                prop="effectiveImgUrl"
                min-width="120"
              >
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
              <!--合规单图片-->
              <el-table-column
                label="合规单图片"
                align="center"
                prop="complianceImageUrl"
                min-width="120"
              >
                <template #default="{ row }">
                  <div class="text-left">
                    <el-image
                      class="w-60px h-60px"
                      v-if="row.complianceImageUrl"
                      :hide-on-click-modal="true"
                      :preview-teleported="true"
                      :preview-src-list="[row.complianceImageUrl]"
                      :src="row.complianceImageUrl"
                    />
                    <div v-else class="text-gray-400 text-sm">暂无图片</div>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="价格信息" min-width="120">
                <template #default="{ row }">
                  <div>
                    <div>
                      <div>官网数量：{{ row.originalQuantity || '--' }}</div>
                      <div>制作数量：{{ row.quantity || '--' }}</div>
                      <div>单价：{{ row.unitPrice ? '￥' + row.unitPrice.toFixed(6) : '--' }}</div>
                      <div
                        >总价：{{ row.totalPrice ? '￥' + row.totalPrice.toFixed(2) : '--' }}</div
                      >
                    </div>
                  </div>
                </template>
              </el-table-column>

              <el-table-column label="SKU信息" align="center" prop="productTitle" min-width="275">
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
                      <span class="label" style="font-weight: bold">定制SKU：</span>
                      <div class="custom-sku-content">
                        <span v-if="row.customSku" class="custom-sku">{{ row.customSku }}</span>
                        <span v-else>-</span>
                        <!-- <el-button
                          v-if="row.customSku"
                          class="copy-button"
                          type="primary"
                          link
                          @click.stop="handleCopy(row.customSku)"
                        >
                          <el-icon><CopyDocument /></el-icon>
                        </el-button> -->
                      </div>
                    </div>
                  </div>
                </template>
              </el-table-column>

              <el-table-column label="订单状态" align="center" prop="orderStatus" min-width="150">
                <template #default="{ row }">
                  <el-tag
                    :type="getOrderStatusType(row.orderStatus)"
                    class="status-tag"
                    size="large"
                  >
                    {{ getOrderStatusText(row.orderStatus) }}
                  </el-tag>
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
              <!--  备注-->
              <el-table-column
                label="备注"
                align="center"
                prop="remark"
                min-width="150"
                show-overflow-tooltip
              />
            </el-table>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="批次编号" align="center" prop="batchNo" min-width="180">
        <template #default="{ row }">
          <div class="batch-info">
            <div class="batch-no">{{ row.batchNo }}</div>
            <div class="create-time">{{
              dayjs(row.createTime).format('YYYY-MM-DD HH:mm:ss')
            }}</div>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="品类信息" align="center" min-width="180">
        <template #default="{ row }">
          <div class="category-info">
            <template v-if="row.orderList && row.orderList.length > 0">
              <el-tag
                v-for="category in [...new Set(row.orderList.map(order => order.categoryName))]"
                :key="category"
                class="category-tag"
                type="info"
                effect="plain"
              >
                {{ category }}
              </el-tag>
            </template>
            <span v-else class="no-data">暂无品类信息</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="打印文件地址" align="center" prop="fileUrl" min-width="200">
        <template #default="{ row }">
          <div class="font-bold flex item-center justify-center" v-if="row.fileUrl">
            <a :href="row.fileUrl" :download="row.fileUrl">
              <el-button type="success" plain class="action-button">
                <Icon icon="ep:download" class="mr-5px" />
                下载作图文件
              </el-button>
            </a>
            <el-button
              v-if="row.status === 0"
              type="primary"
              plain
              @click="handlerHandleUpload(row)"
              class="action-button ml-2"
            >
              <Icon icon="ep:upload" class="mr-5px" />
              重新上传
            </el-button>
          </div>
          <div class="font-bold" v-else>
            <el-button type="primary" plain @click="handlerHandleUpload(row)" class="action-button">
              <Icon icon="ep:upload" class="mr-5px" />
              上传作图文件
            </el-button>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="定制图片（一键下载）" align="center" min-width="130">
        <template #default="{ row }">
          <div class="flex justify-center mt-2">
            <el-button
              type="success"
              plain
              @click="handleDownloadCustomImages(row)"
              class="action-button"
            >
              <Icon icon="ep:picture" class="mr-5px" />
              下载定制图片
            </el-button>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="订单状态" align="center" prop="orderStatus" min-width="100">
        <template #default="{ row }">
          <dict-tag
            :type="DICT_TYPE.TEMU_ORDER_BATCH_STATUS"
            :value="row.status"
            class="batch-status-tag"
          />
        </template>
      </el-table-column>
      <el-table-column label="任务分配状态" align="center" min-width="100">
        <template #default="{ row }">
          <dict-tag
            :type="DICT_TYPE.TEMU_ORDER_BATCH_DISPATCH_STATUS"
            :value="row.isDispatchTask"
            class="batch-status-tag"
          />
        </template>
      </el-table-column>
      <el-table-column
        label="备注"
        align="center"
        prop="remark"
        width="150"
        :show-overflow-tooltip="true"
      />
      <el-table-column label="操作" align="center" width="120px" fixed="right">
        <template #default="scope">
          <div class="flex justify-center" v-if="scope.row.status === 0">
            <el-popconfirm
              title="是否确认完成订单?"
              placement="top-start"
              @confirm="handleUpdateBathchStatus(scope.row)"
            >
              <template #reference>
                <el-button type="warning" plain class="action-button">
                  <Icon icon="ep:check" class="mr-5px" />
                  确认完成
                </el-button>
              </template>
            </el-popconfirm>
          </div>
          <el-button type="text" @click="handlerRemark(scope.row)">备注</el-button>
        </template>
      </el-table-column>
    </el-table>
    <!-- 分页 -->
    <Pagination
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      :page-sizes="[10, 20, 50]"
      :default-page-size="50"
      @pagination="getList"
    />
  </ContentWrap>
  <!--修改备注-->
  <OrderRemarkPopup @confirm="handlerRemarkConfirm" ref="orderRemarkPopup" />
  <!--分配任务 -->
  <OrderBatchTaskDispatchPopup
    v-if="orderBatchTaskDispatchVisible"
    ref="orderBatchTaskDispatchPopup"
    @confirm="handlerDispatchTaskConfirm"
    @close="orderBatchTaskDispatchVisible = false"
  />
</template>

<script setup lang="ts">
import { dateFormatter } from '@/utils/formatTime'
import { OrderBatchApi, OrderBatchVO } from '@/api/temu/order-batch'
import { DICT_TYPE, getStrDictOptions } from '@/utils/dict'
import { ElMessageBox, ElMessage, ElNotification } from 'element-plus'
import JSZip from 'jszip'
import { OrderApi, OrderVO } from '@/api/temu/order'
import printJS from 'print-js'
import OrderRemarkPopup from '@/views/temu/order/batch/components/OrderRemarkPopup.vue'
import OrderBatchTaskDispatchPopup from '@/views/temu/order/batch/components/OrderBatchTaskDispatchPopup.vue'
import { CopyDocument, Printer, ArrowDown } from '@element-plus/icons-vue'
import { PDFDocument } from 'pdf-lib'
import dayjs from 'dayjs'

defineOptions({ name: 'BatchOrderPopup' })
const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

// 状态变量
const loading = ref(true) // 列表的加载中
const list = ref<OrderBatchVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const selectedOrders = ref<OrderVO[]>([]) // 选中的订单
const batchSelections = ref<Map<string, OrderVO[]>>(new Map()) // 每个批次的选择状态
const tableRefs = ref<Map<string, any>>(new Map()) // 存储表格引用
const expandedRows = ref<string[]>([]) // 存储展开的行
const isAllExpanded = ref(false) // 是否全部展开

// 查询参数
const selectedRows = ref([])
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  batchNo: undefined,
  customSku: undefined,
  status: undefined,
  isDispatchTask: undefined,
  createTime: []
})
const orderBatchTaskDispatchVisible = ref(false)

const queryFormRef = ref() // 搜索的表单
// 备注引用
const orderRemarkPopup = useTemplateRef('orderRemarkPopup')
// 分配任务引用
const orderBatchTaskDispatchPopup = useTemplateRef('orderBatchTaskDispatchPopup')
/** 选中行 */
const handlerSelectionChange = (val: any) => {
  selectedRows.value = val
  // 更新选中的订单列表
  selectedOrders.value = []
  val.forEach((batch: any) => {
    if (batch.orderList && batch.orderList.length > 0) {
      selectedOrders.value.push(...batch.orderList)
    }
  })
}

/** 注册表格引用 */
const registerTableRef = (el: any, batchNo: string) => {
  if (el) {
    tableRefs.value.set(batchNo, el)
  }
}

/** 判断是否可选择 */
const isSelectable = () => {
  return true
}

/** 处理内部表格的选择变化 */
const handleInnerSelectionChange = (selection: OrderVO[], batchRow: any) => {
  // 更新当前批次的选择状态
  if (selection.length > 0) {
    batchSelections.value.set(batchRow.batchNo, selection)
  } else {
    batchSelections.value.delete(batchRow.batchNo)
  }

  // 合并所有批次的选择
  const allSelected: OrderVO[] = []
  batchSelections.value.forEach((orders) => {
    allSelected.push(...orders)
  })
  selectedOrders.value = allSelected
}

/** 清除所有选择 */
const clearAllSelections = () => {
  // 清除选择记录
  selectedOrders.value = []
  selectedRows.value = []
}

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const params = {
      ...queryParams,
      groupByBatch: true,
      pageSize: queryParams.pageSize,
      pageNo: queryParams.pageNo
    }

    const data = await OrderBatchApi.getOrderBatchPage(params)

    const batchGroups = new Map()
    data.list.forEach((item) => {
      if (!batchGroups.has(item.batchNo)) {
        batchGroups.set(item.batchNo, item)
      }
    })

    list.value = Array.from(batchGroups.values())
    total.value = data.total
    // 默认展开第一条批次
    if (list.value.length > 0) {
      expandedRows.value = [String(list.value[0].id)]
      isAllExpanded.value = false
    } else {
      expandedRows.value = []
      isAllExpanded.value = false
    }
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

const handlerPrintGoodsSn = async (row: OrderVO, type: string | number) => {
  // let { goodsSn, oldTypeUrl } = await OrderApi.getOrderExtraInfo(row.id)
  let goodsSn = row.goodsSn
  let oldTypeUrl = row.complianceUrl
  let mergedUrl = row.complianceGoodsMergedUrl
  switch (type) {
    case 1:
      if (!goodsSn) {
        ElMessage.warning('商品条码没有设置无法打印!')
        return
      }
      printJS(goodsSn)
      break
    case 2:
      if (!oldTypeUrl) {
        ElMessage.warning('合规单没有设置无法打印!')
        return
      }
      printJS(oldTypeUrl)
      break
    case 3:
      if (!mergedUrl) {
        ElMessage.warning('合并文件没有设置无法打印!')
        return
      }
      printJS(mergedUrl)
      break
  }
}
const handleFileSuccess = async (row: any, res: any) => {
  if (!res) {
    return
  }
  await OrderBatchApi.updateOrderBatchFile({ id: row.id, fileUrl: res })
  row.fileUrl = res
  message.success('操作成功')
  await getList()
}
const handlerHandleUpload = async (row: any) => {
  ElMessageBox.prompt('请输入要上传的文件地址例如：https://osss.aliyun.com/xxx.zip', '提示', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    inputPattern: /^(http|https):\/\/.+\.(zip|rar|7z|docx|doc|xls|xlsx)$/,
    inputErrorMessage: '无效的地址'
  }).then(({ value }) => {
    handleFileSuccess(row, value)
  })
}
const handleUpdateBathchStatus = async (row: any) => {
  try {
    if (!row.fileUrl) {
      message.warning('请先上传文件!')
      return
    }
    if (row.status == 1) {
      message.warning('该订单已完成生产!')
      return
    }
    await OrderBatchApi.updateOrderBatchStatus({ id: row.id })
    row.status = true
    message.success('操作成功')
    // 刷新列表
    await getList()
  } catch {}
}
const handleDownloadCustomImages = async (row: any) => {
  try {
    if (!row.orderList || row.orderList.length === 0) {
      message.warning('该批次没有订单信息！')
      return
    }

    loading.value = true
    const zip = new JSZip()
    const promises: Promise<void>[] = []
    let hasImages = false

    // 遍历所有订单
    row.orderList.forEach((order: any, orderIndex: number) => {
      if (!order.customImageUrls) return

      const urls = order.customImageUrls.split(',')
      urls.forEach((url: string, imgIndex: number) => {
        if (!url) return

        hasImages = true
        const promise = fetch(url)
          .then((response) => {
            if (!response.ok) throw new Error(`Network response was not ok for image: ${url}`)
            return response.blob()
          })
          .then((blob) => {
            // 使用订单号和图片索引构建文件名，保留原始扩展名
            const urlParts = url.split('.')
            const extension = urlParts[urlParts.length - 1] || 'png'
            const fileName = `订单${orderIndex + 1}_${order.orderNo}_图片${imgIndex + 1}.${extension}`
            zip.file(fileName, blob)
          })
          .catch((error) => {
            console.error(`Error processing image ${url}:`, error)
          })

        promises.push(promise)
      })
    })

    if (!hasImages) {
      message.warning('没有找到可下载的定制图片！')
      loading.value = false
      return
    }

    // 等待所有图片加载完成
    await Promise.all(promises)

    // 生成zip文件并下载
    const content = await zip.generateAsync({ type: 'blob' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(content)
    link.download = `${row.batchNo}_定制图片.zip`
    link.click()

    // 释放URL对象
    URL.revokeObjectURL(link.href)
    message.success('定制图片打包下载成功！')
  } catch (error) {
    console.error('下载定制图片失败:', error)
    message.error('下载定制图片失败，请重试！')
  } finally {
    loading.value = false
  }
}

//复制文字内容
const handleCopy = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('复制成功')
  } catch (error) {
    console.error('复制失败:', error)
    ElMessage.error('复制失败')
  }
}

// 获取订单状态类型
const getOrderStatusType = (
  status: number
): 'success' | 'warning' | 'info' | 'primary' | 'danger' | 'process' => {
  switch (status) {
    case 0:
      return 'info' // 待下单 - 浅灰
    case 1:
      return 'primary' // 已下单待送产 - 浅蓝
    case 2:
      return 'warning' // 已送产待生产 - 浅紫
    case 3:
      return 'process' // 已生产待发货 - 浅绿
    case 4:
      return 'success' // 已发货 - 浅青
    default:
      return 'info'
  }
}

// 获取订单状态文本
const getOrderStatusText = (status: number) => {
  switch (status) {
    case 0:
      return '待下单'
    case 1:
      return '已下单待送产'
    case 2:
      return '已送产待生产'
    case 3:
      return '已生产待发货'
    case 4:
      return '已发货'
    default:
      return '未知状态'
  }
}
/** 订单备注 **/
const handlerRemark = async (row: OrderBatchVO) => {
  if (orderRemarkPopup.value) {
    orderRemarkPopup.value.setVisible(true)
    orderRemarkPopup.value.formData.orderId = String(row.id)
    orderRemarkPopup.value.formData.remark = row.remark
  }
}
/** 订单备注确认 **/
const handlerRemarkConfirm = async (data: any) => {
  await OrderBatchApi.updateOrderBatchRemark(data)
  ElMessage.success('操作成功')
  await getList()
}
/** 批量派单 **/
const handlerDispatchTask = () => {
  // 检查是否存在选中的订单
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请选择要操作的订单')
    return
  }
  orderBatchTaskDispatchVisible.value = true
  nextTick(() => {
    if (orderBatchTaskDispatchPopup.value) {
      orderBatchTaskDispatchPopup.value.setVisible(true)
      orderBatchTaskDispatchPopup.value.formData.orderIds = selectedRows.value.map(
        (item: any) => String(item.id)
      )
    }
  })
}
/** 打印批次信息 */
const handlePrintBatch = () => {
  // 创建打印内容
  const printContent = list.value
    .map((batch) => {
      // 获取该批次下所有不重复的品类信息
      const allCategories = Array.from(
        new Set(batch.orderList?.map((order) => order.categoryName) || [])
      )
      const categories = allCategories.slice(0, 5)
      const hasMore = allCategories.length > 5

      return `
      <div style="width: 100mm; min-height: 100mm; padding: 8mm; box-sizing: border-box; font-family: Arial, sans-serif; display: flex; flex-direction: column;">
        <div style="text-align: center; margin-bottom: 6mm;">
          <div style="font-size: 36pt; font-weight: bold; word-break: break-all;">${batch.batchNo}</div>
        </div>
        <div>
          <div style="font-size: 12pt; margin-bottom: 3mm;">品类信息：</div>
          <div style="font-size: 10pt; line-height: 1.4; word-break: break-all;">
            ${categories.join('、')}${hasMore ? '等' : ''}
          </div>
        </div>
      </div>
    `
    })
    .join('<div style="page-break-after: always;"></div>')

  // 使用 print-js 打印
  printJS({
    printable: printContent,
    type: 'raw-html',
    style: `
      @page {
        size: 100mm 100mm;
        margin: 0;
      }
      @media print {
        body {
          margin: 0;
          padding: 0;
        }
      }
    `
  })
}

/** 批量打印商品条码 */
const handlerPrintBatchGoodsSn = async () => {
  if (!selectedOrders.value || selectedOrders.value.length === 0) {
    ElMessage.warning('请先选择要打印的订单')
    return
  }

  try {
    // 检查是否有订单的商品条码为空
    const ordersWithoutGoodsSn = selectedOrders.value.filter(order => !order.goodsSn)
    if (ordersWithoutGoodsSn.length > 0) {
      // 按店铺分组
      const groupedByShop = ordersWithoutGoodsSn.reduce((acc, order) => {
        const shopName = order.shopName || '未知店铺'
        if (!acc[shopName]) {
          acc[shopName] = []
        }
        acc[shopName].push(order.customSku || '未知SKU')
        return acc
      }, {})

      const missingInfo = Object.entries(groupedByShop)
        .map(([shopName, skus]) => `
          <div style="margin-bottom: 16px;">
            <div style="color: #606266; font-weight: bold; margin-bottom: 8px;">${shopName}</div>
            <div style="padding-left: 16px;">
              ${skus.map(sku => `
                <div style="color: #409EFF; margin-bottom: 4px;">
                  ${sku}
                </div>
              `).join('')}
            </div>
          </div>
        `)
        .join('')

      ElNotification({
        title: '无法批量打印',
        message: `
          <div style="margin-bottom: 10px; color: #303133;">以下定制SKU缺少商品条码，请联系相关人员及时补充：</div>
          <div style="max-height: 300px; overflow-y: auto; padding-right: 10px;">${missingInfo}</div>
        `,
        type: 'warning',
        duration: 0,
        dangerouslyUseHTMLString: true,
        style: {
          width: '380px'
        }
      })
      return
    }

    // 使用Map对相同订单编号的订单进行去重
    const uniqueOrders = new Map()
    selectedOrders.value.forEach((order) => {
      if (!uniqueOrders.has(order.orderNo)) {
        uniqueOrders.set(order.orderNo, order)
      }
    })

    // 将Map转换为数组
    const ordersWithGoodsSn = Array.from(uniqueOrders.values())

    // 创建一个新的PDF文档
    const mergedPdf = await PDFDocument.create()
    let successCount = 0
    let failCount = 0

    // 加载并合并所有PDF文件
    for (const order of ordersWithGoodsSn) {
      const url = order.goodsSn.startsWith('@') ? order.goodsSn.substring(1) : order.goodsSn
      try {
        const response = await fetch(url)
        if (!response.ok) {
          console.error(`加载PDF失败: ${url}`)
          failCount++
          continue
        }
        const pdfBytes = await response.arrayBuffer()
        const pdf = await PDFDocument.load(pdfBytes)
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices())
        copiedPages.forEach((page) => {
          mergedPdf.addPage(page)
        })
        successCount++
      } catch (error) {
        console.error(`加载PDF失败: ${url}`, error)
        failCount++
      }
    }

    if (mergedPdf.getPageCount() === 0) {
      ElMessage.error('没有可打印的商品条码PDF文件')
      return
    }

    // 保存合并后的PDF
    const mergedPdfBytes = await mergedPdf.save()
    const mergedPdfBlob = new Blob([mergedPdfBytes], { type: 'application/pdf' })
    const mergedPdfUrl = URL.createObjectURL(mergedPdfBlob)

    // 使用print-js打印PDF
    printJS({
      printable: mergedPdfUrl,
      type: 'pdf',
      showModal: true
    })

    // 显示处理结果
    if (failCount > 0) {
      ElMessage.warning(`成功处理${successCount}个订单，${failCount}个订单处理失败`)
    } else {
      ElMessage.success(`成功处理${successCount}个订单`)
    }

    // 清理资源
    setTimeout(() => {
      URL.revokeObjectURL(mergedPdfUrl)
    }, 10000)
  } catch (error) {
    console.error('批量打印商品条码失败:', error)
    ElMessage.error('批量打印商品条码失败：' + (error instanceof Error ? error.message : '未知错误'))
  }
}

/** 批量打印合规单 */
const handlerPrintBatchCompliance = async () => {
  if (!selectedOrders.value || selectedOrders.value.length === 0) {
    ElMessage.warning('请先选择要打印的订单')
    return
  }

  try {
    // 检查是否有订单的合规单为空
    const ordersWithoutCompliance = selectedOrders.value.filter(order => !order.complianceUrl)
    if (ordersWithoutCompliance.length > 0) {
      // 按店铺分组
      const groupedByShop = ordersWithoutCompliance.reduce((acc, order) => {
        const shopName = order.shopName || '未知店铺'
        if (!acc[shopName]) {
          acc[shopName] = []
        }
        acc[shopName].push(order.customSku || '未知SKU')
        return acc
      }, {})

      const missingInfo = Object.entries(groupedByShop)
        .map(([shopName, skus]) => `
          <div style="margin-bottom: 16px;">
            <div style="color: #606266; font-weight: bold; margin-bottom: 8px;">${shopName}</div>
            <div style="padding-left: 16px;">
              ${skus.map(sku => `
                <div style="color: #409EFF; margin-bottom: 4px;">
                  ${sku}
                </div>
              `).join('')}
            </div>
          </div>
        `)
        .join('')

      ElNotification({
        title: '无法批量打印',
        message: `
          <div style="margin-bottom: 10px; color: #303133;">以下定制SKU缺少合规单，请联系相关人员及时补充：</div>
          <div style="max-height: 300px; overflow-y: auto; padding-right: 10px;">${missingInfo}</div>
        `,
        type: 'warning',
        duration: 0,
        dangerouslyUseHTMLString: true,
        offset: 60
      })
      return
    }

    // 使用Map对相同订单编号的订单进行去重
    const uniqueOrders = new Map()
    selectedOrders.value.forEach((order) => {
      if (!uniqueOrders.has(order.orderNo)) {
        uniqueOrders.set(order.orderNo, order)
      }
    })

    // 将Map转换为数组
    const ordersWithCompliance = Array.from(uniqueOrders.values())

    // 创建一个新的PDF文档
    const mergedPdf = await PDFDocument.create()
    let successCount = 0
    let failCount = 0

    // 加载并合并所有PDF文件
    for (const order of ordersWithCompliance) {
      const url = order.complianceUrl.startsWith('@')
        ? order.complianceUrl.substring(1)
        : order.complianceUrl
      try {
        const response = await fetch(url)
        if (!response.ok) {
          console.error(`加载PDF失败: ${url}`)
          failCount++
          continue
        }
        const pdfBytes = await response.arrayBuffer()
        const pdf = await PDFDocument.load(pdfBytes)
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices())
        copiedPages.forEach((page) => {
          mergedPdf.addPage(page)
        })
        successCount++
      } catch (error) {
        console.error(`加载PDF失败: ${url}`, error)
        failCount++
      }
    }

    if (mergedPdf.getPageCount() === 0) {
      ElMessage.error('没有可打印的合规单PDF文件')
      return
    }

    // 保存合并后的PDF
    const mergedPdfBytes = await mergedPdf.save()
    const mergedPdfBlob = new Blob([mergedPdfBytes], { type: 'application/pdf' })
    const mergedPdfUrl = URL.createObjectURL(mergedPdfBlob)

    // 使用print-js打印PDF
    printJS({
      printable: mergedPdfUrl,
      type: 'pdf',
      showModal: true
    })

    // 显示处理结果
    if (failCount > 0) {
      ElMessage.warning(`成功处理${successCount}个订单，${failCount}个订单处理失败`)
    } else {
      ElMessage.success(`成功处理${successCount}个订单`)
    }

    // 清理资源
    setTimeout(() => {
      URL.revokeObjectURL(mergedPdfUrl)
    }, 10000)
  } catch (error) {
    console.error('批量打印合规单失败:', error)
    ElMessage.error('批量打印合规单失败：' + (error instanceof Error ? error.message : '未知错误'))
  }
}

/** 批量打印条码+合规单 */
const handlerPrintBatchMerged = async () => {
  if (!selectedOrders.value || selectedOrders.value.length === 0) {
    ElMessage.warning('请先选择要打印的订单')
    return
  }

  try {
    // 检查是否有订单的合并文件为空
    const ordersWithoutMerged = selectedOrders.value.filter(order => !order.complianceGoodsMergedUrl)
    if (ordersWithoutMerged.length > 0) {
      // 按店铺分组
      const groupedByShop = ordersWithoutMerged.reduce((acc, order) => {
        const shopName = order.shopName || '未知店铺'
        if (!acc[shopName]) {
          acc[shopName] = []
        }
        acc[shopName].push(order.customSku || '未知SKU')
        return acc
      }, {})

      const missingInfo = Object.entries(groupedByShop)
        .map(([shopName, skus]) => `
          <div style="margin-bottom: 16px;">
            <div style="color: #606266; font-weight: bold; margin-bottom: 8px;">${shopName}</div>
            <div style="padding-left: 16px;">
              ${skus.map(sku => `
                <div style="color: #409EFF; margin-bottom: 4px;">
                  ${sku}
                </div>
              `).join('')}
            </div>
          </div>
        `)
        .join('')

      ElNotification({
        title: '无法批量打印',
        message: `
          <div style="margin-bottom: 10px; color: #303133;">以下定制SKU缺少合并文件，请联系相关人员及时补充：</div>
          <div style="max-height: 300px; overflow-y: auto; padding-right: 10px;">${missingInfo}</div>
        `,
        type: 'warning',
        duration: 0,
        dangerouslyUseHTMLString: true,
        offset: 60
      })
      return
    }

    // 使用Map对相同订单编号的订单进行去重
    const uniqueOrders = new Map()
    selectedOrders.value.forEach((order) => {
      if (!uniqueOrders.has(order.orderNo)) {
        uniqueOrders.set(order.orderNo, order)
      }
    })

    // 将Map转换为数组
    const ordersWithMergedFile = Array.from(uniqueOrders.values())

    // 创建一个新的PDF文档
    const mergedPdf = await PDFDocument.create()
    let successCount = 0
    let failCount = 0

    // 加载并合并所有PDF文件
    for (const order of ordersWithMergedFile) {
      const url = order.complianceGoodsMergedUrl.startsWith('@') 
        ? order.complianceGoodsMergedUrl.substring(1) 
        : order.complianceGoodsMergedUrl
      try {
        const response = await fetch(url)
        if (!response.ok) {
          console.error(`加载PDF失败: ${url}`)
          failCount++
          continue
        }
        const pdfBytes = await response.arrayBuffer()
        const pdf = await PDFDocument.load(pdfBytes)
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices())
        copiedPages.forEach((page) => {
          mergedPdf.addPage(page)
        })
        successCount++
      } catch (error) {
        console.error(`加载PDF失败: ${url}`, error)
        failCount++
      }
    }

    if (mergedPdf.getPageCount() === 0) {
      ElMessage.error('没有可打印的合并文件PDF')
      return
    }

    // 保存合并后的PDF
    const mergedPdfBytes = await mergedPdf.save()
    const mergedPdfBlob = new Blob([mergedPdfBytes], { type: 'application/pdf' })
    const mergedPdfUrl = URL.createObjectURL(mergedPdfBlob)

    // 使用print-js打印PDF
    printJS({
      printable: mergedPdfUrl,
      type: 'pdf',
      showModal: true
    })

    // 显示处理结果
    if (failCount > 0) {
      ElMessage.warning(`成功处理${successCount}个订单，${failCount}个订单处理失败`)
    } else {
      ElMessage.success(`成功处理${successCount}个订单`)
    }

    // 清理资源
    setTimeout(() => {
      URL.revokeObjectURL(mergedPdfUrl)
    }, 10000)
  } catch (error) {
    console.error('批量打印合并文件失败:', error)
    ElMessage.error('批量打印合并文件失败：' + (error instanceof Error ? error.message : '未知错误'))
  }
}

// 在组件卸载时清除选择状态
onUnmounted(() => {
  clearAllSelections()
})

/** 批量派单确认 **/
const handlerDispatchTaskConfirm = async (data: any) => {
  await OrderBatchApi.dispatchTask(data)
  ElMessage.success('操作成功')
  selectedRows.value = []
  await getList()
}

/** 初始化 **/
onMounted(() => {
  getList()
})

/** 切换全部展开/收起状态 */
const toggleAllExpand = () => {
  if (isAllExpanded.value) {
    expandedRows.value = []
  } else {
    expandedRows.value = list.value.map(item => String(item.id))
  }
  isAllExpanded.value = !isAllExpanded.value
}

/** 打印拣货单 */
const handlePrintPickingList = () => {
  // 创建打印内容
  const printContent = list.value
    .map((batch) => {
      if (!batch.orderList || batch.orderList.length === 0) return ''

      // 计算每页显示的订单数量
      const ordersPerPage = 10
      const totalOrders = batch.orderList.length
      const totalPages = Math.ceil(totalOrders / ordersPerPage)

      // 生成分页内容
      const pageContent = Array.from({ length: totalPages }, (_, pageIndex) => {
        const startIndex = pageIndex * ordersPerPage
        const endIndex = Math.min(startIndex + ordersPerPage, totalOrders)
        const pageOrders = batch.orderList.slice(startIndex, endIndex)

        const orderListContent = pageOrders
          .map((order, index) => {
            // 处理定制图片，限制最多显示2张
            const customImages = order.customImageUrls
              ? order.customImageUrls
                  .split(',')
                  .slice(0, 2)
                  .map(
                    (url) =>
                      `<img src="${url}" style="width: 60px; height: 60px; margin: 2px; object-fit: contain;" loading="lazy">`
                  )
                  .join('')
              : '--'

            return `
              <tr class="order-row">
                <td style="text-align: center; padding: 8px; border: 1px solid #ddd; width: 40px;">
                  ${startIndex + index + 1}
                </td>
                <td style="text-align: left; padding: 8px; border: 1px solid #ddd;">
                  <div style="margin-bottom: 5px;"><strong>订单号：</strong>${order.orderNo}</div>
                  <div style="margin-bottom: 5px;"><strong>SKC编号：</strong>${order.skc || '--'}</div>
                  <div><strong>商品属性：</strong>${order.productProperties || '--'}</div>
                </td>
                <td style="text-align: center; padding: 8px; border: 1px solid #ddd; width: 120px;">
                  <div style="color: #409EFF; font-weight: bold;">${order.customSku || '--'}</div>
                </td>
                <td style="text-align: left; padding: 8px; border: 1px solid #ddd;">
                  <div style="margin-bottom: 5px;"><strong>定制文字：</strong>${
                    order.customTextList || '--'
                  }</div>
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <div>
                      <div style="margin-bottom: 2px;"><strong>原图：</strong></div>
                      <div>${customImages}</div>
                    </div>
                    <div>
                      <div style="margin-bottom: 2px;"><strong>预览：</strong></div>
                      <div>
                        <img 
                          src="${order.effectiveImgUrl || ''}" 
                          style="width: 60px; height: 60px; object-fit: contain;"
                          loading="lazy"
                          onerror="this.style.display='none'"
                        >
                      </div>
                    </div>
                  </div>
                </td>
                <td style="text-align: center; padding: 8px; border: 1px solid #ddd; width: 80px;">
                  ${order.originalQuantity || '--'}
                </td>
                <td style="text-align: center; padding: 8px; border: 1px solid #ddd; width: 80px;">
                  <!-- 预留拣货数量列 -->
                </td>
              </tr>
            `
          })
          .join('')

        return `
          <div style="page-break-after: always;">
            <div style="margin-bottom: 20px;">
              <h2 style="text-align: center; margin-bottom: 10px;">拣货单</h2>
              <div style="margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <strong>批次编号：</strong>${batch.batchNo}
                  <span style="margin-left: 20px;">第 ${pageIndex + 1}/${totalPages} 页</span>
                </div>
                <div>
                  <strong>打印时间：</strong>${dayjs().format('YYYY-MM-DD HH:mm:ss')}
                </div>
              </div>
            </div>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
              <thead>
                <tr style="background-color: #f5f7fa;">
                  <th style="padding: 12px; border: 1px solid #ddd; width: 40px;">序号</th>
                  <th style="padding: 12px; border: 1px solid #ddd;">商品信息</th>
                  <th style="padding: 12px; border: 1px solid #ddd; width: 120px;">定制SKU</th>
                  <th style="padding: 12px; border: 1px solid #ddd;">定制内容</th>
                  <th style="padding: 12px; border: 1px solid #ddd; width: 80px;">官网数量</th>
                  <th style="padding: 12px; border: 1px solid #ddd; width: 80px;">拣货数量</th>
                </tr>
              </thead>
              <tbody>
                ${orderListContent}
              </tbody>
            </table>
            ${
              pageIndex === totalPages - 1
                ? `
            <div style="margin-top: 30px; display: flex; justify-content: space-between;">
              <div>
                <strong>制单人：</strong>_____________
              </div>
              <div>
                <strong>拣货人：</strong>_____________
              </div>
              <div>
                <strong>复核人：</strong>_____________
              </div>
            </div>
            `
                : ''
            }
          </div>
        `
      })

      return pageContent.join('')
    })
    .join('')

  // 使用 print-js 打印
  printJS({
    printable: printContent,
    type: 'raw-html',
    style: `
      @page {
        size: A4 landscape;
        margin: 10mm;
      }
      @media print {
        body {
          margin: 0;
          padding: 0;
        }
        img {
          max-width: 100%;
          height: auto;
        }
        .order-row td {
          vertical-align: top;
        }
        thead {
          display: table-header-group;
        }
        tfoot {
          display: table-footer-group;
        }
      }
    `
  })
}
</script>

<style lang="scss" scoped>
:deep(.el-table__header-wrapper) {
  position: sticky;
  top: 0;
  z-index: 1;
}

:deep(.el-table__row .el-table__expanded-cell) {
  .el-table__header-wrapper {
    position: sticky;
    top: 0;
    z-index: 1;
    background: var(--el-bg-color);
  }
}

// 状态标签样式优化
.status-tag {
  font-size: 13px;
  padding: 6px 5px;
  border-radius: 4px;
  font-weight: 500;
  position: relative;
  transition: all 0.3s ease;
  min-width: 90px;

  // 待下单状态
  &.el-tag--info {
    background: #c3c5c7;
    border: 1px solid #c3c5c7;
    color: white;

    &:hover {
      background: #a4a6a8;
      color: #f0f4f8;
    }
  }

  // 已下单待送产状态和已生产待发货状态
  &.el-tag--primary {
    background: #5da2e7;
    border: 1px solid #75bdec;
    color: #fff;

    &:hover {
      background: #409eff;
      color: #dcfce7;
    }

    &::before {
      content: '';
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: #f4f7f5;
      margin-right: 8px;
      animation: pulse 1s infinite;
    }
  }

  // 已送产待生产状态
  &.el-tag--warning {
    background: #e0e7ff;
    border: 1px solid #e0e7ff;
    color: #1e1b4b;

    &:hover {
      background: #6366f1;
      color: #e0e7ff;
    }

    &::before {
      content: '';
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: #6366f1;
      margin-right: 8px;
      animation: pulse 1s infinite;
    }
  }

  // 已发货状态
  &.el-tag--success {
    background: #75c945;
    border: 1px solid #73d13d;
    color: #fff;

    &:hover {
      background: #73d13d;
      color: #fff;
    }

    &::before {
      content: '✓';
      margin-right: 4px;
      font-weight: bold;
    }
  }

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  }
}

@keyframes pulse {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.2);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

// 操作按钮样式
.action-button {
  padding: 7px 14px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 4px;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  }

  .el-icon {
    margin-right: 4px;
    vertical-align: middle;
  }

  // 信息按钮样式（灰色）
  &.el-button--info {
    &.is-plain {
      color: #757679;
      background: #f4f4f5;
      border-color: #dcdfe6;

      &:hover {
        color: #ffffff;
        background: #909399;
        border-color: #909399;
      }
    }
  }

  // 警告按钮样式
  &.el-button--warning {
    &.is-plain {
      &:hover {
        background: var(--el-color-warning);
        border-color: var(--el-color-warning);
        color: white;
      }
    }
  }

  // 成功按钮样式
  &.el-button--success {
    &.is-plain {
      &:hover {
        background-color: var(--el-color-success);
        border-color: var(--el-color-success);
        color: white;
      }
    }
  }
}

// 批次状态标签样式
.batch-status-tag {
  :deep(.el-tag) {
    padding: 10px 18px;
    font-size: 16px;
    font-weight: 600;
  }
}

.sku-info {
  text-align: left;
  padding: 8px;

  .sku-item {
    margin-bottom: 4px;
    font-size: 13px;
    color: var(--el-text-color-regular);

    &:last-child {
      margin-bottom: 0;
    }

    .label {
      color: var(--el-text-color-secondary);
      margin-right: 4px;
    }
  }

  .custom-sku-wrapper {
    .custom-sku-content {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      flex: 1;

      .custom-sku {
        font-weight: 700;
        color: #409eff;
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
          color: #409eff;
        }

        .el-icon {
          margin: 0;
        }
      }
    }
  }
}

// 新增打印按钮样式
.print-action-button {
  min-width: 120px;
  height: 30px;
  font-size: 15px;
  font-weight: 500;
  border-radius: 4px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;

  .print-icon {
    font-size: 16px;
    transition: transform 0.3s ease;
  }

  &:not(:disabled) {
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

      .print-icon {
        transform: scale(1.2);
      }
    }

    &:active {
      transform: translateY(0);
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
    }
  }

  // 主要按钮样式（商品条码）
  &.el-button--primary {
    &.is-plain {
      background-color: var(--el-color-primary-light-9);
      border-color: var(--el-color-primary);
      color: var(--el-color-primary);

      &:hover {
        background-color: var(--el-color-primary);
        border-color: var(--el-color-primary);
        color: white;
      }
    }
  }

  // 成功按钮样式（合规单）
  &.el-button--success {
    &.is-plain {
      background-color: var(--el-color-success-light-9);
      border-color: var(--el-color-success);
      color: var(--el-color-success);

      &:hover {
        background-color: var(--el-color-success);
        border-color: var(--el-color-success);
        color: white;
      }
    }
  }

  // 禁用状态样式
  &.is-disabled {
    background-color: var(--el-fill-color-lighter) !important;
    border-color: var(--el-border-color-lighter) !important;
    color: var(--el-text-color-placeholder) !important;
    cursor: not-allowed;

    &:hover {
      transform: none;
      box-shadow: none;
    }
  }
}

// 自定义tooltip样式优化
:deep(.custom-tooltip) {
  padding: 10px 14px;
  font-size: 13px;
  line-height: 1.5;
  border-radius: 6px;
  max-width: 300px;
  word-break: break-word;
  background-color: rgba(0, 0, 0, 0.85);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.shipping-table {
  // 移除表格默认边框
  :deep(.el-table__inner-wrapper) {
    border: none !important;
  }

  // 表头边框
  :deep(.el-table__header-wrapper) {
    th {
      border-bottom: 1px solid var(--el-border-color) !important;
    }
  }

  // 表格内容边框
  :deep(.el-table__body-wrapper) {
    tr {
      // 统一所有行的边框
      td {
        border-bottom: 1px solid var(--el-border-color) !important;
      }
    }
  }

  // 垂直分隔线
  :deep(.el-table__body) {
    .order-info-column {
      position: relative;

      .cell {
        padding-right: 16px;
      }

      &::after {
        content: '';
        position: absolute;
        top: 0;
        right: 0;
        height: 100%;
        width: 1px;
        background-color: var(--el-border-color);
        z-index: 1;
      }
    }
  }

  // 夜间模式边框颜色适配
  :deep(.dark) {
    // 表头边框
    .el-table__header-wrapper th {
      border-bottom: 1px solid var(--el-border-color-darker) !important;
    }

    // 垂直分隔线
    .order-info-column::after {
      background-color: var(--el-border-color-darker);
    }
  }
}

// 选择信息样式
.selection-info {
  .selection-tag {
    font-size: 14px;
    padding: 6px 12px;
    height: 32px;
    line-height: 20px;

    .selection-count {
      font-size: 15px;
      font-weight: bold;
      color: var(--el-color-primary);
      margin: 0 2px;
    }
  }

  .clear-selection-btn {
    padding: 6px 12px;
    height: 32px;
    font-size: 14px;
    border-radius: 4px;

    &:hover {
      color: var(--el-color-primary);
      border-color: var(--el-color-primary);
    }
  }
}

// 修改打印按钮禁用状态样式
.print-button {
  &.el-button--default {
    &.is-disabled {
      background-color: var(--el-button-disabled-bg);
      border-color: var(--el-button-disabled-border-color);
      color: var(--el-button-disabled-text-color);
    }
  }
}

// 批次信息样式
.batch-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 2px;

  .batch-no {
    font-size: 17px;
    font-weight: 600;
    color: rgb(61, 58, 58);
    transition: all 0.3s ease;

    &:hover {
      opacity: 0.8;
    }
  }

  .create-time {
    font-size: 15px;
    color: var(--el-text-color-secondary);
  }
}

// 品类信息样式
.category-info {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  padding: 4px;

  .category-tag {
    font-size: 15px;
    border-radius: 4px;
    padding: 4px 8px;
    margin: 2px;
    
    &.el-tag--info {
      background-color: var(--el-fill-color-light);
      border-color: var(--el-border-color-lighter);
      color: var(--el-text-color-regular);
    }
  }

  .no-data {
    color: var(--el-text-color-secondary);
    font-size: 14px;
  }
}

// 展开全部按钮样式
.expand-all-button {
  display: inline-flex;
  align-items: center;
  padding: 1px;
  transition: all 0.3s ease;
  height: 32px;
  width: 30%;
  font-size: 14px;
  justify-content: flex-start;
  padding-left: 1px;

  .expand-icon {
    transition: transform 0.3s ease;
    font-size: 16px;
    margin-right: 1px;
    
    &.is-expanded {
      transform: rotate(180deg);
    }
  }

  .expand-text {
    font-size: 13px;
    white-space: nowrap;
  }

  &:hover {
    opacity: 0.9;
  }
}

// 修改 Element Plus 默认的展开按钮样式
:deep(.el-table__expand-icon) {
  float: left;
  margin-left: 16px;
}

:deep(.el-table__expand-column .cell) {
  display: flex;
  justify-content: flex-start;
}
</style>

