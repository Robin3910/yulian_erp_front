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
      <el-form-item label="任务状态" prop="orderStatus">
        <el-select
          v-model="queryParams.taskStatus"
          placeholder="请选择任务状态"
          clearable
          class="!w-220px"
        >
          <el-option
            v-for="dict in getStrDictOptions(DICT_TYPE.TEMU_ORDER_BATCH_TASK_STATUS)"
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
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table
      v-loading="loading"
      :data="list"
      :stripe="true"
      :show-overflow-tooltip="true"
      :default-expand-all="true"
      height="calc(100vh - 280px)"
      :header-cell-style="{ background: 'var(--el-bg-color)' }"
      row-key="taskId"
      @selection-change="handlerSelectionChange"
    >
      <!--选择-->
      <el-table-column reserve-selection type="selection" width="55" align="center" />
      <el-table-column type="expand">
        <template #default="scope">
          <div>
            <el-table
              v-loading="loading"
              :data="scope.row.orderList"
              :stripe="true"
              :show-overflow-tooltip="true"
            >
              <!--订单编号-->
              <el-table-column label="订单编号" align="center" prop="orderNo" min-width="150">
                <template #default="{ row }">
                  <div class="text-left">
                    <div>{{ row.orderNo }}</div>
                    <div>
                      <el-button type="primary" @click="handlerPrintGoodsSn(row, 1)" size="small">
                        打印商品条码
                      </el-button>
                    </div>
                    <div>
                      <el-button type="success" @click="handlerPrintGoodsSn(row, 2)" size="small">
                        打印合规单
                      </el-button>
                    </div>
                  </div>
                </template>
              </el-table-column>
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
              <el-table-column label="价格信息" min-width="120">
                <template #default="{ row }">
                  <div>
                    <div>
                      <div>数量：{{ row.quantity || '--' }}</div>
                      <div>单价：{{ row.unitPrice ? '￥' + row.unitPrice.toFixed(2) : '--' }}</div>
                      <div
                        >总价：{{ row.totalPrice ? '￥' + row.totalPrice.toFixed(2) : '--' }}
                      </div>
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
          <div class="font-bold">
            <div>{{ row.batchNo }}</div>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="品类信息" align="center" min-width="260">
        <template #default="{ row }">
          <div class="category-info">
            <template v-if="row.orderList && row.orderList.length > 0">
              <div class="flex  flex-col" style="align-items:flex-start">
                <el-tag
                  v-for="(category, index) in [
                  ...new Set(row.orderList.map((order) => order.categoryName))
                ]"  :key="index"
                  class="category-tag"
                  type="info"
                  effect="plain"
                >
                  <span>{{ category }}</span>
                  <span class="ml-2 ">制作数量：<span class="color-rose-500">{{ row.orderList.filter((order) => order.categoryName === category).reduce((acc, order) => acc + order.quantity, 0) }}</span></span>

                </el-tag>
              </div>

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
              v-if="row.status === 0 && row.taskType === 1"
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
            <el-button
              v-if="row.status === 0 && row.taskType === 1"
              type="primary"
              plain
              @click="handlerHandleUpload(row)"
              class="action-button"
            >
              <Icon icon="ep:upload" class="mr-5px" />
              上传作图文件
            </el-button>
          </div>
        </template>
      </el-table-column>
      <el-table-column
        label="创建时间"
        align="center"
        prop="createTime"
        :formatter="dateFormatter"
        :show-overflow-tooltip="false"
        width="100"
      />
      <el-table-column label="定制图片（一键下载）" align="center" min-width="130">
        <template #default="{ row }">
          <div class="flex justify-center mt-2 flex-wrap">
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
      <el-table-column label="任务状态" align="center" min-width="100">
        <template #default="{ row }">
          <dict-tag
            :type="DICT_TYPE.TEMU_ORDER_BATCH_TASK_STATUS"
            :value="row.taskStatus"
            class="batch-status-tag"
          />
        </template>
      </el-table-column>
      <el-table-column label="任务类型" align="center" min-width="100">
        <template #default="{ row }">
          <dict-tag
            :type="DICT_TYPE.TEMU_ORDER_BATCH_TASK_TYPE"
            :value="row.taskType"
            class="batch-status-tag"
          />
        </template>
      </el-table-column>
      <el-table-column label="任务负责人" align="left" min-width="100">
        <template #default="{ row }">
          <div v-if="row.isDispatchTask === 1">
            <div v-for="(item,index) in row.userList" :key="index">
              <span>{{item.type==1?'作图':'生产'}}:</span>
              <span>{{item.nickName}}</span>
            </div>
          </div>
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
          <div
            class="flex justify-center"
            v-if="scope.row.status === 0 && scope.row.taskType === 2"
          >
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
      @pagination="getList"
    />
  </ContentWrap>
  <!--修改备注-->
  <OrderRemarkPopup @confirm="handlerRemarkConfirm" ref="orderRemarkPopup" />
</template>

<script setup lang="ts">
import { dateFormatter } from '@/utils/formatTime'
import { OrderBatchApi, OrderBatchVO } from '@/api/temu/order-batch'
import { DICT_TYPE, getStrDictOptions } from '@/utils/dict'
import { ElMessageBox, ElMessage } from 'element-plus'
import JSZip from 'jszip'
import { OrderApi, OrderVO } from '@/api/temu/order'
import printJS from 'print-js'
import OrderRemarkPopup from '@/views/temu/order/batch/components/OrderRemarkPopup.vue'

/** 订单批次 列表 */
defineOptions({ name: 'BatchOrderTask' })
const message = useMessage() // 消息弹窗
const loading = ref(true) // 列表的加载中
const list = ref<OrderBatchVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const selectedRows = ref([])
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  batchNo: undefined,
  customSku: undefined,
  status: undefined,
  isDispatchTask: undefined,
  taskStatus: '1',
  createTime: []
})
const queryFormRef = ref() // 搜索的表单
// 备注引用
const orderRemarkPopup = useTemplateRef('orderRemarkPopup')

/** 选中行 */
const handlerSelectionChange = (val: any) => {
  selectedRows.value = val
}
/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    // 修改分页参数，确保按批次号分页
    const params = {
      ...queryParams,
      groupByBatch: true, // 添加分组标识，告诉后端按批次分组
      pageSize: queryParams.pageSize,
      pageNo: queryParams.pageNo
    }

    const data = await OrderBatchApi.getOrderBatchTaskPage(params)

    // // 按批次号分组数据
    // const batchGroups = new Map()
    // data.list.forEach((item) => {
    //   if (!batchGroups.has(item.batchNo)) {
    //     batchGroups.set(item.batchNo, item)
    //   }
    // })
    //
    // // 将分组后的数据转换为数组
    // list.value = Array.from(batchGroups.values())
    list.value = data.list
    total.value = data.total // 使用服务端返回的批次总数
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
  let { goodsSn, oldTypeUrl } = await OrderApi.getOrderExtraInfo(row.id)
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
      printJS(oldTypeUrl, 'image')
  }
}
const handleFileSuccess = async (row: any, res: any) => {
  if (!res) {
    return
  }
  await OrderBatchApi.updateOrderBatchFileByTask({ taskId: row.taskId, id: row.id, fileUrl: res })
  row.fileUrl = res
  message.success('操作成功')
  await getList()
}
const handlerHandleUpload = async (row: any) => {
  ElMessageBox.prompt('请输入要上传的文件地址例如：https://xxx.com/xxx.zip', '提示', {
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
    await OrderBatchApi.updateOrderBatchStatusByTask({ taskId: row.taskId, id: row.id })
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

// 获取订单状态类型
const getOrderStatusType = (
  status: number
): 'success' | 'warning' | 'info' | 'primary' | 'danger' => {
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
    orderRemarkPopup.value.formData.orderId = row.id
    orderRemarkPopup.value.formData.remark = row.remark
  }
}
/** 订单备注确认 **/
const handlerRemarkConfirm = async (data: any) => {
  await OrderBatchApi.updateOrderBatchRemark(data)
  ElMessage.success('操作成功')
  await getList()
}

/** 初始化 **/
onMounted(() => {
  getList()
})
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
        background: var(--el-color-success);
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
</style>
