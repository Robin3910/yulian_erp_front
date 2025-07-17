<template>
  <div class="mobile-barcode-reader">
    <!-- 顶部导航栏 -->
    <div class="nav-header">
      <span class="title">条码识别</span>
    </div>

    <!-- 上传区域 -->
    <div class="upload-section" v-if="!result && !searchResults.length">
      <div class="preview-container" v-if="imageUrl">
        <img :src="imageUrl" alt="条码图片" class="preview-image" />
        <div class="preview-actions">
          <el-button type="danger" plain @click="resetImage">重新选择</el-button>
        </div>
      </div>
      
      <div v-else class="upload-buttons">
        <el-button type="primary" size="large" @click="handleStartCamera">
          <el-icon class="icon"><Camera /></el-icon>
          拍照扫码
        </el-button>
        <el-button type="info" size="large" @click="openGallery">
          <el-icon class="icon"><Picture /></el-icon>
          从相册选择
        </el-button>
        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          style="display: none"
          @change="handleFileSelect"
        />
      </div>

      <div class="upload-hint">
        支持 png、jpg、jpeg、bmp、gif 格式，最大 4MB
      </div>
    </div>

    <!-- 识别结果 -->
    <div v-if="result && !searchResults.length" class="result-section">
      <!-- 顶部操作栏 -->
      <div class="action-bar">
        <el-button type="primary" plain @click="resetResult">
          <el-icon><Back /></el-icon>
          重新识别
        </el-button>
        <span class="result-title">识别结果</span>
      </div>

      <!-- 结果展示 -->
      <div class="result-content">
        <div class="result-card">
          <div class="result-header">
            <el-icon class="result-icon"><SuccessFilled /></el-icon>
            <span class="result-text">识别成功</span>
          </div>
          <div class="barcode-result">
            <div class="barcode-label">条码内容：</div>
            <div class="barcode-value">{{ result }}</div>
          </div>
          <div class="result-actions">
            <el-button type="primary" @click="copyResult">
              <el-icon><CopyDocument /></el-icon>
              复制条码
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 搜索结果列表 -->
    <div v-if="searchResults.length" class="search-results">
      <!-- 顶部操作栏 -->
      <div class="action-bar">
        <el-button type="primary" plain @click="resetSearch">
          <el-icon><Back /></el-icon>
          重新识别
        </el-button>
        <span class="result-count">找到 {{ searchResults.length }} 个结果</span>
      </div>
      <!-- 结果列表 -->
      <div class="message-list">
        <div
          v-for="(order, index) in filteredResults"
          :key="order.orderNo || index"
          class="message-item"
        >
          <!-- 内容卡片 -->
          <div class="content-section">
            <div class="top-row" v-if="order.sortingSequence && order.sortingSequence !== '0'">
                <span class="main-title">
                  中包：{{ order.sortingSequence }}
                </span>
              </div>
            <div class="bottom-row">
              <span class="main-title" style="color: #409EFF;">{{ order.customSku }}</span>
            </div>
            <div class="bottom-row">
              <span class="sub-info">
                官网 <span :class="['highlight-value', order.originalQuantity > 1 ? 'highlight-strong' : '']">{{ order.originalQuantity }}</span>
                &nbsp;&nbsp;&nbsp;制作 <span class="highlight-value">{{ order.quantity }}</span>
                <el-tooltip
                  :content="order.productProperties"
                  placement="bottom"
                  effect="dark"
                  trigger="click"
                >
                  <span
                    class="product-properties-ellipsis"
                    :title="order.productProperties"
                    style="cursor: pointer; margin-left: 18px;"
                  >
                    属性 <span class="highlight-value">{{ truncateProductProperties(order.productProperties) }}</span>
                  </span>
                </el-tooltip>
              </span>
            </div>
            <div class="bottom-row" v-if="order.customTextList && !(order.customTextList.length === 1 && order.customTextList === ',')">
              <span class="custom-text-label">定制文字</span>
              <el-tooltip
                :content="order.customTextList"
                placement="bottom"
                effect="dark"
                trigger="click"
              >
                <span
                  class="custom-text-ellipsis highlight-value"
                  :title="order.customTextList"
                  style="cursor: pointer;"
                >
                  {{ truncateCustomText(order.customTextList) }}
                </span>
              </el-tooltip>
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
          <!-- 按钮组移动到图片下方 -->
          <div class="button-group">
            <el-button
              type="primary"
              size="small"
              @click="handleViewAllOrders(order)"
              class="order-btn"
            >
              <el-icon class="order-icon">
                <Document />
              </el-icon>
              查看中包
            </el-button>
            <el-button
              v-if="order.trackingNumber"
              type="success"
              size="small"
              @click="showShippingDetail(order)"
              class="shipping-btn"
            >
              <el-icon class="shipping-icon">
                <Van />
              </el-icon>
              查看物流
            </el-button>
          </div>
          <!-- 卡片最下方加提示 -->
          <div
            v-if="order.trackingNumber == null"
            class="no-tracking-tip"
            style="margin-top: 12px; color: #e6a23c; font-size: 14px; text-align: left;"
          >
            当前订单暂未同步物流信息
          </div>
        </div>
      </div>
    </div>

    <!-- 错误提示 -->
    <div v-if="error && !result && !searchResults.length" class="error-section">
      <div class="error-card">
        <div class="error-header">
          <el-icon class="error-icon"><WarningFilled /></el-icon>
          <span class="error-text">识别失败</span>
        </div>
        <div class="error-message">{{ error }}</div>
        <div class="error-actions">
          <el-button type="primary" @click="resetResult">重新识别</el-button>
        </div>
      </div>
    </div>

    <!-- 物流详情抽屉 -->
    <ShippingDetailsDrawer
      v-if="shippingDrawerVisible && shippingData"
      v-model="shippingDrawerVisible"
      :shipping-data="shippingData"
    />

    <!-- 相机组件 -->
    <BarcodeCameraView
      v-if="showCamera"
      @capture="handleCameraCapture"
      @close="showCamera = false"
    />

    <!-- 加载中 -->
    <el-loading 
      v-model="loading" 
      text="识别并查询中..."
      background="rgba(24, 25, 26, 0.9)"
    />

    <!-- 全部订单弹窗 -->
    <OrderListDrawer
      v-model="showAllOrdersDialog"
      :searchResults="filteredOrdersForDialog"
      :seq="seq"
      :date="date"
      :defaultAvatar="defaultAvatar"
      :activeOrderIndex="activeOrderIndex"
      :formatDate="formatDate"
      @update:active-order-index="val => activeOrderIndex = val"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { Camera, Picture, Back, SuccessFilled, WarningFilled, CopyDocument, Van, Document } from '@element-plus/icons-vue';
import Quagga from 'quagga';
import { BrowserMultiFormatReader } from '@zxing/library';
import BarcodeCameraView from './components/BarcodeCameraView.vue';
import { searchByBarcode } from '@/api/temu/image-search';
import { OrderApi } from '@/api/temu/order';
import type { OrderResult, ShippingOrder } from '@/api/temu/order/types';
import ShippingDetailsDrawer from '@/views/temu/order/image-search/phone/components/ShippingDetailsDrawer.vue';
import OrderListDrawer from './components/OrderListDrawer.vue';

const defaultAvatar = 'https://img.yzcdn.cn/vant/cat.jpeg';

const imageUrl = ref<string | null>(null);
const result = ref<string | null>(null);
const error = ref<string | null>(null);
const loading = ref(false);
const showCamera = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);
const searchResults = ref<OrderResult[]>([]);
const shippingData = ref<ShippingOrder | null>(null);
const shippingDrawerVisible = ref(false);
let fileRaw: File | null = null;
const showAllOrdersDialog = ref(false);
const activeOrderIndex = ref(-1); // 默认无高亮
const currentClickedOrder = ref<OrderResult | null>(null); // 新增：当前点击的订单
const shippingCache = ref<Record<string, ShippingOrder | null>>({});


// 按物流序号排序的结果
const sortedResults = computed(() => {
  return [...searchResults.value].sort((a, b) => {
    if (a.dailySequence && b.dailySequence) {
      return a.dailySequence - b.dailySequence;
    } else if (a.dailySequence) {
      return -1;
    } else if (b.dailySequence) {
      return 1;
    } else {
      return a.orderNo.localeCompare(b.orderNo);
    }
  });
});

// 新增 filteredResults 计算属性
const filteredResults = computed(() => {
  if (!result.value) return [];
  return searchResults.value.filter(order => order.goodsSnNo === result.value);
});

// 新增：根据当前点击订单过滤的订单列表
const filteredOrdersForDialog = computed(() => {
  if (!currentClickedOrder.value) return [];
  return searchResults.value.filter(order => 
    order.orderNo === currentClickedOrder.value?.orderNo && 
    order.sku === currentClickedOrder.value?.sku
  );
});

const pickedCount = computed(() => searchResults.value.filter(item => item.isCompleteProducerTask === 1).length);
const totalCount = computed(() => searchResults.value.length);
const pickingPercent = computed(() => totalCount.value === 0 ? 0 : Math.round((pickedCount.value / totalCount.value) * 100));

// 弹窗标题：中包X 全部订单 Y个
const allOrdersDialogTitle = computed(() => {
  const seq = currentClickedOrder.value?.sortingSequence || '--';
  return `中包${seq} 共 ${filteredOrdersForDialog.value.length}个订单`;
});

// 标题相关
const seq = computed(() => currentClickedOrder.value?.sortingSequence || '--');
const date = computed(() => {
  const ts = currentClickedOrder.value?.bookingTime;
  if (!ts) return '';
  const d = new Date(ts);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${mm}-${dd}`;
});

// 新增：处理查看中包详情点击
const handleViewAllOrders = (order: OrderResult) => {
  currentClickedOrder.value = order;
  showAllOrdersDialog.value = true;
};

// 开始相机拍照
const handleStartCamera = () => {
  resetImage();
  showCamera.value = true;
};

// 处理相机拍照结果
const handleCameraCapture = async (file: File) => {
  showCamera.value = false;
  await processImageFile(file);
};

// 重置图片
const resetImage = () => {
  imageUrl.value = null;
  if (fileInput.value) {
    fileInput.value.value = '';
  }
  fileRaw = null;
  result.value = null;
  error.value = null;
  searchResults.value = [];
  shippingData.value = null;
  currentClickedOrder.value = null; // 清空当前点击的订单
};

// 重置结果
const resetResult = () => {
  result.value = null;
  error.value = null;
  searchResults.value = [];
  currentClickedOrder.value = null; // 清空当前点击的订单
};

// 重置搜索
const resetSearch = () => {
  searchResults.value = [];
  currentClickedOrder.value = null; // 清空当前点击的订单
  resetImage();
};

// 打开相册
const openGallery = () => {
  resetImage();
  if (fileInput.value) {
    fileInput.value.click();
  }
};

// 处理文件选择
const handleFileSelect = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (!input.files?.length) return;

  const file = input.files[0];
  await processImageFile(file);
};

// 处理图片文件
const processImageFile = async (file: File) => {
  // 验证文件类型
  const isValidType = ['image/png', 'image/jpeg', 'image/bmp', 'image/gif'].includes(file.type);
  if (!isValidType) {
    ElMessage.error('只支持 PNG、JPG、JPEG、BMP、GIF 格式的图片！');
    return;
  }

  // 显示预览图
  imageUrl.value = URL.createObjectURL(file);
  fileRaw = file;
  await decodeBarcode();
};

// 复制结果
const copyResult = async () => {
  if (result.value) {
    try {
      await navigator.clipboard.writeText(result.value);
      ElMessage.success('条码已复制到剪贴板');
    } catch (err) {
      ElMessage.error('复制失败');
    }
  }
};

// 根据条码查询订单
const searchOrderByBarcode = async () => {
  if (!result.value) {
    ElMessage.warning('请先识别条码');
    return;
  }
  try {
    const response = await searchByBarcode(result.value);
    searchResults.value = response;
    // 检查 trackingNumber
    if (!searchResults.value.length || !searchResults.value[0].trackingNumber) {
      shippingData.value = null;
      ElMessage.warning('该订单暂无物流信息');
    } else {
      const tn = searchResults.value[0].trackingNumber;
      // 直接请求，不再使用缓存
      const shippingRes = await OrderApi.getShippingOrderPage({
        trackingNumber: tn,
        pageNo: 1,
        pageSize: 10
      });
      if (shippingRes.list && shippingRes.list.length > 0) {
        shippingData.value = shippingRes.list[0];
      } else {
        shippingData.value = null;
      }
    }
    loading.value = false;
  } catch (error) {
    ElMessage.error('查询订单失败，请重试');
    shippingData.value = null;
    loading.value = false;
  }
};

async function decodeBarcode() {
  if (!fileRaw) return;
  result.value = null;
  error.value = null;
  loading.value = true;
  
  try {
    const reader = new FileReader();
    reader.onload = function(e) {
      Quagga.decodeSingle({
        src: e.target?.result as string,
        numOfWorkers: 0,
        inputStream: {
          size: 800
        },
        decoder: {
          readers: ['ean_reader', 'code_128_reader', 'upc_reader', 'code_39_reader']
        }
      }, function(res) {
        if (res && res.codeResult) {
          result.value = res.codeResult.code;
          loading.value = false;
          // 识别成功后自动查询订单
          searchOrderByBarcode();
        } else {
          console.log('Quagga 未识别到条码，也没有定位框，尝试用ZXing识别整张图片');
          zxingDecode(imageUrl.value!, false);
        }
      });
    };
    reader.readAsDataURL(fileRaw);
  } catch (e: any) {
    error.value = '识别失败，请确认图片为有效条码。';
    loading.value = false;
    
  }
}

async function zxingDecode(imageDataUrl: string, isZoomed = false, scale = 1.2, tryCount = 0) {
  const codeReader = new BrowserMultiFormatReader();
  try {
    const resultZXing = await codeReader.decodeFromImageUrl(imageDataUrl);
    result.value = resultZXing.getText();
    error.value = null;
    loading.value = false;
    // 识别成功后自动查询订单
    searchOrderByBarcode();
  } catch (e) {
    if (!isZoomed) {
      console.log('ZXing 也无法识别该条码，开始进行放大图片识别...');
      const zoomedDataUrl = await zoomImage(imageDataUrl, scale);
      await zxingDecode(zoomedDataUrl, true, scale, 1);
    } else if (tryCount < 3
     && scale < 2.0) {
      const nextScale = scale + 0.2;
      console.log(`放大重试，当前 scale: ${nextScale.toFixed(1)}`);
      const zoomedDataUrl = await zoomImage(imageDataUrl, nextScale);
      await zxingDecode(zoomedDataUrl, true, nextScale, tryCount + 1);
    } else {
      error.value = 'ZXing 也无法识别该条码。';
      loading.value = false;
    }
  }
}

async function zoomImage(imageDataUrl: string, scale = 2): Promise<string> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = function() {
      const fullWidth = img.width * scale;
      const fullHeight = img.height * scale;
      const cropX = fullWidth * 0.1;
      const cropY = fullHeight * 0.1;
      const cropWidth = fullWidth * 0.8;
      const cropHeight = fullHeight * 0.8;
      const canvas = document.createElement('canvas');
      canvas.width = cropWidth;
      canvas.height = cropHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(
        img,
        cropX / scale,
        cropY / scale,
        img.width * 0.8,
        img.height * 0.8,
        0,
        0,
        cropWidth,
        cropHeight
      );
      resolve(canvas.toDataURL());
    };
    img.src = imageDataUrl;
  });
}

function formatDate(ts?: number) {
  if (!ts) return '';
  const date = new Date(ts)
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${mm}-${dd}`;
}

const showShippingDetail = async (order: OrderResult) => {
  const tn = order.trackingNumber;
  if (!tn) {
    ElMessage.warning('该订单暂无物流信息');
    return;
  }
  // 直接请求，不再使用缓存
  const shippingRes = await OrderApi.getShippingOrderPage({
    trackingNumber: tn,
    pageNo: 1,
    pageSize: 10
  });
  if (shippingRes.list && shippingRes.list.length > 0) {
    shippingData.value = shippingRes.list[0];
    shippingDrawerVisible.value = true;
  } else {
    ElMessage.warning('该订单暂无物流信息');
  }
};

function truncateProductProperties(val: string) {
  if (!val) return '';
  return val.length > 13 ? val.slice(0, 13) + '...' : val;
}
function truncateCustomText(val: string) {
  if (!val) return '';
  return val.length > 15 ? val.slice(0, 15) + '...' : val;
}

</script>

<style lang="scss" scoped>
:deep(.el-drawer__body) {
  padding-top: 0px !important; /* 你想要的间距 */
}
.mobile-barcode-reader {
  background: #f5f7fa;
  min-height: 100vh;
}
.dark .mobile-barcode-reader {
  background: #18191A;
}

.nav-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 44px;
  background-color: #232323;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  z-index: 100;

  .title {
    font-size: 17px;
    font-weight: 600;
    color: #fff;
  }
}

.upload-section {
  padding: 64px 20px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 64px);

  .preview-container {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;

    .preview-image {
      width: 100%;
      max-width: 300px;
      height: auto;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .preview-actions {
      display: flex;
      gap: 12px;
    }
  }

  .upload-buttons {
    display: flex;
    flex-direction: column;
    gap: 16px;
    width: 100%;
    max-width: 300px;

    .el-button {
      width: 100%;
      height: 48px;
      border-radius: 24px;
      font-size: 16px;

      .icon {
        font-size: 20px;
        margin-right: 8px;
      }
    }
  }

  .upload-hint {
    margin-top: 16px;
    color: #909399;
    font-size: 14px;
    text-align: center;
  }
}

.result-section {
  padding: 64px 20px 20px;
  min-height: 100vh;

  .action-bar {
    position: fixed;
    top: 44px;
    left: 0;
    right: 0;
    padding: 10px;
    background-color: #232323;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
    z-index: 99;

    .result-title {
      font-size: 16px;
      font-weight: 600;
      color: #fff;
    }
  }

  .result-content {
    padding-top: 60px;

    .result-card {
      background-color: #232323;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);

      .result-header {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 16px 0 8px 0;
        border-bottom: 1px solid #333;

        .result-icon {
          font-size: 24px;
          color: #67c23a;
          margin-right: 8px;
        }

        .result-text {
          font-size: 18px;
          font-weight: 600;
          color: #67c23a;
        }
      }

      .barcode-result {
        margin-bottom: 24px;

        .barcode-label {
          font-size: 14px;
          color: #909399;
          margin-bottom: 8px;
        }

        .barcode-value {
          font-size: 20px;
          font-weight: 600;
          color: #fff;
          word-break: break-all;
          padding: 12px;
          background-color: #18191A;
          border-radius: 8px;
          border: 1px solid #333;
        }
      }

      .result-actions {
        display: flex;
        justify-content: center;

        .el-button {
          width: 200px;
          height: 44px;
          border-radius: 22px;
          font-size: 16px;

          .el-icon {
            margin-right: 8px;
          }
        }
      }
    }
  }
}

.search-results {
  padding: 10px 10px 10px;
  min-height: 100vh;

  .action-bar {
    position: fixed;
    top: 44px;
    left: 0;
    right: 0;
    padding: 10px;
    background-color: #232323;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
    z-index: 99;

    .result-count {
      font-size: 14px;
      color: #aaa;
    }
  }

  .message-list {
    padding: 60px 0 0 0;

    .message-item {
      display: flex;
      flex-direction: column;
      align-items: stretch;
      background: #232323;
      border-radius: 16px;
      margin: 24px auto 0 auto;
      padding: 16px 20px;
      max-width: 400px;
      box-sizing: border-box;

      .top-flex {
        display: flex;
        flex-direction: row;
        align-items: flex-start;
        width: 100%;
      }

      .avatar-section {
        .avatar {
          width: 48px;
          height: 48px;
          border-radius: 8px; // 或 0，8px更美观
          object-fit: cover;
        }
      }

      .content-section {
        flex: 1;
        margin-left: 14px;
        .top-row {
          display: flex;
          justify-content: space-between;
        }
        .middle-row {
          margin: 4px 0;
          .group-tag {
            background: #2d2d2d;
            color: #f56c6c;
            border: none;
            margin-right: 4px;
          }
        }
        .bottom-row {
          .sub-info {
            color: #aaa;
            font-size: 13px;
            margin-right: 12px;
          }
        }
      }

      .main-title {
        color: #fff;
        font-weight: bold;
        font-size: 18px;
      }

      .sub-info {
        color: #aaa;
        font-size: 15px;
      }

      .time {
        color: #888;
        font-size: 13px;
      }

      .picking-progress-list {
        width: 100%;
        margin-top: 12px;
        .picking-progress-item {
          position: relative;
          margin-bottom: 12px;

          .sorting-sequence-label {
            position: absolute;
            left: 0;
            top: -18px;
            font-size: 13px;
            color: #bbb;
            font-weight: 500;
          }
          .progress-bar-wrap {
            position: relative;
            .picking-progress-bar {
              margin: 0;
              --el-progress-bar-height: 6px;
              .el-progress-bar__outer {
                background: #444 !important;
                border-radius: 4px !important;
              }
              .el-progress-bar__inner {
                border-radius: 4px !important;
              }
              .el-progress--exception .el-progress-bar__inner {
                background: #f56c6c !important;
              }
              .el-progress--success .el-progress-bar__inner {
                background: #67c23a !important;
              }
            }
            .progress-status-text {
              position: absolute;
              right: 0;
              top: -18px;
              font-size: 13px;
              color: #bbb;
              font-weight: 500;
            }
          }
          .picking-progress-status {
            font-size: 13px;
            color: #bbb;
            margin-left: 2px;
            margin-bottom: 2px;
          }
        }
      }
    }
  }
}

.error-section {
  padding: 64px 20px 20px;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;

  .error-card {
    background-color: #232323;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
    width: 100%;
    max-width: 300px;

    .error-header {
      display: flex;
      align-items: center;
      margin-bottom: 16px;

      .error-icon {
        font-size: 24px;
        color: #f56c6c;
        margin-right: 8px;
      }

      .error-text {
        font-size: 18px;
        font-weight: 600;
        color: #f56c6c;
      }
    }

    .error-message {
      font-size: 14px;
      color: #aaa;
      margin-bottom: 20px;
      line-height: 1.5;
    }

    .error-actions {
      .el-button {
        width: 100%;
        height: 44px;
        border-radius: 22px;
        font-size: 16px;
      }
    }
  }
}

.picking-progress-item {
  position: relative;
  margin-bottom: 24px;

  .sorting-sequence-label {
    position: absolute;
    left: 0;
    top: -18px;
    font-size: 13px;
    color: #bbb;
    font-weight: 500;
  }
  .progress-status-text {
    position: absolute;
    right: 0;
    top: -18px;
    font-size: 13px;
    color: #bbb;
    font-weight: 500;
  }
}

.no-tracking-tip {
  margin-top: 12px;
  color: #e6a23c;
  font-size: 14px;
  text-align: left;
  font-weight: 500;
}

.order-dialog-list {
  max-height: 70vh;
  overflow-y: auto;
  padding: 8px 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
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
// 弹窗标题样式
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
// 优化拣货标签样式
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
  /* 只保留多件标识，不加背景和边框 */
  position: relative;
  /* 其他高亮样式去掉 */
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
  background: #fff; /* 改为白色 */
  box-shadow: 0 4px 24px rgba(64, 158, 255, 0.10);
}
/* 普通卡片内容字体为浅色 */
.order-dialog-sku,
.order-dialog-sub-info,
.order-dialog-time {
  color: #fff;
}

/* 高亮卡片内容字体为深色 */
.order-dialog-card-active .order-dialog-sku,
.order-dialog-card-active .order-dialog-sub-info,
.order-dialog-card-active .order-dialog-time {
  color: #232323 !important;
  text-shadow: none;
}
:deep(.el-drawer__header) {
  padding: 0px 16px 0 16px !important;
  min-height: 0 !important;
  margin-bottom: 0 !important;
  height: auto !important;
  display: block;
  
}
.search-results{
    padding: 0px 0px 0px;
    min-height: 100vh;
}
.search-results .message-list{
    padding: 0px 0 0 0;
}
.search-results .message-list .message-item {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    background: linear-gradient(135deg, #232323 80%, #2d2d2d 100%);
    border-radius: 16px;
    margin: 7px auto 0 auto;
    padding: 16px 20px;
    max-width: 400px;
    box-sizing: border-box;
    box-shadow: 0 4px 24px rgba(0,0,0,0.18), 0 1.5px 6px rgba(64,158,255,0.08);
    border: 1.5px solid rgba(255,255,255,0.08);
    transition: box-shadow 0.2s, border 0.2s;
}
.search-results .message-list .message-item:hover {
  box-shadow: 0 8px 32px rgba(64,158,255,0.18), 0 2px 8px rgba(0,0,0,0.18);
  border: 1.5px solid #409EFF;
  z-index: 2;
}
.button-group {
  display: flex;
  flex-direction: row;      // 横向排列
  gap: 8px;                 // 按钮间距
  width: 100%;
  max-width: 220px;         // 可根据实际调整
  margin: 12px auto 0 auto; // 居中并与图片有间距
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
  .order-icon,
  .shipping-icon {
    font-size: 16px;
    margin-right: 4px;
    display: flex;
    align-items: center;
  }
  .shipping-btn {
    background: #67c23a !important;
    color: #fff !important;
    border: none;
    font-weight: 500;
  }
}
.el-button+.el-button {
    margin-left: 0px;
}

/* 新增头像卡片样式 */
.avatar-card {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 auto 8px auto;
  background: #232323;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.18), 0 1.5px 6px rgba(64,158,255,0.08);
  border: 1.5px solid rgba(255,255,255,0.08);
  transition: box-shadow 0.2s, border 0.2s;
  padding: 8px 0;         // 内边距缩小
  max-width: 400px;
  width: 100%;
}
.avatar-card:hover {
  box-shadow: 0 8px 32px rgba(64,158,255,0.18), 0 2px 8px rgba(0,0,0,0.18);
  border: 1.5px solid #409EFF;
}
.avatar-large {
  width: 100%;            // 占满卡片
  height: auto;           // 高度自适应
  border-radius: 12px;
  object-fit: contain;    // 保证完整显示
  display: block;
}
//中包字体
.search-results .message-list .message-item .main-title {
    color: #fff;
    font-weight: bold;
    font-size: 25px;
}
//定制sku字体
.search-results .message-list .message-item .content-section .bottom-row .sub-info[data-v-a0067421] {
    color: #aaa;
    font-size: 15px;
    margin-right: 12px;
}
//日期字体
.search-results .message-list .message-item .time[data-v-a0067421] {
    color: #888;
    font-size: 18px;
}
.search-results .message-list .message-item .time {
  color: #888;
  font-size: 18px;
  margin-left: 12px;
  white-space: nowrap;
}
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
}

.drawer-title-row {
  display: flex;
  align-items: center;
  width: 100%;
  justify-content: space-between;
}

.drawer-title-main-row {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
}

.drawer-title-tracking-row {
  margin-top: 2px;
  font-size: 13px; // 缩小副标题字号
  color: #409EFF;
  font-weight: 500;
  word-break: break-all;
  width: 100%;
  .tracking-number {
    font-family: monospace;
    color: #409EFF;
    font-weight: bold;
    margin-left: 4px;
    font-size: 13px;
  }
}

/* 复用ShippingDetailsDrawer卡片样式 */
.message-item {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  background: #232323;
  border-radius: 16px;
  margin: 24px auto 0 auto;
  padding: 16px 20px;
  max-width: 400px;
  box-sizing: border-box;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  border: 1.5px solid rgba(255,255,255,0.08);
  transition: box-shadow 0.2s, border 0.2s;
}
.message-item:hover {
  box-shadow: 0 4px 24px rgba(64,158,255,0.10);
  border: 1.5px solid #409EFF;
  z-index: 2;
}
.content-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-bottom: 8px;
}
.top-row {
  display: flex;
  align-items: center;
  .main-title {
    color: #fff;
    font-weight: bold;
    font-size: 18px;
  }
}
.bottom-row {
  margin-bottom: 4px;
  .main-title {
    color: #409EFF;
    font-weight: bold;
    font-size: 18px;
  }
  .sub-info {
    color: #aaa;
    font-size: 15px;
    margin-right: 12px;
  }
}
.custom-text-label {
  color: #aaa;
  font-weight: 500;
  margin-left: 0px;
  margin-right: 2px;
  font-size: 15px;
}
.highlight-value {
  color: #fff;
  font-weight: bold;
  margin-left: 8px;
  font-size: 17px;
  letter-spacing: 1px;
}
.highlight-strong {
  color: #ff9800;
  font-weight: 900;
  font-size: 20px;
  text-shadow: 0 1px 4px rgba(255,152,0,0.12);
}
.avatar-card {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 auto 8px auto;
  background: #232323;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  border: 1.5px solid rgba(255,255,255,0.08);
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
.product-properties-ellipsis {
  max-width: 170px;
  display: inline-block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: bottom;
}
.custom-text-ellipsis {
  max-width: 160px;
  display: inline-block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: bottom;
}
</style>



