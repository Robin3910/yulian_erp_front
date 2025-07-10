<template>
  <el-drawer
    v-model="visible"
    title="物流单详情"
    direction="rtl"
    size="100%"
    :before-close="handleClose"
  >
    <div class="shipping-info-container">
      <!-- 物流单基本信息 -->
      <div class="package-info-panel">
        <div class="panel-content">
          <div class="info-item">
            <span class="label">物流序号</span>
            <span class="value" style="font-weight: bold; color: #E6A23C; font-size: 23px;">{{ shippingData.dailySequence || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="label">物流单号</span>
            <span class="value">{{ shippingData.trackingNumber || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="label">店铺名称</span>
            <span class="value">{{ shippingData.shopName }}</span>
          </div>
          <div class="info-item">
            <span class="label">创建时间</span>
            <span class="value">{{ shippingData.createTime ? formatDate(shippingData.createTime, 'YYYY-MM-DD HH:mm:ss') : '-' }}</span>
          </div>
          <div class="info-item">
            <span class="label">包裹数量</span>
            <span class="value" style="font-weight: bold; color: #409EFF;font-size: 23px;">{{ totalPackages }}个</span>
          </div>
          <div class="info-item">
            <span class="label">商品总数</span>
            <span class="value" style="font-weight: bold; color: #67C23A; font-size: 23px;">{{ totalQuantity }}件</span>
            <div class="progress-info">
              <el-progress
                :percentage="shippedPercentage"
                :format="progressFormat"
                :stroke-width="20"
                :color="progressColor"
              />
            </div>
          </div>
          <div class="info-item">
            <el-button type="primary" plain @click="handlePrintAll">
              <el-icon><Printer /></el-icon>
              打印全部
            </el-button>
          </div>
        </div>
      </div>

      <!-- 订单列表 -->
      <div class="order-list">
        <div v-for="(orderGroup, groupIndex) in shippingData.orderNoList" :key="groupIndex">
          <div v-for="(order, orderIndex) in orderGroup.orderList" :key="orderIndex" class="order-item">
            <!-- 订单头部 -->
            <div class="order-header">
              <div class="order-basic-info">
                <div class="order-number">
                  <span class="label">订单号：</span>
                  <span class="value">{{ orderGroup.orderNo }}</span>
                </div>
                <div class="order-status">
                  <el-tag :type="getOrderStatusType(order.orderStatus)">
                    {{ getOrderStatusText(order.orderStatus) }}
                  </el-tag>
                </div>
              </div>
            </div>

            <!-- 订单内容 -->
            <div class="order-content">
              <div class="content-wrapper">
                <!-- 重要信息 -->
                <div class="important-info">
                  <div class="info-item custom-sku">
                    <span class="label">定制SKU：</span>
                    <span class="value" style="font-size: 30px;font-weight: bold; color: var(--el-color-primary);">
                      {{ order.customSku }}
                    </span>
                  </div>
                  <div class="info-item sku-info">
                    <span class="label">SKU：</span>
                    <span class="value">{{ order.sku }}</span>
                    <span class="label">SKC：</span>
                    <span class="value">{{ order.skc }}</span>
                  </div>
                  <div class="info-item quantity-info">
                    <div class="quantity-group">
                      <span class="label">官网数量：</span>
                      <span class="value">{{ order.originalQuantity }}</span>
                    </div>
                    <div class="quantity-group">
                      <span class="label">制作数量：</span>
                      <span class="value">{{ order.quantity }}</span>
                    </div>
                  </div>
                </div>

                <!-- 商品信息 -->
                <div class="product-info">
                  <div class="info-item">
                    <span class="label">标题：</span>
                    <span class="value">{{ order.productTitle }}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">属性：</span>
                    <span class="value">{{ order.productProperties }}</span>
                  </div>
                </div>

                <!-- 定制信息 -->
                <div class="custom-info" v-if="order.customTextList">
                  <div class="info-item">
                    <span class="label">定制文字：</span>
                    <span class="value">{{ order.customTextList }}</span>
                  </div>
                </div>

                <!-- 图片展示 -->
                <div class="image-section">
                  <div class="image-group" v-if="order.customImageUrls">
                    <div
                      v-for="(item, imgIndex) in order.customImageUrls.split(',')"
                      :key="imgIndex"
                      class="image-item"
                    >
                      <el-image
                        :hide-on-click-modal="true"
                        :preview-teleported="true"
                        :src="item"
                        :preview-src-list="[item]"
                        style="width: 100%; height: 300px"
                        fit="cover"
                        loading="lazy"
                        :initial-index="0"
                      />
                    </div>
                    <el-image
                      v-if="order.effectiveImgUrl"
                      :hide-on-click-modal="true"
                      :preview-teleported="true"
                      :src="order.effectiveImgUrl"
                      :preview-src-list="[order.effectiveImgUrl]"
                      style="width: 100%; height: 300px"
                      fit="cover"
                      loading="lazy"
                      :initial-index="0"
                    />
                  </div>
                </div>

                <!-- 打印按钮 -->
                <div class="print-buttons">
                  <el-button
                    type="primary"
                    plain
                    :disabled="!order.complianceGoodsMergedUrl"
                    @click="handlePrint(order.complianceGoodsMergedUrl)"
                  >
                    <el-icon><Printer /></el-icon>
                    打印条码+合规单
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </el-drawer>
  <template v-if="String(shippingData.shippingStatus) === '0'">
    <div style="position: fixed; left: 0; right: 0; bottom: 0; z-index: 9999; background: #fff; padding: 16px; box-shadow: 0 -2px 8px rgba(0,0,0,0.06);">
      <el-button type="success" size="large" style="width: 100%;" @click="handleShip" :loading="shipLoading">
        <el-icon><Van /></el-icon>
        发货
      </el-button>
    </div>
  </template>
  <template v-else-if="String(shippingData.shippingStatus) === '1'">
    <div style="position: fixed; left: 0; right: 0; bottom: 0; z-index: 9999; background: #fff; padding: 16px; box-shadow: 0 -2px 8px rgba(0,0,0,0.06); display: flex; flex-direction: row; align-items: center; justify-content: center; gap: 16px;">
      <el-tag type="success" effect="plain" size="large" style="font-size:15px;font-weight:bold;padding:2px 18px;line-height:1.2;">当前物流已发货</el-tag>
      <el-tag v-if="shippingData.shippedOperatorNickname" type="info" effect="plain" size="large" style="font-size:15px;padding:2px 18px;line-height:1.2;">发货人：{{ shippingData.shippedOperatorNickname }}</el-tag>
    </div>
  </template>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { formatDate } from '@/utils/formatTime'
import { Printer, Van } from '@element-plus/icons-vue'
import { ElMessage, ElNotification, ElMessageBox } from 'element-plus'
import printJS from 'print-js'
import { PDFDocument } from 'pdf-lib'
import type { ShippingOrder } from '@/api/temu/order/types'
import { OrderApi } from '@/api/temu/order'

const props = defineProps<{
  modelValue: boolean
  shippingData: ShippingOrder
}>()

const emit = defineEmits(['update:modelValue'])

const visible = ref(props.modelValue)

// 监听 modelValue 的变化
watch(() => props.modelValue, (newVal) => {
  visible.value = newVal
  // 当抽屉显示时，重置滚动条位置
  if (newVal) {
    nextTick(() => {
      const container = document.querySelector('.shipping-info-container')
      if (container) {
        container.scrollTop = 0
      }
    })
  }
})

// 监听 visible 的变化
watch(() => visible.value, (newVal) => {
  emit('update:modelValue', newVal)
})

// 获取订单状态类型
const getOrderStatusType = (status: number): 'success' | 'warning' | 'info' | 'primary' | 'danger' => {
  switch (status) {
    case 0: return 'info'     // 待下单
    case 1: return 'primary'  // 已下单待送产
    case 2: return 'warning'  // 已送产待生产
    case 3: return 'primary'  // 已生产待发货
    case 4: return 'success'  // 已发货
    default: return 'info'
  }
}

// 获取订单状态文本
const getOrderStatusText = (status: number): string => {
  switch (status) {
    case 0: return '待下单'
    case 1: return '已下单待送产'
    case 2: return '已送产待生产'
    case 3: return '已生产待发货'
    case 4: return '已发货'
    default: return '未知状态'
  }
}

const handleClose = () => {
  emit('update:modelValue', false)
}

// 打印全部功能
const handlePrintAll = async () => {
  try {
    // 获取所有订单
    const allOrders = props.shippingData.orderNoList?.flatMap(group => group.orderList) || [];

    // 按订单号分组（orderNoList 已经是分组结构）
    const orderGroups = props.shippingData.orderNoList || [];

    // 创建一个新的PDF文档
    const mergedPdf = await PDFDocument.create();
    let successCount = 0;
    let failCount = 0;

    // 首先处理加急单（只打印一次）
    const urgentUrl = props.shippingData.orderNoList?.[0]?.expressOutsideImageUrl;
    if (urgentUrl) {
      const processedUrgentUrl = urgentUrl.startsWith('@')
        ? urgentUrl.substring(1)
        : urgentUrl;
      try {
        await addPdfToMerged(mergedPdf, processedUrgentUrl);
      } catch (error) {
        console.error('加急单打印失败:', error);
        failCount++;
      }
    }

    // 检查是否有订单的合并文件为空
    const ordersWithoutMerged = allOrders.filter(
      (order) => !order.complianceGoodsMergedUrl
    );
    if (ordersWithoutMerged.length > 0) {
      // 按店铺分组并去重SKC
      const groupedByShop = ordersWithoutMerged.reduce((acc, order) => {
        const shopName = props.shippingData.shopName || '未知店铺';
        if (!acc[shopName]) {
          acc[shopName] = new Set();
        }
        if (order.skc) {
          acc[shopName].add(order.skc);
        }
        return acc;
      }, {} as Record<string, Set<string>>);

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
        .join('');

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
      });
      return;
    }

    // 按顺序处理每个订单组：先物流面单，再条码+合规单
    for (const orderGroup of orderGroups) {
      try {
        // 1. 打印物流面单（只打印一次）
        if (orderGroup.expressImageUrl) {
          const expressUrl = orderGroup.expressImageUrl.startsWith('@')
            ? orderGroup.expressImageUrl.substring(1)
            : orderGroup.expressImageUrl;
          await addPdfToMerged(mergedPdf, expressUrl);
        }

        // 2. 打印该组所有订单的条码+合规单（根据官网数量 originalQuantity 打印）
        for (const order of orderGroup.orderList) {
          if (order.complianceGoodsMergedUrl) {
            const mergedUrl = order.complianceGoodsMergedUrl.startsWith('@')
              ? order.complianceGoodsMergedUrl.substring(1)
              : order.complianceGoodsMergedUrl;
            const copies = order.originalQuantity || 1;
            for (let i = 0; i < copies; i++) {
              await addPdfToMerged(mergedPdf, mergedUrl);
            }
          }
        }
        successCount++;
      } catch (error) {
        console.error(`处理订单组 ${orderGroup.orderNo} 失败:`, error);
        failCount++;
      }
    }

    // 如果有成功合并的PDF，则打印
    if (mergedPdf.getPageCount() > 0) {
      const mergedPdfBytes = await mergedPdf.save();
      const mergedPdfBlob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
      const mergedPdfUrl = URL.createObjectURL(mergedPdfBlob);

      printJS({
        printable: mergedPdfUrl,
        type: 'pdf',
        showModal: true
      });

      // 清理资源
      setTimeout(() => {
        URL.revokeObjectURL(mergedPdfUrl);
      }, 10000);
    }

    // 显示处理结果
    if (failCount > 0) {
      ElMessage.warning(`成功处理${successCount}个订单组，${failCount}个订单组处理失败`);
    } else {
      ElMessage.success(`成功处理${successCount}个订单组`);
    }
  } catch (error) {
    console.error('打印全部失败:', error);
    ElMessage.error('打印全部失败：' + (error instanceof Error ? error.message : '未知错误'));
  }
};

// 添加辅助函数用于将PDF添加到合并文档中
const addPdfToMerged = async (mergedPdf: PDFDocument, url: string) => {
  try {
    if (url.toLowerCase().endsWith('.pdf')) {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`加载PDF失败: ${url}`)
      }
      const pdfBytes = await response.arrayBuffer()
      const pdf = await PDFDocument.load(pdfBytes)
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices())
      copiedPages.forEach((page) => {
        mergedPdf.addPage(page)
      })
    } else {
      // 如果是图片，直接使用print-js打印
      printJS({
        printable: url,
        type: 'image',
        showModal: true
      })
    }
  } catch (error) {
    throw new Error(`处理文件失败: ${url}`)
  }
}

// 计算总包裹数
const totalPackages = computed(() => {
  const uniquePackages = new Set(
    props.shippingData.orderNoList?.flatMap(group =>
      group.orderList.map(order => `${group.orderNo}_${order.skc}_${order.sku}`)
    ) || []
  )
  return uniquePackages.size
})

// 计算总商品数
const totalQuantity = computed(() => {
  return props.shippingData.orderNoList?.reduce((total, group) => {
    return total + group.orderList.reduce((groupTotal, order) => groupTotal + (order.originalQuantity || 0), 0)
  }, 0) || 0
})

// 计算已发货订单数
const shippedOrders = computed(() => {
  return props.shippingData.orderNoList?.reduce((total, group) => {
    return total + group.orderList.reduce((groupTotal, order) => {
      // 如果订单状态为4（已发货），则加上该订单的官网数量
      return groupTotal + (order.orderStatus === 4 ? (order.originalQuantity || 0) : 0)
    }, 0)
  }, 0) || 0
})

// 计算发货进度百分比
const shippedPercentage = computed(() => {
  if (totalQuantity.value === 0) return 0
  return Math.round((shippedOrders.value / totalQuantity.value) * 100)
})

// 进度条格式化
const progressFormat = (percentage: number) => {
  return `${shippedOrders.value}/${totalQuantity.value}`
}

// 进度条颜色
const progressColor = (percentage: number) => {
  if (percentage < 30) return '#F56C6C'
  if (percentage < 70) return '#E6A23C'
  return '#67C23A'
}

// 打印条码+合规单
const handlePrint = async (url: string) => {
  if (!url) {
    ElMessage.error('打印失败：未找到打印文件')
    return
  }

  try {
    const printUrl = url.startsWith('@') ? url.substring(1) : url
    const isPDF = printUrl.toLowerCase().endsWith('.pdf')

    if (isPDF) {
      printJS({
        printable: printUrl,
        type: 'pdf',
        showModal: true
      })
    } else {
      printJS({
        printable: printUrl,
        type: 'image',
        showModal: true
      })
    }
  } catch (error) {
    console.error('打印错误:', error)
    ElMessage.error('打印失败：' + (error instanceof Error ? error.message : '未知错误'))
  }
}

const shipLoading = ref(false)
const handleShip = async () => {
  try {
    shipLoading.value = true
    // 获取所有订单id
    const orderIds = props.shippingData.orderNoList?.flatMap(group => group.orderList.map(order => order.id)) || []
    if (orderIds.length === 0) {
      ElMessage.error('没有可发货的订单')
      return
    }
    await ElMessageBox.confirm(
      `确认发货该物流单号下的 ${orderIds.length} 个订单吗？该操作确认后无法撤回`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    await OrderApi.batchUpdateOrderStatus({
      orderIds,
      orderStatus: 4,
      trackingNumber: props.shippingData.trackingNumber
    })
    ElMessage.success('发货成功')
    emit('update:modelValue', false)
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('发货失败')
    }
  } finally {
    shipLoading.value = false
  }
}
</script>

<style lang="scss" scoped>
.shipping-info-container {
  padding: 16px;
  background-color: var(--el-bg-color);
  height: 100%;
  overflow-y: auto;
  position: relative;

  .package-info-panel {
    background-color: var(--el-bg-color-overlay);
    border-radius: 12px;
    margin-bottom: 16px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);

    .panel-content {
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 16px;

      .info-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        background: var(--el-fill-color-light);
        border-radius: 8px;

        .label {
          font-size: 14px;
          color: var(--el-text-color-secondary);
          font-weight: 500;
        }

        .value {
          font-size: 15px;
          color: var(--el-text-color-primary);
          font-weight: 600;
        }

        .progress-info {
          flex: 1;
          margin-left: 16px;

          :deep(.el-progress-bar__outer) {
            border-radius: 10px;
          }

          :deep(.el-progress-bar__inner) {
            border-radius: 10px;
          }
        }

        &:last-child {
          margin-top: 8px;
          background: none;
          padding: 0;

          .el-button {
            width: 100%;
            height: 44px;
            font-size: 15px;
            border-radius: 8px;

            .el-icon {
              margin-right: 8px;
            }
          }
        }
      }
    }
  }

  .order-list {
    .order-item {
      background-color: var(--el-bg-color-overlay);
      border-radius: 12px;
      margin-bottom: 16px;
      overflow: hidden;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);

      .order-header {
        background-color: var(--el-fill-color-light);
        padding: 16px;
        border-bottom: 1px solid var(--el-border-color-lighter);

        .order-basic-info {
          display: flex;
          flex-direction: column;
          gap: 12px;

          .order-number {
            .label {
              color: var(--el-text-color-secondary);
              margin-right: 8px;
              font-size: 14px;
            }

            .value {
              color: var(--el-color-primary);
              font-weight: 600;
              font-size: 16px;
            }
          }

          .order-status {
            :deep(.el-tag) {
              font-size: 14px;
              padding: 6px 12px;
              font-weight: 600;
              border-radius: 6px;
            }
          }
        }
      }

      .order-content {
        padding: 16px;

        .content-wrapper {
          display: flex;
          flex-direction: column;
          gap: 16px;

          .important-info, .product-info, .custom-info {
            padding: 16px;
            background-color: var(--el-fill-color-light);
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

            .info-item {
              margin-bottom: 12px;
              display: flex;
              flex-direction: column;
              gap: 8px;

              &:last-child {
                margin-bottom: 0;
              }

              .label {
                font-size: 14px;
                font-weight: 500;
                color: var(--el-text-color-secondary);
              }

              .value {
                font-size: 15px;
                color: var(--el-text-color-primary);
                line-height: 1.5;
              }

              &.sku-info {
                display: flex;
                flex-direction: row;
                align-items: center;
                gap: 16px;
              }

              &.quantity-info {
                display: flex;
                flex-direction: row;
                align-items: center;
                gap: 16px;

                .quantity-group {
                  display: flex;
                  align-items: center;
                  gap: 8px;
                }
              }
            }
          }

          .image-section {
            .image-group {
              display: flex;
              flex-direction: column;
              gap: 16px;
              padding: 16px;
              background-color: var(--el-fill-color-light);
              border-radius: 12px;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

              :deep(.el-image) {
                background-color: #fff;
                border-radius: 8px;
                padding: 12px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
              }
            }
          }

          .print-buttons {
            margin-top: 16px;

            .el-button {
              width: 100%;
              height: 44px;
              font-size: 15px;
              border-radius: 8px;

              .el-icon {
                margin-right: 8px;
              }
            }
          }
        }
      }
    }
  }
}
</style> 
