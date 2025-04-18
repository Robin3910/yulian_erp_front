<template>
  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="68px"
    >
      <el-row :gutter="20">

        <el-col :span="24" :lg="6">
          <el-form-item label="商品名称" prop="categoryName" class="w-full">
            <el-input
              v-model="queryParams.categoryName"
              placeholder="请输入商品名称"
              clearable
              @keyup.enter="handleQuery"

            />
          </el-form-item>
        </el-col>

        <el-col :span="24" :lg="6">
          <el-form-item label="创建时间" prop="createTime" class="w-full">
            <el-date-picker
              v-model="queryParams.createTime"
              value-format="YYYY-MM-DD HH:mm:ss"
              type="daterange"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"

            />
          </el-form-item>
        </el-col>
        <el-col :span="24" :lg="6">
          <el-form-item class="w-full">
            <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
            <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
            <el-button
              v-hasPermi="['temu:product-category:create']"
              type="primary"
              plain
              @click="openForm('create')"

            >
              <Icon icon="ep:plus" class="mr-5px" /> 新增
            </el-button>

          </el-form-item>
        </el-col>
      </el-row>

    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="主键ID" align="center" prop="id" />
      <el-table-column label="商品品类ID" align="center" prop="categoryId" />
      <el-table-column label="商品名称" align="center" prop="categoryName" />
      <el-table-column label="定价规则" align="center" prop="unitPrice" min-width="200" >
        <template #default="scope">
          <div v-if="scope.row.unitPrice">
          <div v-for="(item,index) in scope.row.unitPrice.sort((a,b)=>a.max-b.max)" :key="index" class="mb-2 text-left flex">
            <div class="mr-2">产品数量：<el-tag type="success">{{scope.row.unitPrice.sort((a,b)=>a.max-b.max)[index-1]?scope.row.unitPrice.sort((a,b)=>a.max-b.max)[index-1].max:0}}</el-tag>~<el-tag type="success">{{item.max}}</el-tag></div>
            <div>价格：<el-tag type="success">{{item.price?'¥'+item.price.toFixed(2):'暂未设置'}}</el-tag></div>
          </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="默认价格" align="center" prop="defaultPrice" min-width="120" >
        <template #default="scope">
          <el-tag type="success">数量大于{{scope.row.unitPrice.sort((a,b)=>a.max-b.max)[scope.row.unitPrice.sort((a,b)=>a.max-b.max).length-1].max}} 价格:{{scope.row.defaultPrice?'¥'+scope.row.defaultPrice.toFixed(2):'暂未设置'}}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="商品尺寸" align="center" min-width="200">
        <template #default="scope">
          <div class="flex flex-col gap-1">
            <div>长度：<el-tag size="small">{{scope.row.length||0}}cm</el-tag></div>
            <div>宽度：<el-tag size="small">{{scope.row.width||0}}cm</el-tag></div>
            <div>高度：<el-tag size="small">{{scope.row.height||0}}cm</el-tag></div>
            <div>重量：<el-tag size="small">{{scope.row.weight||0}}kg</el-tag></div>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="主图URL" align="center" prop="mainImageUrl" >
        <template #default="scope">
          <el-image
            style="width: 100px; height: 100px"
            :src="scope.row.mainImageUrl"
            :preview-src-list="[scope.row.mainImageUrl]"
            :hide-on-click-modal="true"
            :preview-teleported="true"
            fit="cover"
          />
        </template>
      </el-table-column>
      <el-table-column
        label="创建时间"
        align="center"
        prop="createTime"
        :formatter="dateFormatter"
        width="180px"
      />
      <el-table-column label="操作" align="center" min-width="120px">
        <template #default="scope">
          <el-button
            v-hasPermi="['temu:product-category:update']"
            link
            type="primary"
            @click="openForm('update', scope.row.id)"

          >
            编辑
          </el-button>
          <el-button
            v-hasPermi="['temu:product-category:delete']"
            link
            type="danger"
            @click="handleDelete(scope.row.id)"

          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <!-- 分页 -->
    <Pagination
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />
  </ContentWrap>

  <!-- 表单弹窗：添加/修改 -->
  <ProductCategoryForm ref="formRef" @success="getList" />
</template>

<script setup lang="ts">
import { dateFormatter } from '@/utils/formatTime'
import download from '@/utils/download'
import { ProductCategoryApi, ProductCategoryVO } from '@/api/temu/product-category'
import  ProductCategoryForm from './conpoments/ProductCategoryForm.vue'

/** 商品品类 列表 */
defineOptions({ name: 'TemuProductCategory' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const list = ref<ProductCategoryVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  categoryId: undefined,
  categoryName: undefined,
  length: undefined,
  width: undefined,
  height: undefined,
  weight: undefined,
  mainImageUrl: undefined,
  createTime: [],
})
const queryFormRef = ref() // 搜索的表单

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await ProductCategoryApi.getProductCategoryPage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value.resetFields()
  handleQuery()
}

/** 添加/修改操作 */
const formRef = ref()
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id)
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 发起删除
    await ProductCategoryApi.deleteProductCategory(id)
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
  } catch {}
}

/** 初始化 **/
onMounted(() => {
  getList()
})
</script>
