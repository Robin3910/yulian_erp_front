<template>
  <el-drawer
    v-model="visible"
    :title="null"
    direction="rtl"
    size="100%"
    :before-close="handleClose"
    :show-close="false"
  >
    <template #title>
      <div class="drawer-title-card">
        <div class="drawer-title-row">
          <div class="drawer-title-main-row">
            <span class="order-seq" >
              物流序号 {{shippingData.dailySequence}}<span v-if="shippingData.createTime" style="color: #409EFF;">（{{formatDate(shippingData.createTime,'MM-DD')}}）</span>
            </span>
            <span class="tracking-number">{{ shippingData.trackingNumber }}</span>
          </div>
          <el-icon class="close-btn" @click="handleClose"><Close /></el-icon>
        </div>
        <div class="drawer-title-second-row">
          <el-tooltip :content="shippingData.shopName" placement="bottom" effect="dark" trigger="click">
            <span class="shop-name" :title="shippingData.shopName">{{ truncateShopName(shippingData.shopName) }}</span>
          </el-tooltip>
          <div class="drawer-title-right-group">
            <span class="package-count">中包 <span class="package-count-value" >{{ totalPackages }}</span></span>
            <span class="order-count">商品 <span class="order-count-value">{{ totalQuantity }}</span></span>
          </div>
        </div>
      </div>
    </template>
    <!-- 下面是内容区 -->
    <div class="shipping-info-container">
      <!-- 订单列表 -->
      <div class="order-list">
        <div v-for="(orderGroup, groupIndex) in shippingData.orderNoList" :key="groupIndex">
          <div v-for="(order, orderIndex) in orderGroup.orderList" :key="orderIndex" class="message-item">
            <!-- 多件标签 -->
            <div v-if="order.originalQuantity > 1" class="multi-tag">多件</div>
            <!-- 内容卡片 -->
            <div class="content-section">
              <div class="top-row">
                <span class="main-title">
                  中包：{{ order.sortingSequence || '--' }}
                </span>
              </div>
              <div class="bottom-row">
                <span class="main-title" style="color: #409EFF;">{{ order.customSku }}</span>
              </div>
              <div class="bottom-row">
                <span class="sub-info">
                  官网 <span class="highlight-value">{{ order.originalQuantity }}</span>
                  &nbsp;&nbsp;&nbsp;制作 <span class="highlight-value">{{ order.quantity }}</span>
                  <span style="margin-left: 18px;">
                    属性 <span class="highlight-value">{{ order.productProperties }}</span>
                  </span>
                </span>
              </div>
              <div class="bottom-row" v-if="order.customTextList && !(order.customTextList.length === 1 && order.customTextList === ',')">
                <span class="custom-text-label">定制文字</span>
                <span class="highlight-value">{{ order.customTextList }}</span>
              </div>
            </div>
            <!-- 头像卡片 -->
            <div class="avatar-card">
              <el-image
                :src="order.effectiveImgUrl || defaultAvatar"
                :preview-src-list="order.effectiveImgUrl ? [order.effectiveImgUrl] : [defaultAvatar]"
                fit="cover"
                class="avatar-large"
              />
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
      <el-tag
        effect="plain"
        size="large"
        style="font-size:15px;font-weight:bold;padding:2px 18px;line-height:1.2;color:#409EFF;border-color:#409EFF;"
      >当前物流已发货</el-tag>
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
import { Document, Close } from '@element-plus/icons-vue'

const defaultAvatar = 'https://img.yzcdn.cn/vant/cat.jpeg';

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

const handleViewAllOrders = (order: any) => {
  // 这里可以跳转到订单详情页面，或者传递订单ID给父组件进行处理
  // 例如：emit('update:modelValue', false) 关闭抽屉，然后父组件根据 order.id 跳转
  // 或者直接跳转到订单详情页面
  ElMessage.info(`查看中包：${order.sortingSequence}`)
}

function truncateShopName(name) {
  if (!name) return '';
  return name.length > 15 ? name.slice(0, 15) + '...' : name;
}
</script>

<style lang="scss" scoped>

.drawer-title-card {
  background: #232323;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  padding: 14px 20px 8px 20px;
  margin: 0;
  width: 100vw;
  position: relative;
  left: 50%;
  transform: translateX(-50%);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  z-index: 10;
  color: #fff;
}

.drawer-title-row {
  display: flex;
  align-items: center;
  width: 100%;
}

.drawer-title-main-row {
  display: flex;
  flex-direction: row;
  align-items: baseline;
  gap: 10px;
  font-size: 16px;
  font-weight: bold;
  color: #fff;
  flex: 1;
}
.tracking-label {
  color: #bbb;
  font-size: 13px;
  font-weight: 500;
}
.order-seq {
  color: #fff;
  font-size: 16px;
}
.tracking-number {
  color: #fff;
  font-weight: 700;
  font-size: 13px;
  font-family: inherit;
}
.date {
  color: #bbb;
  font-size: 13px;
  font-weight: 500;
  margin-left: 8px;
}
.drawer-title-second-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 60px;
  font-size: 15px;
  font-weight: 500;
  color: #fff;
  margin-top: 2px;
  justify-content: space-between;
}
.drawer-title-right-group {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 38px;
  margin-left: auto;
  margin-right: 5px;
}
.shop-name {
  max-width: 140px; /* 原来是90px，改大即可 */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #fff;
  font-weight: 700;
  cursor: pointer;
}
.package-count {
  color: #fff;
  font-weight: 700;
  margin-left: 40px; // 你可以根据实际需要调整数值
}
.package-count-value {
  color: #409EFF;
  font-weight: 700;
}
.order-count {
  color: #fff;
  font-weight: 700;
}
.order-count-value {
  color: #409EFF;
  font-weight: 700;
}
.close-btn {
  font-size: 22px;
  color: #bbb;
  cursor: pointer;
  margin-left: 16px;
  transition: color 0.2s;
}
.close-btn:hover {
  color: #f56c6c;
}

.drawer-title-tracking-row {
  margin-top: 2px;
  font-size: 15px;
  color: #bbb; /* 物流单号前缀灰色 */
  font-weight: 500;
  word-break: break-all;
  width: 100%;
  letter-spacing: 0.5px;
}
.tracking-number {
  color: #fff;
  font-weight: 700;
  margin-left: 4px;
  font-size: 15px;
  font-family: inherit;
}
.shipping-info-container {
  padding-bottom: 72px; // 根据实际按钮高度调整
}

.package-info-panel {
  background-color: #232323;
  border-radius: 12px;
  margin-bottom: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border: 2px solid #2d2d2d; // 可选，略深的描边

  .panel-content {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 6px; // 行距缩短

    .info-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 0; // 行高缩短
      background: #232323;
      border-radius: 8px;

      .label {
        font-size: 14px;
        color: #aaa;
        font-weight: 500;
      }

      .value {
        font-size: 15px;
        color: #fff;
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

/* 复用订单卡片样式 */
.message-item {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  background: #232323;
  border-radius: 16px;
  margin: 7px auto 0 auto;
  padding: 16px 20px;
  max-width: 400px;
  box-sizing: border-box;
  position: relative; /* Added for positioning multi-tag */
}
.content-section {
  .top-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    // 卡片主字段
    .main-title {
      color: #fff;
      font-weight: bold;
      font-size: 20px; // 与标题主行一致
    }
    // 卡片副字段
    .time {
      color: #aaa;
      font-size: 15px; // 与 tracking-row 一致
      margin-left: 12px;
      white-space: nowrap;
    }
  }
  .bottom-row {
    margin-bottom: 4px;
    // 卡片副字段
    .sub-info {
      color: #aaa;
      font-size: 15px; // 与 tracking-row 一致
      margin-right: 12px;
    }
    // 新增：customSku主行样式适配浅色模式
    .main-title {
      color: #fff;
      font-weight: bold;
      font-size: 20px;
    }
  }
}
// 适配深色模式
.dark .content-section .bottom-row .main-title {
  color: #fff;
}
.avatar-card {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 auto 8px auto;
  background: #232323;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  padding: 8px 0;
  max-width: 400px;
  width: 100%;
}
.avatar-large {
  width: 100%;
  height: auto;
  border-radius: 12px;
  object-fit: contain;
  display: block;
}
.button-group {
  display: flex;
  flex-direction: row;
  gap: 8px;
  width: 100%;
  max-width: 220px;
  margin: 12px auto 0 auto;
  .el-button {
    flex: 1 1 0;
    width: auto;
    font-size: 14px;
    border-radius: 16px;
    height: 34px;
    padding: 0 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    min-width: 0;
  }
  .order-icon {
    font-size: 16px;
    margin-right: 4px;
    display: flex;
    align-items: center;
  }
}
.highlight-value {
  color: #fff;
  font-weight: bold;
  margin-left: 15px;
  font-size: 17px;
  letter-spacing: 1px;
}
.custom-text-label {
  color: #aaa;
  font-weight: 500;
  margin-left: 0px;
  margin-right: 2px;
  font-size: 15px;
}
.nav-bar {
  display: flex;
  align-items: center;
  background: #333;
  padding: 0 10px;
  .nav-item {
    position: relative;
    margin: 0 10px;
    font-size: 22px;
    color: #eee;
    font-weight: bold;
    &.active {
      color: #fff;
      .underline {
        width: 32px;
        height: 4px;
        background: #fff;
        border-radius: 2px;
        margin: 2px auto 0 auto;
      }
    }
    .badge-dot {
      position: absolute;
      top: 0;
      right: -8px;
      width: 10px;
      height: 10px;
      background: #ff2d55;
      border-radius: 50%;
      border: 2px solid #333;
    }
    .badge-num {
      position: absolute;
      top: -8px;
      right: -10px;
      min-width: 18px;
      height: 18px;
      background: #ff2d55;
      color: #fff;
      font-size: 14px;
      border-radius: 9px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 5px;
      font-weight: bold;
      border: 2px solid #333;
    }
    .avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      object-fit: cover;
      display: block;
    }
  }
}
.drawer-title-card[data-v-1e76f50e] {
  background: #232323;
  border-radius: 0px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  padding: 5px 20px 8px 20px;
  margin: 0;
  width: 100vw;
  position: relative;
  left: 50%;
  right: 50%;
  transform: translateX(-50%);
  box-sizing: border-box;
  display: flex
;
  flex-direction: column;
  align-items: flex-start;
  z-index: 10;
}
:deep(.el-drawer__body) {
  padding-top: px !important; /* 你想要的间距 */
}
.multi-tag {
  position: absolute;
  left: 16px;
  top: -16px;
  background: #ff9800;
  color: #fff;
  font-size: 15px;
  font-weight: bold;
  padding: 4px 18px;
  border-radius: 12px 12px 12px 0;
  z-index: 3;
  font-family: 'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
  box-shadow: 0 2px 8px rgba(0,0,0,0.10);
  letter-spacing: 2px;
}
</style> 

