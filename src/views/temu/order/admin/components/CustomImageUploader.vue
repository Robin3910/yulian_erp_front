<template>
  <div class="custom-image-uploader">
    <!-- 图片列表 -->
    <div class="image-gallery" v-if="imageList.length > 0">
      <div class="gallery-header">
        <h3>已上传图片 ({{ imageList.length }}张)</h3>
        <el-button type="primary" @click="triggerFileInput">
          <el-icon :size="16"><Plus /></el-icon>
          添加更多图片
        </el-button>
      </div>
      <div class="image-grid">
        <div v-for="(image, index) in imageList" :key="index" class="image-card">
          <el-image
            class="preview-image"
            :src="image"
            fit="contain"
            :preview-src-list="imageList"
            :initial-index="index"
            preview-teleported
            @click="showImageViewer(index)"
          />
          <div class="image-actions">
            <el-tooltip content="预览大图" placement="top" :effect="'light'" :enterable="false">
              <el-button
                type="primary"
                size="default"
                circle
                @click="showImageViewer(index)"
              >
                <el-icon :size="18"><ZoomIn /></el-icon>
              </el-button>
            </el-tooltip>
            <el-tooltip content="替换图片" placement="top" :effect="'light'" :enterable="false">
              <el-button
                type="warning"
                size="default"
                circle
                @click="replaceImage(index)"
              >
                <el-icon :size="18"><RefreshRight /></el-icon>
              </el-button>
            </el-tooltip>
            <el-tooltip content="删除图片" placement="top" :effect="'light'" :enterable="false">
              <el-button
                type="danger"
                size="default"
                circle
                @click="removeImage(index)"
              >
                <el-icon :size="18"><Delete /></el-icon>
              </el-button>
            </el-tooltip>
          </div>
          <div class="image-index">{{ index + 1 }}</div>
        </div>
      </div>
    </div>
    <div class="empty-state" v-else>
      <el-empty description="暂无定制图片">
        <template #default>
          <el-button type="primary" size="large" @click="triggerFileInput">
            <el-icon :size="18"><Plus /></el-icon>
            上传图片
          </el-button>
        </template>
      </el-empty>
    </div>

    <!-- 上传按钮区域 -->
    <div class="upload-actions" v-if="imageList.length > 0 || originalImageList.length > 0">
      <el-upload
        ref="uploadRef"
        :multiple="true"
        :show-file-list="false"
        :before-upload="beforeUpload"
        :http-request="customUpload"
        :auto-upload="true"
      >
        <el-button type="primary" size="large" :loading="uploading">
          <el-icon :size="18"><Upload /></el-icon>
          上传定制图片
        </el-button>
      </el-upload>
      <el-button type="success" size="large" @click="saveImages" :disabled="!hasChanges">
        <el-icon :size="18"><Check /></el-icon>
        保存
      </el-button>
    </div>

    <!-- 上传进度 -->
    <el-progress
      v-if="uploading"
      :percentage="uploadProgress"
      :status="uploadProgress === 100 ? 'success' : ''"
      :stroke-width="15"
      class="upload-progress"
    />

    <!-- 隐藏的文件输入框 -->
    <input
      type="file"
      ref="fileInputRef"
      style="display: none"
      accept="image/*"
      multiple
      @change="handleFileChange"
    />

    <!-- 替换图片的隐藏输入框 -->
    <input
      type="file"
      ref="replaceFileInputRef"
      style="display: none"
      accept="image/*"
      @change="handleReplaceFileChange"
    />

    <!-- 删除确认对话框 -->
    <el-dialog
      v-model="deleteDialogVisible"
      title="删除确认"
      width="400px"
      center
      :close-on-click-modal="false"
      destroy-on-close
    >
      <div class="delete-dialog-content">
        <el-icon class="delete-icon" :size="50"><WarningFilled /></el-icon>
        <p class="delete-message">确定要删除这张图片吗？</p>
        <div v-if="deleteImageIndex !== -1 && imageList[deleteImageIndex]" class="delete-preview">
          <el-image
            class="delete-image"
            :src="imageList[deleteImageIndex]"
            fit="contain"
          />
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="deleteDialogVisible = false">取消</el-button>
          <el-button type="danger" @click="confirmDeleteImage">
            确认删除
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 自定义图片预览器 -->
    <div class="image-viewer-container" v-if="showViewer" @click="closeViewer">
      <div class="image-viewer-content" @click.stop>
        <div class="image-viewer-header">
          <span>图片预览 ({{ currentViewIndex + 1 }}/{{ imageList.length }})</span>
          <el-button circle type="primary" plain @click="closeViewer">
            <el-icon><Close /></el-icon>
          </el-button>
        </div>
        <div class="image-viewer-body">
          <el-button 
            v-if="imageList.length > 1" 
            class="nav-button prev" 
            circle 
            @click="prevImage"
          >
            <el-icon><ArrowLeft /></el-icon>
          </el-button>
          
          <div class="image-container">
            <img :src="imageList[currentViewIndex]" alt="预览图片" />
          </div>
          
          <el-button 
            v-if="imageList.length > 1" 
            class="nav-button next" 
            circle 
            @click="nextImage"
          >
            <el-icon><ArrowRight /></el-icon>
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { OssApi } from '@/api/temu/oss'
import { OrderApi } from '@/api/temu/order'
import type { UploadProps, UploadRequestOptions } from 'element-plus'
import { 
  Delete, Upload, Check, Plus, ZoomIn, RefreshRight, 
  WarningFilled, Close, ArrowLeft, ArrowRight 
} from '@element-plus/icons-vue'

// 组件接收的参数
const props = defineProps({
  // 订单ID
  orderId: {
    type: Number,
    required: true
  },
  // 当前的定制图片URLs（逗号分隔的字符串）
  customImageUrls: {
    type: String,
    default: ''
  }
})

// 定义事件
const emit = defineEmits(['update:customImageUrls', 'saved'])

// 图片列表状态
const originalImageList = ref<string[]>([])
const imageList = ref<string[]>([])
const uploading = ref(false)
const uploadProgress = ref(0)
const uploadRef = ref()
const fileInputRef = ref<HTMLInputElement | null>(null)
const replaceFileInputRef = ref<HTMLInputElement | null>(null)
const currentReplaceIndex = ref(-1)
const deleteDialogVisible = ref(false)
const deleteImageIndex = ref(-1)

// 图片预览相关
const showViewer = ref(false)
const currentViewIndex = ref(0)

// 计算属性：是否有变更
const hasChanges = computed(() => {
  // 原始有图片，现在没有图片，表示删除了所有图片
  if (originalImageList.value.length > 0 && imageList.value.length === 0) return true;
  
  // 原始没有图片，现在有图片，表示添加了图片
  if (originalImageList.value.length === 0 && imageList.value.length > 0) return true;
  
  // 图片数量不同，表示有变更
  if (originalImageList.value.length !== imageList.value.length) return true;
  
  // 检查每张图片是否相同
  for (let i = 0; i < originalImageList.value.length; i++) {
    if (originalImageList.value[i] !== imageList.value[i]) return true;
  }
  
  return false;
})

// 监听customImageUrls变化
watch(
  () => props.customImageUrls,
  (newVal) => {
    if (newVal) {
      originalImageList.value = newVal.split(',')
      imageList.value = [...originalImageList.value]
    } else {
      originalImageList.value = []
      imageList.value = []
    }
  },
  { immediate: true }
)

// 触发文件选择
const triggerFileInput = () => {
  if (fileInputRef.value) {
    fileInputRef.value.click()
  }
}

// 处理文件选择
const handleFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    const files = Array.from(target.files)
    
    // 验证所有文件
    const validFiles = files.filter(file => {
      const isImage = file.type.startsWith('image/')
      const isLt10M = file.size / 1024 / 1024 < 10
      
      if (!isImage) {
        ElMessage.error(`文件 ${file.name} 不是图片格式!`)
        return false
      }
      
      if (!isLt10M) {
        ElMessage.error(`文件 ${file.name} 超过10MB限制!`)
        return false
      }
      
      return true
    })
    
    if (validFiles.length > 0) {
      uploading.value = true
      uploadProgress.value = 0
      
      try {
        // 模拟总体进度
        const progressInterval = setInterval(() => {
          if (uploadProgress.value < 90) {
            uploadProgress.value += (90 / (validFiles.length * 10))
          }
        }, 200)
        
        // 上传所有文件
        const uploadPromises = validFiles.map(file => OssApi.uploadFile(file))
        const responses = await Promise.all(uploadPromises)
        
        // 完成上传
        uploadProgress.value = 100
        clearInterval(progressInterval)
        
        // 将返回的URL添加到图片列表
        imageList.value.push(...responses)
        
        ElMessage.success(`成功上传 ${responses.length} 张图片`)
      } catch (error) {
        ElMessage.error('上传失败，请重试')
        console.error('上传失败:', error)
      } finally {
        setTimeout(() => {
          uploading.value = false
          uploadProgress.value = 0
          // 清空文件输入以便再次选择相同文件
          if (fileInputRef.value) {
            fileInputRef.value.value = ''
          }
        }, 500)
      }
    }
  }
}

// 替换图片
const replaceImage = (index: number) => {
  currentReplaceIndex.value = index
  if (replaceFileInputRef.value) {
    replaceFileInputRef.value.click()
  }
}

// 处理替换文件
const handleReplaceFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0 && currentReplaceIndex.value !== -1) {
    const file = target.files[0]
    
    // 验证文件
    const isImage = file.type.startsWith('image/')
    if (!isImage) {
      ElMessage.error('只能上传图片文件!')
      return
    }
    
    const isLt10M = file.size / 1024 / 1024 < 10
    if (!isLt10M) {
      ElMessage.error('图片大小不能超过10MB!')
      return
    }
    
    uploading.value = true
    uploadProgress.value = 0
    
    try {
      // 模拟进度
      const progressInterval = setInterval(() => {
        if (uploadProgress.value < 90) {
          uploadProgress.value += 10
        }
      }, 200)
      
      // 调用上传API
      const response = await OssApi.uploadFile(file)
      
      // 完成上传
      uploadProgress.value = 100
      clearInterval(progressInterval)
      
      // 替换图片URL
      imageList.value[currentReplaceIndex.value] = response
      
      ElMessage.success('图片替换成功')
    } catch (error) {
      ElMessage.error('替换失败，请重试')
      console.error('替换失败:', error)
    } finally {
      setTimeout(() => {
        uploading.value = false
        uploadProgress.value = 0
        currentReplaceIndex.value = -1
        // 清空文件输入以便再次选择相同文件
        if (replaceFileInputRef.value) {
          replaceFileInputRef.value.value = ''
        }
      }, 500)
    }
  }
}

// 预览图片 - 使用自定义预览器
const showImageViewer = (index: number) => {
  currentViewIndex.value = index;
  showViewer.value = true;
  
  // 防止页面滚动
  document.body.style.overflow = 'hidden';
}

// 关闭预览
const closeViewer = () => {
  showViewer.value = false;
  document.body.style.overflow = '';
}

// 下一张图片
const nextImage = () => {
  if (currentViewIndex.value < imageList.value.length - 1) {
    currentViewIndex.value++;
  } else {
    currentViewIndex.value = 0; // 循环到第一张
  }
}

// 上一张图片
const prevImage = () => {
  if (currentViewIndex.value > 0) {
    currentViewIndex.value--;
  } else {
    currentViewIndex.value = imageList.value.length - 1; // 循环到最后一张
  }
}

// 显示删除确认对话框
const removeImage = (index: number) => {
  deleteImageIndex.value = index;
  deleteDialogVisible.value = true;
}

// 确认删除图片
const confirmDeleteImage = () => {
  if (deleteImageIndex.value !== -1) {
    imageList.value.splice(deleteImageIndex.value, 1);
    ElMessage({
      type: 'success',
      message: '图片已成功删除',
      duration: 2000,
      showClose: true,
      offset: 80
    });
    deleteDialogVisible.value = false;
    deleteImageIndex.value = -1;
  }
}

// 上传前验证
const beforeUpload: UploadProps['beforeUpload'] = (file) => {
  // 验证文件类型
  const isImage = file.type.startsWith('image/')
  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }

  // 验证文件大小（小于10MB）
  const isLt10M = file.size / 1024 / 1024 < 10
  if (!isLt10M) {
    ElMessage.error('图片大小不能超过10MB!')
    return false
  }

  return true
}

// 自定义上传
const customUpload = async (options: UploadRequestOptions) => {
  uploading.value = true
  uploadProgress.value = 0

  try {
    // 模拟进度
    const progressInterval = setInterval(() => {
      if (uploadProgress.value < 90) {
        uploadProgress.value += 10
      }
    }, 200)

    // 调用上传API
    const response = await OssApi.uploadFile(options.file as File)
    
    // 完成上传
    uploadProgress.value = 100
    clearInterval(progressInterval)
    
    // 将返回的URL添加到图片列表
    imageList.value.push(response)
    
    ElMessage.success('图片上传成功')
  } catch (error) {
    ElMessage.error('上传失败，请重试')
    console.error('上传失败:', error)
  } finally {
    setTimeout(() => {
      uploading.value = false
      uploadProgress.value = 0
    }, 500)
  }
}

// 保存图片
const saveImages = async () => {
  try {
    // 组合图片URL为逗号分隔的字符串
    const customImageUrls = imageList.value.join(',')
    
    // 调用API保存
    const result = await OrderApi.updateOrderCustomImages({
      orderId: props.orderId,
      customImageUrls
    })
    
    if (result) {
      ElMessage.success('定制图片保存成功')
      originalImageList.value = [...imageList.value]
      emit('update:customImageUrls', customImageUrls)
      emit('saved', customImageUrls)
    } else {
      ElMessage.error('保存失败，请重试')
    }
  } catch (error) {
    ElMessage.error('保存失败，请重试')
    console.error('保存失败:', error)
  }
}
</script>

<style scoped>
.custom-image-uploader {
  margin-bottom: 20px;
  padding: 15px;
}

.gallery-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 0 10px;
}

.gallery-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: bold;
  color: #303133;
}

.image-gallery {
  margin-bottom: 25px;
  border-radius: 6px;
  padding: 20px;
  background-color: #fafafa;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.image-card {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  background-color: transparent;
  height: 220px;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 10px;
  transition: transform 0.3s;
}

.image-card:hover {
  transform: translateY(-5px);
}

.preview-image {
  max-width: 100%;
  max-height: 180px;
  object-fit: contain;
  transition: all 0.3s;
  cursor: pointer;
}

.image-actions {
  position: absolute;
  bottom: 10px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  gap: 15px;
  padding: 8px;
  background-color: rgba(255, 255, 255, 0.8);
  transition: all 0.3s ease;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.image-index {
  position: absolute;
  top: 10px;
  left: 10px;
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
}

.empty-state {
  height: 250px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  margin-bottom: 20px;
  background-color: #f9f9f9;
}

.upload-actions {
  display: flex;
  gap: 20px;
  margin: 25px 0;
  justify-content: center;
}

.upload-progress {
  margin-top: 20px;
}

.delete-dialog-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px;
}

.delete-icon {
  color: #f56c6c;
  margin-bottom: 15px;
}

.delete-message {
  font-size: 16px;
  margin-bottom: 20px;
  font-weight: bold;
}

.delete-preview {
  width: 100%;
  height: 200px;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  overflow: hidden;
  background-color: #f9f9f9;
  margin-bottom: 10px;
}

.delete-image {
  max-width: 100%;
  max-height: 180px;
  object-fit: contain;
}

/* 自定义图片预览器样式 */
.image-viewer-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.85);
  z-index: 2100;
  display: flex;
  justify-content: center;
  align-items: center;
}

.image-viewer-content {
  width: 90%;
  height: 90%;
  display: flex;
  flex-direction: column;
  max-width: 1200px;
}

.image-viewer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  color: white;
  font-size: 16px;
}

.image-viewer-body {
  flex-grow: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.image-container {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.image-container img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.nav-button {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 2;
}

.nav-button.prev {
  left: 20px;
}

.nav-button.next {
  right: 20px;
}
</style> 