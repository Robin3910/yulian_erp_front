<template>
  <div class="search-history">
    <div class="history-header">
      <h3>搜索历史</h3>
      <el-button 
        type="danger" 
        link 
        @click="clearHistory"
        v-if="searchHistory.length > 0"
      >
        清空历史
      </el-button>
    </div>
    <div class="history-list" v-if="searchHistory.length > 0">
      <div 
        v-for="(item, index) in searchHistory" 
        :key="index" 
        class="history-item"
        @click="handleItemClick(item)"
      >
        <div class="item-content">
          <div class="image-preview">
            <el-image
              :src="item.imageUrl"
              fit="cover"
              :preview-src-list="[item.imageUrl]"
              hide-on-click-modal
              preview-teleported
            />
          </div>
          <div class="item-info">
            <div class="search-time">{{ formatTime(item.searchTime) }}</div>
            <div class="result-count">找到 {{ item.resultCount }} 个相似商品</div>
          </div>
        </div>
        <el-button 
          type="danger" 
          link 
          class="delete-btn"
          @click.stop="deleteHistoryItem(index)"
        >
          删除
        </el-button>
      </div>
    </div>
    <div v-else class="empty-history">
      <el-empty description="暂无搜索历史" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import { formatDate } from '@/utils/formatTime'

interface SearchHistoryItem {
  imageUrl: string
  searchTime: number
  resultCount: number
  searchResults: any[] // 存储搜索结果
}

const emit = defineEmits(['select-history'])

const searchHistory = ref<SearchHistoryItem[]>([])

// 从 localStorage 加载历史记录
const loadHistory = () => {
  const history = localStorage.getItem('imageSearchHistory')
  if (history) {
    searchHistory.value = JSON.parse(history)
  }
}

// 保存历史记录到 localStorage
const saveHistory = () => {
  localStorage.setItem('imageSearchHistory', JSON.stringify(searchHistory.value))
}

// 添加新的搜索记录
const addSearchHistory = (item: SearchHistoryItem) => {
  // 限制历史记录数量为10条
  if (searchHistory.value.length >= 10) {
    searchHistory.value.pop()
  }
  searchHistory.value.unshift(item)
  saveHistory()
}

// 删除单条历史记录
const deleteHistoryItem = async (index: number) => {
  try {
    await ElMessageBox.confirm('确定要删除这条搜索记录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    searchHistory.value.splice(index, 1)
    saveHistory()
    ElMessage.success('删除成功')
  } catch {
    // 用户取消删除
  }
}

// 清空所有历史记录
const clearHistory = async () => {
  try {
    await ElMessageBox.confirm('确定要清空所有搜索历史吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    searchHistory.value = []
    localStorage.removeItem('imageSearchHistory')
    ElMessage.success('清空成功')
  } catch {
    // 用户取消清空
  }
}

// 点击历史记录项
const handleItemClick = (item: SearchHistoryItem) => {
  emit('select-history', item)
}

// 格式化时间
const formatTime = (timestamp: number) => {
  return formatDate(new Date(timestamp), 'YYYY-MM-DD HH:mm:ss')
}

// 组件挂载时加载历史记录
onMounted(() => {
  loadHistory()
})

// 暴露方法给父组件
defineExpose({
  addSearchHistory
})
</script>

<style lang="scss" scoped>
.search-history {
  margin-top: 20px;
  padding: 16px;
  background: var(--el-bg-color);
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);

  .history-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    h3 {
      margin: 0;
      font-size: 16px;
      color: var(--el-text-color-primary);
    }
  }

  .history-list {
    display: flex;
    flex-direction: column;
    gap: 12px;

    .history-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px;
      background: var(--el-fill-color-light);
      border-radius: 8px;
      transition: all 0.3s ease;
      cursor: pointer;

      &:hover {
        background: var(--el-fill-color);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);

        .delete-btn {
          opacity: 1;
        }
      }

      .item-content {
        display: flex;
        align-items: center;
        gap: 16px;
        flex: 1;

        .image-preview {
          width: 80px;
          height: 80px;
          border-radius: 6px;
          overflow: hidden;
          flex-shrink: 0;
          border: 1px solid var(--el-border-color-lighter);

          :deep(.el-image) {
            width: 100%;
            height: 100%;
            
            img {
              object-fit: contain;
              width: 100%;
              height: 100%;
              background: white;
            }
          }
        }

        .item-info {
          flex: 1;

          .search-time {
            font-size: 14px;
            color: var(--el-text-color-primary);
            margin-bottom: 6px;
          }

          .result-count {
            font-size: 13px;
            color: var(--el-text-color-secondary);
          }
        }
      }

      .delete-btn {
        opacity: 0;
        transition: opacity 0.3s ease;
      }
    }
  }

  .empty-history {
    padding: 40px 0;
  }
}
</style> 