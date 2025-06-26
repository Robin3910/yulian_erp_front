<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible">
    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px" v-loading="formLoading">
      <el-form-item label="工作人员ID，关联system_users表id" prop="workerId">
        <el-input v-model="formData.workerId" placeholder="请输入工作人员ID，关联system_users表id" />
      </el-form-item>
      <el-form-item label="工作人员姓名，关联system_users表nickname" prop="workerName">
        <el-input v-model="formData.workerName" placeholder="请输入工作人员姓名，关联system_users表nickname" />
      </el-form-item>
      <el-form-item label="工作人员类型 1:作图员 2:生产员 3:发货员" prop="workerType">
        <el-radio-group v-model="formData.workerType">
          <el-radio value="1">请选择字典生成</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="任务类型 1:作图 2:生产 3:发货" prop="taskType">
        <el-radio-group v-model="formData.taskType">
          <el-radio value="1">请选择字典生成</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="任务状态 0:待处理 1:已完成 2:已取消" prop="taskStatus">
        <el-radio-group v-model="formData.taskStatus">
          <el-radio value="1">请选择字典生成</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="关联订单ID，对应temu_order表id" prop="orderId">
        <el-input v-model="formData.orderId" placeholder="请输入关联订单ID，对应temu_order表id" />
      </el-form-item>
      <el-form-item label="订单编号，对应temu_order表order_no" prop="orderNo">
        <el-input v-model="formData.orderNo" placeholder="请输入订单编号，对应temu_order表order_no" />
      </el-form-item>
      <el-form-item label="批次订单ID，对应temu_order_batch_task表batch_order_id" prop="batchOrderId">
        <el-input v-model="formData.batchOrderId" placeholder="请输入批次订单ID，对应temu_order_batch_task表batch_order_id" />
      </el-form-item>
      <el-form-item label="定制SKU，对应temu_order表custom_sku" prop="customSku">
        <el-input v-model="formData.customSku" placeholder="请输入定制SKU，对应temu_order表custom_sku" />
      </el-form-item>
      <el-form-item label="处理SKU数量，对应temu_order表quantity" prop="skuQuantity">
        <el-input v-model="formData.skuQuantity" placeholder="请输入处理SKU数量，对应temu_order表quantity" />
      </el-form-item>
      <el-form-item label="任务完成时间" prop="taskCompleteTime">
        <el-date-picker v-model="formData.taskCompleteTime" type="date" value-format="x" placeholder="选择任务完成时间" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import { WorkerTaskApi, WorkerTaskVO } from '@/api/temu/workertask'

/** 工作人员任务记录 表单 */
defineOptions({ name: 'WorkerTaskForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined,
  workerId: undefined,
  workerName: undefined,
  workerType: undefined,
  taskType: undefined,
  taskStatus: undefined,
  orderId: undefined,
  orderNo: undefined,
  batchOrderId: undefined,
  customSku: undefined,
  skuQuantity: undefined,
  taskCompleteTime: undefined,
})
const formRules = reactive({
  workerId: [{ required: true, message: '工作人员ID，关联system_users表id不能为空', trigger: 'blur' }],
  workerName: [{ required: true, message: '工作人员姓名，关联system_users表nickname不能为空', trigger: 'blur' }],
  workerType: [{ required: true, message: '工作人员类型 1:作图员 2:生产员 3:发货员不能为空', trigger: 'blur' }],
  taskType: [{ required: true, message: '任务类型 1:作图 2:生产 3:发货不能为空', trigger: 'blur' }],
  taskStatus: [{ required: true, message: '任务状态 0:待处理 1:已完成 2:已取消不能为空', trigger: 'blur' }],
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
      formData.value = await WorkerTaskApi.getWorkerTask(id)
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
    const data = formData.value as unknown as WorkerTaskVO
    if (formType.value === 'create') {
      await WorkerTaskApi.createWorkerTask(data)
      message.success(t('common.createSuccess'))
    } else {
      await WorkerTaskApi.updateWorkerTask(data)
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
    workerId: undefined,
    workerName: undefined,
    workerType: undefined,
    taskType: undefined,
    taskStatus: undefined,
    orderId: undefined,
    orderNo: undefined,
    batchOrderId: undefined,
    customSku: undefined,
    skuQuantity: undefined,
    taskCompleteTime: undefined,
  }
  formRef.value?.resetFields()
}
</script>