const db = require('../../utils/db.js');

Page({
  data: {
    activeTab: 0,
    chatUnread: 0,
    sysUnread: 0,
    allMessages: [],
    messages: [],
    loading: true
  },

  onLoad() {
    this.loadMessages();
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 });
    }
    // 每次显示时刷新消息
    this.loadMessages();
  },

  // 从数据库加载消息
  async loadMessages() {
    this.setData({ loading: true });
    
    try {
      const messages = await db.getMyMessages();
      
      // 格式化消息数据
      const formattedMessages = messages.map(msg => ({
        id: msg._id,
        type: msg.type || 'system',
        subType: msg.subType || '',
        icon: msg.icon || (msg.type === 'chat' ? '💬' : '🔔'),
        avatarBg: msg.avatarBg || (msg.type === 'chat' ? '#FFE0D6' : '#E6F7FF'),
        title: msg.title || '系统通知',
        preview: msg.preview || msg.content || '',
        time: this.formatTime(msg.createTime),
        unread: !msg.read,
        userId: msg.fromUserId || '',
        relatedId: msg.relatedId || '',
        avatar: msg.avatar || ''
      }));
      
      // 计算未读数
      const chatUnread = formattedMessages.filter(m => m.type === 'chat' && m.unread).length;
      const sysUnread = formattedMessages.filter(m => m.type === 'system' && m.unread).length;
      
      this.setData({
        allMessages: formattedMessages,
        chatUnread,
        sysUnread,
        loading: false
      });
      
      this.filterMessages(this.data.activeTab);
    } catch (err) {
      console.error('加载消息失败:', err);
      this.setData({ 
        allMessages: [],
        messages: [],
        loading: false 
      });
    }
  },

  // 格式化时间
  formatTime(createTime) {
    if (!createTime) return '';
    
    const date = new Date(createTime);
    const now = new Date();
    const diff = now - date;
    
    // 今天
    if (diff < 24 * 60 * 60 * 1000 && date.getDate() === now.getDate()) {
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    }
    
    // 昨天
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.getDate() === yesterday.getDate() && 
        date.getMonth() === yesterday.getMonth() &&
        date.getFullYear() === yesterday.getFullYear()) {
      return '昨天';
    }
    
    // 更早
    const month = (date.getMonth() + 1).toString();
    const day = date.getDate().toString();
    return `${month}月${day}日`;
  },

  switchTab(e) {
    const tab = Number(e.currentTarget.dataset.tab);
    this.setData({ activeTab: tab });
    this.filterMessages(tab);
  },

  filterMessages(tab) {
    const all = this.data.allMessages;
    let filtered;
    switch(tab) {
      case 1: filtered = all.filter(m => m.type === 'chat'); break;
      case 2: filtered = all.filter(m => m.type === 'system'); break;
      default: filtered = all;
    }
    this.setData({ messages: filtered });
  },

  onMsgTap(e) {
    const item = e.currentTarget.dataset.item;
    
    // 标记为已读
    this.markAsRead(item.id);
    
    if (item.type === 'chat') {
      // 私信消息：跳转到聊天页面
      wx.navigateTo({ 
        url: `/pages/chat/chat?id=${item.userId || item.id}&name=${item.title}` 
      });
    } else if (item.type === 'system') {
      // 系统通知：根据子类型跳转不同页面
      switch(item.subType) {
        case 'order':     // 接单通知
        case 'complete':  // 服务完成
        case 'remind':    // 到期提醒
          if (item.relatedId) {
            wx.navigateTo({ 
              url: `/pages/help-detail/help-detail?id=${item.relatedId}` 
            });
          } else {
            this.showNoticeDetail(item);
          }
          break;
        default:
          this.showNoticeDetail(item);
      }
    }
  },
  
  // 标记消息已读（同时更新数据库）
  async markAsRead(msgId) {
    // 更新本地状态
    const allMessages = this.data.allMessages.map(m => {
      if (m.id === msgId) {
        return { ...m, unread: false };
      }
      return m;
    });
    
    // 重新计算未读数
    const chatUnread = allMessages.filter(m => m.type === 'chat' && m.unread).length;
    const sysUnread = allMessages.filter(m => m.type === 'system' && m.unread).length;
    
    this.setData({ allMessages, chatUnread, sysUnread });
    this.filterMessages(this.data.activeTab);
    
    // 更新数据库（可选，如果需要持久化已读状态）
    try {
      await db.db.collection('messages').doc(msgId).update({
        data: { read: true }
      });
    } catch (err) {
      console.error('更新已读状态失败:', err);
    }
  },
  
  // 显示通知详情弹窗
  showNoticeDetail(item) {
    wx.showModal({
      title: item.title,
      content: item.preview,
      showCancel: false,
      confirmText: '知道了',
      confirmColor: '#FFBAA3'
    });
  },

  // 下拉刷新
  async onPullDownRefresh() {
    await this.loadMessages();
    wx.stopPullDownRefresh();
  }
});
