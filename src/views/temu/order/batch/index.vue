<template>
  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form class="-mb-15px" :model="queryParams" ref="queryFormRef" :inline="true" label-width="68px">
      <el-row :gutter="20">
        <el-col :span="24" :lg="6">
          <el-form-item label="类目" prop="categoryId" class="w-full">
            <el-select
v-model="queryParams.categoryId" placeholder="请选择类目" clearable multiple filterable
@input="handleCategorySearch" remote :remote-method="handleCategorySearch">
              <el-option
v-for="(item, index) in categoryList" :key="index" :label="item.categoryName"
                :value="item.id" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="24" :lg="6">
          <el-form-item label="店铺" prop="shopId" class="w-full">
            <el-select filterable v-model="queryParams.shopId" placeholder="请选择店铺" clearable>
              <el-option v-for="(item, index) in shopList" :key="index" :label="item.shopName" :value="item.shopId" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="24" :lg="6">
          <el-form-item label="批次编号" prop="batchNo" class="w-full">
            <el-input v-model="queryParams.batchNo" placeholder="请输入批次编号" clearable @keyup.enter="handleQuery" />
          </el-form-item>
        </el-col>
        <el-col :span="24" :lg="6">
          <el-form-item label="定制SKU" prop="customSku" class="w-full">
            <el-input v-model="queryParams.customSku" placeholder="请输入定制SKU" clearable @keyup.enter="handleQuery" />
          </el-form-item>
        </el-col>
        <el-col :span="24" :lg="6">
          <el-form-item label="订单编号" prop="orderNo" class="w-full">
            <el-input v-model="queryParams.orderNo" placeholder="请输入订单编号" clearable @keyup.enter="handleQuery" />
          </el-form-item>
        </el-col>
        <el-col :span="24" :lg="6">
          <el-form-item label="订单状态" prop="orderStatus" class="w-full">
            <el-select v-model="queryParams.status" placeholder="请选择订单状态" clearable>
              <el-option
v-for="dict in getStrDictOptions(DICT_TYPE.TEMU_ORDER_BATCH_STATUS)" :key="dict.value"
                :label="dict.label" :value="dict.value" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="24" :lg="6">
          <el-form-item label="分配状态" prop="orderStatus" class="w-full">
            <el-select v-model="queryParams.isDispatchTask" placeholder="请选择分配状态" clearable>
              <el-option
v-for="dict in getStrDictOptions(DICT_TYPE.TEMU_ORDER_BATCH_DISPATCH_STATUS)" :key="dict.value"
                :label="dict.label" :value="dict.value" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="24" :lg="6">
          <el-form-item label="创建时间" prop="createTime">
            <el-date-picker
v-model="queryParams.createTime" value-format="YYYY-MM-DD HH:mm:ss" type="daterange"
              start-placeholder="开始日期" end-placeholder="结束日期"
              :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]" class="!w-220px" />
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
            <el-button type="primary" @click="handlerDispatchTask">
              <Icon icon="ep:plus" class="mr-5px" />
              分配任务
            </el-button>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <div class="mb-10px flex justify-between">
      <div class="flex flex-col">
        <div class="flex gap-2">
          <el-button type="primary" @click="handlerPrintBatchGoodsSn" plain :disabled="selectedOrders.length === 0">
            <Icon icon="ep:printer" class="mr-5px" />
            批量打印商品条码
          </el-button>
          <el-button type="warning" @click="handlerPrintBatchCompliance" plain :disabled="selectedOrders.length === 0">
            <Icon icon="ep:printer" class="mr-5px" />
            批量打印合规单
          </el-button>
          <el-button type="success" @click="handlerPrintBatchMerged" plain :disabled="selectedOrders.length === 0">
            <Icon icon="ep:printer" class="mr-5px" />
            批量打印条码+合规单
          </el-button>
          <el-button type="info" @click="handlerPrintBatchPickList" plain :disabled="selectedOrders.length === 0">
            <Icon icon="ep:document" class="mr-5px" />
            打印批次拣货单
          </el-button>
          <el-button
type="warning" @click="handlePrintSelectedOrders" plain
            :disabled="selectedInnerOrders.length === 0">
            <Icon icon="ep:printer" class="mr-5px" />
            打印选中订单条码+合规单
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
        <el-button
type="primary" @click="handlerCompleteSelectedDrawTasks" plain
          :disabled="selectedInnerOrders.length === 0" class="batch-draw-complete-btn">
          <Icon icon="ep:check" class="mr-5px" />
          批量作图完成
        </el-button>
        <el-button
type="success" @click="handleDownloadSelectedImages" plain
          :disabled="selectedInnerOrders.length === 0">
          <Icon icon="ep:picture" class="mr-5px" />
          下载选中订单图片
        </el-button>
        <el-button type="primary" @click="handlePrintBatch" plain>
          <Icon icon="ep:printer" class="mr-5px" />
          打印所有批次箱贴
        </el-button>
      </div>
    </div>
    <el-table
v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true"
      :expand-row-keys="expandedRows" height="calc(100vh - 280px)"
      :header-cell-style="{ background: 'var(--el-bg-color)' }" row-key="id" @selection-change="handlerSelectionChange"
      v-infinite-scroll="loadMore" infinite-scroll-disabled="loading" infinite-scroll-distance="10" ref="mainTableRef">
      <!--选择-->
      <el-table-column reserve-selection type="selection" width="30" align="center" />
      <el-table-column type="expand" width="90">
        <template #header>
          <el-button :type="isAllExpanded ? 'primary' : 'info'" link @click="toggleAllExpand" class="expand-all-button">
            <el-icon class="expand-icon" :class="{ 'is-expanded': isAllExpanded }">
              <ArrowDown />
            </el-icon>
            <span class="expand-text">{{ isAllExpanded ? '收起全部' : '展开全部' }}</span>
          </el-button>
        </template>
        <template #default="scope">
          <div>
            <el-table
v-loading="loading" :data="scope.row.orderList && scope.row.orderList.length > 0 ? getSortedOrderList(scope.row) : []" :stripe="true" :show-overflow-tooltip="true"
              row-key="id" :ref="(el) => {
                if (el) registerTableRef(el, scope.row.batchNo)
              }
                " @selection-change="(selection) => handleInnerSelectionChange(selection, scope.row)">
              <!--选择-->
              <el-table-column reserve-selection type="selection" width="30" align="center" />
              <!--订单编号-->
              <el-table-column
label="订单信息" align="center" prop="orderNo" min-width="280"
                class-name="order-info-column">
                <template #default="{ row }">
                  <div class="text-left">
                    <div>
                      <div class="font-bold">
                        订单号：{{ row.orderNo }}
                        <el-tag v-if="row.isReturnOrder === 1" type="danger" size="small" class="ml-2">返单</el-tag>
                      </div>
                      <div class="text-gray-500 mt-1">店铺名称：{{ row.shopName }}</div>
                    </div>
                    <div class="mt-2 flex gap-2">
                      <el-tooltip
effect="dark" content="当前商品条码尚未上传，请联系相关人员及时上传！" placement="top"
                        :disabled="!!row.goodsSn" popper-class="custom-tooltip" :show-after="100" :hide-after="200"
                        :enterable="false" :offset="20">
                        <el-button
size="small" :type="row.goodsSn ? 'primary' : 'default'" plain
                          class="print-action-button" :disabled="!row.goodsSn" @click="handlerPrintGoodsSn(row, 1)">
                          <template #icon>
                            <el-icon class="print-icon">
                              <Printer />
                            </el-icon>
                          </template>
                          打印商品条码
                        </el-button>
                      </el-tooltip>
                      <el-tooltip
effect="dark" content="当前合规单尚未上传，请联系相关人员及时上传！" placement="top"
                        :disabled="!!row.complianceUrl" popper-class="custom-tooltip" :show-after="100"
                        :hide-after="200" :enterable="false" :offset="20">
                        <el-button
size="small" :type="row.complianceUrl ? 'success' : 'default'" plain
                          class="print-action-button" :disabled="!row.complianceUrl"
                          @click="handlerPrintGoodsSn(row, 2)">
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
effect="dark" content="当前合并文件尚未上传，请联系相关人员及时上传！" placement="top"
                        :disabled="!!row.complianceGoodsMergedUrl" popper-class="custom-tooltip" :show-after="100"
                        :hide-after="200" :enterable="false" :offset="20">
                        <el-button
size="small" :type="row.complianceGoodsMergedUrl ? 'warning' : 'default'" plain
                          class="print-action-button" :disabled="!row.complianceGoodsMergedUrl"
                          @click="handlerPrintGoodsSn(row, 3)">
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
              <!-- 商品信息 -->
              <el-table-column label="商品信息" align="center" prop="productImgUrl" min-width="240">
                <template #default="{ row }">
                  <div class="text-left flex items-start gap-4">
                    <div class="flex-shrink-0">
                      <el-image
class="w-80px h-80px" :hide-on-click-modal="true" :preview-teleported="true"
                        :src="row.productImgUrl" :preview-src-list="[row.productImgUrl]" lazy :initial-index="0"
                        fit="cover" loading="lazy" />
                    </div>
                    <div class="flex-1">
                      <div class="truncate mb-2 font-bold">标题：{{ row.productTitle }}</div>
                      <!-- 商品属性 -->
                      <div class="flex items-start mb-2">
                        <div>属性:</div>
                        <div class="ml-2">{{ row.productProperties || '--' }}</div>
                      </div>
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
              <el-table-column label="定制文字" align="center" prop="customTextList" min-width="180">
                <template #default="{ row }">
                  <div class="text-center" v-if="row.customTextList">
                    <div v-for="(text, index) in row.customTextList.split(',')" :key="index" class="custom-text-item">
                      {{ text }}
                    </div>
                  </div>
                  <div v-else class="text-center">--</div>
                </template>
              </el-table-column>
              <!-- 定制图片 -->
              <el-table-column label="定制图片" align="center" prop="customImageUrls" min-width="180">
                <template #default="{ row }">
                  <div class="flex flex-wrap" v-if="row.customImageUrls">
                    <div v-for="(item, index) in row.customImageUrls.split(',')" :key="index" class="ml-2">
                      <el-image
class="w-60px h-60px" :hide-on-click-modal="true" :preview-teleported="true" :src="item + '?x-oss-process=image/resize,w_200'"
                        :preview-src-list="[item]" lazy :initial-index="0" fit="cover" loading="lazy" />
                    </div>
                  </div>
                </template>
              </el-table-column>
              <!--合成预览-->
              <el-table-column label="合成预览" align="center" prop="effectiveImgUrl" min-width="120">
                <template #default="{ row }">
                  <div class="text-left">
                    <el-image
class="w-60px h-60px" v-if="row.effectiveImgUrl" :hide-on-click-modal="true"
                      :preview-teleported="true" :preview-src-list="[row.effectiveImgUrl]" :src="row.effectiveImgUrl" />
                  </div>
                </template>
              </el-table-column>
              <!--合规单图片-->
              <el-table-column label="合规单图片" align="center" prop="complianceImageUrl" min-width="120">
                <template #default="{ row }">
                  <div class="text-left">
                    <el-image
class="w-60px h-60px" v-if="row.complianceImageUrl" :hide-on-click-modal="true"
                      :preview-teleported="true" :preview-src-list="[row.complianceImageUrl]"
                      :src="row.complianceImageUrl" />
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

              <el-table-column label="作图状态" align="center" min-width="120">
                <template #default="{ row }">
                  <div class="flex flex-col gap-2">
                    <el-tag :type="row.isCompleteDrawTask === 1 ? 'success' : 'info'" class="status-tag" size="large">
                      {{ row.isCompleteDrawTask === 1 ? '作图完成' : '作图待完成' }}
                    </el-tag>
                    <div class="task-actions" v-if="row.isCompleteDrawTask === 0">
                      <el-button
type="primary" @click="handlerCompleteOrderTask(scope.row, row, 1)"
                        class="print-action-button" plain size="small">
                        标记作图完成
                      </el-button>
                    </div>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="生产状态" align="center" min-width="120">
                <template #default="{ row }">
                  <div class="flex flex-col gap-2">
                    <el-tag
:type="row.isCompleteProducerTask === 1 ? 'success' : 'info'" class="status-tag"
                      size="large">
                      {{ row.isCompleteProducerTask === 1 ? '生产完成' : '生产待完成' }}
                    </el-tag>
                    <div class="task-actions" v-if="row.isCompleteProducerTask === 0">
                      <el-button
type="success" @click="handlerCompleteOrderTask(scope.row, row, 2)"
                        class="print-action-button" plain size="small">
                        标记生产完成
                      </el-button>
                    </div>
                  </div>
                </template>
              </el-table-column>

              <el-table-column label="订单状态/时间" align="center" min-width="200">
                <template #default="{ row }">
                  <div class="flex flex-col items-center gap-2">
                    <div class="w-[90px]">
                      <el-tag :type="getOrderStatusType(row.orderStatus)" class="status-tag" size="large">
                        {{ getOrderStatusText(row.orderStatus) }}
                      </el-tag>
                    </div>
                    <div :class="['booking-time', getTimeClass(row.bookingTime)]">
                      {{ dayjs(row.bookingTime).format('YYYY-MM-DD HH:mm:ss') }}
                    </div>
                  </div>
                </template>
              </el-table-column>

              <!--  备注-->
              <el-table-column label="备注" align="center" prop="remark" min-width="150" show-overflow-tooltip />
            </el-table>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="批次编号" align="center" prop="batchNo" min-width="280">
        <template #default="{ row }">
          <div class="batch-info">
            <div class="flex items-center gap-4">
              <div class="batch-no">{{ row.batchNo }}</div>
              <el-tag size="large" type="primary" effect="dark" class="order-count-tag">
                {{ row.orderList?.length || 0 }}个订单
              </el-tag>
            </div>
            <div class="create-time">{{ dayjs(row.createTime).format('YYYY-MM-DD HH:mm') }}</div>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="品类信息" align="center" min-width="260">
        <template #default="{ row }">
          <div class="category-info">
            <template v-if="row.orderList && row.orderList.length > 0">
              <div class="flex flex-col" style="align-items: flex-start">
                <el-tag
v-for="(category, index) in [
                  ...new Set(row.orderList.map((order) => order.categoryName))
                ]" :key="index" class="category-tag" type="info" effect="plain">
                  <span>{{ category }}</span>
                  <span class="ml-2">制作数量：<span class="color-rose-500">{{
                    row.orderList
                      .filter((order) => order.categoryName === category)
                      .reduce((acc, order) => acc + order.quantity, 0)
                      }}</span></span>
                </el-tag>
              </div>
            </template>
            <span v-else class="no-data">暂无品类信息</span>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="打印文件地址" align="center" prop="fileUrl" min-width="140">
        <template #default="{ row }">
          <div class="font-bold flex item-center justify-center flex-wrap" v-if="row.fileUrl">
            <a :href="row.fileUrl" :download="row.fileUrl" class="mb-2">
              <el-button type="success" plain size="small" class="action-button">
                <Icon icon="ep:download" class="mr-5px" />
                下载作图文件
              </el-button>
            </a>

            <el-button
v-if="row.status === 0" type="primary" plain size="small" @click="handlerHandleUpload(row)"
              class="action-button ml-2">
              <Icon icon="ep:upload" class="mr-5px" />
              重新上传文件
            </el-button>
          </div>
          <div class="font-bold" v-else>
            <el-button type="primary" plain size="small" @click="handlerHandleUpload(row)" class="action-button">
              <Icon icon="ep:upload" class="mr-5px" />
              上传作图文件
            </el-button>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="定制图片（一键下载）" align="center" min-width="140">
        <template #default="{ row }">
          <div class="flex justify-center mt-2">
            <el-button type="success" plain size="small" @click="handleDownloadCustomImages(row)" class="action-button">
              <Icon icon="ep:picture" class="mr-5px" />
              下载定制图片
            </el-button>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="订单状态" align="center" prop="orderStatus" min-width="90">
        <template #default="{ row }">
          <dict-tag :type="DICT_TYPE.TEMU_ORDER_BATCH_STATUS" :value="row.status" class="batch-status-tag" />
        </template>
      </el-table-column>
      <el-table-column label="任务分配状态" align="center" min-width="90">
        <template #default="{ row }">
          <dict-tag
:type="DICT_TYPE.TEMU_ORDER_BATCH_DISPATCH_STATUS" :value="row.isDispatchTask"
            class="batch-status-tag" />
        </template>
      </el-table-column>

      <el-table-column label="任务负责人" align="left" min-width="80">
        <template #default="{ row }">
          <div v-if="row.isDispatchTask === 1">
            <template v-if="row.userList && row.userList.length > 0">
              <!-- 先显示作图人员 -->
              <div v-if="row.userList.find(item => item.type === 1)">
                <span>作图:</span>
                <span>{{row.userList.find(item => item.type === 1)?.nickName}}</span>
              </div>
              <!-- 再显示生产人员 -->
              <div v-if="row.userList.find(item => item.type === 2)">
                <span>生产:</span>
                <span>{{row.userList.find(item => item.type === 2)?.nickName}}</span>
              </div>
            </template>
          </div>
        </template>
      </el-table-column>
      <!-- 任务进度列 -->
      <el-table-column label="任务进度" align="center" min-width="250">
        <template #default="{ row }">
          <div class="progress-bars">
            <div class="progress-item">
              <div class="flex justify-between mb-1">
                <span class="text-sm">作图进度</span>
                <span class="text-sm">{{row.orderList?.filter(order => order.isCompleteDrawTask === 1).length || 0
                }}/{{ row.orderList?.length || 0 }}</span>
              </div>
              <el-progress
:percentage="calculateProgress(row.orderList, 'draw')" :stroke-width="8"
                :color="progressColor(calculateProgress(row.orderList, 'draw'))" :show-text="false" />
            </div>
            <div class="progress-item mt-2">
              <div class="flex justify-between mb-1">
                <span class="text-sm">生产进度</span>
                <span class="text-sm">{{row.orderList?.filter(order => order.isCompleteProducerTask === 1).length || 0
                }}/{{ row.orderList?.length || 0 }}</span>
              </div>
              <el-progress
:percentage="calculateProgress(row.orderList, 'production')" :stroke-width="8"
                :color="progressColor(calculateProgress(row.orderList, 'production'))" :show-text="false" />
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" width="120" :show-overflow-tooltip="true" />
      <el-table-column label="操作" align="center" width="120px" fixed="right">
        <template #default="scope">
          <div class="flex justify-center" v-if="scope.row.status === 0">
            <el-popconfirm title="是否确认完成订单?" placement="top-start" @confirm="handleUpdateBathchStatus(scope.row)">
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
:total="total" v-model:page="queryParams.pageNo" v-model:limit="queryParams.pageSize"
      :page-sizes="[1, 3, 5, 10, 20]" :default-page-size="5" @pagination="handlePaginationChange" />
  </ContentWrap>
  <!--修改备注-->
  <OrderRemarkPopup @confirm="handlerRemarkConfirm" ref="orderRemarkPopup" />
  <!--分配任务 -->
  <OrderBatchTaskDispatchPopup
v-if="orderBatchTaskDispatchVisible" ref="orderBatchTaskDispatchPopup"
    @confirm="handlerDispatchTaskConfirm" @close="orderBatchTaskDispatchVisible = false" />
</template>

<script setup lang="ts">
import { dateFormatter } from '@/utils/formatTime'
import { OrderBatchApi, OrderBatchVO } from '@/api/temu/order-batch'
import { TemuCommonApi } from '@/api/temu/common'
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
import { ElImageViewer } from 'element-plus'

defineOptions({ name: 'BatchOrderPopup' })
const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

// 状态变量
const categoryList = ref<any[]>([])
const shopList = ref<any[]>([])
const loading = ref(true) // 列表的加载中
const list = ref<OrderBatchVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const selectedOrders = ref<OrderVO[]>([]) // 选中的订单
const selectedRows = ref<OrderBatchVO[]>([]) // 选中的批次
const batchSelections = ref<Map<string, OrderVO[]>>(new Map()) // 每个批次的选择状态
const tableRefs = ref<Map<string, any>>(new Map()) // 存储表格引用
const expandedRows = ref<string[]>([]) // 存储展开的行
const isAllExpanded = ref(false) // 是否全部展开
const mainTableRef = ref() // 主表格引用

// 计算进度条颜色
const progressColor = (percentage: number) => {
  if (percentage === 0) {
    return '#909399'  // 灰色
  } else if (percentage === 100) {
    return '#67c23a'  // 绿色
  } else {
    return '#e6a23c'  // 橙色
  }
}

// 计算进度
const calculateProgress = (orderList: any[], type: 'draw' | 'production') => {
  if (!orderList || orderList.length === 0) {
    return 0
  }

  const total = orderList.length
  let completed = 0

  if (type === 'draw') {
    completed = orderList.filter(order => order.isCompleteDrawTask === 1).length
  } else {
    completed = orderList.filter(order => order.isCompleteProducerTask === 1).length
  }

  return Math.round((completed / total) * 100)
}

// 查询参数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  batchNo: undefined as string | undefined,
  customSku: undefined as string | undefined,
  status: undefined as boolean | undefined,
  isDispatchTask: undefined as boolean | undefined,
  createTime: [] as string[],
  shopId: undefined,
  categoryId: undefined,
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
// 获取店铺列表
const getShopList = async () => {
  const data = await TemuCommonApi.getShopList()
  shopList.value = data.list
}
//获取分类列表
const getProductCategoryList = async () => {
  const data = await TemuCommonApi.getProductCategoryList()
  categoryList.value = data.list
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
  selectedInnerOrders.value = allSelected
}

/** 清除所有选择 */
const clearAllSelections = () => {
  // 清除选择记录
  selectedOrders.value = []
  selectedRows.value = []

  // 使用表格ref清除选择
  if (mainTableRef.value) {
    mainTableRef.value.clearSelection()
  }
}

/** 清除内部选中的订单 */
const clearSelectedInnerOrders = () => {
  // 遍历所有表格引用，清除选择
  tableRefs.value.forEach((tableRef) => {
    if (tableRef && tableRef.clearSelection) {
      tableRef.clearSelection()
    }
  })

  // 清空选中记录
  batchSelections.value.clear()
  selectedInnerOrders.value = []
}

const handlerCompleteOrderTask = async (scope, row, taskType) => {
  try {
    await OrderBatchApi.completeOrderTaskByAdmin({
      taskType,
      id: scope.id,
      orderId: row.id
    })
    // 直接更新对应的任务状态
    if (taskType === 1) {
      row.isCompleteDrawTask = 1
    } else if (taskType === 2) {
      row.isCompleteProducerTask = 1
    }
    ElMessage.success('操作成功')
  } catch (error) {
    ElMessage.error('操作失败：' + error.message)
  }
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
    // 默认不展开任何行
    expandedRows.value = []
    isAllExpanded.value = false

    // 清除选中状态（在数据重新加载后）
    nextTick(() => {
      // 清除主表格选择
      clearAllSelections()
      // 清除内部选中的订单
      clearSelectedInnerOrders()
      // 清除选择记录
      batchSelections.value.clear()
    })
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
    // 移除对文件上传的检查，允许在没有上传作图文件的情况下也能完成批次
    // if (!row.fileUrl) {
    //   message.warning('请先上传文件!')
    //   return
    // }
    if (row.status == 1) {
      message.warning('该订单已完成生产!')
      return
    }
    await OrderBatchApi.updateOrderBatchStatus({ id: row.id })
    row.status = true
    message.success('操作成功')
    // 刷新列表
    await getList()
  } catch { }
}

// 首先添加一个图片格式转换的工具函数
const convertToPng = (blob: Blob): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    // 创建图片对象
    const img = new Image();
    img.onload = () => {
      // 创建 canvas
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;

      // 在 canvas 上绘制图片
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      // 将 canvas 内容转换为 PNG blob
      canvas.toBlob((pngBlob) => {
        if (pngBlob) {
          resolve(pngBlob);
        } else {
          reject(new Error('Failed to convert image to PNG'));
        }
      }, 'image/png');
    };

    // 处理加载错误
    img.onerror = () => reject(new Error('Failed to load image'));

    // 从 blob 创建临时 URL
    img.src = URL.createObjectURL(blob);
  });
};

// 修改后的 handleDownloadCustomImages 函数
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
    let successCount = 0
    let failCount = 0

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
          .then(async (blob) => {
            try {
              // 转换图片为 PNG 格式
              const pngBlob = await convertToPng(blob)

              // 构建文件名（统一使用 .png 扩展名）
              const categoryInfo = order.categoryName ? `_${order.categoryName}` : ''
              const makeQuantity = order.quantity ? `_制作：${order.quantity}` : ''
              const originalQuantity = order.originalQuantity ? `_官网：${order.originalQuantity}` : ''
              const fileName = `订单${orderIndex + 1}_${order.orderNo}_图片${imgIndex + 1}${categoryInfo}${makeQuantity}${originalQuantity}.png`

              // 将转换后的 PNG 图片添加到 ZIP
              zip.file(fileName, pngBlob)
              successCount++
            } catch (error) {
              console.error(`Error converting image to PNG: ${url}`, error)
              failCount++
            }
          })
          .catch((error) => {
            console.error(`Error processing image ${url}:`, error)
            failCount++
          })

        promises.push(promise)
      })
    })

    if (!hasImages) {
      message.warning('没有找到可下载的定制图片！')
      loading.value = false
      return
    }

    await Promise.all(promises)

    // 生成并下载 ZIP 文件
    const content = await zip.generateAsync({ type: 'blob' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(content)
    link.download = `${row.batchNo}_定制图片.zip`
    link.click()

    // 清理资源
    URL.revokeObjectURL(link.href)

    // 显示转换结果
    if (failCount > 0) {
      message.warning(`成功转换${successCount}张图片，${failCount}张图片转换失败`)
    } else {
      message.success(`成功转换并打包${successCount}张图片`)
    }
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
      orderBatchTaskDispatchPopup.value.formData.orderIds = selectedRows.value.map((item: any) =>
        String(item.id)
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
    const ordersWithoutGoodsSn = selectedOrders.value.filter((order) => !order.goodsSn)
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
        .map(
          ([shopName, skus]) => `
          <div style="margin-bottom: 16px;">
            <div style="color: #606266; font-weight: bold; margin-bottom: 8px;">${shopName}</div>
            <div style="padding-left: 16px;">
              ${skus
              .map(
                (sku) => `
                <div style="color: #409EFF; margin-bottom: 4px;">
                  ${sku}
                </div>
              `
              )
              .join('')}
            </div>
          </div>
        `
        )
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
        customClass: 'custom-notification'
      })
      return
    }

    // 创建一个新的PDF文档
    const mergedPdf = await PDFDocument.create()
    let successCount = 0
    let failCount = 0

    // 加载并合并所有PDF文件
    for (const order of selectedOrders.value) {
      if (!order.goodsSn) continue
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
    ElMessage.error(
      '批量打印商品条码失败：' + (error instanceof Error ? error.message : '未知错误')
    )
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
    const ordersWithoutCompliance = selectedOrders.value.filter((order) => !order.complianceUrl)
    if (ordersWithoutCompliance.length > 0) {
      // 按店铺分组并去重SKC
      const groupedByShop = ordersWithoutCompliance.reduce((acc, order) => {
        const shopName = order.shopName || '未知店铺'
        if (!acc[shopName]) {
          acc[shopName] = new Map()
        }
        if (order.skc) {
          if (!acc[shopName].has(order.skc)) {
            acc[shopName].set(order.skc, new Set())
          }
          if (order.customSku) {
            acc[shopName].get(order.skc).add(order.customSku)
          }
        }
        return acc
      }, {})

      // 生成HTML
      const missingInfo = Object.entries(groupedByShop)
        .map(([shopName, skcMap]) => {
          return `
            <div style="margin-bottom: 16px;">
              <div style="color: #606266; font-weight: bold; margin-bottom: 8px;">${shopName}</div>
              <div style="padding-left: 16px;">
                ${Array.from(skcMap.entries())
                  .map(
                    ([skc, skuSet]) => `
                      <div style="color: #409EFF; margin-bottom: 4px;">
                        <div><strong>SKC：</strong>${skc}</div>
                        <div style="margin-left: 12px; color: #606266;">
                          <strong>定制SKU：</strong>
                          ${Array.from(skuSet).join('、') || '--'}
                        </div>
                      </div>
                    `
                  )
                  .join('')}
              </div>
            </div>
          `
        })
        .join('')

      ElNotification({
        title: '无法批量打印',
        message: `
          <div style="margin-bottom: 10px; color: #303133;">以下SKC缺少合规单，请联系相关人员及时补充：</div>
          <div style="max-height: 300px; overflow-y: auto; padding-right: 10px;">${missingInfo}</div>
        `,
        type: 'warning',
        duration: 0,
        dangerouslyUseHTMLString: true,
        offset: 60
      })
      return
    }

    // 创建一个新的PDF文档
    const mergedPdf = await PDFDocument.create()
    let successCount = 0
    let failCount = 0

    // 加载并合并所有PDF文件
    for (const order of selectedOrders.value) {
      if (!order.complianceUrl) continue
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
    const ordersWithoutMerged = selectedOrders.value.filter(
      (order) => !order.complianceGoodsMergedUrl
    )
    if (ordersWithoutMerged.length > 0) {
      // 按店铺分组并去重SKC
      const groupedByShop = ordersWithoutMerged.reduce((acc, order) => {
        const shopName = order.shopName || '未知店铺'
        if (!acc[shopName]) {
          acc[shopName] = new Set()
        }
        if (order.skc) {
          acc[shopName].add(order.skc)
        }
        return acc
      }, {})

      const missingInfo = Object.entries(groupedByShop)
        .map(
          ([shopName, skcs]) => `
          <div style="margin-bottom: 16px;">
            <div style="color: #606266; font-weight: bold; margin-bottom: 8px;">${shopName}</div>
            <div style="padding-left: 16px;">
              ${Array.from(skcs)
              .map(
                (skc) => `
                <div style="color: #409EFF; margin-bottom: 4px;">
                  ${skc}
                </div>
              `
              )
              .join('')}
            </div>
          </div>
        `
        )
        .join('')

      ElNotification({
        title: '无法批量打印',
        message: `
          <div style="margin-bottom: 10px; color: #303133;">以下SKC缺少合并文件，请联系相关人员及时补充：</div>
          <div style="max-height: 300px; overflow-y: auto; padding-right: 10px;">${missingInfo}</div>
        `,
        type: 'warning',
        duration: 0,
        dangerouslyUseHTMLString: true,
        offset: 60
      })
      return
    }

    // 创建一个新的PDF文档
    const mergedPdf = await PDFDocument.create()
    let successCount = 0
    let failCount = 0

    // 加载并合并所有PDF文件
    for (const order of selectedOrders.value) {
      if (!order.complianceGoodsMergedUrl) continue
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
    ElMessage.error(
      '批量打印合并文件失败：' + (error instanceof Error ? error.message : '未知错误')
    )
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

/** 打印批次拣货单 **/
const handlerPrintBatchPickList = () => {
  if (!selectedOrders.value || selectedOrders.value.length === 0) {
    ElMessage.warning('请先选择要打印的订单')
    return
  }

  // 每页显示的订单数量
  const ORDERS_PER_PAGE = 7

  // 按照页面显示顺序获取选中的批次
  const selectedBatchesInOrder = list.value.filter((batch) =>
    selectedRows.value.some((selected) => selected.id === batch.id)
  )

  // 生成打印内容
  const printContent = selectedBatchesInOrder
    .map((batch) => {
      // 获取当前批次的订单
      const orders =
        batch.orderList?.filter((order) =>
          selectedOrders.value.some((selected) => selected.id === order.id)
        ) || []

      if (orders.length === 0) return ''

      const totalQuantity = orders.reduce((sum, order) => sum + (order.originalQuantity || 0), 0)
      const totalPages = Math.ceil(orders.length / ORDERS_PER_PAGE)

      // 将订单分页
      const pages = []
      for (let i = 0; i < orders.length; i += ORDERS_PER_PAGE) {
        const pageOrders = orders.slice(i, i + ORDERS_PER_PAGE)
        const currentPage = Math.floor(i / ORDERS_PER_PAGE) + 1
        const isLastPage = currentPage === totalPages

        // 生成当前页的订单列表HTML
        const ordersHtml = pageOrders
          .map(
            (order, index) => `
            <tr>
              <td style="text-align: center; vertical-align: middle;">${i + index + 1}</td>
              <td style="vertical-align: top;">
                <div style="margin-bottom: 4px;"><strong>订单编号：</strong>${order.orderNo || '--'}</div>
                <div style="margin-bottom: 4px;"><strong>店铺名称：</strong>${order.shopName || '--'}</div>
                <div style="margin-bottom: 4px;"><strong>SKC：</strong>${order.skc || '--'}</div>
                <div style="margin-bottom: 4px;"><strong>SKU：</strong>${order.sku || '--'}</div>
                <div><strong>创建时间：</strong>${dayjs(order.bookingTime).format('YYYY-MM-DD HH:mm:ss')}</div>
              </td>
              <td style="vertical-align: top; text-align: left;">
                <div style="margin-bottom: 8px; font-weight: bold; font-size: 14px;">${order.customSku || '--'}</div>
                <div style="white-space: pre-wrap; font-size: 12px;">${order.productProperties || '--'}</div>
              </td>
              <td style="vertical-align: top;">
                <div style="margin-bottom: 4px;">
                  <strong>定制文字：</strong>
                  <div style="white-space: pre-wrap; font-size: 12px;">${order.customTextList || '--'}</div>
                </div>
                <div style="display: flex; gap: 10px; align-items: flex-start;">
                  ${order.customImageUrls
                ? `
                  <div>
                    <strong>定制图片：</strong>
                    <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px;">
                      ${order.customImageUrls
                  .split(',')
                  .map(
                    (url) => `
                        <img src="${url}" style="width: 40px; height: 40px; object-fit: contain; border: 1px solid #ddd;">
                      `
                  )
                  .join('')}
                    </div>
                  </div>
                  `
                : ''
              }
                  ${order.effectiveImgUrl
                ? `
                  <div>
                    <strong>合成预览：</strong>
                    <div style="margin-top: 4px;">
                      <img src="${order.effectiveImgUrl}" style="width: 50px; height: 50px; object-fit: contain; border: 1px solid #ddd;">
                    </div>
                  </div>
                  `
                : ''
              }
                </div>
              </td>
              <td style="text-align: center; vertical-align: middle;">${order.originalQuantity || 0}</td>
            </tr>
          `
          )
          .join('')

        pages.push(`
          <div class="pick-list-page">
            <div class="pick-list-header">
              <h1 style="margin: 0; padding: 10px 0; font-size: 20px; text-align: center;">批次拣货单</h1>
              <div style="margin: 10px 0; font-size: 14px; display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; align-items: center;">
                  <strong style="font-size: 16px;">批次编号：${batch.batchNo}</strong>
                  <span style="margin-left: 15px;">第 ${currentPage} 页 / 共 ${totalPages} 页</span>
                </div>
                <div>打印时间：${dayjs().format('YYYY-MM-DD HH:mm:ss')}</div>
              </div>
            </div>

            <div class="pick-list-content">
              <table class="pick-list-table">
                <thead>
                  <tr>
                    <th style="width: 40px; text-align: center;">序号</th>
                    <th style="width: 200px;">商品信息</th>
                    <th style="width: 150px; text-align: left;">定制SKU/属性</th>
                    <th style="width: 300px;">定制内容</th>
                    <th style="width: 60px; text-align: center;">官方数量</th>
                  </tr>
                </thead>
                <tbody>
                  ${ordersHtml}
                </tbody>
                ${isLastPage
            ? `
                <tfoot>
                  <tr>
                    <td colspan="4" style="text-align: right;"><strong>总数量：</strong></td>
                    <td style="text-align: center;"><strong>${totalQuantity}</strong></td>
                  </tr>
                </tfoot>
                `
            : ''
          }
              </table>
            </div>

            ${isLastPage
            ? `
            <div class="pick-list-footer">
              <div style="display: flex; justify-content: space-between; padding: 0 40px;">
                <div>拣货人：____________</div>
                <div>复核人：____________</div>
                <div>日期：____________</div>
              </div>
            </div>
            `
            : ''
          }
          </div>
        `)
      }

      return pages.join('')
    })
    .join('')

  // 使用print-js打印
  printJS({
    printable: printContent,
    type: 'raw-html',
    style: `
      @page {
        size: A4;
        margin: 1.5cm 1cm;
      }
      @media print {
        body {
          margin: 0;
          padding: 0;
        }
        .pick-list-page {
          page-break-after: always;
          min-height: auto;
          box-sizing: border-box;
          position: relative;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
        }
        .pick-list-page:last-child {
          page-break-after: avoid;
        }
        .pick-list-header {
          margin-bottom: 15px;
          padding: 10px 0;
        }
        .pick-list-content {
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        .pick-list-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 15px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
          table-layout: fixed;
        }
        th {
          background-color: #f8f8f8 !important;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        th, td {
          border: 1px solid #000;
          padding: 6px;
          text-align: left;
          word-wrap: break-word;
          overflow-wrap: break-word;
        }
        tbody tr:nth-child(even) {
          background-color: #fafafa;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .pick-list-footer {
          margin-top: auto;
          padding: 20px 0;
        }
        tr {
          page-break-inside: avoid;
        }
      }
    `
  })
}

/** 初始化 **/
onMounted(() => {
  getList()
  getShopList()
  getProductCategoryList()
})

/** 切换全部展开/收起状态 */
const toggleAllExpand = () => {
  if (isAllExpanded.value) {
    expandedRows.value = []
  } else {
    expandedRows.value = list.value.map((item) => String(item.id))
  }
  isAllExpanded.value = !isAllExpanded.value
}

const getTimeClass = (time: string) => {
  const hour = dayjs(time).hour()
  return hour < 12 ? 'morning-time' : 'afternoon-time'
}

const selectedInnerOrders = ref<OrderVO[]>([]) // 选中的内部订单

/** 批量打印选中的订单条码+合规单 */
const handlePrintSelectedOrders = async () => {
  if (!selectedInnerOrders.value || selectedInnerOrders.value.length === 0) {
    ElMessage.warning('请先选择要打印的订单')
    return
  }

  try {
    // 检查是否有订单的合并文件为空
    const ordersWithoutMerged = selectedInnerOrders.value.filter(
      (order) => !order.complianceGoodsMergedUrl
    )
    if (ordersWithoutMerged.length > 0) {
      // 按店铺分组并去重SKC
      const groupedByShop = ordersWithoutMerged.reduce((acc, order) => {
        const shopName = order.shopName || '未知店铺'
        if (!acc[shopName]) {
          acc[shopName] = new Set()
        }
        if (order.skc) {
          acc[shopName].add(order.skc)
        }
        return acc
      }, {})

      const missingInfo = Object.entries(groupedByShop)
        .map(
          ([shopName, skcs]) => `
          <div style="margin-bottom: 16px;">
            <div style="color: #606266; font-weight: bold; margin-bottom: 8px;">${shopName}</div>
            <div style="padding-left: 16px;">
              ${Array.from(skcs)
              .map(
                (skc) => `
                <div style="color: #409EFF; margin-bottom: 4px;">
                  ${skc}
                </div>
              `
              )
              .join('')}
            </div>
          </div>
        `
        )
        .join('')

      ElNotification({
        title: '无法批量打印',
        message: `
          <div style="margin-bottom: 10px; color: #303133;">以下SKC缺少合并文件，请联系相关人员及时补充：</div>
          <div style="max-height: 300px; overflow-y: auto; padding-right: 10px;">${missingInfo}</div>
        `,
        type: 'warning',
        duration: 0,
        dangerouslyUseHTMLString: true,
        offset: 60
      })
      return
    }

    // 创建一个新的PDF文档
    const mergedPdf = await PDFDocument.create()
    let successCount = 0
    let failCount = 0

    // 加载并合并所有PDF文件
    for (const order of selectedInnerOrders.value) {
      if (!order.complianceGoodsMergedUrl) continue
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
    ElMessage.error(
      '批量打印合并文件失败：' + (error instanceof Error ? error.message : '未知错误')
    )
  }
}

// 添加虚拟滚动相关变量
const finished = ref(false)
const pageSize = ref(10)
const currentPage = ref(1)

// 优化图片加载
const imageOptions = {
  lazy: true,
  loading: 'lazy',
  fit: 'cover',
  initialIndex: 0,
  previewTeleported: true,
  hideOnClickModal: true
}

// 优化数据加载
const loadMore = async () => {
  if (loading.value || finished.value) return

  loading.value = true
  try {
    const params = {
      ...queryParams,
      pageNo: currentPage.value,
      pageSize: pageSize.value
    }

    const data = await OrderBatchApi.getOrderBatchPage(params)

    if (data.list.length < pageSize.value) {
      finished.value = true
    }

    list.value = [...list.value, ...data.list]
    currentPage.value++
  } catch (error) {
    console.error('加载更多数据失败:', error)
  } finally {
    loading.value = false
  }
}

// 优化图片预览
const handleImagePreview = (url: string) => {
  if (!url) return
  const img = new Image()
  img.src = url
  img.onload = () => {
    // 图片加载完成后再显示预览
    ElImageViewer({
      urlList: [url],
      initialIndex: 0,
      onClose: () => {
        // 清理资源
        img.src = ''
      }
    })
  }
}

/** 下载选中订单的定制图片 */
const handleDownloadSelectedImages = async () => {
  if (!selectedInnerOrders.value || selectedInnerOrders.value.length === 0) {
    ElMessage.warning('请先选择要下载图片的订单')
    return
  }

  try {
    loading.value = true
    const zip = new JSZip()
    const promises: Promise<void>[] = []
    let hasImages = false

    // 遍历所有选中的订单
    selectedInnerOrders.value.forEach((order: any, orderIndex: number) => {
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
            // 添加品类信息、制作数量和官网数量到文件名
            const categoryInfo = order.categoryName ? `_${order.categoryName}` : ''
            const makeQuantity = order.quantity ? `_制作：${order.quantity}` : ''
            const originalQuantity = order.originalQuantity ? `_官网：${order.originalQuantity}` : ''
            const fileName = `订单${orderIndex + 1}_${order.orderNo}_图片${imgIndex + 1}${categoryInfo}${makeQuantity}${originalQuantity}.${extension}`
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
    link.download = `选中订单定制图片_${dayjs().format('YYYYMMDDHHmmss')}.zip`
    link.click()

    // 释放URL对象
    URL.revokeObjectURL(link.href)
    message.success('选中订单定制图片打包下载成功！')

    // 清除选中状态
    clearSelectedInnerOrders()
  } catch (error) {
    console.error('下载定制图片失败:', error)
    message.error('下载定制图片失败，请重试！')
  } finally {
    loading.value = false
  }
}

/** 批量完成选中订单的作图任务 */
const handlerCompleteSelectedDrawTasks = async () => {
  // 检查是否有选中的订单
  if (!selectedInnerOrders.value || selectedInnerOrders.value.length === 0) {
    ElMessage.warning('请先选择要标记作图完成的订单')
    return
  }

  try {
    // 仅过滤未完成的订单
    const unfinishedOrders = selectedInnerOrders.value.filter(order => order.isCompleteDrawTask === 0)
    
    if (unfinishedOrders.length === 0) {
      ElMessage.warning('所选订单均已完成作图任务')
      return
    }

    // 确认操作
    try {
      await ElMessageBox.confirm(
        `确定要将 ${unfinishedOrders.length} 个选中订单标记为作图完成吗？`, 
        '确认操作', 
        {
          confirmButtonText: '确认',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
    } catch (e) {
      // 用户取消操作
      return
    }
    
    // 显示操作进行中的提示（不阻塞界面）
    const processingMessage = ElMessage({
      message: `正在处理 ${unfinishedOrders.length} 个订单，请稍候...`,
      type: 'info',
      duration: 0,
      showClose: true
    })
    
    // 禁用按钮，避免重复操作
    const btnDisabled = ref(true)
    setTimeout(() => {
      const btn = document.querySelector('.batch-draw-complete-btn')
      if (btn) btn.setAttribute('disabled', 'disabled')
    }, 0)
    
    // 处理结果计数
    let successCount = 0
    let failCount = 0
    
    // 逐个处理订单
    for (const order of unfinishedOrders) {
      // 查找订单所属的批次
      const batch = list.value.find(b => 
        b.orderList && b.orderList.some(o => o.id === order.id)
      )
      
      if (!batch) {
        failCount++
        continue
      }
      
      try {
        // 调用API标记作图完成
        await OrderBatchApi.completeOrderTaskByAdmin({
          taskType: 1, // 1表示作图任务
          id: batch.id,
          orderId: order.id
        })
        
        // 更新本地数据状态
        order.isCompleteDrawTask = 1
        successCount++
      } catch (err) {
        failCount++
      }
    }
    
    // 关闭处理中的提示
    processingMessage.close()
    
    // 显示结果
    if (failCount > 0 && successCount > 0) {
      ElMessage.warning(`已完成${successCount}个订单标记，${failCount}个订单失败`)
    } else if (failCount > 0) {
      ElMessage.error('操作失败，请稍后重试')
    } else {
      ElMessage.success(`成功标记${successCount}个订单作图完成`)
    }
    
    // 清除勾选状态
    if (successCount > 0) {
      // 清除内部表格的选择
      clearSelectedInnerOrders()
    }
    
    // 恢复按钮状态
    setTimeout(() => {
      const btn = document.querySelector('.batch-draw-complete-btn')
      if (btn) btn.removeAttribute('disabled')
    }, 0)
    
  } catch (error) {
    // 出错时也关闭提示
    ElMessage.closeAll()
    
    ElMessage.error('批量标记作图完成失败，请重试')
    console.error('批量标记作图完成失败:', error)
    
    // 清除勾选状态
    clearSelectedInnerOrders()
    
    // 恢复按钮状态
    setTimeout(() => {
      const btn = document.querySelector('.batch-draw-complete-btn')
      if (btn) btn.removeAttribute('disabled')
    }, 0)
  } 
  // 不需要finally块了
}

/** 分页改变 */
const handlePaginationChange = () => {
  // 清除主表格选择
  clearAllSelections()
  getList()
}

/** 获取排序后的订单列表 */
const getSortedOrderList = (batch) => {
  // 特定尺寸的贴纸(酒标)列表
  const SPECIAL_STICKER_SIZES = [
    '贴纸(酒标)18cm*8.7cm*0.2cm',
    '贴纸(酒标)16cm*6.3cm*0.2cm',
    '贴纸(酒标)8.5cm*5cm*0.2cm',
    '贴纸(酒标)5.7cm*1.7cm*0.2cm'
  ];

  // 检查批次是否包含特定尺寸的贴纸(酒标)或贺卡
  const hasSpecialSticker = batch.orderList.some(order => 
    order.categoryName && SPECIAL_STICKER_SIZES.includes(order.categoryName)
  );
  const hasGreetingCard = batch.orderList.some(order => 
    order.categoryName && order.categoryName.includes('贺卡')
  );
  
  // 如果批次包含特定尺寸的贴纸(酒标)或贺卡订单，需要分开处理
  if (hasSpecialSticker || hasGreetingCard) {
    // 将订单分为三组：特定尺寸贴纸订单、贺卡订单和其他订单
    const stickerOrders = batch.orderList.filter(order => 
      order.categoryName && SPECIAL_STICKER_SIZES.includes(order.categoryName)
    );
    
    const greetingCardOrders = batch.orderList.filter(order => 
      order.categoryName && order.categoryName.includes('贺卡')
    );
    
    const otherOrders = batch.orderList.filter(order => 
      !order.categoryName || 
      (!SPECIAL_STICKER_SIZES.includes(order.categoryName) && !order.categoryName.includes('贺卡'))
    );
    
    // 特定尺寸贴纸订单和贺卡订单按返单状态和制作数量排序
    const sortByReturnAndQuantity = (orders) => {
      return [...orders].sort((a, b) => {
        // 先按返单状态排序
        const returnOrderDiff = (a.isReturnOrder === 1 ? -1 : 0) - (b.isReturnOrder === 1 ? -1 : 0);
        if (returnOrderDiff !== 0) return returnOrderDiff;
        
        // 再按制作数量从小到大排序
        return (a.quantity || 0) - (b.quantity || 0);
      });
    };

    const sortedStickerOrders = sortByReturnAndQuantity(stickerOrders);
    const sortedGreetingCardOrders = sortByReturnAndQuantity(greetingCardOrders);
    
    // 其他订单只按返单状态排序
    const sortedOtherOrders = [...otherOrders].sort((a, b) => 
      (a.isReturnOrder === 1 ? -1 : 0) - (b.isReturnOrder === 1 ? -1 : 0)
    );
    
    // 合并所有订单，特定尺寸贴纸订单和贺卡订单排在前面
    return [...sortedStickerOrders, ...sortedGreetingCardOrders, ...sortedOtherOrders];
  }
  
  // 其他批次保持原有的返单优先排序逻辑
  return [...batch.orderList].sort((a, b) => 
    (a.isReturnOrder === 1 ? -1 : 0) - (b.isReturnOrder === 1 ? -1 : 0)
  );
}

// 在 script 部分添加处理函数
const handleCategorySearch = (query: string) => {
  if (!query) return;

  // 找到所有匹配的类目
  const matchedCategories = categoryList.value.filter(item =>
    item.categoryName.toLowerCase().includes(query.toLowerCase())
  );

  // 获取匹配类目的 ID 列表
  const matchedIds = matchedCategories.map(item => item.id);

  // 将匹配的类目 ID 添加到已选中的列表中
  queryParams.categoryId = Array.from(new Set([...queryParams.categoryId || [], ...matchedIds]));
}

</script>

<style lang="scss" scoped>
// ... existing code ...
.task-status {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin: 8px 0;

  .el-tag {
    width: fit-content;
    margin: 0 auto;
    font-size: 13px;
    padding: 4px 8px;
  }
}

.task-actions {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 4px;

  .el-button {
    width: fit-content;
    margin: 0 auto;
    font-size: 13px;
    padding: 4px 12px;
  }
}

// ... existing code ...
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
  min-width: 90px;

  // 待下单状态
  &.el-tag--info {
    background: #c3c5c7;
    border: 1px solid #c3c5c7;
    color: white;
  }

  // 已下单待送产状态
  &.el-tag--primary {
    background: #e0f2fe;
    border: 1px solid #e0f2fe;
    color: #082f49;

    &::before {
      content: '';
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: #0ea5e9;
      margin-right: 8px;
      animation: pulse 1s infinite;
    }
  }

  // 已送产待生产状态
  &.el-tag--warning {
    background: #e0e7ff;
    border: 1px solid #e0e7ff;
    color: #1e1b4b;

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

  // 已生产待发货状态
  &.el-tag--process {
    background: #5da2e7;
    border: 1px solid #75bdec;
    color: #fff;

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

  // 已发货状态
  &.el-tag--success {
    background: #75c945;
    border: 1px solid #73d13d;
    color: #fff;

    &::before {
      content: '✓';
      margin-right: 4px;
      font-weight: bold;
    }
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

// ... existing code ...

.print-action-button {
  min-width: 80px !important;
  height: 26px;
  font-size: 12px;
  padding: 0 8px;
}

// ... existing code ...

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
  gap: 8px;
  padding: 4px;

  .batch-no {
    font-size: 18px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    transition: all 0.3s ease;

    &:hover {
      opacity: 0.8;
    }
  }

  .create-time {
    font-size: 14px;
    color: var(--el-text-color-secondary);
  }

  // 进度条样式
  .progress-bars {
    padding: 8px;

    .progress-item {
      .text-sm {
        color: var(--el-text-color-secondary);
        font-size: 13px;
        min-width: 60px;
      }

      :deep(.el-progress) {
        width: 100%;
        margin-left: 4px;
      }

      :deep(.el-progress-bar__outer) {
        border-radius: 4px;
        background-color: var(--el-fill-color-dark);
      }

      :deep(.el-progress-bar__inner) {
        border-radius: 4px;
        transition: all 0.3s ease;
      }

      :deep(.el-progress__text) {
        font-size: 12px !important;
        min-width: 35px;
      }
    }
  }
}

.order-count-tag {
  font-size: 16px;
  font-weight: 600;
  padding: 8px 16px;
  border-radius: 6px;
  background: linear-gradient(135deg, var(--el-color-primary) 0%, var(--el-color-primary-light-3) 100%);
  border: none;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.25);
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 100px;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent);
    transform: translateX(-100%);
    transition: transform 0.6s ease;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(64, 158, 255, 0.35);

    &::before {
      transform: translateX(100%);
    }
  }
}

// 品类信息样式
.category-info {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-start;
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

.booking-time {
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 500;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
  }

  &.morning-time {
    background-color: #e6f7ff;
    color: #0050b3;
    border: 1px solid #91d5ff;

    &::before {
      background-color: #1890ff;
    }
  }

  &.afternoon-time {
    background-color: #fff1f0;
    color: #cf1322;
    border: 1px solid #ffa39e;

    &::before {
      background-color: #ff4d4f;
    }
  }
}

// 添加图片懒加载相关样式
.el-image {
  transition: opacity 0.3s;

  &.is-loading {
    opacity: 0.5;
  }

  &.is-loaded {
    opacity: 1;
  }
}

// 优化滚动性能
:deep(.el-table__body-wrapper) {
  overflow-y: auto;
  scrollbar-width: thin;

  &::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: #c0c4cc;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-track {
    background: #f5f7fa;
  }
}

.progress-bars {
  padding: 12px;
  background-color: var(--el-fill-color-lighter);
  border-radius: 6px;
  border: 1px solid var(--el-border-color-lighter);

  .progress-item {
    .text-sm {
      color: var(--el-text-color-regular);
      font-size: 13px;
    }

    :deep(.el-progress-bar__outer) {
      border-radius: 4px;
      background-color: var(--el-fill-color-darker);
    }

    :deep(.el-progress-bar__inner) {
      border-radius: 4px;
      transition: all 0.3s ease;
    }
  }
}

.custom-text-item {
  padding: 2px 0;
  line-height: 1.5;
  word-break: break-all;
}
</style>
