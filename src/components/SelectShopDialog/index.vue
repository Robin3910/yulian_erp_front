<template>
  <Dialog v-model="dialogVisible" title="绑定店铺">
    <el-form  ref="formRef" v-loading="formLoading" :model="formData" label-width="100px">
      <el-form-item label="绑定的用户：">
        <el-input :value="userInfo.nickname" disabled />
      </el-form-item>
      <el-form-item
        prop="shopId"
        label="关联店铺："
        :rules="[
          {
            required: true,
            message: '请选择要关联的店铺',
            trigger: 'change'
          }
        ]"
      >
        <el-select v-model="formData.shopId" filterable placeholder="请选择要关联的店铺" clearable>
          <el-option
            v-for="(item, index) in shopList"
            :key="index"
            :label="item.shopName"
            :value="item.shopId"
          />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import { TemuCommonApi } from '@/api/temu/common'
import {UserApi} from "@/api/temu/user";
import { ElMessage } from 'element-plus'


defineOptions({
  name: 'SelectShopDialog'
})
const dialogVisible = ref(false) // 弹窗的是否展示
const formLoading = ref(false)
const shopList = ref<any[]>([])
const userInfo = ref<any>(null)
const formRef = ref()
const formData = reactive({
  shopId: '',
  userId: '',
  tenant_id:""
})
const submitForm = async () => {
  formLoading.value = false
  formRef.value.validate(async (valid: boolean) => {
    console.log(valid)
    if (!valid) return
    await  UserApi.bindShop(formData)
    ElMessage.success('绑定成功')
    dialogVisible.value = false
  })
}
// 获取店铺列表
const getShopList = async () => {
  const data = await TemuCommonApi.getShopList()
  shopList.value = data.list
}
// 打开弹窗
const open = (row: any) => {
  console.log(row)
  userInfo.value = row
  getShopList()
  dialogVisible.value = true
  formData.userId = row.id
  formData.tenant_id = row.tenantId
}
defineExpose({
  open
})
</script>

<style scoped lang="scss"></style>
