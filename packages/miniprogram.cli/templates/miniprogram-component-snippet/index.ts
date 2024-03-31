import { defineComponentHOC, Doraemon, Component, Prop } from '@doraemon-ui/miniprogram.core-js'
const { classNames, styleToCssString } = Doraemon.util

@Component({
  props: {
    prefixCls: {
      type: String,
      default: 'dora-demo-component',
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

  @Prop({
    type: Object,
    default: null,
  })
  wrapStyle: Partial<CSSStyleDeclaration>

  get classes () {
    const { prefixCls, hoverClass, disabled } = this
    const wrap = classNames(prefixCls, {
      [`${prefixCls}--disabled`]: disabled,
    })
    const hover = hoverClass && hoverClass !== 'default' ? hoverClass : `${prefixCls}--hover`

    return {
      wrap,
      hover,
    }
  }

  get containerStyle () {
    return this.wrapStyle ? styleToCssString(this.wrapStyle) : ''
  }

  onClick () {
    if (!this.disabled) {
      this.$emit('click')
    }
  }
}

export type DemoComponentInstance = DemoComponent
export default defineComponentHOC()(DemoComponent)
