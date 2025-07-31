<template v-if="dialogVisible">
  <el-drawer
    v-model="dialogVisible"
    title="物流单详情"
    direction="rtl"
    size="80%"
    :before-close="handleClose"
  >
    <div class="shipping-info-container">
      <!-- 物流单基本信息 -->
      <div class="package-info-panel">
        <div class="panel-header">
          <h3>物流单号：{{ formData.trackingNumber || '-' }}</h3>
          <div v-if="formData.sortingSequence" class="sorting-sequence">
            中包序号：<span class="sequence-value">{{ formData.sortingSequence }}</span>
          </div>
        </div>
      </div>

      <!-- 预览图列表 -->
      <div class="preview-images-container">
        <div v-if="formData.previewData && formData.previewData.length > 0" class="preview-images-grid">
          <div v-for="(item, index) in formData.previewData" :key="index" class="preview-image-item">
            <div class="image-wrapper">
              <!-- 多件标签 -->
              <div v-if="item.isMultiple" class="multiple-badge">多件</div>
              <!-- 根据是否为动漫肖像贺卡显示不同的图片布局 -->
              <template v-if="item.isAnimeCard && item.customImages.length > 0">
                <div class="custom-images-grid" :class="getCustomImagesGridClass(item.customImages.length)">
                  <!-- 添加定制图片标签 -->
                  <div class="custom-image-badge">定制图片</div>
                  <el-image
                    v-for="(imgUrl, imgIndex) in item.customImages"
                    :key="imgIndex"
                    :hide-on-click-modal="true"
                    :preview-teleported="true"
                    :src="imgUrl"
                    :preview-src-list="item.customImages"
                    :initial-index="imgIndex"
                    fit="cover"
                    loading="lazy"
                    class="custom-image"
                  />
                </div>
              </template>
              <el-image
                v-else
                :hide-on-click-modal="true"
                :preview-teleported="true"
                :src="item.imageUrl"
                :preview-src-list="[item.imageUrl]"
                style="width: 300px; height: 300px"
                fit="cover"
                loading="lazy"
                :initial-index="0"
              />
            </div>
            <div class="image-info">
              <div class="order-info">
                <div class="info-row">
                  <div class="custom-text" v-if="item.customTextList">
                    <span class="custom-text-label">定制文字：</span>
                    <span class="custom-text-value">{{ item.customTextList.startsWith(',') ? item.customTextList.substring(1) : item.customTextList }}</span>
                  </div>
                  <div class="product-props" v-if="item.productProperties">
                    <span class="props-label">属性：</span>
                    <span class="props-value">{{ item.productProperties }}</span>
                  </div>
                </div>
                  <!-- 添加SKU信息行 -->
                  <div class="info-row sku-info-row">
                    <div class="sku-info">
                      <div class="sku-item">
                        <span class="sku-label">定制SKU：</span>
                        <span class="sku-value custom-sku">{{ item.customSku || '-' }}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="quantity-info">
                  <div class="quantity-item original">
                    <span class="label">官网数量：</span>
                    <span class="value">{{ item.originalQuantity }}</span>
                  </div>
                  <div class="quantity-item">
                    <span class="label">制作数量：</span>
                    <span class="value">{{ item.quantity }}</span>
                  </div>
                  <div class="quantity-item">
                    <span class="label">所属类目：</span>
                    <span class="value">{{ item.categoryName || '-' }}</span>
                  </div>
                </div>
            </div>
          </div>
        </div>
        <div v-else class="no-data">
          <el-empty description="暂无预览图数据" />
        </div>
      </div>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'

const emit = defineEmits(['confirm'])
defineOptions({
  name: 'ShippingInfoPopup'
})

const dialogVisible = ref(false)
const formData = reactive({
  orderId: '',
  trackingNumber: '',
  sortingSequence: '',
  previewData: [] as Array<{
    imageUrl: string,
    customImages: string[],
    isAnimeCard: boolean,
    originalQuantity: number,
    quantity: number,
    orderNo: string,
    customSku: string,
    customTextList: string,
    productProperties: string,
    isMultiple?: boolean,
    categoryId?: string,
    categoryName?: string
  }>
})

const setVisible = (visible: boolean) => {
  dialogVisible.value = visible
}

const handleClose = () => {
  dialogVisible.value = false
}

// 暴露方法给父组件
defineExpose({
  setVisible,
  formData
})

// 根据图片数量返回对应的网格类名
const getCustomImagesGridClass = (count: number) => {
  if (count <= 1) return 'grid-1'
  if (count <= 2) return 'grid-2'
  if (count <= 4) return 'grid-4'
  return 'grid-6'
}
</script>

<style lang="scss" scoped>
.shipping-info-container {
  padding: 20px;
  height: 100%;
  overflow-y: auto;
}

    .panel-header {
  margin-bottom: 20px;
  border-bottom: 1px solid #ebeef5;
  padding-bottom: 10px;
  
  h3 {
    font-size: 18px;
    color: #303133;
    margin: 0;
    margin-bottom: 10px;
  }

  .sorting-sequence {
    font-size: 16px;
    color: #606266;
    
    .sequence-value {
      color: #409EFF;
      font-weight: bold;
      font-size: 18px;
    }
  }
}

.preview-images-container {
  margin-top: 20px;
}

.preview-images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 30px;
}

.preview-image-item {
  display: flex;
  flex-direction: column;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  }
  
  .image-wrapper {
      display: flex;
    justify-content: center;
      align-items: center;
    padding: 10px;
    background-color: #f5f7fa;
    position: relative; /* 添加相对定位，用于多件标签的绝对定位 */
    
    /* 多件标签样式 */
    .multiple-badge {
      position: absolute;
      top: 8px;
      left: 8px;
      background: linear-gradient(to right, #3498db, #2980b9); /* 平滑蓝色渐变 */
      color: #fff;
      padding: 8px 15px; /* 保持内边距 */
      border-radius: 50px; /* 圆角更大，胶囊形状 */
      font-size: 22px; /* 保持字体大小 */
      font-weight: 800; /* 字体粗细 */
      z-index: 10; /* 确保在最上层 */
      box-shadow: 
        0 4px 10px rgba(0, 0, 0, 0.2), /* 主阴影 */
        0 0 0 3px rgba(52, 152, 219, 0.3), /* 外发光效果 */
        inset 0 1px 0 rgba(255, 255, 255, 0.3); /* 顶部高光 */
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2); /* 文字阴影更微妙 */
      border: none; /* 移除边框 */
      backdrop-filter: blur(2px); /* 背景模糊效果 */
      transform: translateY(-2px); /* 轻微上浮 */
      letter-spacing: 1px; /* 字间距适中 */
      animation: glow 3s infinite alternate; /* 发光动画 */
      
      /* 添加渐变边框 */
      &::before {
        content: '';
        position: absolute;
        top: -2px;
        left: -2px;
        right: -2px;
        bottom: -2px;
        background: linear-gradient(45deg, #3498db, #2ecc71, #3498db);
        border-radius: 52px;
        z-index: -1;
        filter: blur(4px);
        opacity: 0.7;
      }
    }
    
    /* 发光动画 */
    @keyframes glow {
      0% { 
        box-shadow: 
          0 4px 10px rgba(0, 0, 0, 0.2),
          0 0 0 3px rgba(52, 152, 219, 0.3),
          inset 0 1px 0 rgba(255, 255, 255, 0.3);
      }
      100% { 
        box-shadow: 
          0 4px 10px rgba(0, 0, 0, 0.2),
          0 0 0 5px rgba(52, 152, 219, 0.5),
          inset 0 1px 0 rgba(255, 255, 255, 0.3);
      }
    }
  }
  
  .image-info {
    padding: 15px;
    
    .order-info {
      margin-bottom: 10px;
      
      .info-row {
      display: flex;
        flex-direction: row;
        gap: 20px;
        align-items: flex-start;
        flex-wrap: wrap;
      }
      
      .custom-text {
        flex: 1;
        min-width: 200px;
        word-break: break-all;
        
        .custom-text-label {
          font-size: 15px;
          color: #606266;
          font-weight: 500;
        }
        
        .custom-text-value {
          font-size: 22px;
          color: #409EFF;
          font-weight: 700;
          display: inline-block;
          margin-left: 5px;
        }
      }
      
      .product-props {
        flex: 1;
        min-width: 200px;
        
        .props-label {
          font-size: 14px;
          color: #606266;
          font-weight: 500;
        }
        
        .props-value {
          font-size: 14px;
          color: #303133;
          display: inline-block;
          margin-left: 5px;
          line-height: 1.4;
        }
      }

      .sku-info-row {
        margin-top: 10px;
        .sku-info {
          display: flex;
          gap: 20px;
          .sku-item {
            .sku-label {
              font-size: 14px;
              color: #606266;
              font-weight: 500;
            }
            .sku-value {
              font-size: 14px;
              color: #303133;
              font-weight: 500;
            }
            .custom-sku {
              color: #409EFF;
            }
          }
        }
      }
    }
    
    .quantity-info {
      display: flex;
      flex-direction: column;
      gap: 5px;
      
      .quantity-item {
          display: flex;
          align-items: center;
        
        &.original {
            .value {
            font-size: 18px;
            font-weight: bold;
            color: #409EFF;
          }
                }

                .label {
          width: 80px;
          text-align: right;
          margin-right: 8px;
          color: #909399;
                  }

                  .value {
                  font-weight: 500;
          color: #606266;
        }
      }
    }
  }
}

.no-data {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
}

.custom-images-grid {
  width: 300px;
  height: 300px;
  display: grid;
  gap: 4px;
  padding: 4px;
  background: #f5f7fa;
  border-radius: 4px;
  position: relative; // 添加相对定位

  // 添加定制图片标签样式
  .custom-image-badge {
    position: absolute;
    top: 8px;
    right: 8px;
    background: linear-gradient(45deg, #409EFF, #36D1DC);
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: bold;
    z-index: 2;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(4px);
  }

  &.grid-1 {
    grid-template-columns: 1fr;
    .custom-image {
      width: 100%;
      height: 100%;
    }
  }

  &.grid-2 {
    grid-template-columns: repeat(2, 1fr);
    .custom-image {
      width: 100%;
      height: 100%;
    }
  }

  &.grid-4 {
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: repeat(2, 1fr);
    .custom-image {
      width: 100%;
      height: 100%;
    }
  }

  &.grid-6 {
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(2, 1fr);
    .custom-image {
      width: 100%;
      height: 100%;
    }
  }

  .custom-image {
    border-radius: 2px;
    overflow: hidden;
    object-fit: cover;
  }
}
</style>
