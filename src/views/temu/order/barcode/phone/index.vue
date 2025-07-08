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
        <div v-for="(order, index) in sortedResults" :key="order.orderNo || index" class="message-item">
          <div class="top-flex">
            <div class="avatar-section">
              <el-image
                :src="order.effectiveImgUrl || defaultAvatar"
                :preview-src-list="order.effectiveImgUrl ? [order.effectiveImgUrl] : [defaultAvatar]"
                fit="cover"
                class="avatar"
              />
            </div>
            <div class="content-section">
              <div class="top-row">
                <span class="main-title">
                  {{ order.dailySequence || '--' }}<span v-if="'sortingSequence' in order && order.sortingSequence != null">-{{ order.sortingSequence }}</span>
                </span>
                <span class="time">{{ formatDate(order.shippingTime) }}</span>
              </div>
              <div class="middle-row">
                <span class="sub-info">顺丰单号 {{ order.trackingNumber }}</span>
              </div>
              <div class="bottom-row">
                <span class="sub-info">定制SKU {{ order.customSku }}</span>
              </div>
              <div class="bottom-row">
                <span class="sub-info">官网 {{ order.originalQuantity }}&nbsp;&nbsp;&nbsp;制作 {{ order.quantity }}</span>
              </div>
            </div>
          </div>
          <div v-if="shippingData && shippingData.orderNoList && shippingData.orderNoList.length" class="picking-progress-list">
            <div
              v-for="orderGroup in shippingData.orderNoList"
              :key="orderGroup.orderNo"
              class="picking-progress-item">
              <div class="progress-bar-wrap">
                <el-progress
                  :percentage="orderGroup.orderList.length > 0
                    ? Math.round(orderGroup.orderList.filter(item => item.isCompleteProducerTask === 1).length / orderGroup.orderList.length * 100)
                    : 0"
                  :status="orderGroup.orderList.length > 0 && orderGroup.orderList.filter(item => item.isCompleteProducerTask === 1).length === orderGroup.orderList.length ? 'success' : 'exception'"
                  :stroke-width="6"
                  :show-text="false"
                  class="picking-progress-bar"
                />
                <span class="progress-status-text">
                  {{ orderGroup.orderList.filter(item => item.isCompleteProducerTask === 1).length }}/{{ orderGroup.orderList.length }}
                </span>
              </div>
              <div class="picking-progress-status">
                {{ orderGroup.orderList.length > 0 && orderGroup.orderList.filter(item => item.isCompleteProducerTask === 1).length === orderGroup.orderList.length ? '拣货完成' : '拣货中' }}
              </div>
            </div>
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { Camera, Picture, Back, SuccessFilled, WarningFilled, CopyDocument } from '@element-plus/icons-vue';
import Quagga from 'quagga';
import { BrowserMultiFormatReader } from '@zxing/library';
import BarcodeCameraView from './components/BarcodeCameraView.vue';
import { searchByBarcode } from '@/api/temu/image-search';
import { OrderApi } from '@/api/temu/order';
import type { OrderResult, ShippingOrder } from '@/api/temu/order/types';
import printJS from 'print-js';
import ShippingDetailsDrawer from '../../image-search/phone/components/ShippingDetailsDrawer.vue';

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
};

// 重置结果
const resetResult = () => {
  result.value = null;
  error.value = null;
  searchResults.value = [];
};

// 重置搜索
const resetSearch = () => {
  searchResults.value = [];
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
    if (searchResults.value.length > 0 && searchResults.value[0].trackingNumber) {
      try {
        const shippingRes = await OrderApi.getShippingOrderPage({
          trackingNumber: searchResults.value[0].trackingNumber,
          pageNo: 1,
          pageSize: 10
        });
        if (shippingRes.list && shippingRes.list.length > 0) {
          shippingData.value = shippingRes.list[0];
        }
      } catch (err) {
        console.error('自动查物流详情失败', err);
      }
    }
    if (searchResults.value.length === 0) {
      ElMessage.warning('未找到相关订单');
    } else {
      ElMessage.success(`找到 ${searchResults.value.length} 个相关订单`);
    }
  } catch (error) {
    ElMessage.error('查询订单失败，请重试');
    console.error('Barcode search error:', error);
  } finally {
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
  const date = new Date(ts);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${mm}-${dd}`;
}
</script>

<style lang="scss" scoped>
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
          border-radius: 50%;
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
          margin-bottom: 6px;
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
</style>



