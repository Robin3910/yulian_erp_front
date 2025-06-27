import type { RouteMeta } from 'vue-router'
import { Icon } from '@/components/Icon'
import { useI18n } from '@/hooks/web/useI18n'
import { ElBadge } from 'element-plus'
import { useUrgentOrderStore } from '@/store/modules/urgentOrder'
import { Fragment } from 'vue'

export const useRenderMenuTitle = () => {
  const urgentOrderStore = useUrgentOrderStore()
  const renderMenuTitle = (meta: RouteMeta) => {
    const { t } = useI18n()
    const { title = 'Please set title', icon } = meta

    if (title === '加急') {
      // console.log('渲染加急菜单，当前数量:', urgentOrderStore.urgentOrderCount)
      return (
        <span style="display: inline-flex; align-items: center;">
          {icon && <Icon icon={icon} />}
          <span class="v-menu__title overflow-hidden overflow-ellipsis whitespace-nowrap" style="margin-left: 4px;">
            {t(title as string)}
          </span>
          {urgentOrderStore.urgentOrderCount > 0 && (
            <span
              style="
                display: inline-block;
                min-width: 18px;
                height: 18px;
                line-height: 18px;
                background: #f56c6c;
                color: #fff;
                border-radius: 9px;
                font-size: 12px;
                text-align: center;
                margin-left: 6px;
                padding: 0 5px;
                font-weight: bold;
              "
            >
              {urgentOrderStore.urgentOrderCount}
            </span>
          )}
        </span>
      )
    }
    return icon ? (
      <Fragment>
        <Icon icon={icon}></Icon>
        <span class="v-menu__title overflow-hidden overflow-ellipsis whitespace-nowrap">
          {t(title as string)}
        </span>
      </Fragment>
    ) : (
      <span class="v-menu__title overflow-hidden overflow-ellipsis whitespace-nowrap">
        {t(title as string)}
      </span>
    )
  }

  return {
    renderMenuTitle
  }
}
