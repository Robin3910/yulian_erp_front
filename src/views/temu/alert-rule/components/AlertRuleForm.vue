<template>
  <el-dialog 
    :title="formTitle" 
    v-model="dialogVisible" 
    width="900px" 
    append-to-body 
    destroy-on-close
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="120px"
      v-loading="formLoading"
    >
      <el-form-item label="规则名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入规则名称" />
      </el-form-item>
      <el-form-item label="规则描述" prop="description">
        <el-input v-model="formData.description" type="textarea" placeholder="请输入规则描述" :rows="2" />
      </el-form-item>
      <el-form-item label="SQL查询内容" prop="sqlContent">
        <el-input v-model="formData.sqlContent" type="textarea" placeholder="请输入SQL查询内容，必须是返回单个数值的查询" :rows="5" />
        <div class="mt-1 text-gray-500 text-sm">
          SQL必须返回单个数值，如聚合函数COUNT、SUM等。为确保安全，请在管理环境下编写和验证。
        </div>
      </el-form-item>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="阈值" prop="threshold">
            <el-input-number v-model="formData.threshold" :min="0" :precision="0" :step="1" class="!w-full" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="比较类型" prop="compareType">
            <el-select v-model="formData.compareType" placeholder="请选择比较类型" class="!w-full">
              <el-option v-for="item in compareTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="CRON表达式" prop="cronExpression">
        <el-input v-model="formData.cronExpression" placeholder="请输入CRON表达式，如 0 0 * * * ?">
          <template #append>
            <el-popover
              placement="top"
              width="400"
              trigger="click"
            >
              <template #reference>
                <el-button><Icon icon="ep:question-filled" /></el-button>
              </template>
              <div>
                <h3 class="mb-2">CRON表达式说明</h3>
                <p>CRON表达式由6个或7个时间元素组成，格式为: <code>秒 分 时 日 月 周 [年]</code></p>
                <div class="mt-2">
                  <div><b>常用示例:</b></div>
                  <div><code>0 0 * * * ?</code> - 每小时执行一次</div>
                  <div><code>0 0 0 * * ?</code> - 每天0点执行一次</div>
                  <div><code>0 0 0 ? * MON</code> - 每周一0点执行一次</div>
                  <div><code>0 0 0 1 * ?</code> - 每月1号0点执行一次</div>
                </div>
              </div>
            </el-popover>
          </template>
        </el-input>
      </el-form-item>
      <el-form-item label="Webhook地址" prop="webhookUrls">
        <div class="webhook-list">
          <div v-for="(webhook, index) in webhookList" :key="index" class="webhook-item mb-2 flex items-center">
            <el-input 
              v-model="webhook.url" 
              placeholder="请输入企业微信Webhook地址" 
              class="flex-1 mr-2" 
              @input="updateWebhookUrl" 
            />
            <el-button 
              type="danger" 
              circle 
              @click="removeWebhook(index)" 
              :disabled="webhookList.length === 1"
              class="delete-btn flex items-center justify-center"
            >
              <Icon icon="ep:delete" />
            </el-button>
          </div>
          <el-button type="primary" plain class="mt-2" @click="addWebhook">
            <Icon icon="ep:plus" class="mr-1" /> 添加Webhook地址
          </el-button>
          <div class="text-gray-500 text-sm mt-1">
            支持添加多个Webhook地址，告警将同时发送到所有地址，建议不超过5个Webhook地址
          </div>
        </div>
      </el-form-item>
      <el-form-item label="通知模板" prop="notifyTemplate" class="full-width-item">
        <div class="template-editor">
          <div class="mb-2">
            <div class="text-gray-500 text-sm mb-1">点击按钮可快速插入变量：</div>
            <div class="template-variables">
              <el-button 
                v-for="variable in templateVariables" 
                :key="variable.name" 
                size="small" 
                @click="insertVariable(variable.name)" 
                type="info" 
                plain 
                class="mr-2 mb-2"
              >
                {{ variable.label }}
              </el-button>
            </div>
          </div>
          <el-input 
            v-model="formData.notifyTemplate" 
            type="textarea" 
            placeholder="请输入通知模板" 
            :autosize="{ minRows: 4, maxRows: 10 }" 
            ref="templateInputRef"
            class="template-input" 
          />
        </div>
        <div class="mt-1 text-gray-500 text-sm">
          官方示例：<br/>
          1. 返单告警：<code>"警告：系统检测到当前返单数量为${resultValue}，已超过预设阈值${threshold}，时间${alertTime} - 请及时处理！"</code><br/>
          2. 未下单告警：<code>"警告：系统检测到当前有${resultValue}个未下单的订单，超过阈值${threshold}，时间${alertTime} - 请及时处理！"</code>
        </div>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="formData.status">
          <el-radio :label="0">禁用</el-radio>
          <el-radio :label="1">启用</el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="formLoading">确定</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { TemuAlertRuleApi, TemuAlertRuleBaseVO, TemuAlertRuleRespVO } from '@/api/temu/alert-rule'
import { formatDate } from '@/utils/formatTime'

defineOptions({ name: 'AlertRuleForm' })
const emit = defineEmits(['success'])
const message = useMessage() // 消息弹窗

// 表单相关变量
const dialogVisible = ref(false)
const formLoading = ref(false)
const formTitle = ref('')
const formType = ref('create') // create / update
const formRef = ref()
const templateInputRef = ref() // 模板输入框引用

// 可用的模板变量
const templateVariables = [
  { name: 'name', label: '规则名称' },
  { name: 'resultValue', label: 'SQL查询结果值' },
  { name: 'threshold', label: '阈值' },
  { name: 'alertTime', label: '触发时间' }
]

// 插入变量到模板中
const insertVariable = (variableName: string) => {
  if (!templateInputRef.value) return
  
  const input = templateInputRef.value.$el.querySelector('textarea')
  if (!input) return
  
  const start = input.selectionStart
  const end = input.selectionEnd
  const template = formData.value.notifyTemplate || ''
  
  // 在光标位置插入变量
  const variable = '${' + variableName + '}'
  const newTemplate = template.substring(0, start) + variable + template.substring(end)
  formData.value.notifyTemplate = newTemplate
  
  // 重新聚焦并设置光标位置
  nextTick(() => {
    input.focus()
    input.setSelectionRange(start + variable.length, start + variable.length)
  })
}

// Webhook地址列表管理
const webhookList = ref<{url: string}[]>([{ url: '' }])

// 添加Webhook地址
const addWebhook = () => {
  webhookList.value.push({ url: '' })
}

// 移除Webhook地址
const removeWebhook = (index: number) => {
  if (webhookList.value.length > 1) {
    webhookList.value.splice(index, 1)
    updateWebhookUrl()
  }
}

// 更新webhookUrl字段（逗号分隔多个地址）
const updateWebhookUrl = () => {
  const urls = webhookList.value
    .map(item => item.url.trim())
    .filter(url => url)
    .join(',')
  formData.value.webhookUrl = urls
}

// 表单数据
const defaultFormData: TemuAlertRuleBaseVO = {
  name: '',
  description: '',
  sqlContent: '',
  threshold: 0,
  compareType: 1,
  cronExpression: '0 0 * * * ?', // 默认每小时执行一次
  webhookUrl: '',
  notifyTemplate: '警告：系统检测到当前返单数量为${resultValue}，已超过预设阈值${threshold}，时间${alertTime} - 请及时处理！',
  status: 1 // 默认启用
}
const formData = ref<Partial<TemuAlertRuleBaseVO & { id?: number }>>({...defaultFormData})

// 表单校验规则
const formRules = {
  name: [{ required: true, message: '规则名称不能为空', trigger: 'blur' }],
  sqlContent: [{ required: true, message: 'SQL查询内容不能为空', trigger: 'blur' }],
  threshold: [{ required: true, message: '阈值不能为空', trigger: 'blur' }],
  compareType: [{ required: true, message: '比较类型不能为空', trigger: 'change' }],
  cronExpression: [{ required: true, message: 'CRON表达式不能为空', trigger: 'blur' }],
  webhookUrl: [{ required: true, message: 'Webhook地址不能为空', trigger: 'blur' }],
  notifyTemplate: [{ required: true, message: '通知模板不能为空', trigger: 'blur' }],
  status: [{ required: true, message: '状态不能为空', trigger: 'change' }]
}

// 比较类型选项
const compareTypeOptions = [
  { value: 1, label: '大于 (>)' },
  { value: 2, label: '等于 (=)' },
  { value: 3, label: '小于 (<)' },
  { value: 4, label: '大于等于 (>=)' },
  { value: 5, label: '小于等于 (<=)' },
  { value: 6, label: '不等于 (!=)' }
]

/** 打开表单 */
const open = async (data?: TemuAlertRuleRespVO) => {
  dialogVisible.value = true
  resetForm()
  
  if (data?.id) {
    // 修改
    formTitle.value = '修改告警规则'
    formType.value = 'update'
    
    // 加载详情
    formLoading.value = true
    try {
      const res = await TemuAlertRuleApi.getAlertRule(data.id)
      formData.value = { ...res }
      
      // 处理Webhook地址列表
      if (res.webhookUrl) {
        const urls = res.webhookUrl.split(',').filter(url => url.trim())
        webhookList.value = urls.map(url => ({ url }))
        if (webhookList.value.length === 0) {
          webhookList.value = [{ url: '' }]
        }
      } else {
        webhookList.value = [{ url: '' }]
      }
    } catch (error) {
      message.error('获取规则详情失败')
    } finally {
      formLoading.value = false
    }
  } else {
    // 新增
    formTitle.value = '新增告警规则'
    formType.value = 'create'
    formData.value = { ...defaultFormData }
    webhookList.value = [{ url: '' }]
  }
}

/** 重置表单 */
const resetForm = () => {
  formData.value = { ...defaultFormData }
  webhookList.value = [{ url: '' }]
  nextTick(() => {
    formRef.value?.resetFields()
  })
}

/** 提交表单 */
const submitForm = async () => {
  // 表单校验
  await formRef.value.validate()
  
  // 确保webhookUrl已更新
  updateWebhookUrl()
  
  formLoading.value = true
  try {
    // 提交请求
    if (formType.value === 'create') {
      // 创建
      await TemuAlertRuleApi.createAlertRule(formData.value as TemuAlertRuleBaseVO)
      message.success('创建成功')
    } else {
      // 更新
      await TemuAlertRuleApi.updateAlertRule(formData.value as TemuAlertRuleBaseVO & { id: number })
      message.success('更新成功')
    }
    
    // 关闭表单
    dialogVisible.value = false
    
    // 通知父组件刷新
    emit('success')
  } catch (error) {
    message.error(formType.value === 'create' ? '创建失败' : '更新失败')
  } finally {
    formLoading.value = false
  }
}

// 暴露方法
defineExpose({
  open
})
</script>

<style lang="scss" scoped>
:deep(.el-form-item__content) {
  .el-input-number {
    width: 100%;
  }
}

.template-editor {
  width: 100%;
  
  .template-variables {
    display: flex;
    flex-wrap: wrap;
  }
  
  .template-input {
    width: 100%;
  }
  
  :deep(.el-textarea__inner) {
    min-width: 100%;
    width: 100%;
    resize: vertical;
  }
}

:deep(.el-form-item.full-width-item) {
  width: 100%;
  
  .el-form-item__content {
    width: calc(100% - 120px);
  }
}

// 增加对话框宽度相关样式
:deep(.el-dialog__body) {
  padding: 20px 30px;
}

.webhook-list {
  .webhook-item {
    display: flex;
    align-items: center;
  }
  
  .delete-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    
    :deep(.el-icon) {
      margin: 0;
    }
  }
}
</style> 