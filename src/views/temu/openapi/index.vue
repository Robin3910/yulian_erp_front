<template>
  <div class="openapi-page">
    <!-- 平台分组标签 -->
    <div class="platform-tabs">
      <el-tabs v-model="activeTab" type="card">
        <el-tab-pane label="全部平台" name="all" />
      </el-tabs>
      <el-input v-model="searchText" class="search-input" placeholder="搜索平台名称" prefix-icon="el-icon-search"
        size="small" />
      <el-button size="small" type="primary" class="search-btn" @click="handleSearch">搜索</el-button>
      <el-button size="small" class="reset-btn" @click="handleReset">重置</el-button>
    </div>
    <!-- 平台logo区 -->
    <div class="platform-logos">
      <div class="logo-row">
        <div v-for="logo in filteredLogoList" :key="logo.name" class="logo-item"
          :class="{ selected: selectedLogo === logo.name }" @click="selectLogo(logo.name)" style="cursor:pointer;">
          <template v-if="logo.img">
            <img :src="logo.img" :alt="logo.name" class="logo-img" />
          </template>
          <template v-else>
            <span class="logo-text">{{ logo.name }}</span>
          </template>
        </div>
      </div>
    </div>
    <!-- 新增店铺按钮 -->
    <div class="add-shop-btn-wrap">
      <el-button type="primary" size="large" :disabled="!selectedLogo" @click="showAddShop = true">
        新增店铺
      </el-button>
    </div>
    <!-- 店铺条件搜索区，移动到新增店铺按钮下方 -->
    <div class="shop-filter-wrap">
      <el-input v-model="shopFilterName" placeholder="店铺名称" class="shop-filter-input" clearable
        @keyup.enter="handleShopFilter" />
      <el-select v-model="shopFilterPlatform" placeholder="授权平台" class="shop-filter-select" clearable>
        <el-option v-for="logo in logoList" :key="logo.name" :label="logo.name" :value="logo.name" />
      </el-select>
      <el-button type="primary" class="shop-filter-btn" @click="handleShopFilter">搜索</el-button>
      <el-button class="shop-filter-btn" @click="handleShopFilterReset">重置</el-button>
    </div>
    <!-- 表格和分页 -->
    <div class="table-section">
      <div class="table-header">
        <span>店铺名称</span>
        <span>授权平台</span>
        <span>店铺负责人</span>
        <span>授权时间</span>
        <span>授权到期时间</span>
        <span>更新时间</span>
        <span>操作</span>
      </div>
      <div v-if="shopList.length === 0" class="table-empty">
        <div class="empty-icon">🧢</div>
        <div class="empty-text">暂无店铺授权</div>
      </div>
      <div v-else class="table-content">
        <div v-for="shop in shopList" :key="shop.id" class="table-row">
          <span>{{ shop.shopName }}</span>
          <span>{{ shop.platform }}</span>
          <span>{{ shop.owner }}</span>
          <span>{{ formatTime(shop.authTime) }}</span>
          <span>{{ formatTime(shop.authExpireTime) }}</span>
          <span>{{ formatTime(shop.updateTime) }}</span>
          <span>
            <el-button type="text" size="small">编辑</el-button>
            <el-button type="text" size="small" style="color: #f56c6c;">删除</el-button>
          </span>
        </div>
      </div>
      <!-- 分页组件 -->
      <div class="pagination-wrap">
        <el-pagination v-model:current-page="pagination.pageNum" v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]" :total="pagination.total" layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange" @current-change="handleCurrentChange" />
      </div>
    </div>
    <!-- 新增店铺弹窗 -->
    <el-dialog v-model="showAddShop" :title="`新增${selectedLogo}店铺`" width="1000px" @close="resetAddShop"
      class="add-shop-dialog" draggable @open="clearFormValidation">
      <div v-if="selectedLogo === 'Temu'">
        <el-form :model="addShopForm" :rules="addShopRules" ref="addShopFormRef" label-width="110px">
          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="店铺名称" prop="shopName" required>
                <el-input v-model="addShopForm.shopName" placeholder="请输入店铺名称" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="店铺token" prop="token" required>
                <el-input v-model="addShopForm.token" placeholder="请输入店铺token" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="店铺ID" prop="shopId" required>
                <el-input v-model="addShopForm.shopId" placeholder="请输入店铺ID" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="店铺负责人" prop="owner" required>
                <el-input v-model="addShopForm.owner" placeholder="请输入店铺负责人" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="AppKey" prop="appKey" required>
                <el-input v-model="addShopForm.appKey" placeholder="请输入AppKey" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="AppSecret" prop="appSecret" required>
                <el-input v-model="addShopForm.appSecret" placeholder="请输入AppSecret" />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </div>
      <div v-else>
        其它平台表单（待实现）
      </div>
      <template #footer>
        <el-button @click="showAddShop = false">取消</el-button>
        <el-button type="primary" @click="handleAddShop">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { TemuCommonApi } from '@/api/temu/common'

const activeTab = ref('all')
const logoList = [
  { name: 'Temu', img: '' },
  { name: 'shein', img: '' }
]
const searchText = ref('')
const filteredLogoList = computed(() => {
  if (!searchText.value) return logoList
  return logoList.filter(logo => logo.name.toLowerCase().includes(searchText.value.trim().toLowerCase()))
})
const selectedLogo = ref('Temu')
const showAddShop = ref(false)
const addShopForm = ref({
  shopName: '',
  shopId: '',
  token: '',
  owner: '',
  platform: 'Temu',
  appKey: '',
  appSecret: ''
})
const addShopFormRef = ref()
const addShopRules = {
  shopName: [
    { required: true, message: '请输入店铺名称', trigger: 'blur' }
  ],
  shopId: [
    { required: true, message: '请输入店铺ID', trigger: 'blur' }
  ],
  token: [
    { required: true, message: '请输入店铺token', trigger: 'blur' }
  ],
  owner: [
    { required: true, message: '请输入店铺负责人', trigger: 'blur' }
  ],
  appKey: [
    { required: true, message: '请输入AppKey', trigger: 'blur' }
  ],
  appSecret: [
    { required: true, message: '请输入AppSecret', trigger: 'blur' }
  ]
}
const shopFilterName = ref('')
const shopFilterPlatform = ref('')
// 分页相关数据
const pagination = ref({
  pageNum: 1,
  pageSize: 10,
  total: 0
})
// 更新ShopItem接口定义，使用camelCase字段名
interface ShopItem {
  id: number;
  tenantId: number;
  shopName: string;
  platform: string;
  shopId: string;
  token: string;
  owner: string;
  authTime: number | null;
  authExpireTime: number | null;
  semiManagedMall: boolean;
  isThriftStore: boolean;
  updateTime: number;
  appKey: string;
  appSecret: string;
}
const shopList = ref<ShopItem[]>([])
const loading = ref(false)
function selectLogo(logo: string) {
  selectedLogo.value = logo
  addShopForm.value.platform = logo
}
function resetAddShop() {
  addShopForm.value = {
    shopName: '',
    shopId: '',
    token: '',
    owner: '',
    platform: selectedLogo.value,
    appKey: '',
    appSecret: ''
  }
}
async function handleAddShop() {
  // 校验表单
  const form = addShopFormRef.value
  if (!form) return
  await form.validate(async (valid: boolean) => {
    if (valid) {
      try {
        // 调用新增店铺接口
        const shopData = {
          shopName: addShopForm.value.shopName,
          shopId: addShopForm.value.shopId,
          token: addShopForm.value.token,
          owner: addShopForm.value.owner,
          platform: addShopForm.value.platform,
          appKey: addShopForm.value.appKey,
          appSecret: addShopForm.value.appSecret
        }
        const res = await TemuCommonApi.addShop(shopData)
        // 如果返回的是字符串且包含"成功"，说明保存成功
        if (res && typeof res === 'string' && res.includes('成功')) {
          ElMessage.success('新增店铺成功')
          showAddShop.value = false
          resetAddShop()
          // 刷新店铺列表
          getShopList()
        } else {
          ElMessage.error(typeof res === 'string' ? res : '新增店铺失败')
        }
      } catch (error) {
        console.error('新增店铺失败:', error)
        ElMessage.error('新增店铺失败')
      }
    } else {
      ElMessage.error('请完整填写必填项')
    }
  })
}
function handleSearch() {
  // 逻辑已由filteredLogoList computed处理，无需额外操作
}
function handleReset() {
  searchText.value = ''
}
// 获取店铺列表数据
async function getShopList() {
  loading.value = true
  try {
    const params = {
      pageNum: pagination.value.pageNum,
      pageSize: pagination.value.pageSize,
      shopName: shopFilterName.value || undefined,
      platform: shopFilterPlatform.value || undefined
    }
    const res = await TemuCommonApi.getShopPage(params)
    if (res && res.list) {
      shopList.value = res.list || []
      pagination.value.total = res.total || 0
    }
  } catch (error) {
    console.error('获取店铺列表失败:', error)
    ElMessage.error('获取店铺列表失败')
  } finally {
    loading.value = false
  }
}
// 分页事件处理
function handleSizeChange(size: number) {
  pagination.value.pageSize = size
  pagination.value.pageNum = 1
  getShopList()
}
function handleCurrentChange(page: number) {
  pagination.value.pageNum = page
  getShopList()
}
// 更新搜索和重置方法
function handleShopFilter() {
  pagination.value.pageNum = 1
  getShopList()
}
function handleShopFilterReset() {
  shopFilterName.value = ''
  shopFilterPlatform.value = ''
  pagination.value.pageNum = 1
  getShopList()
}
// 添加时间格式化函数
function formatTime(timestamp: number | null): string {
  if (!timestamp) return '-'
  return new Date(timestamp).toLocaleString('zh-CN')
}
// 添加清除表单校验的方法
function clearFormValidation() {
  const form = addShopFormRef.value
  if (form) {
    form.clearValidate()
  }
}
// 页面加载时获取数据
onMounted(() => {
  getShopList()
})
</script>

<style scoped>
.openapi-page {
  padding: 24px;
  background: #f5f6fa;
  min-height: 100vh;
}

.platform-tabs {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.platform-tabs .el-tabs {
  flex: 1;
}

.search-input {
  width: 200px;
  margin-left: 16px;
}

.platform-logos {
  background: #fff;
  border-radius: 8px;
  padding: 24px 16px 8px 16px;
  margin-bottom: 24px;
}

.logo-row {
  display: flex;
  flex-wrap: nowrap;
  margin-bottom: 16px;
}

.logo-item {
  flex: 0 0 110px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
  background: #fff;
  border-radius: 6px;
  font-size: 15px;
  color: #333;
  font-weight: 500;
  border: 1px solid #eee;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.logo-item.selected {
  border: 2px solid #409eff;
  box-shadow: 0 0 6px #409eff33;
  background: #e6f7ff;
}

.logo-img {
  width: 100px;
  height: 40px;
  object-fit: contain;
  display: block;
  margin: 0 auto;
}

.logo-text {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100px;
  height: 40px;
}

.add-shop-btn-wrap {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 16px;
}

.table-section {
  background: #fff;
  border-radius: 8px;
  margin-bottom: 24px;
  padding: 0 0 24px 0;
}

.table-header {
  display: flex;
  padding: 16px 24px;
  border-bottom: 1px solid #f0f0f0;
  color: #888;
  font-size: 14px;
  font-weight: 500;
}

.table-header span {
  flex: 1;
  text-align: left;
}

.table-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 120px;
  color: #bbb;
  font-size: 15px;
  padding: 32px 0;
}

.empty-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.add-shop-dialog .el-form {
  padding: 48px 48px 0 48px;
}

.add-shop-dialog .el-form-item {
  margin-bottom: 40px;
}

.add-shop-dialog .el-input,
.add-shop-dialog .el-select {
  width: 100%;
}

.inline-radio-group {
  display: flex;
  flex-direction: row;
  align-items: center;
}

.inline-radio-group .el-radio {
  margin-right: 24px;
}

.nowrap-label .el-form-item__label {
  white-space: nowrap;
}

.search-btn,
.reset-btn {
  margin-left: 8px;
}

.shop-filter-wrap {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.shop-filter-input {
  width: 250px;
  margin-right: 8px;
}

.shop-filter-select {
  width: 200px;
  margin-right: 8px;
}

.shop-filter-btn {
  margin-right: 8px;
}

.table-content {
  padding: 0 24px;
}

.table-row {
  display: flex;
  padding: 16px 0;
  border-bottom: 1px solid #f0f0f0;
  align-items: center;
}

.table-row:last-child {
  border-bottom: none;
}

.table-row span {
  flex: 1;
  text-align: left;
  font-size: 14px;
  color: #333;
}

.pagination-wrap {
  display: flex;
  justify-content: center;
  padding: 24px;
  border-top: 1px solid #f0f0f0;
}
</style>
