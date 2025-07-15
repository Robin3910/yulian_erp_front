<template>
  <el-drawer
    v-model="visible"
    direction="rtl"
    size="100%"
    :before-close="handleClose"
  >
    <template #title>
      <div class="drawer-title-card">
        <div class="drawer-title-row" style="flex-wrap: nowrap;">
          <div class="drawer-title-main-row" style="flex-direction: row; align-items: center; gap: 16px;">
            <span class="order-seq">
              中包 {{ seq }}</span>
            <span v-if="totalQuantity !== undefined" class="order-count" style="margin-left: 18px;">
              商品 <span class="order-count-value">{{ totalQuantity }}</span>
            </span>
          </div>
          <el-icon class="close-btn" @click="handleClose"><Close /></el-icon>
        </div>
      </div>
    </template>
    <div class="order-dialog-list">
      <div
        v-for="(order, index) in searchResults"
        :key="order.orderNo || index"
        class="order-dialog-card"
        :class="{
          'order-dialog-card-multi': order.originalQuantity > 1,
          'order-dialog-card-active': activeOrderIndex === index
        }"
        @click="emit('update:activeOrderIndex', index)"
      >
        <div class="order-dialog-tag-wrap">
          <el-tag :type="order.isCompleteProducerTask === 1 ? 'success' : 'info'" size="small">
            {{ order.isCompleteProducerTask === 1 ? '已拣货' : '未拣货' }}
          </el-tag>
        </div>
        <div class="order-dialog-top-flex">
          <div class="order-dialog-avatar-section">
            <el-image
              :src="order.effectiveImgUrl || defaultAvatar"
              :preview-src-list="order.effectiveImgUrl ? [order.effectiveImgUrl] : [defaultAvatar]"
              fit="cover"
              class="order-dialog-avatar"
            />
          </div>
          <div class="order-dialog-content-section">
            <div class="order-dialog-top-row">
              <span class="order-dialog-sku">{{ order.customSku }}</span>
              <span class="order-dialog-time">{{ formatDate(order.bookingTime) }}</span>
            </div>
            <div class="order-dialog-bottom-row">
              <span class="order-dialog-sub-info">官网 {{ order.originalQuantity }}&nbsp;&nbsp;&nbsp;制作 {{ order.quantity }}</span>
            </div>
            <div class="order-dialog-bottom-row">
              <span class="order-dialog-sub-info">属性 {{ order.productProperties }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue';
const props = defineProps<{
  modelValue: boolean,
  searchResults: any[],
  seq: string | number,
  date: string,
  defaultAvatar: string,
  activeOrderIndex: number,
  formatDate: (ts?: number) => string
}>();
const emit = defineEmits(['update:modelValue', 'update:activeOrderIndex']);
const visible = ref(props.modelValue);

watch(() => props.modelValue, (val) => {
  visible.value = val;
  if (val) {
    nextTick(() => {
      const container = document.querySelector('.order-list-drawer-container');
      if (container) container.scrollTop = 0;
    });
  }
});
watch(() => visible.value, (val) => {
  emit('update:modelValue', val);
});
const handleClose = () => {
  emit('update:modelValue', false);
};

// 新增：店铺名、商品总数
const shopName = computed(() => {
  // 取第一个订单的店铺名，或空
  return props.searchResults[0]?.shopName || '';
});
const totalQuantity = computed(() => {
  // 所有订单商品数量之和
  return props.searchResults.reduce((sum, order) => sum + (order.originalQuantity || 0), 0);
});
function truncateShopName(name: string) {
  if (!name) return '';
  return name.length > 15 ? name.slice(0, 15) + '...' : name;
}
</script>

<style lang="scss" scoped>
.order-list-drawer-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 0 16px 16px 16px; // 顶部padding设为0
  background-color: var(--el-bg-color);
  position: relative;
}
.order-dialog-list {
  flex: 1;
  overflow-y: auto;
  padding: 0; // 顶部padding设为0
  display: flex;
  flex-direction: column;
  gap: 16px; // 卡片间距可适当缩小
}
.order-dialog-card {
  background: #232323;
  border-radius: 14px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  padding: 16px 18px 12px 18px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  transition: box-shadow 0.2s;
  position: relative;
}
.order-dialog-card:hover {
  box-shadow: 0 4px 24px rgba(0,0,0,0.16);
}
.order-dialog-title-wrap {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 4px 0 2px 0;
}
.order-dialog-title-main {
  font-size: 22px;
  font-weight: bold;
  color: #232323;
  display: flex;
  align-items: baseline;
  gap: 16px;
}
.order-dialog-title-strong {
  color: #232323;
  font-size: 22px;
  font-weight: 700;
}
.order-dialog-title-count {
  color: #409EFF;
  font-size: 16px;
  font-weight: 500;
  margin-left: 8px;
}
.order-dialog-tag-wrap {
  position: absolute;
  right: 18px;
  top: 14px;
  z-index: 2;
  .el-tag {
    font-size: 14px;
    padding: 0 12px;
    border: none;
    font-family: 'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
  }
  .el-tag--success {
    background: #67c23a !important;
    color: #fff !important;
  }
  .el-tag--info {
    background: #f56c6c !important;
    color: #fff !important;
  }
}
.order-dialog-top-flex {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  width: 100%;
}
.order-dialog-avatar-section {
  .order-dialog-avatar {
    width: 48px;
    height: 48px;
    border-radius: 8px;
    object-fit: cover;
  }
}
.order-dialog-content-section {
  flex: 1;
  margin-left: 14px;
  .order-dialog-top-row {
    display: flex;
    justify-content: space-between;
  }
  .order-dialog-middle-row {
    margin: 4px 0;
  }
  .order-dialog-bottom-row {
    .order-dialog-sub-info {
      color: #aaa;
      font-size: 13px;
      margin-right: 12px;
    }
  }
}
.order-dialog-main-title {
  color: #fff;
  font-weight: bold;
  font-size: 18px;
}
.order-dialog-sub-info {
  color: #aaa;
  font-size: 15px;
}
.order-dialog-time {
  color: #888;
  font-size: 13px;
}
.order-dialog-sku {
  color: #fff;
  font-size: 18px;
  font-weight: bold;
  margin-right: 12px;
}
.order-dialog-card-multi {
  position: relative;
}
.order-dialog-card-multi::before {
  content: '多件';
  position: absolute;
  left: -2px;
  top: -12px;
  background: #ff9800;
  color: #fff;
  font-size: 12px;
  font-weight: bold;
  padding: 2px 10px;
  border-radius: 8px 8px 8px 0;
  z-index: 3;
  font-family: 'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
}
.order-dialog-card-active {
  border: 2px solid #409EFF;
  background: #fff;
  box-shadow: 0 4px 24px rgba(64, 158, 255, 0.10);
}
.order-dialog-sku,
.order-dialog-sub-info,
.order-dialog-time {
  color: #fff;
}
.order-dialog-card-active .order-dialog-sku,
.order-dialog-card-active .order-dialog-sub-info,
.order-dialog-card-active .order-dialog-time {
  color: #232323 !important;
  text-shadow: none;
}
.order-list-drawer-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 22px;
  font-weight: bold;
  color: #232323;
  line-height: 1.2; /* 推荐设置为1.2或1，减少高度 */
  min-height: unset; /* 如有必要，去除min-height */
  padding: 0;        /* 如有必要，去除padding */
}
.order-dialog-title-strong {
  color: #232323;
  font-size: 22px;
  font-weight: 700;
}
.order-dialog-title-date {
  color: #232323;
  font-size: 18px;
  font-weight: 400;
}
.order-dialog-title-count {
  color: #409EFF;
  font-size: 16px;
  font-weight: 500;
  margin-left: 8px;
}
:deep(.el-drawer__header) {
  padding: 4px 16px 0 16px !important;
  min-height: 0 !important;
  margin-bottom: 0 !important;
  height: auto !important;
}
.order-list-drawer-title {
  line-height: 1.2;
  min-height: unset;
  padding: 0;
}
.el-drawer__header {
  padding: 4px 16px 0 16px !important;
  min-height: 0 !important;
  margin-bottom: 0 !important;
  height: auto !important;
}

// 复制ShippingDetailsDrawer的标题样式
.drawer-title-card {
  background: #232323;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  padding: 7px 20px 8px 20px;
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
  justify-content: space-between; // 关键
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
.order-seq {
  color: #fff;
  font-size: 16px;
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
  max-width: 140px;
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
  margin-left: 40px;
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
</style> 