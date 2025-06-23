<template>
  <el-drawer
    v-model="dialogVisible"
    title="搜索结果"
    direction="rtl"
    size="90%"
    :before-close="handleClose"
  >
    <div class="search-results-container">
      <!-- 包裹信息面板 -->
      <div class="package-info-panel">
        <div class="panel-content">
          <div class="info-item">
            <span class="label">搜索结果数</span>
            <span class="value" style="font-weight: bold; color: #409EFF;font-size: 23px;">
              {{ searchResults.length }}个
            </span>
          </div>
        </div>
      </div>

      <!-- 订单列表 -->
      <div class="order-list">
        <div v-for="(order, index) in sortedResults" :key="index" class="order-item">
          <!-- 订单头部 -->
          <div class="order-header">
            <div class="order-basic-info">
              <div class="similarity-score">
                <span class="label">相似度：</span>
                <div class="score-cell">
                  <el-progress 
                    type="dashboard"
                    :percentage="Number((order.score * 100).toFixed(0))"
                    :color="getScoreColor(order.score)"
                    :width="50"
                    :stroke-width="6"
                  >
                    <template #default="{ percentage }">
                      <span class="score-value">{{ percentage }}%</span>
                    </template>
                  </el-progress>
                </div>
              </div>
              <div class="tracking-sequence" v-if="order.dailySequence" style="display: flex; align-items: center; height: 45px;">
                <span class="label" style="line-height: 45px;">物流序号：</span>
                <div style="display: flex; align-items: center;">
                  <span style="color: var(--el-color-primary); font-weight: 600; font-size: 45px; line-height: 45px;">{{ order.dailySequence }}</span>
                                     <span v-if="order.shippingTime" style="color: var(--el-color-primary); font-size: 22px; font-weight: normal; opacity: 0.9; margin-left: 4px; line-height: 45px;">({{ formatDate(order.shippingTime) }})</span>
                </div>
              </div>
              <div class="tracking-info" v-if="order.trackingNumber">
                <span class="label">物流单号：</span>
                <span class="value">{{ order.trackingNumber }}</span>
              </div>
              <div class="shop-info">
                <span class="value">{{ order.shopName }} ({{ order.aliasName }})</span>
              </div>
              <div class="order-number">
                <span class="label">订单号：</span>
                <span class="value">{{ order.orderNo }}</span>
              </div>
              <div class="order-status">
                <el-tag :type="getOrderStatusType(order.orderStatus)">
                  {{ getOrderStatusText(order.orderStatus) }}
                </el-tag>
              </div>
              
              <el-button
                    v-if="order.trackingNumber"
                    type="primary"
                    size="small"
                    @click="handleViewShipping(order)"
                    class="view-shipping-btn"
                  >
                    查看物流详情
                  </el-button>
            </div>
          </div>

          <!-- 订单内容 -->
          <div class="order-content">
            <div class="content-wrapper">
              <!-- 左侧信息 -->
              <div class="info-section">
                <!-- 重要信息 -->
                <div class="important-info">
                  <div class="info-item custom-sku">
                    <span class="label">定制SKU：</span>
                    <span class="value" style="font-size: 30px;font-weight: bold; color: var(--el-color-primary);">
                      {{ order.customSku }}
                    </span>
                  </div>
                  <div class="info-item quantity-info">
                    <div class="quantity-group">
                      <span class="label">官网数量：</span>
                      <span class="value" style="color: var(--el-color-primary); font-size: 24px; font-weight: 600;">{{ order.originalQuantity }}</span>
                    </div>
                    <div class="quantity-group">
                      <span class="label">制作数量：</span>
                      <span class="value" style="color: var(--el-color-primary); font-size: 24px; font-weight: 600;">{{ order.quantity }}</span>
                    </div>
                  </div>
                </div>

                <!-- 商品信息 -->
                <div class="product-info">
                  <div class="secondary-info">
                    <div class="info-row">
                      <span class="label">标题：</span>
                      <span class="value" style="color: var(--el-text-color-secondary);">{{ order.productTitle }}</span>
                    </div>
                    <div class="info-row">
                      <span class="label">属性：</span>
                      <span class="value" style="color: var(--el-text-color-secondary);">{{ order.productProperties }}</span>
                    </div>
                    <div class="info-row">
                      <span class="label">SKU：</span>
                      <span class="value" style="color: var(--el-text-color-secondary);">{{ order.sku }}</span>
                      <span class="label" style="margin-left: 16px;">SKC：</span>
                      <span class="value" style="color: var(--el-text-color-secondary);">{{ order.skc }}</span>
                    </div>
                  </div>
                </div>

                <!-- 定制信息 -->
                <div class="custom-info" v-if="order.customTextList">
                  <div class="info-item">
                    <span class="label">定制文字：</span>
                    <span class="value">{{ order.customTextList }}</span>
                  </div>
                </div>

                <!-- 打印按钮 -->
                <div class="print-buttons">
                  <el-button 
                    type="primary" 
                    plain 
                    :disabled="!order.complianceGoodsMergedUrl"
                    @click="handlePrint(order.complianceGoodsMergedUrl, order)"
                  >
                    <el-icon><Printer /></el-icon>
                    打印条码+合规单
                  </el-button>
                </div>
              </div>

              <!-- 右侧图片 -->
              <div class="image-section">
                <!-- 定制图片 -->
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
                      style="width: 300px; height: 300px"
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
                    style="width: 300px; height: 300px"
                    fit="cover"
                    loading="lazy"
                    :initial-index="0"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </el-drawer>
</template>

<script lang="ts" setup>
import { ref, computed, watch, nextTick } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'
import { Printer } from '@element-plus/icons-vue'
import printJS from 'print-js'
import { PDFDocument } from 'pdf-lib'
import { OrderApi } from '@/api/temu/order'

// 添加更新订单状态的接口定义
interface UpdateOrderStatusParams {
  id: number
  orderStatus: string
}

interface OrderResult {
  id: number  // 添加id字段
  orderNo: string
  productTitle: string
  orderStatus: number
  sku: string
  skc: string
  customSku: string
  quantity: number
  productProperties: string
  customImageUrls: string
  customTextList: string | null
  productImgUrl: string
  effectiveImgUrl: string
  originalQuantity: number
  productId: string
  score: number
  shopName: string
  aliasName: string
  complianceGoodsMergedUrl: string
  trackingNumber: string
  dailySequence: string
  shippingTime: string
}

const props = defineProps<{
  modelValue: boolean
  searchResults: OrderResult[]
}>()

const emit = defineEmits(['update:modelValue', 'view-shipping'])

const dialogVisible = ref(props.modelValue)
const localSearchResults = ref<OrderResult[]>([])

// 初始化本地数据
watch(() => props.searchResults, (newVal) => {
  localSearchResults.value = JSON.parse(JSON.stringify(newVal))
}, { immediate: true, deep: true })

// 监听抽屉显示状态
watch(() => props.modelValue, (newVal) => {
  dialogVisible.value = newVal
  // 当抽屉显示时，重置滚动条位置
  if (newVal) {
    nextTick(() => {
      const container = document.querySelector('.search-results-container')
      if (container) {
        container.scrollTop = 0
      }
    })
  }
})

watch(() => dialogVisible.value, (newVal) => {
  emit('update:modelValue', newVal)
})

// 按相似度排序的结果
const sortedResults = computed(() => {
  return [...localSearchResults.value].sort((a, b) => b.score - a.score)
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

// 打印条码+合规单
const handlePrint = async (url: string, order: OrderResult) => {
  if (!url) {
    ElMessage.error('打印失败：未找到打印文件')
    return
  }

  try {
    // 立即更新订单状态为已发货(4)
    await OrderApi.updateOrderStatus([{
      id: order.id,
      orderStatus: '4'
    }] as UpdateOrderStatusParams[])
    ElMessage.success('订单状态已更新为已发货')

    // 更新本地数据状态
    const index = localSearchResults.value.findIndex(item => item.id === order.id)
    if (index !== -1) {
      localSearchResults.value[index].orderStatus = 4
    }

    // 处理URL中的@前缀
    const printUrl = url.startsWith('@') ? url.substring(1) : url
    const isPDF = printUrl.toLowerCase().endsWith('.pdf')

    // 获取打印份数
    const copies = order.originalQuantity || 1

    if (isPDF) {
      // 如果是PDF，先合并多份
      const mergedPdf = await PDFDocument.create()
      const response = await fetch(printUrl)
      if (!response.ok) {
        throw new Error(`加载PDF失败: ${printUrl}`)
      }
      const pdfBytes = await response.arrayBuffer()
      const pdf = await PDFDocument.load(pdfBytes)
      
      // 复制指定份数
      for (let i = 0; i < copies; i++) {
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices())
        copiedPages.forEach(page => {
          mergedPdf.addPage(page)
        })
      }

      // 保存并打印合并后的PDF
      const mergedPdfBytes = await mergedPdf.save()
      const mergedPdfBlob = new Blob([mergedPdfBytes], { type: 'application/pdf' })
      const mergedPdfUrl = URL.createObjectURL(mergedPdfBlob)

      printJS({
        printable: mergedPdfUrl,
        type: 'pdf',
        showModal: true
      })

      // 清理资源
      setTimeout(() => {
        URL.revokeObjectURL(mergedPdfUrl)
      }, 10000)
    } else {
      // 如果是图片，循环打印指定份数
      for (let i = 0; i < copies; i++) {
        printJS({
          printable: printUrl,
          type: 'image',
          showModal: true
        })
      }
    }
  } catch (error) {
    console.error('打印错误:', error)
    ElMessage.error('打印失败：' + (error instanceof Error ? error.message : '未知错误'))
  }
}

const handleClose = () => {
  emit('update:modelValue', false)
}

const handleViewShipping = (row: any) => {
  emit('view-shipping', row)
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const getScoreColor = (score: number) => {
  if (score >= 0.9) return '#67C23A'  // 绿色
  if (score >= 0.7) return '#409EFF'  // 蓝色
  if (score >= 0.5) return '#E6A23C'  // 橙色
  return '#F56C6C'  // 红色
}
</script>

<style lang="scss" scoped>
.search-results-container {
  padding: 24px;
  background-color: var(--el-bg-color);
  height: 100%;
  overflow-y: auto;
  position: relative;

  .package-info-panel {
    position: fixed;
    bottom: 0;
    right: 0;
    width: 100%;
    background-color: var(--el-bg-color-overlay);
    box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.08);
    z-index: 100;
    border-top: 1px solid var(--el-border-color-lighter);

    .panel-content {
      padding: 20px 40px;
      display: flex;
      justify-content: flex-start;
      align-items: center;
      width: 100%;
      margin: 0;
      gap: 32px;

      .info-item {
        margin: 0;
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 24px;
        background: var(--el-fill-color-light);
        border-radius: 8px;
        transition: all 0.3s ease;

        &:hover {
          background: var(--el-fill-color);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }

        .label {
          font-size: 15px;
          color: var(--el-text-color-secondary);
          font-weight: 500;
        }

        .value {
          font-size: 16px;
          color: var(--el-text-color-primary);
          font-weight: 600;
        }
      }
    }
  }

  .order-list {
    margin-top: -30px;
    margin-bottom: 120px;

    .order-item {
      background-color: var(--el-bg-color-overlay);
      border-radius: 12px;
      margin-bottom: 24px;
      overflow: hidden;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
      }

      .order-header {
        background-color: var(--el-fill-color-light);
        padding: 16px 24px;
        border-bottom: 1px solid var(--el-border-color-lighter);

        .order-basic-info {
          display: flex;
          align-items: center;
          gap: 32px;
          font-size: 14px;

          .tracking-info {
            .label {
              color: var(--el-text-color-secondary);
              margin-right: 8px;
              font-size: 16px;
            }

            .value {
              color: var(--el-color-primary);
              font-weight: 600;
              font-size: 20px;
            }
          }

          .shop-info, .order-number {
            .label {
              color: var(--el-text-color-secondary);
              margin-right: 8px;
              font-size: 16px;
            }

            .value {
              color: var(--el-color-primary);
              font-weight: 600;
              font-size: 20px;
            }
          }

          .order-status, .similarity-score {
            :deep(.el-tag) {
              font-size: 16px;
              padding: 8px 16px;
              font-weight: 600;
              border-radius: 8px;
            }
          }

          .similarity-score {
            display: flex;
            align-items: center;
            gap: 8px;

            .label {
              color: var(--el-text-color-secondary);
              font-size: 14px;
            }

            .score-cell {
              display: flex;
              align-items: center;

              :deep(.el-progress) {
                margin: 0;
              }

              .score-value {
                font-size: 12px;
                font-weight: bold;
                color: var(--el-text-color-regular);
              }
            }
          }

          .tracking-sequence {
            display: flex;
            align-items: center;
            height: 45px;

            .label {
              color: var(--el-text-color-secondary);
              margin-right: 8px;
              font-size: 16px;
              height: 45px;
              line-height: 45px;
            }

            .value {
              display: flex;
              align-items: center;
              height: 45px;

              .sequence-number {
                color: var(--el-color-primary);
                font-weight: 600;
                font-size: 45px;
                line-height: 45px;
              }

              .date-suffix {
                color: var(--el-text-color-secondary);
                font-size: 16px;
                font-weight: normal;
                opacity: 0.9;
                margin-left: 4px;
                line-height: 45px;
              }
            }
          }
        }
      }

      .order-content {
        padding: 24px;

        .content-wrapper {
          display: flex;
          gap: 32px;

          .info-section {
            flex: 0 0 35%;

            .important-info, .product-info, .custom-info {
              margin-bottom: 24px;
              padding: 20px;
              background-color: var(--el-fill-color-light);
              border-radius: 12px;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

              .info-item {
                margin-bottom: 16px;
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
                  gap: 24px;
                }

                &.quantity-info {
                  display: flex;
                  flex-direction: row;
                  align-items: center;
                  gap: 24px;

                  .quantity-group {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                  }
                }
              }
            }

            .print-buttons {
              margin-top: 24px;
              display: flex;
              flex-direction: column;
              gap: 12px;

              .el-button {
                width: 100%;
                justify-content: center;
                border-radius: 8px;
                transition: all 0.3s ease;
                
                &:hover {
                  transform: translateY(-2px);
                  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                }
                
                .el-icon {
                  margin-right: 8px;
                }
              }
            }
          }

          .image-section {
            flex: 0 0 65%;

            .image-group {
              display: flex;
              flex-flow: row wrap;
              gap: 24px;
              padding: 20px;
              background-color: var(--el-fill-color-light);
              border-radius: 12px;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

              :deep(.el-image) {
                background-color: #fff;
                border-radius: 8px;
                padding: 12px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
                transition: all 0.3s ease;

                &:hover {
                  transform: translateY(-2px);
                  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
                }
              }
            }
          }
        }
      }
    }
  }

  .score-cell {
    display: flex;
    align-items: center;
    gap: 16px;

    .score-value {
      font-size: 16px;
      font-weight: 500;
      color: var(--el-color-primary);
    }

    .view-shipping-btn {
      margin-left: 8px;
    }
  }

  .product-info {
    .secondary-info {
      padding: 12px 0;
      margin-bottom: 16px;

      .info-row {
        display: flex;
        align-items: flex-start;
        margin-bottom: 8px;
        font-size: 14px;
        line-height: 1.5;

        &:last-child {
          margin-bottom: 0;
        }

        .label {
          flex-shrink: 0;
          width: 45px;
          color: var(--el-text-color-secondary);
        }

        .value {
          flex: 1;
          word-break: break-all;
        }
      }
    }
  }
}
</style> 
