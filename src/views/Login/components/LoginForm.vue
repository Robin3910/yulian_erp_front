<template>
  <el-form
    v-show="getShow"
    ref="formLogin"
    :model="loginData.loginForm"
    :rules="LoginRules"
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
            v-model="loginData.loginForm.username"
            :placeholder="t('login.usernamePlaceholder')"
            :prefix-icon="iconAvatar"
          />
        </el-form-item>
      </el-col>
      <el-col :span="24" style="padding-right: 10px; padding-left: 10px">
        <el-form-item prop="password">
          <el-input
            v-model="loginData.loginForm.password"
            :placeholder="t('login.passwordPlaceholder')"
            :prefix-icon="iconLock"
            show-password
            type="password"
            @keyup.enter="getCode()"
          />
        </el-form-item>
      </el-col>
      <el-col
        :span="24"
        style="padding-right: 10px; padding-left: 10px; margin-top: -20px; margin-bottom: -20px"
      >
        <el-form-item>
          <el-row justify="space-between" style="width: 100%">
            <el-col :span="6">
              <el-checkbox v-model="loginData.loginForm.rememberMe">
                {{ t('login.remember') }}
              </el-checkbox>
            </el-col>
            <el-col :offset="6" :span="12">
              <el-link
                style="float: right"
                type="primary"
                @click="setLoginState(LoginStateEnum.RESET_PASSWORD)"
              >
                {{ t('login.forgetPassword') }}
              </el-link>
            </el-col>
          </el-row>
        </el-form-item>
      </el-col>
      <el-col :span="24" style="padding-right: 10px; padding-left: 10px">
        <el-form-item>
          <XButton
            :loading="loginLoading"
            :title="t('login.login')"
            class="w-[100%]"
            type="primary"
            @click="getCode()"
          />
        </el-form-item>
      </el-col>
      <el-col :span="6" style="padding-right: 10px; padding-left: 10px">
        <el-form-item>
          <XButton
            :title="t('login.btnRegister')"
            class="w-[100%]"
            @click="setLoginState(LoginStateEnum.REGISTER)"
          />
        </el-form-item>
      </el-col>
      <Verify
        v-if="loginData.captchaEnable === 'true'"
        ref="verify"
        :captchaType="captchaType"
        :imgSize="{ width: '400px', height: '200px' }"
        mode="pop"
        @success="handleLogin"
      />
    </el-row>
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
import { LoginStateEnum, useFormValid, useLoginState } from './useLogin'

defineOptions({ name: 'LoginForm' })

const { t } = useI18n()
const message = useMessage()
const iconHouse = useIcon({ icon: 'ep:house' })
const iconAvatar = useIcon({ icon: 'ep:avatar' })
const iconLock = useIcon({ icon: 'ep:lock' })
const formLogin = ref()
const { validForm } = useFormValid(formLogin)
const { setLoginState, getLoginState } = useLoginState()
const { currentRoute, push } = useRouter()
const permissionStore = usePermissionStore()
const redirect = ref<string>('')
const loginLoading = ref(false)
const verify = ref()
const captchaType = ref('blockPuzzle') // blockPuzzle 滑块 clickWord 点击文字
const showPassword = ref(false)

const getShow = computed(() => unref(getLoginState) === LoginStateEnum.LOGIN)

const LoginRules = {
  tenantName: [required],
  username: [required],
  password: [required]
}
const loginData = reactive({
  isShowPassword: false,
  captchaEnable: import.meta.env.VITE_APP_CAPTCHA_ENABLE,
  tenantEnable: import.meta.env.VITE_APP_TENANT_ENABLE,
  loginForm: {
    tenantName: import.meta.env.VITE_APP_DEFAULT_LOGIN_TENANT || '',
    username: import.meta.env.VITE_APP_DEFAULT_LOGIN_USERNAME || '',
    password: import.meta.env.VITE_APP_DEFAULT_LOGIN_PASSWORD || '',
    captchaVerification: '',
    rememberMe: true // 默认记录我。如果不需要，可手动修改
  }
})

const socialList = [
  { icon: 'ant-design:wechat-filled', type: 30 },
  { icon: 'ant-design:dingtalk-circle-filled', type: 20 },
  { icon: 'ant-design:github-filled', type: 0 },
  { icon: 'ant-design:alipay-circle-filled', type: 0 }
]

// 获取验证码
const getCode = async () => {
  // 情况一，未开启：则直接登录
  if (loginData.captchaEnable === 'false') {
    await handleLogin({})
  } else {
    // 情况二，已开启：则展示验证码；只有完成验证码的情况，才进行登录
    // 弹出验证码
    verify.value.show()
  }
}
// 获取租户 ID
const getTenantId = async () => {
  if (loginData.tenantEnable === 'true') {
    const res = await LoginApi.getTenantIdByName(loginData.loginForm.tenantName)
    authUtil.setTenantId(res)
  }
}
// 记住我
const getLoginFormCache = () => {
  const loginForm = authUtil.getLoginForm()
  if (loginForm) {
    loginData.loginForm = {
      ...loginData.loginForm,
      username: loginForm.username ? loginForm.username : loginData.loginForm.username,
      password: loginForm.password ? loginForm.password : loginData.loginForm.password,
      rememberMe: loginForm.rememberMe,
      tenantName: loginForm.tenantName ? loginForm.tenantName : loginData.loginForm.tenantName
    }
  }
}
// 根据域名，获得租户信息
const getTenantByWebsite = async () => {
  const website = location.host
  const res = await LoginApi.getTenantByWebsite(website)
  if (res) {
    loginData.loginForm.tenantName = res.name
    authUtil.setTenantId(res.id)
  }
}
const loading = ref() // ElLoading.service 返回的实例
// 登录
const handleLogin = async (params: any) => {
  loginLoading.value = true
  try {
    await getTenantId()
    const data = await validForm()
    if (!data) {
      return
    }
    const loginDataLoginForm = { ...loginData.loginForm }
    loginDataLoginForm.captchaVerification = params.captchaVerification
    const res = await LoginApi.login(loginDataLoginForm)
    if (!res) {
      return
    }
    loading.value = ElLoading.service({
      lock: true,
      text: '正在加载系统中...',
      background: 'rgba(0, 0, 0, 0.7)'
    })
    if (loginDataLoginForm.rememberMe) {
      authUtil.setLoginForm(loginDataLoginForm)
    } else {
      authUtil.removeLoginForm()
    }
    authUtil.setToken(res)
    if (!redirect.value) {
      redirect.value = '/'
    }
    // 判断是否为SSO登录
    if (redirect.value.indexOf('sso') !== -1) {
      window.location.href = window.location.href.replace('/login?redirect=', '')
    } else {
      await push({ path: redirect.value || permissionStore.addRouters[0].path })
    }
  } finally {
    loginLoading.value = false
    loading.value.close()
  }
}

// 社交登录
const doSocialLogin = async (type: number) => {
  if (type === 0) {
    message.error('此方式未配置')
  } else {
    loginLoading.value = true
    if (loginData.tenantEnable === 'true') {
      // 尝试先通过 tenantName 获取租户
      await getTenantId()
      // 如果获取不到，则需要弹出提示，进行处理
      if (!authUtil.getTenantId()) {
        try {
          const data = await message.prompt('请输入租户名称', t('common.reminder'))
          if (data?.action !== 'confirm') throw 'cancel'
          const res = await LoginApi.getTenantIdByName(data.value)
          authUtil.setTenantId(res)
        } catch (error) {
          if (error === 'cancel') return
        } finally {
          loginLoading.value = false
        }
      }
    }
    // 计算 redirectUri
    // tricky: type、redirect需要先encode一次，否则钉钉回调会丢失。
    // 配合 Login/SocialLogin.vue#getUrlValue() 使用
    const redirectUri =
      location.origin +
      '/social-login?' +
      encodeURIComponent(`type=${type}&redirect=${redirect.value || '/'}`)

    // 进行跳转
    window.location.href = await LoginApi.socialAuthRedirect(type, encodeURIComponent(redirectUri))
  }
}
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
  getLoginFormCache()
  getTenantByWebsite()
})

// 密码强度计算
const getPasswordStrength = (password: string) => {
  if (!password) return 0
  let strength = 0
  // 长度检查
  if (password.length >= 8) strength += 1
  // 包含数字
  if (/\d/.test(password)) strength += 1
  // 包含字母
  if (/[a-zA-Z]/.test(password)) strength += 1
  // 包含特殊字符
  if (/[!@#$%^&*]/.test(password)) strength += 1
  return strength
}

const strengthClass = computed(() => {
  const strength = getPasswordStrength(loginData.loginForm.password)
  return {
    'strength-weak': strength === 1,
    'strength-medium': strength === 2,
    'strength-strong': strength === 3,
    'strength-very-strong': strength === 4
  }
})

const strengthText = computed(() => {
  const strength = getPasswordStrength(loginData.loginForm.password)
  const texts = ['弱', '中等', '强', '非常强']
  return texts[strength - 1] || ''
})
</script>

<style lang="scss" scoped>
:deep(.anticon) {
  &:hover {
    color: #4d6bfe !important;
  }
}

:deep(.el-input__wrapper) {
  border: 1.5px solid #e4e7ed !important;
  
  &:hover, &.is-focus {
    border-color: #4d6bfe !important;
    box-shadow: 0 0 0 1.5px #4d6bfe33 !important;
  }
}

:deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: #4d6bfe !important;
  border-color: #4d6bfe !important;
}

:deep(.el-checkbox__label) {
  color: #4d6bfe !important;
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

.title-divider {
  height: 2px;
  background: var(--el-color-primary);
  margin: 8px 0 16px;
  border-radius: 2px;
  width: 40px;
}

.enterprise-option {
  display: flex;
  align-items: center;
  
  i {
    color: var(--el-color-primary);
  }
}

.password-field {
  position: relative;
}

.password-strength {
  position: absolute;
  bottom: -20px;
  left: 0;
  right: 0;
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
  }
  
  .strength-level {
    height: 100%;
    width: 0;
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
  }
}

.login-button {
  height: 44px;
  font-size: 16px;
  border-radius: 22px;
  background: var(--el-color-primary);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.3);
  }
}

.register-link {
  font-size: 14px;
  color: var(--el-color-primary);
  display: inline-flex;
  align-items: center;
  transition: all 0.3s ease;
  
  .el-icon {
    margin-left: 4px;
    transition: transform 0.3s ease;
  }
  
  &:hover {
    .el-icon {
      transform: translateX(4px);
    }
  }
}

// 移动端适配
@media screen and (max-width: 768px) {
  .el-input {
    input[type="tel"] {
      -webkit-appearance: none;
      -moz-appearance: textfield;
    }
  }
}
</style>
