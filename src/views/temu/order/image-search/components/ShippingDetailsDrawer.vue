<template>
  <el-drawer
    v-model="visible"
    title="物流单详情"
    direction="rtl"
    size="80%"
    :before-close="handleClose"
  >
    <div class="shipping-info-container">
      <!-- 物流单基本信息 -->
      <div class="package-info-panel">
        <div class="panel-content">
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
            <span class="label">订单数量</span>
            <span class="value" style="font-weight: bold; color: #409EFF;font-size: 23px;">{{ totalOrders }}个</span>
          </div>
          <div class="info-item">
            <span class="label">商品总数</span>
            <span class="value" style="font-weight: bold; color: #67C23A; font-size: 23px;">{{ totalQuantity }}件</span>
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
                <div class="shop-info">
                  <span class="label">店铺：</span>
                  <span class="value">{{ shippingData.shopName }}</span>
                </div>
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
                <!-- 左侧信息 -->
                <div class="info-section">
                  <!-- 重要信息 -->
                  <div class="important-info">
                    <div class="info-item">
                      <span class="label">图片ID：</span>
                      <span class="value">{{ order.productId }}</span>
                    </div>
                    <div class="info-item sku-info">
                      <span class="label">SKU：</span>
                      <span class="value">{{ order.sku }}</span>
                      <span class="label">SKC：</span>
                      <span class="value">{{ order.skc }}</span>
                    </div>
                    <div class="info-item custom-sku">
                      <span class="label">定制SKU：</span>
                      <span class="value" style="font-size: 30px;font-weight: bold; color: var(--el-color-primary);">
                        {{ order.customSku }}
                      </span>
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
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { formatDate } from '@/utils/formatTime'
import type { ShippingOrder, OrderResult } from '@/api/temu/order/types'

const props = defineProps<{
  modelValue: boolean
  shippingData: ShippingOrder
}>()

const emit = defineEmits(['update:modelValue'])

const visible = ref(props.modelValue)

// 监听 modelValue 的变化
watch(() => props.modelValue, (newVal) => {
  visible.value = newVal
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

// 计算物流单号下的总订单数
const totalOrders = computed(() => {
  if (!props.shippingData.orderNoList) return 0
  return props.shippingData.orderNoList.length
})

// 计算物流单号下的总商品数量
const totalQuantity = computed(() => {
  if (!props.shippingData.orderNoList) return 0
  return props.shippingData.orderNoList.reduce((total, group) => {
    return total + (group.orderList?.length || 0)
  }, 0)
})
</script>

<style lang="scss" scoped>
.shipping-info-container {
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

          .order-status {
            :deep(.el-tag) {
              font-size: 16px;
              padding: 8px 16px;
              font-weight: 600;
              border-radius: 8px;
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
}
</style> 