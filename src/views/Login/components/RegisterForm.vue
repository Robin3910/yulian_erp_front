<template>
  <el-form
    v-show="getShow"
    ref="formLogin"
    :model="registerData.registerForm"
    :rules="registerRules"
    class="login-form"
    label-position="top"
    label-width="120px"
    size="large"
  >
    <el-row style="margin-right: -10px; margin-left: -10px">
      <el-col :span="24" style="padding-right: 10px; padding-left: 10px">
        <el-form-item>
          <LoginFormTitle style="width: 100%" />
        </el-form-item>
      </el-col>
      <el-col :span="24" style="padding-right: 10px; padding-left: 10px">
        <el-form-item prop="username">
          <el-input
            v-model="registerData.registerForm.username"
            :placeholder="t('login.username')"
            size="large"
            :prefix-icon="iconAvatar"
            @input="handleUsernameInput"
          />
        </el-form-item>
      </el-col>
      <el-col :span="24" style="padding-right: 10px; padding-left: 10px">
        <el-form-item prop="password">
          <el-input
            v-model="registerData.registerForm.password"
            type="password"
            auto-complete="off"
            :placeholder="t('login.password')"
            size="large"
            :prefix-icon="iconLock"
            show-password
          />
        </el-form-item>
      </el-col>
      <el-col :span="24" style="padding-right: 10px; padding-left: 10px">
        <el-form-item prop="confirmPassword">
          <el-input
            v-model="registerData.registerForm.confirmPassword"
            type="password"
            size="large"
            auto-complete="off"
            :placeholder="t('login.checkPassword')"
            :prefix-icon="iconLock"
            show-password
          />
        </el-form-item>
      </el-col>
      <el-col :span="24" style="padding-right: 10px; padding-left: 10px">
        <el-form-item>
          <XButton
            :loading="loginLoading"
            :title="t('login.register')"
            class="w-[100%]"
            type="primary"
            @click="getCode()"
          />
        </el-form-item>
      </el-col>
      <Verify
        v-if="registerData.captchaEnable === 'true'"
        ref="verify"
        :captchaType="captchaType"
        :imgSize="{ width: '400px', height: '200px' }"
        mode="pop"
        @success="handleRegister"
      />
    </el-row>
    <XButton :title="t('login.hasUser')" class="w-[100%]" @click="handleBackLogin()" />
  </el-form>
</template>
<script lang="ts" setup>
import { ElLoading } from 'element-plus'
import LoginFormTitle from './LoginFormTitle.vue'
import type { RouteLocationNormalizedLoaded } from 'vue-router'
import { useIcon } from '@/hooks/web/useIcon'
import * as authUtil from '@/utils/auth'
import { usePermissionStore } from '@/store/modules/permission'
import * as LoginApi from '@/api/login'
import { LoginStateEnum, useLoginState } from './useLogin'

defineOptions({ name: 'RegisterForm' })

const { t } = useI18n()
const iconHouse = useIcon({ icon: 'ep:house' })
const iconAvatar = useIcon({ icon: 'ep:avatar' })
const iconLock = useIcon({ icon: 'ep:lock' })
const formLogin = ref()
const { handleBackLogin, getLoginState } = useLoginState()
const { currentRoute, push } = useRouter()
const permissionStore = usePermissionStore()
const redirect = ref<string>('')
const loginLoading = ref(false)
const verify = ref()
const captchaType = ref('blockPuzzle') // blockPuzzle 滑块 clickWord 点击文字

const getShow = computed(() => unref(getLoginState) === LoginStateEnum.REGISTER)

const equalToPassword = (rule, value, callback) => {
  if (registerData.registerForm.password !== value) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const registerRules = {
  tenantName: [
    { required: true, trigger: 'blur', message: '请输入您所属的租户' },
    { min: 2, max: 20, message: '租户账号长度必须介于 2 和 20 之间', trigger: 'blur' }
  ],
  username: [
    { required: true, trigger: 'blur', message: '请输入您的账号' },
    { min: 4, max: 30, message: '用户账号长度必须介于 4 和 30 之间', trigger: 'blur' }
  ],
  nickname: [
    { required: true, trigger: 'blur', message: '请输入您的昵称' },
    { min: 0, max: 30, message: '昵称长度必须介于 0 和 30 之间', trigger: 'blur' }
  ],
  password: [
    { required: true, trigger: 'blur', message: '请输入您的密码' },
    { min: 5, max: 20, message: '用户密码长度必须介于 5 和 20 之间', trigger: 'blur' },
    { pattern: /^[^<>"'|\\]+$/, message: '不能包含非法字符：< > " \' \\\ |', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, trigger: 'blur', message: '请再次输入您的密码' },
    { required: true, validator: equalToPassword, trigger: 'blur' }
  ]
}

const registerData = reactive({
  isShowPassword: false,
  captchaEnable: import.meta.env.VITE_APP_CAPTCHA_ENABLE,
  tenantEnable: import.meta.env.VITE_APP_TENANT_ENABLE,
  registerForm: {
    tenantName: import.meta.env.VITE_APP_DEFAULT_LOGIN_TENANT || '',
    nickname: '',
    tenantId: 0,
    username: '',
    password: '',
    confirmPassword: '',
    captchaVerification: ''
  }
})

const handleUsernameInput = (value: string) => {
  // 当用户名输入时，自动设置昵称
  registerData.registerForm.nickname = value
}

// 提交注册
const handleRegister = async (params: any) => {
  loading.value = true
  try {
    if (registerData.tenantEnable) {
      await getTenantId()
      registerData.registerForm.tenantId = authUtil.getTenantId()
    }

    if (registerData.captchaEnable) {
      registerData.registerForm.captchaVerification = params.captchaVerification
    }

    const res = await LoginApi.register(registerData.registerForm)
    if (!res) {
      return
    }
    loading.value = ElLoading.service({
      lock: true,
      text: '正在加载系统中...',
      background: 'rgba(0, 0, 0, 0.7)'
    })

    authUtil.removeLoginForm()

    authUtil.setToken(res)
    if (!redirect.value) {
      redirect.value = '/'
    }
    // 判断是否为SSO登录
    if (redirect.value.indexOf('sso') !== -1) {
      window.location.href = window.location.href.replace('/login?redirect=', '')
    } else {
      push({ path: redirect.value || permissionStore.addRouters[0].path })
    }
  } finally {
    loginLoading.value = false
    loading.value.close()
  }
}

// 获取验证码
const getCode = async () => {
  // 情况一，未开启：则直接注册
  if (registerData.captchaEnable === 'false') {
    await handleRegister({})
  } else {
    // 情况二，已开启：则展示验证码；只有完成验证码的情况，才进行注册
    // 弹出验证码
    verify.value.show()
  }
}

// 获取租户 ID
const getTenantId = async () => {
  if (registerData.tenantEnable === 'true') {
    const res = await LoginApi.getTenantIdByName(registerData.registerForm.tenantName)
    authUtil.setTenantId(res)
  }
}

// 根据域名，获得租户信息
const getTenantByWebsite = async () => {
  const website = location.host
  const res = await LoginApi.getTenantByWebsite(website)
  if (res) {
    registerData.registerForm.tenantName = res.name
    authUtil.setTenantId(res.id)
  }
}
const loading = ref() // ElLoading.service 返回的实例

watch(
  () => currentRoute.value,
  (route: RouteLocationNormalizedLoaded) => {
    redirect.value = route?.query?.redirect as string
  },
  {
    immediate: true
  }
)
onMounted(() => {
  // getCookie()
  getTenantByWebsite()
})
</script>

<style lang="scss" scoped>
:deep(.el-input__wrapper) {
  border: 1.5px solid #e4e7ed !important;
  
  &:hover, &.is-focus {
    border-color: #4d6bfe !important;
    box-shadow: 0 0 0 1px #4d6bfe33 !important;
  }
}

:deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: #4d6bfe !important;
  border-color: #4d6bfe !important;
}

:deep(.el-link.el-link--primary) {
  color: #4d6bfe !important;
  
  &:hover {
    color: #2563eb !important;
  }
}

:deep(.el-button) {
  &:hover {
    color: #2563eb !important;
    border-color: #2563eb !important;
  }
}

:deep(.el-button--default) {
  color: #4d6bfe !important;
  border-color: #4d6bfe !important;
  
  &:hover {
    color: #2563eb !important;
    border-color: #2563eb !important;
    background-color: rgba(37, 99, 235, 0.1) !important;
  }
  
  &:active {
    color: #1d4ed8 !important;
    border-color: #1d4ed8 !important;
  }
}

:deep(.el-button--primary) {
  --el-button-bg-color: #4d6bfe !important;
  --el-button-border-color: #4d6bfe !important;
  --el-button-text-color: #ffffff !important;
  --el-button-hover-bg-color: #2563eb !important;
  --el-button-hover-border-color: #2563eb !important;
  --el-button-hover-text-color: #ffffff !important;
  --el-button-active-bg-color: #1d4ed8 !important;
  --el-button-active-border-color: #1d4ed8 !important;
  --el-button-active-text-color: #ffffff !important;
  
  &:hover {
    color: #ffffff !important;
  }
  
  &:active {
    color: #ffffff !important;
  }
}

.register-back {
  color: #4d6bfe !important;
  
  &:hover {
    color: #6c85fe !important;
  }
  
  .el-icon {
    transition: transform 0.3s ease;
  }
  
  &:hover .el-icon {
    transform: translateX(-4px);
  }
}

.login-code {
  float: right;
  width: 100%;
  height: 38px;

  img {
    width: 100%;
    height: auto;
    max-width: 100px;
    vertical-align: middle;
    cursor: pointer;
  }
}

.password-form-item {
  margin-bottom: 35px !important;  // 增加底部间距
}

.password-strength-wrapper {
  margin-top: 8px;
  height: 20px;
  position: relative;
}

.password-strength {
  width: 100%;
  display: flex;
  align-items: center;
  font-size: 12px;
  
  .strength-bar {
    flex: 1;
    height: 4px;
    background: #eee;
    border-radius: 2px;
    margin-right: 8px;
    overflow: hidden;
    position: relative;
  }
  
  .strength-level {
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    transition: all 0.3s ease;
    
    &.strength-weak {
      width: 25%;
      background: #ff4d4f;
    }
    
    &.strength-medium {
      width: 50%;
      background: #faad14;
    }
    
    &.strength-strong {
      width: 75%;
      background: #52c41a;
    }
    
    &.strength-very-strong {
      width: 100%;
      background: #1890ff;
    }
  }
  
  .strength-text {
    color: var(--el-text-color-secondary);
    min-width: 36px;
  }
}
</style>
