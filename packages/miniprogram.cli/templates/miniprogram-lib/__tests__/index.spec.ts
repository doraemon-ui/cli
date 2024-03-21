import DemoLib from '../src/index'

describe('DemoLib', () => {
  test('call correctly', () => {
    expect(DemoLib()).toBe('demo-lib')
  })
})
