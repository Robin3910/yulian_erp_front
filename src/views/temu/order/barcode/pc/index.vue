<template>
  <div class="barcode-reader">
    <el-card>
      <h2>条码识别</h2>
      <el-upload
        class="upload-demo"
        drag
        :show-file-list="false"
        :before-upload="handleBeforeUpload"
        accept="image/*"
      >
        <i class="el-icon-upload"></i>
        <div class="el-upload__text">将图片拖到此处，或<em>点击上传</em></div>
      </el-upload>
      <div v-if="imageUrl" class="preview">
        <img :src="imageUrl" alt="条码图片" style="max-width: 300px; margin-top: 20px;" />
      </div>
      <el-button type="primary" @click="decodeBarcode" :disabled="!imageUrl" style="margin-top: 20px;">识别条码</el-button>
      <div v-if="result" class="result">
        <el-alert :title="'识别结果：' + result" type="success" show-icon style="margin-top: 20px;" />
      </div>
      <div v-if="error && !result" class="error">
        <el-alert :title="error" type="error" show-icon style="margin-top: 20px;" />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Quagga from 'quagga';
import { BrowserMultiFormatReader } from '@zxing/library';

const imageUrl = ref<string | null>(null);
const result = ref<string | null>(null);
const error = ref<string | null>(null);
let fileRaw: File | null = null;

function handleBeforeUpload(file: File) {
  fileRaw = file;
  imageUrl.value = URL.createObjectURL(file);
  result.value = null;
  error.value = null;
  return false; // 阻止自动上传
}

async function decodeBarcode() {
  if (!fileRaw) return;
  result.value = null;
  error.value = null;
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
        } else {
          console.log('Quagga 未识别到条码，也没有定位框，尝试用ZXing识别整张图片');
          zxingDecode(imageUrl.value!, false);
        }
      });
    };
    reader.readAsDataURL(fileRaw);
  } catch (e: any) {
    error.value = '识别失败，请确认图片为有效条码。';
  }
}

async function zxingDecode(imageDataUrl: string, isZoomed = false, scale = 1.2, tryCount = 0) {
  const codeReader = new BrowserMultiFormatReader();
  try {
    const resultZXing = await codeReader.decodeFromImageUrl(imageDataUrl);
    result.value = resultZXing.getText();
    error.value = null; // 识别成功时清空错误
  } catch (e) {
    if (!isZoomed) {
      console.log('ZXing 也无法识别该条码，开始进行放大图片识别...');
      const zoomedDataUrl = await zoomImage(imageDataUrl, scale);
      await zxingDecode(zoomedDataUrl, true, scale, 1);
    } else if (tryCount < 10 && scale < 2.0) {
      const nextScale = scale + 0.2;
      console.log(`放大重试，当前 scale: ${nextScale.toFixed(1)}`);
      const zoomedDataUrl = await zoomImage(imageDataUrl, nextScale);
      await zxingDecode(zoomedDataUrl, true, nextScale, tryCount + 1);
    } else {
      error.value = 'ZXing 也无法识别该条码。';
    }
  }
}

async function zoomImage(imageDataUrl: string, scale = 1.2): Promise<string> {
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
        cropX / scale, // 源图起点x（需除以scale）
        cropY / scale, // 源图起点y
        img.width * 0.8, // 源图宽度
        img.height * 0.8, // 源图高度
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
</script>

<style scoped>
.barcode-reader {
  max-width: 500px;
  margin: 40px auto;
}
.preview {
  text-align: center;
}
.result, .error {
  margin-top: 20px;
}
</style>


