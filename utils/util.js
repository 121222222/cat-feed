// utils/util.js
const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return `${[year, month, day].map(formatNumber).join('-')} ${[hour, minute, second].map(formatNumber).join(':')}`
}

const formatDate = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${year}-${formatNumber(month)}-${formatNumber(day)}`
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : `0${n}`
}

// 计算时间差
const getTimeDiff = (dateStr) => {
  const now = new Date()
  const target = new Date(dateStr)
  const diff = now - target
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 30) return `${days}天前`
  return dateStr
}

// 状态文字映射
const statusMap = {
  pending: '待接单',
  accepted: '已接单',
  in_progress: '服务中',
  completed: '已完成',
  cancelled: '已取消',
  reviewing: '待审核',
  approved: '已通过',
  rejected: '已拒绝'
}

const getStatusText = (status) => {
  return statusMap[status] || status
}

const getStatusColor = (status) => {
  const colorMap = {
    pending: '#FAAD14',
    accepted: '#1890FF',
    in_progress: '#52C41A',
    completed: '#999999',
    cancelled: '#FF4D4F',
    reviewing: '#FAAD14',
    approved: '#52C41A',
    rejected: '#FF4D4F'
  }
  return colorMap[status] || '#999999'
}

module.exports = {
  formatTime,
  formatDate,
  formatNumber,
  getTimeDiff,
  getStatusText,
  getStatusColor
}
