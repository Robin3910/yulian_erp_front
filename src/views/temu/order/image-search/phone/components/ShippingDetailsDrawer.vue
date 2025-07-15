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
          </div>
        </div>
      </div>

      <!-- 订单列表 -->
      <div class="order-list">
        <div v-for="(orderGroup, groupIndex) in shippingData.orderNoList" :key="groupIndex">
          <div v-for="(order, orderIndex) in orderGroup.orderList" :key="orderIndex" class="order-item">
            <!-- 订单内容 -->
            <div class="order-content">
              <div class="content-wrapper">
                <!-- 重要信息 -->
                <div class="important-info">
                  <div class="info-item custom-sku">
                    <span class="value" style="font-size: 30px;font-weight: bold; color: var(--el-color-primary);">
                      {{ order.customSku }}
                    </span>
                  </div>
                  <div class="info-item quantity-info">
                    <div class="quantity-group">
                      <span class="label">官网：</span>
                      <span class="value">{{ order.originalQuantity }}</span>
                    </div>
                    <div class="quantity-group">
                      <span class="label">制作：</span>
                      <span class="value">{{ order.quantity }}</span>
                    </div>
                    <div class="quantity-group">
                      <span class="label">属性：</span>
                      <span class="value">{{ order.productProperties }}</span>
                    </div>
                  </div>
                  <div class="info-item custom-text" v-if="order.customTextList && order.customTextList.trim() !== ','">
                    <span class="label">定制文字：{{ order.customTextList }}</span>
                  </div>
                </div>
                <!-- 图片展示 -->
                <div class="image-section">
                  <div class="image-group" v-if="order.customImageUrls">
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
import { ElMessage, ElMessageBox } from 'element-plus'
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

const handleClose = () => {
  emit('update:modelValue', false)
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

