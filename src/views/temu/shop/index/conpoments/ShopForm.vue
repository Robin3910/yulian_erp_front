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
        <el-input v-model="formData.shopId" placeholder="请输入店铺ID" />
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
        <div class="flex justify-between gap-4">
          <!-- 第一个上传框 key=0 -->
          <div class="compliance-card">
            <div class="compliance-header bg-primary">
              <span class="text-lg font-medium">0+</span>
              <el-tooltip content="适用于0岁及以上的产品" placement="top">
                <Icon icon="ep:info-filled" class="text-white text-sm" />
              </el-tooltip>
            </div>
            <div class="compliance-body">
              <UploadImg
                v-model="formData.oldTypeUrl['0']"
                :limit="1"
                width="160px"
                height="160px"
                :fileType="['image/jpeg', 'image/png', 'image/gif', 'application/pdf']"
                @preview="handlePreview"
              />
              <el-button 
                type="primary"
                class="mt-3 w-full"
                @click="handleOpenSkcDialog('0')"
                :disabled="!formData.shopId"
              >
                SKC管理
              </el-button>
            </div>
          </div>

          <!-- 第二个上传框 key=1 -->
          <div class="compliance-card">
            <div class="compliance-header bg-success">
              <span class="text-lg font-medium">3+</span>
              <el-tooltip content="适用于3岁及以上的产品" placement="top">
                <Icon icon="ep:info-filled" class="text-white text-sm" />
              </el-tooltip>
            </div>
            <div class="compliance-body">
              <UploadImg
                v-model="formData.oldTypeUrl['1']"
                :limit="1"
                width="160px"
                height="160px"
                :fileType="['image/jpeg', 'image/png', 'image/gif', 'application/pdf']"
                @preview="handlePreview"
              />
              <el-button 
                type="primary"
                class="mt-3 w-full"
                @click="handleOpenSkcDialog('1')"
                :disabled="!formData.shopId"
              >
                SKC管理
              </el-button>
            </div>
          </div>

          <!-- 第三个上传框 key=2 -->
          <div class="compliance-card">
            <div class="compliance-header bg-warning">
              <span class="text-lg font-medium">14+</span>
              <el-tooltip content="适用于14岁及以上的产品" placement="top">
                <Icon icon="ep:info-filled" class="text-white text-sm" />
              </el-tooltip>
            </div>
            <div class="compliance-body">
              <UploadImg
                v-model="formData.oldTypeUrl['2']"
                :limit="1"
                width="160px"
                height="160px"
                :fileType="['image/jpeg', 'image/png', 'image/gif', 'application/pdf']"
                @preview="handlePreview"
              />
              <el-button 
                type="primary"
                class="mt-3 w-full"
                @click="handleOpenSkcDialog('2')"
                :disabled="!formData.shopId"
              >
                SKC管理
              </el-button>
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
    @success="handleSkcSuccess"
  />
</template>
<script setup lang="ts">
import { ShopApi, ShopVO, ShopOldTypeVO } from '@/api/temu/shop'
import { UploadImg } from '@/components/UploadFile'
import { Icon } from '@/components/Icon'
import ShopSkcDialog from './ShopSkcDialog.vue'

/** 店铺 表单 */
defineOptions({ name: 'ShopForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined,
  shopId: undefined,
  shopName: undefined,
  webhook: undefined,
  accessToken: undefined,
  oldTypes: [] as ShopOldTypeVO[],
  oldTypeUrl: {
    '0': undefined as string | undefined,
    '1': undefined as string | undefined,
    '2': undefined as string | undefined
  }
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

// 监听shopId变化
watch(() => formData.value.shopId, async (newShopId) => {
  if (newShopId) {
    try {
      // 打印请求参数和响应数据，用于调试
      console.log('请求参数 shopId:', newShopId)
      const response = await ShopApi.getShopOldType(newShopId)
      console.log('获取到的合规单数据:', response)

      // response直接就是数组数据
      if (response && response.length > 0) {
        // 保存原始数据
        formData.value.oldTypes = response

        // 按oldType分组并更新显示
        const groupedData = response.reduce((acc: { [key: string]: ShopOldTypeVO[] }, item: ShopOldTypeVO) => {
          if (!acc[item.oldType]) {
            acc[item.oldType] = []
          }
          acc[item.oldType].push(item)
          return acc
        }, {})

        console.log('分组后的数据:', groupedData)

        // 更新oldTypeUrl，每组取第一个URL
        const newOldTypeUrl = {
          '0': groupedData['0']?.[0]?.oldTypeUrl,
          '1': groupedData['1']?.[0]?.oldTypeUrl,
          '2': groupedData['2']?.[0]?.oldTypeUrl
        }
        console.log('设置的oldTypeUrl:', newOldTypeUrl)
        formData.value.oldTypeUrl = newOldTypeUrl
      } else {
        // 如果没有数据，重置为空
        formData.value.oldTypes = []
        formData.value.oldTypeUrl = {
          '0': undefined,
          '1': undefined,
          '2': undefined
        }
      }
    } catch (error) {
      console.error('获取合规单数据失败:', error)
      message.error('获取合规单数据失败')
    }
  }
})

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  
  formLoading.value = true
  try {
    // 修改时，设置数据
    if (id) {
      const data = await ShopApi.getShop(id)
      formData.value = {
        ...data,
        oldTypes: [],
        oldTypeUrl: {
          '0': undefined,
          '1': undefined,
          '2': undefined
        }
      }

      // 如果有shopId，获取合规单数据
      if (formData.value.shopId) {
        console.log('open方法中获取合规单，shopId:', formData.value.shopId)
        const response = await ShopApi.getShopOldType(formData.value.shopId)
        console.log('open方法中获取到的合规单数据:', response)

        // response直接就是数组数据
        if (response && response.length > 0) {
          // 保存原始数据
          formData.value.oldTypes = response

          // 按oldType分组并更新显示
          const groupedData = response.reduce((acc: { [key: string]: ShopOldTypeVO[] }, item: ShopOldTypeVO) => {
            if (!acc[item.oldType]) {
              acc[item.oldType] = []
            }
            acc[item.oldType].push(item)
            return acc
          }, {})

          console.log('open方法中分组后的数据:', groupedData)

          // 更新oldTypeUrl，每组取第一个URL
          const newOldTypeUrl = {
            '0': groupedData['0']?.[0]?.oldTypeUrl,
            '1': groupedData['1']?.[0]?.oldTypeUrl,
            '2': groupedData['2']?.[0]?.oldTypeUrl
          }
          console.log('open方法中设置的oldTypeUrl:', newOldTypeUrl)
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
  // 提交请求
  formLoading.value = true
  try {
    const data = { ...formData.value }
    // 更新oldTypes数据
    const oldTypes = Object.entries(data.oldTypeUrl)
      .filter(([_, url]) => url !== undefined)
      .map(([oldType, oldTypeUrl]) => ({
        shopId: String(data.shopId || ''),
        skc: '', // 这里可能需要根据业务需求设置skc
        oldTypeUrl: oldTypeUrl as string,
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
      oldTypeUrl: formData.value.oldTypeUrl[item.oldType], // 使用对应oldType的URL
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

// 打开SKC管理对话框
const handleOpenSkcDialog = (oldType: string) => {
  if (!formData.value.shopId) {
    message.warning('请先输入店铺ID')
    return
  }
  currentOldType.value = oldType
  skcDialogRef.value.open()
}

// SKC管理成功回调
const handleSkcSuccess = async () => {
  // 重新加载合规单数据
  if (formData.value.shopId) {
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

      formData.value.oldTypeUrl = {
        '0': groupedData['0']?.[0]?.oldTypeUrl,
        '1': groupedData['1']?.[0]?.oldTypeUrl,
        '2': groupedData['2']?.[0]?.oldTypeUrl
      }
    }
  }
}
</script>

<style scoped>
.bg-primary {
  background-color: var(--el-color-primary);
}
.bg-success {
  background-color: var(--el-color-success);
}
.bg-warning {
  background-color: var(--el-color-warning);
}
.text-white {
  color: white;
}
.compliance-card {
  width: 185px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  flex: 1;
  max-width: 300px;
}
.compliance-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.15);
}
.compliance-header {
  padding: 12px;
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.compliance-body {
  padding: 16px;
  background-color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
}
</style>
