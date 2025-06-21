<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      v-loading="formLoading"
    >
      <el-form-item label="用户 ID" prop="userId">
        <el-input v-model="formData.userId" placeholder="请输入用户 ID" />
      </el-form-item>
      <el-form-item label="用户名" prop="userName">
        <el-input v-model="formData.userName" placeholder="请输入用户名" />
      </el-form-item>
      <el-form-item label="操作时间" prop="operationTime">
        <el-date-picker
          v-model="formData.operationTime"
          type="date"
          value-format="x"
          placeholder="选择操作时间"
        />
      </el-form-item>
      <el-form-item label="操作模块 " prop="module">
        <el-input v-model="formData.module" placeholder="请输入操作模块 " />
      </el-form-item>
      <el-form-item label="操作类型" prop="operationType">
        <el-select v-model="formData.operationType" placeholder="请选择操作类型">
          <el-option label="请选择字典生成" value="" />
        </el-select>
      </el-form-item>
      <el-form-item label="请求参数" prop="requestParams">
        <el-input v-model="formData.requestParams" placeholder="请输入请求参数" />
      </el-form-item>
      <el-form-item label="响应结果" prop="responseResult">
        <el-input v-model="formData.responseResult" placeholder="请输入响应结果" />
      </el-form-item>
      <el-form-item label="操作 IP 地址" prop="ipAddress">
        <el-input v-model="formData.ipAddress" placeholder="请输入操作 IP 地址" />
      </el-form-item>
      <el-form-item label="类名" prop="className">
        <el-input v-model="formData.className" placeholder="请输入类名" />
      </el-form-item>
      <el-form-item label="方法名" prop="methodName">
        <el-input v-model="formData.methodName" placeholder="请输入方法名" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import { OperationLogApi, OperationLogVO } from '@/api/temu/operationlog'

/** 操作日志 表单 */
defineOptions({ name: 'OperationLogForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  userId: undefined,
  userName: undefined,
  operationTime: undefined,
  module: undefined,
  operationType: undefined,
  requestParams: undefined,
  responseResult: undefined,
  ipAddress: undefined,
  className: undefined,
  methodName: undefined,
})
const formRules = reactive({
})
const formRef = ref() // 表单 Ref

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
      formData.value = await OperationLogApi.getOperationLog(id)
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
    const data = formData.value as unknown as OperationLogVO
    if (formType.value === 'create') {
      await OperationLogApi.createOperationLog(data)
      message.success(t('common.createSuccess'))
    } else {
      await OperationLogApi.updateOperationLog(data)
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
    userId: undefined,
    userName: undefined,
    operationTime: undefined,
    module: undefined,
    operationType: undefined,
    requestParams: undefined,
    responseResult: undefined,
    ipAddress: undefined,
    className: undefined,
    methodName: undefined,
  }
  formRef.value?.resetFields()
}
</script>