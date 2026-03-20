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
        avatarBg: '#FFE4C4',
        title: '小美',
        preview: '好的，我明天下午3点过去喂猫~',
        time: '10:30',
        unread: true
      },
      {
        id: 'm002',
        type: 'system',
        icon: '🔔',
        avatarBg: '#E6F7FF',
        title: '接单通知',
        preview: '您发布的喂养需求「橘座」已被小美接单',
        time: '09:15',
        unread: true
      },
      {
        id: 'm003',
        type: 'chat',
        icon: '💬',
        avatarBg: '#F0FFF0',
        title: '大壮',
        preview: '请问您家猫咪有什么忌口吗？',
        time: '昨天',
        unread: true
      },
      {
        id: 'm004',
        type: 'system',
        icon: '✅',
        avatarBg: '#F0FFF0',
        title: '服务完成',
        preview: '喂养人小花已完成本次服务，请确认并评价',
        time: '昨天',
        unread: false
      },
      {
        id: 'm005',
        type: 'notice',
        icon: '📢',
        avatarBg: '#FFFBE6',
        title: '平台公告',
        preview: '【重要】宿舍区养猫新规则发布，请所有养猫同事查看',
        time: '3月18日',
        unread: false
      },
      {
        id: 'm006',
        type: 'system',
        icon: '⏰',
        avatarBg: '#FFF2E6',
        title: '到期提醒',
        preview: '您发布的喂养需求将于明天开始，请确认喂养人信息',
        time: '3月17日',
        unread: false
      }
    ],
    messages: []
  },

  onLoad() {
    this.filterMessages(0);
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 });
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
      case 3: filtered = all.filter(m => m.type === 'notice'); break;
      default: filtered = all;
    }
    this.setData({ messages: filtered });
  },

  onMsgTap(e) {
    const item = e.currentTarget.dataset.item;
    if (item.type === 'chat') {
      wx.navigateTo({ url: `/pages/chat/chat?id=${item.id}&name=${item.title}` });
    } else {
      wx.showToast({ title: '消息详情开发中', icon: 'none' });
    }
  }
});
