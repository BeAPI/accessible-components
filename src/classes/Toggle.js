import { disableBodyScroll, enableBodyScroll } from 'body-scroll-lock'

import AbstractDomElement from './AbstractDomElement.js'
import DOMAnimations from '../utils/DOMAnimations.js'
import { ThrottledEvent } from 'oneloop.js'
import { randomId } from '../utils/helpers.js'

/**
 * Toggle Class
 * @author Milan Ricoul
 */
class Toggle extends AbstractDomElement {
  constructor(element, options) {
    var instance = super(element, options)

    // avoid double init :
    if (!instance.isNewInstance()) {
      return instance
    }

    this.target = this._settings.target
      ? this._element.parentNode.querySelector(this._settings.target)
      : document.getElementById(this._element.getAttribute('aria-controls'))

    this._onResizeHandler = onResize.bind(this)
    this.handleClick = this.handleClick.bind(this)
    this.handleBlur = this.handleBlur.bind(this)
    this.enableBodyScroll = this.enableBodyScroll.bind(this)
    this.disableBodyScroll = this.disableBodyScroll.bind(this)

    this.initialized = false

    new ThrottledEvent(window, 'resize').add('resize', this._onResizeHandler)
    this._onResizeHandler()
  }

  /**
   * Initialize class
   * @returns {Boolean}
   * @author Milan Ricoul
   */
  init() {
    const el = this._element
    const { closeOnBlur, closeOnEscPress, isOpened, onClick, prefixId } = this._settings

    this.initialized = true

    if (this.target) {
      el.addEventListener('click', this.handleClick)
    } else if (!this.target && onClick) {
      el.addEventListener('click', onClick)

      return false
    } else {
      return false
    }

    if (onClick) {
      el.addEventListener('click', onClick.bind(this))
    }

    if (!el.getAttribute('aria-controls')) {
      const id = `${prefixId}-${randomId()}`
      el.setAttribute('aria-controls', id)
      this.target.id = id
    }

    if (closeOnBlur) {
      el.addEventListener('blur', this.handleBlur)
    }

    if (closeOnEscPress) {
      _closeOnEscPress(el)
    }

    if (!this.target.hasAttribute('aria-hidden')) {
      this.target.setAttribute('aria-hidden', isOpened ? 'false' : 'true')
    }

    if (isOpened) {
      this.open()
    }

    return true
  }

  /**
   * Destroy events
   * @returns {void}
   * @author Milan Ricoul
   */
  destroy() {
    const el = this._element
    this.initialized = false

    this.reset()

    if (this._settings.onClick) {
      el.removeEventListener('click', this._settings.onClick)
    } else {
      el.removeEventListener('click', this.handleClick)
      el.removeEventListener('blur', this.handleBlur)
    }
  }

  /**
   * Handle button MouseEvent
   * @param {MouseEvent} e event handler
   * @returns {void}
   * @author Milan Ricoul
   */
  handleClick(e) {
    const { isOpened } = this._settings

    e.preventDefault()

    if (this.target.getAttribute('aria-hidden')) {
      this.target.getAttribute('aria-hidden') !== 'true' ? this.close() : this.open()

      return
    } else {
      this.target.setAttribute('aria-hidden', isOpened ? 'true' : 'false')
    }
  }

  /**
   * Open target
   * @returns {void}
   * @author Milan Ricoul
   */
  open() {
    const el = this._element
    const s = this._settings

    this.target.setAttribute('aria-hidden', 'false')
    el.setAttribute('aria-expanded', 'true')

    if (s.hasAnimation) {
      DOMAnimations.slideDown(this.target)
    }

    if (s.bodyScrollLock) {
      this.disableBodyScroll()
    }
  }

  /**
   * Close target
   * @returns {void}
   * @author Milan Ricoul
   */
  close() {
    const el = this._element
    const s = this._settings

    this.target.setAttribute('aria-hidden', 'true')
    el.setAttribute('aria-expanded', 'false')

    if (this._settings.hasAnimation) {
      DOMAnimations.slideUp(this.target)
    }

    if (s.bodyScrollLock) {
      enableBodyScroll(this.target)
    }
  }

  /**
   * Remove ARIA attributes
   * @returns {void}
   * @author Milan Ricoul
   */
  reset() {
    const el = this._element

    this.target.removeAttribute('aria-hidden')
    this.target.removeAttribute('aria-expanded')
    el.removeAttribute('aria-expanded')

    if (this._settings.hasAnimation) {
      DOMAnimations.slideDown(this.target, 500, () => {
        this.target.removeAttribute('style')
      })
    }
  }

  /**
   * Handle button FocusEvent
   * @returns {void}
   * @author Milan Ricoul
   */
  handleBlur() {
    window.setTimeout(() => {
      this.target.setAttribute('aria-hidden', 'true')
      this._element.setAttribute('aria-expanded', 'false')
    }, 200)
  }

  /**
   * Disable body scroll
   * @returns {void}
   * @author Milan Ricoul
   */
  disableBodyScroll() {
    const s = this._settings

    if (s.bodyScrollLockMediaQuery && window.matchMedia(s.bodyScrollLockMediaQuery).matches) {
      disableBodyScroll(this.target)
    } else if (!s.bodyScrollLockMediaQuery) {
      disableBodyScroll(this.target)
    }
  }

  /**
   * Enable body scroll
   * @returns {void}
   * @author Milan Ricoul
   */
  enableBodyScroll() {
    enableBodyScroll(this.target)
  }
}

/**
 * Events
 *
 * @returns {void}
 *
 * @author Milan Ricoul
 */
function onResize() {
  const { mediaQuery } = this._settings

  if (!mediaQuery && !this.initialized) {
    this.init()
  }

  if (mediaQuery && this.initialized && !mediaQuery.matches) {
    this.destroy()
  } else if (mediaQuery && !this.initialized && mediaQuery.matches) {
    this.init()
  } else if (
    mediaQuery &&
    !this.initialized &&
    !mediaQuery.matches &&
    this.target.style.display === 'none' &&
    this.target.hasAttribute('style')
  ) {
    this.target.removeAttribute('style')
  }
}

/**
 * Close all targets on Esc keydown
 * @param {HTMLElement} el element from preset
 */
function _closeOnEscPress(el) {
  window.addEventListener('keydown', (e) => {
    if (e.defaultPrevented) {
      return
    }

    const key = e.key || e.keyCode

    if (
      (key === 'Escape' || key === 'Esc' || key === 27) &&
      document.getElementById(el.getAttribute('aria-controls')).getAttribute('aria-hidden') !== 'true'
    ) {
      el.click()
    }
  })
}

Toggle.defaults = {
  bodyScrollLock: false,
  bodyScrollLockMediaQuery: false,
  closeOnBlur: false,
  closeOnEscPress: false,
  hasAnimation: false,
  isOpened: false,
  mediaQuery: null,
  onClick: null,
  prefixId: 'toggle',
  target: null,
}

export default Toggle
