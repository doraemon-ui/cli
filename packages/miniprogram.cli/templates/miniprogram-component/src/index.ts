import { defineComponentHOC, Doraemon, Component, Prop } from '@doraemon-ui/miniprogram.core-js'
const { classNames } = Doraemon.util

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

  onClick () {
    if (!this.disabled) {
      this.$emit('click')
    }
  }
}

export default defineComponentHOC()(DemoComponent)
