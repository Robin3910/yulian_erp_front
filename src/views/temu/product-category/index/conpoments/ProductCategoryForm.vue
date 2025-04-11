<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      v-loading="formLoading"
    >
      <el-form-item label="商品品类ID" prop="categoryId">
        <el-input @input="filterInput" v-model="formData.categoryId" placeholder="请输入商品品类ID" clearable />
      </el-form-item>
      <el-form-item label="商品名称" prop="categoryName">
        <el-input v-model="formData.categoryName" placeholder="请输入商品名称" clearable />
      </el-form-item>
      <el-form-item label="长度(cm)" prop="length">
        <el-input type="number" v-model="formData.length" placeholder="请输入长度(cm)" clearable />
      </el-form-item>
      <el-form-item label="宽度(cm)" prop="width">
        <el-input  type="number"  v-model="formData.width" placeholder="请输入宽度(cm)" clearable />
      </el-form-item>
      <el-form-item label="高度(cm)" prop="height">
        <el-input type="number"  v-model="formData.height" placeholder="请输入高度(cm)" clearable />
      </el-form-item>
      <el-form-item label="重量(g)" prop="weight">
        <el-input type="number"  v-model="formData.weight" placeholder="请输入重量(g)" clearable />
      </el-form-item>
      <el-form-item label="主图URL" prop="mainImageUrl">
        <upload-img :file-size="10"  v-model="formData.mainImageUrl" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import { ProductCategoryApi, ProductCategoryVO } from '@/api/temu/product-category'

/** 商品品类 表单 */
defineOptions({ name: 'ProductCategoryForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined,
  categoryId: undefined,
  categoryName: undefined,
  length: undefined,
  width: undefined,
  height: undefined,
  weight: undefined,
  mainImageUrl: undefined
})
const formRules = reactive({
  categoryId: [{ required: true, message: '商品品类ID不能为空', trigger: 'blur' }],
  categoryName: [{ required: true, message: '商品名称不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref
const filterInput = (s:string) => {
  // 使用正则表达式过滤掉非数字字符
  formData.value.categoryId= s.replace(/\D/g, '')
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
      formData.value = await ProductCategoryApi.getProductCategory(id)
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
    const data = formData.value as unknown as ProductCategoryVO
    if (formType.value === 'create') {
      await ProductCategoryApi.createProductCategory(data)
      message.success(t('common.createSuccess'))
    } else {
      await ProductCategoryApi.updateProductCategory(data)
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
    categoryId: undefined,
    categoryName: undefined,
    length: undefined,
    width: undefined,
    height: undefined,
    weight: undefined,
    mainImageUrl: undefined
  }
  formRef.value?.resetFields()
}
</script>
