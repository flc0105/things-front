export function isMobile() {
  const ua = navigator.userAgent
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)
  // 或者根据窗口宽度判断：
  // return window.innerWidth <= 768
}