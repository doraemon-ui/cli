import type { ComponentPublicInstance, CSSStylePropertiesWithVars } from '@doraemon-ui/miniprogram.core-js'

import type { DemoComponent } from './index'

/**
 * SemanticName类型定义
 *
 * - root: 根元素，设置容器样式和布局
 * - hover: 按压元素，按钮按下去的样式类
 */
export type SemanticName = 'root' | 'hover'

export interface DemoComponentProps {
  prefixCls?: string
  rootClassName?: string
  rootStyle?: string | Partial<CSSStylePropertiesWithVars>
  classNames?: Partial<Record<SemanticName, string>>
  styles?: Partial<Record<SemanticName, CSSStylePropertiesWithVars | string>>

  /**
   * 是否禁用
   *
   * @type {boolean}
   */
  disabled?: boolean

  /**
   * 按钮按下时的自定义样式类
   *
   * @type {string}
   */
  hoverClass?: string
}

export interface DemoComponentExpose {}

export type DemoComponentInstance = ComponentPublicInstance<DemoComponent, DemoComponentProps, DemoComponentExpose>
