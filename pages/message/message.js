Page({
  data: {
    activeTab: 0,
    chatUnread: 2,
    sysUnread: 1,
    allMessages: [
      {
        id: 'm001',
        type: 'chat',
        icon: '💬',
        avatarBg: '#FFE0D6',
        title: '小美',
        preview: '好的，我明天下午3点过去喂猫~',
        time: '10:30',
        unread: true,
        userId: 'user001'  // 用于跳转聊天
      },
      {
        id: 'm002',
        type: 'system',
        subType: 'order',  // 接单通知
        icon: '🔔',
        avatarBg: '#E6F7FF',
        title: '接单通知',
        preview: '您发布的喂养需求「橘座」已被小美接单',
        time: '09:15',
        unread: true,
        relatedId: 'help001'  // 关联的互助ID
      },
      {
        id: 'm003',
        type: 'chat',
        icon: '💬',
        avatarBg: '#F0FFF0',
        title: '大壮',
        preview: '请问您家猫咪有什么忌口吗？',
        time: '昨天',
        unread: true,
        userId: 'user002'
      },
      {
        id: 'm004',
        type: 'system',
        subType: 'complete',  // 服务完成
        icon: '✅',
        avatarBg: '#F0FFF0',
        title: '服务完成',
        preview: '喂养人小花已完成本次服务，请确认并评价',
        time: '昨天',
        unread: false,
        relatedId: 'help002'
      },
      {
        id: 'm006',
        type: 'system',
        subType: 'remind',  // 到期提醒
        icon: '⏰',
        avatarBg: '#FFEFE9',
        title: '到期提醒',
        preview: '您发布的喂养需求将于明天开始，请确认喂养人信息',
        time: '3月17日',
        unread: false,
        relatedId: 'help003'
      }
    ],
    messages: []
  },

  onLoad() {
    this.filterMessages(0);
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 });
    }
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
  
  // 标记消息已读
  markAsRead(msgId) {
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
  }
});
