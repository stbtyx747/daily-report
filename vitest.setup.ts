import '@testing-library/jest-dom'

// Radix UI が使用する Pointer Events API の jsdom ポリフィル
window.HTMLElement.prototype.hasPointerCapture = () => false
window.HTMLElement.prototype.setPointerCapture = () => {}
window.HTMLElement.prototype.releasePointerCapture = () => {}
