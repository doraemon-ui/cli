import { defineComponentHOC, Doraemon, Component, Prop } from '@doraemon-ui/miniprogram.core-js'
import type { CSSStylePropertiesWithVars } from '@doraemon-ui/miniprogram.core-js'
import { useCSSVarCls, useHoverCls, useSemanticClassNames, useSemanticStylesString } from '@doraemon-ui/miniprogram.shared'
import type { SemanticName } from './types'

const { classNames, styleToCssString } = Doraemon.util

@Component({
  props: {
    prefixCls: {
      type: String,
      default: 'dora-demo-component',
    },
    rootClassName: {
      type: String,
      default: '',
    },
    rootStyle: {
      type: null,
      default: null,
    },
    classNames: {
      type: Object,
      default: () => ({}),
    },
    styles: {
      type: Object,
      default: () => ({}),
    },
  },
})
class DemoComponent extends Doraemon {
  /**
   * 自定义类名前缀
   *
   * @type {string}
   * @memberof DemoComponent
   */
  prefixCls!: string
  rootClassName!: string
  rootStyle!: string | Partial<CSSStylePropertiesWithVars>
  classNames!: Partial<Record<SemanticName, string>>
  styles!: Partial<Record<SemanticName, CSSStylePropertiesWithVars | string>>

  @Prop({
    type: Boolean,
    default: false,
  })
  disabled: boolean

  @Prop({
    type: String,
    default: 'default',
  })
  hoverClass: string

  get classes() {
    const { prefixCls, rootClassName, hoverClass, disabled } = this
    const internalClassNames: Partial<Record<SemanticName, string>> = {
      root: classNames(prefixCls, rootClassName, useCSSVarCls(prefixCls), {
        [`${prefixCls}--disabled`]: disabled,
      }),
      hover: useHoverCls(prefixCls, hoverClass),
    }

    return useSemanticClassNames(undefined, internalClassNames, this.classNames)
  }

  get mergedStyles() {
    const { rootStyle = {} } = this
    return useSemanticStylesString(
      {
        root: rootStyle,
      },
      this.styles,
    )
  }

  onClick() {
    if (!this.disabled) {
      this.$emit('click')
    }
  }
}

export { DemoComponent }

export default defineComponentHOC()(DemoComponent)
