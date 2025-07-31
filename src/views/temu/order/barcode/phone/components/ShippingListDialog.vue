<template>
  <el-dialog
    v-model="visible"
    title="物流单号列表"
    width="90%"
    :close-on-click-modal="true"
    :show-close="true"
    class="shipping-list-dialog"
    @open="handleDialogOpen"
  >
    <div class="shipping-list" ref="listRef">
      <div
        v-for="item in displayList"
        :key="item.id"
        class="shipping-item"
        @click="handleSelect(item)"
      >
        <div class="shipping-info">
          <div class="main-info">
            <span class="sequence">{{ item.dailySequence }}</span>
            <span class="date">({{ formatDate(new Date(item.createTime), 'MM-DD') }})</span>
          </div>
          <div class="tracking-number">{{ item.trackingNumber }}</div>
        </div>
        <el-icon class="arrow-icon"><ArrowRight /></el-icon>
      </div>
      
      <!-- 展开按钮 -->
      <div v-if="!isExpanded && shippingList.length > 3" class="expand-button" @click="handleExpand">
        <span>展开更多</span>
        <el-icon><ArrowDown /></el-icon>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { ArrowRight, ArrowDown } from '@element-plus/icons-vue'
import { formatDate } from '@/utils/formatTime'
import type { ShippingOrder } from '@/api/temu/order/types'

const props = defineProps<{
  modelValue: boolean
  shippingList: ShippingOrder[]
}>()

const emit = defineEmits(['update:modelValue', 'select'])

const visible = ref(props.modelValue)
const isExpanded = ref(false)
const listRef = ref<HTMLElement | null>(null)

// 根据展开状态显示不同数量的列表项
const displayList = computed(() => {
  const sortedList = [...props.shippingList].sort((a, b) => b.createTime - a.createTime)
  return isExpanded.value ? sortedList : sortedList.slice(0, 3)
})

// 处理展开按钮点击
const handleExpand = () => {
  isExpanded.value = true
}

// 处理对话框打开
const handleDialogOpen = () => {
  isExpanded.value = false
  // 重置滚动位置
  if (listRef.value) {
    listRef.value.scrollTop = 0
  }
}

watch(() => props.modelValue, (newVal) => {
  visible.value = newVal
})

watch(() => visible.value, (newVal) => {
  emit('update:modelValue', newVal)
})

const handleSelect = (item: ShippingOrder) => {
  emit('select', item)
  visible.value = false
}
</script>

<style lang="scss" scoped>
.shipping-list-dialog {
  :deep(.el-dialog) {
    border-radius: 16px;
    overflow: hidden;
    margin-top: 20vh !important;
  }

  :deep(.el-dialog__header) {
    margin: 0;
    padding: 16px 20px;
    border-bottom: 1px solid #eee;
    
    .el-dialog__title {
      font-size: 18px;
      font-weight: bold;
    }
  }

  :deep(.el-dialog__body) {
    padding: 0;
  }
}

.expand-button {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  color: #409EFF;
  font-size: 15px;
  cursor: pointer;
  background: #fff;
  border-top: 1px solid #f0f0f0;
  transition: all 0.2s;

  &:hover {
    background: #f5f7fa;
  }

  span {
    margin-right: 4px;
  }

  .el-icon {
    font-size: 16px;
  }
}

.shipping-list {
  max-height: 60vh;
  overflow-y: auto;
  scroll-behavior: smooth;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: #dcdfe6;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-track {
    background-color: #f5f7fa;
  }
}

.shipping-item {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: all 0.2s;
  background: #fff;

  &:hover {
    background: #f5f7fa;
  }

  .shipping-info {
    flex: 1;

    .main-info {
      display: flex;
      align-items: baseline;
      margin-bottom: 4px;

      .sequence {
        font-size: 20px;
        font-weight: bold;
        color: #409EFF;
      }

      .date {
        margin-left: 8px;
        font-size: 15px;
        color: #909399;
      }
    }

    .tracking-number {
      font-size: 18px;
      color: #606266;
      font-family: Consolas, Monaco, monospace;
      letter-spacing: 0.5px;
    }
  }

  .arrow-icon {
    color: #909399;
    font-size: 20px;
    margin-left: 16px;
  }
}
</style> 