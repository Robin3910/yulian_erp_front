<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="120px"
      v-loading="formLoading"
    >
      <el-form-item label="店铺ID" prop="shopId">
        <el-input 
          ref="shopIdInputRef"
          v-model="formData.shopId" 
          placeholder="请输入店铺ID" 
        />
      </el-form-item>
      <el-form-item label="授权token" prop="accessToken">
        <el-input v-model="formData.accessToken" placeholder="请输入授权token" />
      </el-form-item>
      <el-form-item label="店铺名称" prop="shopName">
        <el-input v-model="formData.shopName" placeholder="请输入店铺名称" />
      </el-form-item>
      <el-form-item label="webhook地址" prop="webhook">
        <el-input v-model="formData.webhook" placeholder="请输入信息通知机器人webhook地址" />
      </el-form-item>

      <!-- 添加合规单上传 -->
      <el-form-item label="合规单">
        <div class="compliance-scroll-container">
          <div class="compliance-container">
            <!-- 现有的合规单卡片 -->
            <template v-for="(label, type) in oldTypeMap" :key="type">
              <div class="compliance-wrapper">
                <div class="compliance-header">
                  <span class="age-label">{{ label }}</span>
                  <!-- 删除描述信息的tooltip -->
                  <!-- 保留删除按钮 -->
                  <el-tooltip 
                    v-if="Number(type) >= 3" 
                    content="删除此合规单类型" 
                    placement="top"
                  >
                    <el-button
                      type="danger"
                      link
                      class="delete-btn"
                      @click.stop="handleDeleteType(type)"
                    >
                      <el-icon><Delete /></el-icon>
                    </el-button>
                  </el-tooltip>
                </div>
                <div class="skc-manage-btn">
                  <div @click="handleSkcButtonClick(type)">
                    <el-button 
                      ref="skcButtonRefs"
                      :type="hasSkcsForType(type) ? 'primary' : 'default'"
                      class="skc-button"
                    >
                      <div class="skc-button-content">
                        <span>SKC管理</span>
                        <span class="skc-count">{{ getSkcCount(type) || 0 }}</span>
                      </div>
                    </el-button>
                  </div>
                </div>
                <div class="compliance-card">
                  <div class="compliance-body">
                    <div class="upload-wrapper" @click="handleUploadClick(type)">
                      <template v-if="getOldTypeImageUrl(type)">
                        <div class="file-container">
                          <!-- 图片预览 -->
                          <template v-if="!isPdfFile(getOldTypeImageUrl(type))">
                            <img 
                              :src="getOldTypeImageUrl(type)" 
                              class="preview-image"
                              @click.stop="handlePreview(getOldTypeImageUrl(type))"
                            />
                          </template>
                          <!-- PDF预览 -->
                          <template v-else>
                            <div class="pdf-preview" @click.stop="handlePreview(getOldTypeImageUrl(type))">
                              <el-icon class="pdf-icon"><Document /></el-icon>
                              <span class="pdf-text">查看PDF</span>
                            </div>
                          </template>
                          <!-- 统一的操作按钮 -->
                          <div class="file-actions">
                            <el-upload
                              class="hidden-upload"
                              :action="uploadUrl"
                              :headers="HEADERS"
                              :show-file-list="false"
                              :before-upload="(file) => onBeforeUpload(file, type)"
                              :on-success="(response) => handleReplaceSuccess(response, type)"
                              :on-error="onUploadError"
                              :accept="'.pdf'"
                              :http-request="httpRequest"
                              :data="{
                                path: 'temu/shop/oldType'
                              }"
                              @click="handleReplaceClick(type)"
                            >
                              <el-button
                                type="primary"
                                size="small"
                                class="action-button"
                              >
                                <el-icon><Edit /></el-icon>
                                <span>更换</span>
                              </el-button>
                            </el-upload>
                            <el-button
                              type="danger"
                              size="small"
                              class="action-button"
                              @click.stop="handleDeleteImage(type)"
                            >
                              <el-icon><Delete /></el-icon>
                              <span>删除</span>
                            </el-button>
                          </div>
                        </div>
                      </template>
                      <UploadImg
                        v-else
                        v-model="formData.oldTypeUrl[type]"
                        :limit="1"
                        :fileType="['image/jpeg', 'image/png', 'image/gif', 'application/pdf']"
                        @preview="handlePreview"
                        :disabled="!formData.shopId || !hasSkcsForType(type)"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </template>

            <!-- 新增合规单类型按钮 -->
            <div class="compliance-wrapper add-type-wrapper" @click="handleAddType">
              <div class="add-type-content">
                <el-icon class="add-icon"><Plus /></el-icon>
                <span>新增合规单类型</span>
              </div>
            </div>
          </div>
        </div>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>

  <!-- 预览对话框 -->
  <el-dialog v-model="previewVisible" title="文件预览" width="80%" append-to-body>
    <div v-if="previewUrl" class="w-full h-[80vh]">
      <img :src="previewUrl" class="max-w-full max-h-full mx-auto" />
    </div>
  </el-dialog>

  <!-- SKC管理对话框 -->
  <ShopSkcDialog
    ref="skcDialogRef"
    :shopId="Number(formData.shopId)"
    :oldType="currentOldType"
    :showUploadTip="showUploadTip"
    @success="handleSkcSuccess"
  />

  <!-- 新增合规单类型对话框 -->
  <el-dialog
    v-model="addTypeDialogVisible"
    title="新增合规单类型"
    width="400px"
    append-to-body
    destroy-on-close
  >
    <el-form
      ref="addTypeFormRef"
      :model="addTypeForm"
      :rules="addTypeRules"
      label-width="100px"
    >
      <el-form-item label="年龄标签" prop="label">
        <el-input v-model="addTypeForm.label" placeholder="请输入年龄标签，例如: 18+" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="addTypeDialogVisible = false">取 消</el-button>
      <el-button type="primary" @click="submitAddType" :loading="addTypeLoading">确 定</el-button>
    </template>
  </el-dialog>
</template>
<script setup lang="ts">
import { ShopApi, ShopVO, ShopOldTypeVO } from '@/api/temu/shop'
import { UploadImg } from '@/components/UploadFile'
import { Icon } from '@/components/Icon'
import ShopSkcDialog from './ShopSkcDialog.vue'
import { Plus, Delete, Edit, Document } from '@element-plus/icons-vue'
import { ElMessageBox } from 'element-plus'
import { getAccessToken, getTenantId } from '@/utils/auth'
import { useUpload } from '@/components/UploadFile/src/useUpload'

/** 店铺 表单 */
defineOptions({ name: 'ShopForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

// 修改 oldTypeMap 的类型定义
const oldTypeMap = ref<Record<string, string>>({
  '0': '0+',
  '1': '3+',
  '2': '14+'
})

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改

// 类型定义
interface OldTypeUrl {
  [key: string]: string | undefined;
}

const formData = ref({
  id: undefined,
  shopId: undefined,
  shopName: undefined,
  webhook: undefined,
  accessToken: undefined,
  oldTypes: [] as ShopOldTypeVO[],
  oldTypeUrl: {} as OldTypeUrl
})
const formRules = reactive({
  shopId: [{ required: true, message: '店铺ID不能为空', trigger: 'blur' }],
  shopName: [{ required: true, message: '店铺名称不能为空', trigger: 'blur' }],
})
const formRef = ref() // 表单 Ref

// 额外的上传框计数
const extraOldTypeUrls = ref<{[key: number]: string}>({})
let nextImageKey = 4 // 从4开始递增

// 新增图片上传框
const addNewImage = () => {
  extraOldTypeUrls.value[nextImageKey] = ''
  formData.value.oldTypeUrl[nextImageKey.toString()] = undefined
  nextImageKey++
}

// 删除额外的图片上传框
const removeExtraImage = (key: number) => {
  delete extraOldTypeUrls.value[key]
  delete formData.value.oldTypeUrl[key.toString()]
}

// 预览相关的状态
const previewVisible = ref(false)
const previewUrl = ref('')

// 处理预览
const handlePreview = (url: string) => {
  if (url.toLowerCase().endsWith('.pdf')) {
    window.open(url, '_blank')
  } else {
    previewUrl.value = url
    previewVisible.value = true
  }
}

// 添加一个函数来初始化店铺的合规单类型映射
const initShopOldTypeMap = async (shopId: number | string) => {
  try {
    // 先重置为基础类型
    oldTypeMap.value = {
      '0': '0+',
      '1': '3+',
      '2': '14+'
    }
    
    // 获取该店铺的所有合规单类型
    const response = await ShopApi.getShopOldType(shopId)
    if (response && response.length > 0) {
      // 遍历所有合规单类型，找出非基础类型的
      response.forEach(item => {
        const type = item.oldType
        // 如果是新增的类型（大于2的类型）
        if (Number(type) > 2 && !oldTypeMap.value[type]) {
          // 使用一个默认的标签格式
          oldTypeMap.value[type] = `类型${type}`
        }
      })
    }
  } catch (error) {
    console.error('初始化店铺合规单类型映射失败:', error)
  }
}

// 修改 open 函数
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  
  formLoading.value = true
  try {
    if (id) {
      const data = await ShopApi.getShop(id)
      formData.value = {
        ...data,
        oldTypes: [],
        oldTypeUrl: {}
      }

      if (formData.value.shopId) {
        // 初始化该店铺的合规单类型映射
        await initShopOldTypeMap(formData.value.shopId)
        
        const response = await ShopApi.getShopOldType(formData.value.shopId)
        if (response && response.length > 0) {
          formData.value.oldTypes = response
          const groupedData = response.reduce((acc: { [key: string]: ShopOldTypeVO[] }, item: ShopOldTypeVO) => {
            if (!acc[item.oldType]) {
              acc[item.oldType] = []
            }
            acc[item.oldType].push(item)
            return acc
          }, {})

          const newOldTypeUrl = {}
          Object.entries(groupedData).forEach(([oldType, items]) => {
            const itemWithUrl = (items as ShopOldTypeVO[]).find(item => item.oldTypeUrl)
            if (itemWithUrl) {
              newOldTypeUrl[oldType] = itemWithUrl.oldTypeUrl
            }
          })
          
          formData.value.oldTypeUrl = newOldTypeUrl
        }
      }
    }
  } finally {
    formLoading.value = false
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 提交表单 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
const submitForm = async () => {
  // 校验表单
  await formRef.value.validate()
  
  // 检查合规单SKC绑定情况
  for (const [oldType, url] of Object.entries(formData.value.oldTypeUrl)) {
    if (url) {  // 如果上传了合规单
      const hasSkc = formData.value.oldTypes.some(item => item.oldType === oldType)
      if (!hasSkc) {
        message.warning(`${oldTypeMap.value[oldType]}合规单至少绑定一个SKC，再确认！`)
        return
      }
    }
  }

  // 提交请求
  formLoading.value = true
  try {
    const data = { ...formData.value }
    // 更新oldTypes数据，确保包含所有类型的数据
    const oldTypes = Object.keys(oldTypeMap.value).map(oldType => ({
      shopId: String(data.shopId || ''),
      skc: '',
      oldTypeUrl: data.oldTypeUrl[oldType] || '',  // 如果URL不存在则使用空字符串
      oldType
    }))

    const submitData = {
      ...data,
      oldTypes
    }
    // 移除临时使用的oldTypeUrl
    delete (submitData as any).oldTypeUrl

    // 1. 先调用原有的创建/更新接口
    if (formType.value === 'create') {
      await ShopApi.createShop(submitData as unknown as ShopVO)
      message.success(t('common.createSuccess'))
    } else {
      await ShopApi.updateShop(submitData as unknown as ShopVO)
      message.success(t('common.updateSuccess'))
    }

    // 2. 调用 /temu/shop-oldType/update 接口
    // 从formData.oldTypes中获取所有SKC信息并按要求格式化
    const skcData = formData.value.oldTypes.map(item => ({
      shopId: Number(data.shopId),
      skc: item.skc,
      oldTypeUrl: formData.value.oldTypeUrl[item.oldType] || '',  // 使用对应oldType的URL，如果没有则使用空字符串
      oldType: item.oldType
    }))

    if (skcData.length > 0) {
      await ShopApi.updateShopOldType(skcData)
    }

    dialogVisible.value = false
    // 发送操作成功的事件
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    id: undefined,
    shopId: undefined,
    shopName: undefined,
    webhook: undefined,
    accessToken: undefined,
    oldTypes: [],
    oldTypeUrl: {
      '0': undefined,
      '1': undefined,
      '2': undefined
    }
  }
  extraOldTypeUrls.value = {}
  nextImageKey = 4
  formRef.value?.resetFields()
}

const skcDialogRef = ref()
const currentOldType = ref('')

// 获取指定类型的SKC数量
const getSkcCount = (oldType: string) => {
  return formData.value.oldTypes.filter(item => item.oldType === oldType).length
}

// 检查是否有SKC
const hasSkcsForType = (oldType: string) => {
  return formData.value.oldTypes.some(item => item.oldType === oldType)
}

// 打开SKC管理对话框
const handleOpenSkcDialog = (oldType: string) => {
  if (!formData.value.shopId) {
    message.warning('请先输入店铺ID')
    return
  }
  currentOldType.value = oldType
  skcDialogRef.value.open()
}

// 添加一个状态来控制是否显示上传提示
const showUploadTip = ref(false)

// SKC管理成功回调
const handleSkcSuccess = async () => {
  showUploadTip.value = false  // 成功后隐藏提示
  
  try {
    if (formData.value.shopId) {
      // 只更新 SKC 列表数据
      const response = await ShopApi.getShopOldType(formData.value.shopId)
      if (response && response.length > 0) {
        // 更新 oldTypes，但保留现有的 URL
        formData.value.oldTypes = response.map(newItem => {
          // 查找对应的旧数据
          const oldItem = formData.value.oldTypes.find(
            old => old.oldType === newItem.oldType && old.skc === newItem.skc
          )
          // 如果找到旧数据，保留其 URL
          if (oldItem) {
            return {
              ...newItem,
              oldTypeUrl: oldItem.oldTypeUrl,
              oldTypeImageUrl: oldItem.oldTypeImageUrl
            }
          }
          return newItem
        })
      } else {
        formData.value.oldTypes = []
      }
    }
  } catch (error) {
    console.error('更新SKC列表失败:', error)
    message.error('更新SKC列表失败')
  }
}

// 获取指定类型的SKC图片URL
const getOldTypeImageUrl = (oldType: string): string => {
  const skcs = formData.value.oldTypes.filter(item => item.oldType === oldType)
  if (skcs.length > 0 && skcs[0].oldTypeImageUrl) {
    return skcs[0].oldTypeImageUrl
  }
  return formData.value.oldTypeUrl[oldType] || ''
}

// 检查是否为PDF文件
const isPdfFile = (url: string): boolean => {
  if (!url) return false
  return url.toLowerCase().endsWith('.pdf')
}

// 新增类型相关
const addTypeDialogVisible = ref(false)
const addTypeLoading = ref(false)
const addTypeForm = ref({
  label: ''
})
const addTypeFormRef = ref()
const addTypeRules = {
  label: [
    { required: true, message: '请输入年龄标签', trigger: 'blur' },
    { min: 1, max: 20, message: '长度在1到20个字符之间', trigger: 'blur' }
  ]
}

// 打开新增类型对话框
const handleAddType = async () => {
  // 先触发店铺ID的表单验证
  try {
    await formRef.value.validateField('shopId')
  } catch (error) {
    shopIdInputRef.value?.focus()
    return
  }

  if (!formData.value.shopId) {
    shopIdInputRef.value?.focus()
    message.warning('请先填写店铺ID')
    return
  }

  addTypeForm.value = {
    label: ''
  }
  addTypeDialogVisible.value = true
}

// 提交新增类型
const submitAddType = async () => {
  await addTypeFormRef.value.validate()
  
  addTypeLoading.value = true
  try {
    const newType = Object.keys(oldTypeMap.value).length.toString()
    oldTypeMap.value[newType] = addTypeForm.value.label
    
    // 初始化新类型的URL
    formData.value.oldTypeUrl[newType] = undefined
    
    addTypeDialogVisible.value = false
    message.success('新增合规单类型成功')
  } catch (error) {
    console.error('新增合规单类型失败:', error)
    message.error('新增合规单类型失败')
  } finally {
    addTypeLoading.value = false
  }
}

// 删除合规单类型
const handleDeleteType = async (type: string) => {
  if (!formData.value.shopId) {
    message.warning('请先填写店铺ID')
    return
  }

  try {
    await ElMessageBox.confirm(
      '确定要删除该合规单类型吗？删除后该类型下的所有SKC记录将被删除且无法恢复。',
      '警告',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    )
    
    // 获取当前类型下的所有SKC
    const skcList = formData.value.oldTypes
      .filter(item => item.oldType === type)
      .map(item => item.skc)

    if (skcList.length > 0) {
      // 调用批量删除接口
      await ShopApi.deleteShopOldType({
        shopId: Number(formData.value.shopId),
        oldType: type,
        skcList
      })
    }

    // 删除本地数据
    const newOldTypeMap = { ...oldTypeMap.value }
    delete newOldTypeMap[type]
    oldTypeMap.value = newOldTypeMap
    
    delete formData.value.oldTypeUrl[type]
    formData.value.oldTypes = formData.value.oldTypes.filter(item => item.oldType !== type)
    
    message.success('删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除合规单类型失败:', error)
      message.error('删除失败，请重试')
    }
  }
}

const shopIdInputRef = ref()
const skcButtonRefs = ref<any[]>([])

// 点击事件处理
const handleSkcButtonClick = async (type: string) => {
  // 先触发店铺ID的表单验证
  try {
    await formRef.value.validateField('shopId')
  } catch (error) {
    shopIdInputRef.value?.focus()
    return
  }

  if (!formData.value.shopId) {
    shopIdInputRef.value?.focus()
    message.warning('请先填写店铺ID')
    return
  }
  handleOpenSkcDialog(type)
}

// 处理上传区域点击
const handleUploadClick = async (type: string) => {
  // 先触发店铺ID的表单验证
  try {
    await formRef.value.validateField('shopId')
  } catch (error) {
    shopIdInputRef.value?.focus()
    return
  }

  if (!formData.value.shopId) {
    shopIdInputRef.value?.focus()
    return
  }
  
  if (!hasSkcsForType(type)) {
    showUploadTip.value = true
    currentOldType.value = type
    skcDialogRef.value.open()
    return
  }
  showUploadTip.value = false
}

// 删除图片
const handleDeleteImage = (type: string) => {
  // 清除对应类型的URL
  formData.value.oldTypeUrl[type] = undefined
  
  // 清除对应类型的oldTypes中的oldTypeImageUrl
  formData.value.oldTypes = formData.value.oldTypes.map(item => {
    if (item.oldType === type) {
      return {
        ...item,
        oldTypeImageUrl: null,
        oldTypeUrl: null
      }
    }
    return item
  })
}

// 上传组件引用
const uploadRefs = ref<{ [key: string]: any }>({})

// 上传相关配置
const { uploadUrl, httpRequest } = useUpload()
const HEADERS = {
  Authorization: 'Bearer ' + getAccessToken(),
  'tenant-id': getTenantId()
}

// 上传前检查
const onBeforeUpload = (file: File, oldType: string) => {
  // 检查店铺ID
  if (!formData.value.shopId) {
    shopIdInputRef.value?.focus()
    message.warning('请先填写店铺ID')
    return false
  }
  
  // 检查SKC
  if (!hasSkcsForType(oldType)) {
    message.warning('请先补充至少一条SKC！')
    const skcButton = skcButtonRefs.value[Number(oldType)]
    if (skcButton) {
      skcButton.$el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      skcButton.$el.click()
    }
    return false
  }
  
  // 检查文件类型
  if (file.type !== 'application/pdf') {
    message.error('只能上传PDF格式文件！')
    return false
  }
  
  // 检查文件大小（2MB）
  const isLt2M = file.size / 1024 / 1024 < 2
  if (!isLt2M) {
    message.error('文件大小不能超过2MB！')
    return false
  }

  // 先清除当前文件
  formData.value.oldTypeUrl[oldType] = undefined
  formData.value.oldTypes = formData.value.oldTypes.map(item => {
    if (item.oldType === oldType) {
      return {
        ...item,
        oldTypeImageUrl: null,
        oldTypeUrl: null
      }
    }
    return item
  })
  
  return true
}

// 处理更换成功
const handleReplaceSuccess = (response: any, oldType: string) => {
  console.log('上传成功，类型:', oldType, '响应:', response)
  if (response.data) {  // 直接检查response.data是否存在
    // 更新URL
    formData.value.oldTypeUrl[oldType] = response.data
    
    // 更新oldTypes
    formData.value.oldTypes = formData.value.oldTypes.map(item => {
      if (item.oldType === oldType) {
        return {
          ...item,
          oldTypeImageUrl: response.data,
          oldTypeUrl: response.data
        }
      }
      return item
    })
    
    message.success('更换成功')
  } else {
    message.error('更换失败')
  }
}

// 上传失败处理
const onUploadError = (error: any) => {
  console.error('上传失败:', error)
  message.error('上传失败，请重试')
}

// 更新currentOldType的处理函数
const handleReplaceClick = (type: string) => {
  console.log('设置当前操作类型:', type)
}
</script>

<style scoped>
.compliance-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);  /* 固定三列布局 */
  gap: 12px;
  width: 100%;
}

.compliance-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  min-width: 0;
  background: var(--el-fill-color-light);
  border-radius: 8px;
  padding: 8px;  /* 减小内边距 */
  box-shadow: 0 2px 12px 0 rgba(238, 231, 231, 0.08);
  transition: all 0.3s ease;
  border: 1px solid var(--el-border-color);
  width: 100%;
}

.compliance-header {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
  position: relative;
}

.age-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.info-icon {
  color: var(--el-color-info);
  cursor: help;
}

.skc-manage-btn {
  width: 100%;
  margin-bottom: 4px;  /* 减小底部间距 */
}

.skc-button {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  height: 32px;
  border-radius: 4px;
  transition: all 0.3s ease;
  border-width: 1px;
}

.skc-button-content {
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 500;
  font-size: 12px;
}

.skc-count {
  min-width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  font-size: 12px;
  padding: 0 6px;
  background-color: var(--el-color-primary-light-8);
  color: var(--el-color-primary-dark-2);
  font-weight: bold;
}

.compliance-card {
  width: 100%;
  border: 2px solid var(--el-border-color-darker);
  border-radius: 4px;
  overflow: hidden;
  transition: all 0.3s ease;
  background-color: #fff;
}

.compliance-card:hover {
  border-color: var(--el-color-primary);
  background-color: var(--el-color-primary-light-9);
}

.compliance-body {
  padding: 16px;
}

.upload-wrapper {
  width: 100%;
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--el-fill-color-blank);
  border-radius: 4px;
  position: relative;
}

.file-container {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 150px;  /* 适当减小高度 */
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--el-fill-color-blank);
  border-radius: 4px;
  overflow: hidden;
}

.preview-image {
  max-width: 100%;
  max-height: 150px;  /* 适当减小高度 */
  object-fit: contain;
  transition: transform 0.3s ease;
}

.preview-image:hover {
  transform: scale(1.02);
}

.pdf-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 16px;
  background-color: var(--el-fill-color-lighter);
  border-radius: 4px;
  transition: all 0.3s ease;
}

.pdf-preview:hover {
  background-color: var(--el-fill-color-dark);
}

.pdf-icon {
  font-size: 32px;
  color: var(--el-color-danger);
  margin-bottom: 4px;
}

.pdf-text {
  font-size: 12px;
  color: var(--el-text-color-primary);
}

.file-actions {
  position: absolute;
  top: 0;
  right: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  height: 25px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.file-container:hover .file-actions {
  opacity: 1;
}

.action-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 35px;
  padding: 0;
  font-size: 20px;
  font-weight: 500;
  border: 1px solid rgba(255, 255, 255, 0.5);
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  cursor: pointer;
  border-radius: 3px;
  transition: all 0.2s ease;
  white-space: nowrap;
  box-shadow: 0 1px 3px rgba(173, 171, 171, 0.2);
}

.action-button:hover {
  background: rgba(0, 0, 0, 0.75);
  border-color: rgba(255, 255, 255, 0.7);
  box-shadow: 0 2px 5px rgba(75, 74, 74, 0.25);
}

.action-button .el-icon {
  margin-right: 2px;
  font-size: 12px;
  width: 12px;
  height: 12px;
  flex-shrink: 0;
}

.action-button span {
  line-height: 1;
  font-size: 12px;
  color: #fff;
  text-shadow: 0 1px 2px rgba(59, 58, 58, 0.3);
}

.hidden-upload {
  display: inline-block;
}

.hidden-upload :deep(.el-upload) {
  display: inline-block;
}

.hidden-upload :deep(.el-upload-list) {
  display: none;
}

/* 添加滚动容器样式 */
.compliance-scroll-container {
  max-height: 600px;  /* 增加容器最大高度，确保可以显示三个 */
  overflow-y: auto;
  padding-right: 8px;
  margin-right: -8px;
  /* 自定义滚动条样式 */
  scrollbar-width: thin;
  scrollbar-color: var(--el-border-color) transparent;
}

.compliance-scroll-container::-webkit-scrollbar {
  width: 4px;
}

.compliance-scroll-container::-webkit-scrollbar-track {
  background: transparent;
}

.compliance-scroll-container::-webkit-scrollbar-thumb {
  background-color: var(--el-border-color);
  border-radius: 2px;
}

.compliance-scroll-container::-webkit-scrollbar-thumb:hover {
  background-color: var(--el-border-color-darker);
}

.add-type-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  min-height: 160px;
  border: 2px dashed var(--el-border-color);
  background: transparent;
  box-shadow: none;
}

.add-type-wrapper:hover {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.add-type-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: var(--el-text-color-secondary);
}

.add-type-wrapper:hover .add-type-content {
  color: var(--el-color-primary);
}

.add-icon {
  font-size: 20px;
}

.delete-btn {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  font-size: 16px;
  color: var(--el-color-danger);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.compliance-wrapper:hover .delete-btn {
  opacity: 1;
}

.skc-manage-btn > .el-tooltip > div {
  width: 100%;
  cursor: pointer;
}

.skc-manage-btn > .el-tooltip > div:hover .el-button.is-disabled {
  opacity: 0.8;
  cursor: not-allowed;
}
</style>
