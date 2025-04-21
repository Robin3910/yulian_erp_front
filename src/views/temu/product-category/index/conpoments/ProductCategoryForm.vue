<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      v-loading="formLoading"
    >
      <el-form-item label="商品名称" prop="categoryName">
        <el-input v-model="formData.categoryName" placeholder="请输入商品名称" clearable />
      </el-form-item>

      <el-form-item
        label="选择规则"
        prop="ruleType"
        :rules="[
          {
            required: true,
            message: '请选择规则类型',
            trigger: 'blur'
          }
        ]"
      >
        <el-radio-group v-model="formData.ruleType" @change="initUnitPrice">
          <el-radio :label="1">数量阶梯计价</el-radio>
          <el-radio :label="2">版面数量计价</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item
        v-if="formData.ruleType === 1"
        label="补充阶梯"
        prop="unitPrice"
        :rules="[
          {
            required: true,
            message: '请输入单位价格规则',
            trigger: 'blur'
          }
        ]"
      >
        <div class="flex flex-col">
          <div>
            <el-button type="primary" @click="addPriceRule">添加规则</el-button>
          </div>
          <div
            v-for="(item, index) in (formData.unitPrice as RulePriceByNumber).unitPrice"
            :key="index"
            class="flex items-center mt-4"
          >
            <span style="flex: 0 0 auto"></span>
            <el-form-item
              :label="`第${ numberToChinese(index + 1) }阶梯数量在:`"
              :prop="'unitPrice.unitPrice.' + index + `.max`"
              label-width="130px"
              class=""
              :rules="[
                {
                  required: true,
                  message: '请输入数量',
                  trigger: 'blur'
                }
              ]"
            >
              <div class="flex items-center">
                <span style="flex: 0 0 auto"
                  >{{
                    (formData.unitPrice as RulePriceByNumber).unitPrice[index - 1]
                      ? (formData.unitPrice as RulePriceByNumber).unitPrice[index - 1].max
                      : 0
                  }}-</span
                >
                <el-input
                  type="text"
                  v-model.number="item.max"
                  placeholder="请输入单位价格"
                  clearable
                />
              </div>
            </el-form-item>
            <el-form-item
              label="价格:"
              :prop="'unitPrice.unitPrice.' + index + `.price`"
              label-width="60px"
              class=""
              :rules="[
                {
                  required: true,
                  message: '请输入价格',
                  trigger: 'blur'
                },
                {
                  validator: (rule, value, callback) => {
                    if (value < 0) {
                      callback(new Error('价格必须大于等于0'))
                    } else {
                      callback()
                    }
                  },
                  trigger: 'blur'
                }
              ]"
            >
              <el-input type="number" v-model="item.price" placeholder="请输入价格" clearable />
            </el-form-item>
            <el-button
              class="ml-2"
              type="danger"
              @click="(formData.unitPrice as RulePriceByNumber).unitPrice.splice(index, 1)"
              >删除
            </el-button>
          </div>
          <div class="flex items-center mt-4 mb-4">
            <el-form-item
              label-width="0px"
              prop="unitPrice.defaultPrice"
              :rules="[
                {
                  required: true,
                  message: '请输入默认价格',
                  trigger: 'blur'
                }
              ]"
            >
              <div class="flex items-center">
                <span class="mr-2" style="flex: 0 0 auto"
                  >数量大于{{
                    sortRulePrice((formData.unitPrice as RulePriceByNumber).unitPrice)
                      ? sortRulePrice((formData.unitPrice as RulePriceByNumber).unitPrice)[
                          sortRulePrice((formData.unitPrice as RulePriceByNumber).unitPrice)
                            .length - 1
                        ].max
                      : 0
                  }}的价格是:</span
                >
                <el-input
                  v-model="(formData.unitPrice as RulePriceByNumber).defaultPrice"
                  placeholder="请输入价格"
                  clearable
                  class="w-full"
                />
              </div>
            </el-form-item>
          </div>
        </div>
      </el-form-item>
      <el-form-item
        v-if="formData.ruleType === 2"
        label="补充阶梯"
        prop="unitPrice"
        :rules="[
          {
            required: true,
            message: '请输入单位价格规则',
            trigger: 'blur'
          }
        ]"
      >
        <div class="flex flex-col">
          <div>
            <el-button type="primary" @click="addPriceRule">添加规则</el-button>
          </div>
         <div class="flex items-center mt-4 ">
           <div class="flex items-center mb-2">
             <el-form-item
               label-width="0px"
               prop="unitPrice.singlePrice"
               :rules="[
                {
                  required: true,
                  message: '请输入单个产品价格',
                  trigger: 'blur'
                }
              ]"
             >
               <div class="flex items-center">
                <span class="mr-2" style="flex: 0 0 auto"
                >单个产品的价格是:</span
                >
                 <el-input
                   v-model="(formData.unitPrice as RulePriceByLayout).singlePrice"
                   placeholder="请输入价格"
                   clearable
                   class="w-full"
                 />
               </div>
             </el-form-item>
           </div>
           <div class="flex items-center  mb-2">
             <el-form-item
               label-width="0px"
               prop="unitPrice.singleLayoutCount"
               :rules="[
                {
                  required: true,
                  message: '请输入单个版面可定做的数量',
                  trigger: 'blur'
                }
              ]"
             >
               <div class="flex items-center">
                <span class="mr-2" style="flex: 0 0 auto"
                >单个版面可定做的数量:</span>
                 <el-input
                   v-model="(formData.unitPrice as RulePriceByLayout).singleLayoutCount"
                   placeholder="请输入单个版面可定做的数量"
                   clearable
                   class="w-full"
                 />
               </div>
             </el-form-item>
           </div>
         </div>
          <div
            v-for="(item, index) in (formData.unitPrice as RulePriceByLayout).unitPrice"
            :key="index"
            class="flex items-center mt-4"
          >
            <span style="flex: 0 0 auto"></span>
            <el-form-item
              :label="`第${ numberToChinese(index + 1) }阶梯的数量在:`"
              :prop="'unitPrice.unitPrice.' + index + `.max`"
              label-width="140px"
              class=""
              :rules="[
                {
                  required: true,
                  message: '请输入数量',
                  trigger: 'blur'
                }
              ]"
            >
              <div class="flex items-center">
                <span style="flex: 0 0 auto"
                >{{
                    (formData.unitPrice as RulePriceByLayout).unitPrice[index - 1]
                      ? (formData.unitPrice as RulePriceByLayout).unitPrice[index - 1].max
                      : 0
                  }}-</span
                >
                <el-input
                  type="text"
                  v-model.number="item.max"
                  placeholder="请输入数量"
                  clearable
                />
              </div>
            </el-form-item>
            <el-form-item
              label="价格:"
              :prop="'unitPrice.unitPrice.' + index + `.price`"
              label-width="60px"
              class=""
              :rules="[
                {
                  required: true,
                  message: '请输入价格',
                  trigger: 'blur'
                },
                {
                  validator: (rule, value, callback) => {
                    if (value < 0) {
                      callback(new Error('价格必须大于等于0'))
                    } else {
                      callback()
                    }
                  },
                  trigger: 'blur'
                }
              ]"
            >
              <el-input type="number" v-model="item.price" placeholder="请输入价格" clearable />
            </el-form-item>
            <el-button
              class="ml-2"
              type="danger"
              @click="(formData.unitPrice as RulePriceByLayout).unitPrice.splice(index, 1)"
            >删除
            </el-button>
          </div>
          <div class="flex items-center mt-4 mb-2 ">
            <el-form-item
              label-width="0px"
              prop="unitPrice.defaultPrice"
              :rules="[
                {
                  required: true,
                  message: '请输入默认价格',
                  trigger: 'blur'
                }
              ]"
            >
              <div class="flex items-center w-full">
                <span class="mr-2" style="flex: 0 0 auto"
                >版面数量大于{{
                    sortRulePrice((formData.unitPrice as RulePriceByLayout).unitPrice)
                      ? sortRulePrice((formData.unitPrice as RulePriceByLayout).unitPrice)[
                      sortRulePrice((formData.unitPrice as RulePriceByLayout).unitPrice)
                        .length - 1
                        ].max
                      : 0
                  }}的价格是:</span
                >
                <el-input
                  v-model="(formData.unitPrice as RulePriceByLayout).defaultPrice"
                  placeholder="请输入价格"
                  clearable
                  style="flex:1"
                />
              </div>
            </el-form-item>
          </div>
        </div>
      </el-form-item>

      <el-form-item label="长度(cm)" prop="length">
        <el-input type="number" v-model="formData.length" placeholder="请输入长度(cm)" clearable />
      </el-form-item>
      <el-form-item label="宽度(cm)" prop="width">
        <el-input type="number" v-model="formData.width" placeholder="请输入宽度(cm)" clearable />
      </el-form-item>
      <el-form-item label="高度(cm)" prop="height">
        <el-input type="number" v-model="formData.height" placeholder="请输入高度(cm)" clearable />
      </el-form-item>
      <el-form-item label="重量(g)" prop="weight">
        <el-input type="number" v-model="formData.weight" placeholder="请输入重量(g)" clearable />
      </el-form-item>
      <el-form-item label="主图URL" prop="mainImageUrl">
        <upload-img :file-size="10" v-model="formData.mainImageUrl" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import { ProductCategoryApi,rulePrice,RulePriceByNumber,RulePriceByLayout } from '@/api/temu/product-category'
import _ from 'lodash'


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
  mainImageUrl: undefined,
  unitPrice: undefined as RulePriceByNumber | RulePriceByLayout | undefined,
  ruleType: undefined
})
const formRules = reactive({
  categoryId: [{ required: true, message: '商品品类ID不能为空', trigger: 'blur' }],
  categoryName: [{ required: true, message: '商品名称不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref
// 排序规则价格
const sortRulePrice = (arr: rulePrice[]) => {
  if (!arr) {
    return []
  }
  return _.cloneDeep(arr).sort((a, b) => a.max - b.max)
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
// 初始化规则价格
const initUnitPrice = () => {
  if (formData.value.ruleType === 1) {
    formData.value.unitPrice = {
      defaultPrice: undefined,
      unitPrice: [
        {
          max: undefined,
          price: undefined
        }
      ]
    }
  }
  if (formData.value.ruleType === 2) {
    formData.value.unitPrice = {
      singlePrice: undefined,
      singleLayoutCount: undefined,
      defaultPrice: undefined,
      unitPrice: [
        {
          max: undefined,
          price: undefined
        }
      ]
    }
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗
const numberToChinese = (num: number): string => {
  const chineseNumbers = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九']
  const units = [
    '',
    '十',
    '百',
    '千',
    '万',
    '十',
    '百',
    '千',
    '亿',
    '十',
    '百',
    '千',
    '万',
    '十',
    '百',
    '千'
  ]
  let result = ''
  let unitIndex = 0

  if (num === 0) {
    return chineseNumbers[0]
  }

  while (num > 0) {
    const digit = num % 10
    if (digit === 0) {
      if (result.length > 0 && result[0] !== chineseNumbers[0]) {
        result = chineseNumbers[0] + result
      }
    } else {
      result = chineseNumbers[digit] + units[unitIndex] + result
    }
    num = Math.floor(num / 10)
    unitIndex++
  }

  // 去除连续的零
  result = result.replace(/零+/g, '零')
  // 去除末尾的零
  if (result.endsWith('零')) {
    result = result.slice(0, -1)
  }
  // 处理十位为1的情况，如“一十”改为“十”
  result = result.replace(/^一十/, '十')

  return result
}
// 添加价格规则
const addPriceRule = () => {
  if (!(formData.value.unitPrice as RulePriceByNumber).unitPrice) {
    ;(formData.value.unitPrice as RulePriceByNumber).unitPrice = [
      {
        max: undefined,
        price: undefined
      }
    ]
  } else {
    ;(formData.value.unitPrice as RulePriceByNumber).unitPrice.push({
      max: undefined,
      price: undefined
    })
  }
}
/** 提交表单 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
const submitForm = async () => {
  // 校验表单
  await formRef.value.validate()
  // 提交请求
  formLoading.value = true
  try {
    const data = _.cloneDeep(formData.value)

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
    mainImageUrl: undefined,
    unitPrice: undefined
  }
  formRef.value?.resetFields()
}

</script>
