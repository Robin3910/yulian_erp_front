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
        <div class="flex flex-wrap gap-6">
          <!-- 第一个上传框 key=0 -->
          <div class="flex flex-col items-center w-[160px]">
            <div class="mb-2 px-3 py-1 bg-primary rounded text-white text-sm font-medium">0+</div>
            <UploadImg
              v-model="formData.oldTypeUrl['0']"
              :limit="1"
              width="160px"
              height="160px"
              :fileType="['image/jpeg', 'image/png', 'image/gif', 'application/pdf']"
              @preview="handlePreview"
            />
          </div>

          <!-- 第二个上传框 key=1 -->
          <div class="flex flex-col items-center w-[160px]">
            <div class="mb-2 px-3 py-1 bg-success rounded text-white text-sm font-medium">3+</div>
            <UploadImg
              v-model="formData.oldTypeUrl['1']"
              :limit="1"
              width="160px"
              height="160px"
              :fileType="['image/jpeg', 'image/png', 'image/gif', 'application/pdf']"
              @preview="handlePreview"
            />
          </div>

          <!-- 第三个上传框 key=2 -->
          <div class="flex flex-col items-center w-[160px]">
            <div class="mb-2 px-3 py-1 bg-warning rounded text-white text-sm font-medium">14+</div>
            <UploadImg
              v-model="formData.oldTypeUrl['2']"
              :limit="1"
              width="160px"
              height="160px"
              :fileType="['image/jpeg', 'image/png', 'image/gif', 'application/pdf']"
              @preview="handlePreview"
            />
          </div>

          <!-- 额外的上传框列表 -->
          <template v-for="(_, key) in extraOldTypeUrls" :key="key">
            <div class="flex flex-col items-center w-[160px] relative">
              <UploadImg
                v-model="formData.oldTypeUrl[key.toString()]"
                :limit="1"
                width="160px"
                height="160px"
                :fileType="['image/jpeg', 'image/png', 'image/gif', 'application/pdf']"
                @preview="handlePreview"
              />
              <el-button
                type="danger"
                link
                @click="removeExtraImage(key)"
                class="delete-btn"
              >
                <Icon icon="ep:delete" />
              </el-button>
            </div>
          </template>

          <!-- 新增按钮 -->
          <div v-if="Object.keys(extraOldTypeUrls).length < 7" class="w-[160px] h-[160px] border border-dashed border-[var(--el-border-color)] rounded-lg hover:border-primary cursor-pointer flex items-center justify-center" @click="addNewImage">
            <div class="flex flex-col items-center gap-2 text-[var(--el-text-color-secondary)]">
              <Icon icon="ep:plus" class="text-24px" />
              <span class="text-sm">新增图片</span>
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
</template>
<script setup lang="ts">
import { ShopApi, ShopVO } from '@/api/temu/shop'
import { UploadImg } from '@/components/UploadFile'
import { Icon } from '@/components/Icon'

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
  accessToken:undefined,
  oldTypeUrl: {
    '0': undefined,
    '1': undefined,
    '2': undefined
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

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      const data = await ShopApi.getShop(id)
      // 处理 oldTypeUrl 为 null 的情况
      formData.value = {
        ...data,
        oldTypeUrl: data.oldTypeUrl || {
          '0': undefined,
          '1': undefined,
          '2': undefined
        }
      }
      // 如果有额外的图片，需要更新 extraOldTypeUrls
      if (data.oldTypeUrl) {
        Object.keys(data.oldTypeUrl).forEach(key => {
          const keyNum = parseInt(key)
          if (keyNum >= 3) {
            extraOldTypeUrls.value[keyNum] = ''
            nextImageKey = Math.max(nextImageKey, keyNum + 1)
          }
        })
      }
    } finally {
      formLoading.value = false
    }
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
    // 检查 oldTypeUrl 是否所有值都为 undefined
    const hasValue = Object.values(data.oldTypeUrl).some(url => url !== undefined)
    if (!hasValue) {
      data.oldTypeUrl = null
    }

    if (formType.value === 'create') {
      await ShopApi.createShop(data as unknown as ShopVO)
      message.success(t('common.createSuccess'))
    } else {
      await ShopApi.updateShop(data as unknown as ShopVO)
      message.success(t('common.updateSuccess'))
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
.hover\:border-primary:hover {
  border-color: var(--el-color-primary);
}
.delete-btn {
  position: absolute;
  top: 0;
  right: 0;
  padding: 4px;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  z-index: 1;
  margin: 4px;
}
.delete-btn:hover {
  background-color: var(--el-color-danger);
}
</style>
