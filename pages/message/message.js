const db = require('../../utils/db.js');
const app = getApp();

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

  // 加载消息
  async loadMessages() {
    this.setData({ loading: true });
    
    try {
      // 从云数据库加载聊天会话
      const chatMessages = await this.loadCloudConversations();
      
      // 从数据库加载系统消息
      const systemMessages = await this.loadSystemMessages();
      
      // 合并并排序所有消息
      const allMessages = [...chatMessages, ...systemMessages].sort((a, b) => {
        return (b.sortTime || 0) - (a.sortTime || 0);
      });
      
      // 计算未读数（统计所有未读消息的数量，而不是会话数）
      let chatUnread = 0;
      chatMessages.forEach(m => {
        chatUnread += m.unreadCount || (m.unread ? 1 : 0);
      });
      const sysUnread = systemMessages.filter(m => m.unread).length;
      
      // 计算总未读数并更新TabBar
      const totalUnread = chatUnread + sysUnread;
      
      this.setData({
        allMessages: allMessages,
        chatUnread,
        sysUnread,
        loading: false
      });
      
      // 更新TabBar的消息数量显示
      if (typeof this.getTabBar === 'function' && this.getTabBar()) {
        this.getTabBar().setData({ msgCount: totalUnread });
      }
      
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

  // 从云数据库加载聊天会话（优先使用云函数）
  async loadCloudConversations() {
    try {
      const currentUser = app.globalData.userInfo;
      if (!currentUser) return [];
      
      const currentUserId = currentUser._id || currentUser.openid || '';
      if (!currentUserId) return [];
      
      // 优先使用云函数获取会话（解决权限问题）
      let conversations = [];
      try {
        const res = await wx.cloud.callFunction({
          name: 'chatService',
          data: {
            action: 'getConversations',
            data: { userId: currentUserId }
          }
        });
        if (res.result && res.result.success) {
          conversations = res.result.data || [];
        } else {
          // 云函数失败，降级使用本地方法
          conversations = await db.getMyConversations(currentUserId);
        }
      } catch (cfErr) {
        console.warn('云函数调用失败，使用本地方法:', cfErr);
        conversations = await db.getMyConversations(currentUserId);
      }
      
      return conversations.map(conv => {
        // 判断对方是谁
        const isUser1 = conv.user1Id === currentUserId;
        const targetId = isUser1 ? conv.user2Id : conv.user1Id;
        
        // 获取对方的信息
        const targetInfo = conv.participantsInfo ? conv.participantsInfo[targetId] : null;
        const targetName = targetInfo && targetInfo.name ? targetInfo.name : '微信用户';
        const targetAvatar = targetInfo ? targetInfo.avatar : '';
        
        // 获取未读数
        const unreadCount = conv.unreadCount ? (conv.unreadCount[currentUserId] || 0) : 0;
        
        // 格式化最后一条消息的预览
        const preview = conv.lastMessage || '暂无消息';
        
        return {
          id: conv._id,
          type: 'chat',
          conversationId: conv._id,
          icon: '💬',
          avatarBg: '#FFE0D6',
          title: targetName,
          avatar: targetAvatar,
          preview: preview,
          time: this.formatTime(conv.lastMessageTime),
          unread: unreadCount > 0,
          unreadCount: unreadCount,
          userId: targetId,
          targetName: targetName,
          targetAvatar: targetAvatar,
          sortTime: conv.lastMessageTime ? new Date(conv.lastMessageTime).getTime() : 0
        };
      });
    } catch (err) {
      console.error('加载云端会话失败:', err);
      return [];
    }
  },

  // 加载系统消息
  async loadSystemMessages() {
    try {
      const messages = await db.getMyMessages();
      
      // 只返回系统类型消息
      return messages.filter(msg => msg.type === 'system' || !msg.type).map(msg => ({
        id: msg._id,
        type: msg.type || 'system',
        subType: msg.subType || '',
        icon: msg.icon || '🔔',
        avatarBg: msg.avatarBg || '#E6F7FF',
        title: msg.title || '系统通知',
        preview: msg.preview || msg.content || '',
        time: this.formatTime(msg.createTime),
        unread: !msg.read,
        userId: msg.fromUserId || '',
        relatedId: msg.relatedId || '',
        avatar: msg.avatar || '',
        sortTime: msg.createTime ? new Date(msg.createTime).getTime() : 0
      }));
    } catch (err) {
      console.error('加载系统消息失败:', err);
      return [];
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
    this.markAsRead(item);
    
    if (item.type === 'chat') {
      // 私信消息：跳转到聊天页面
      wx.navigateTo({ 
        url: `/pages/chat/chat?targetId=${item.userId}&targetName=${encodeURIComponent(item.targetName || item.title)}&targetAvatar=${encodeURIComponent(item.targetAvatar || item.avatar || '')}` 
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
  async markAsRead(item) {
    // 更新本地状态
    const allMessages = this.data.allMessages.map(m => {
      if (m.id === item.id) {
        return { ...m, unread: false, unreadCount: 0 };
      }
      return m;
    });
    
    // 重新计算未读数
    let chatUnread = 0;
    allMessages.filter(m => m.type === 'chat').forEach(m => {
      chatUnread += m.unreadCount || (m.unread ? 1 : 0);
    });
    const sysUnread = allMessages.filter(m => m.type === 'system' && m.unread).length;
    const totalUnread = chatUnread + sysUnread;
    
    this.setData({ allMessages, chatUnread, sysUnread });
    this.filterMessages(this.data.activeTab);
    
    // 更新TabBar显示
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ msgCount: totalUnread });
    }
    
    // 更新云数据库
    const currentUser = app.globalData.userInfo;
    const currentUserId = currentUser ? (currentUser._id || currentUser.openid || '') : '';
    
    if (item.type === 'chat' && item.conversationId) {
      // 聊天消息：使用云函数更新未读状态（确保权限）
      try {
        await wx.cloud.callFunction({
          name: 'chatService',
          data: {
            action: 'markRead',
            data: {
              conversationId: item.conversationId,
              userId: currentUserId
            }
          }
        });
      } catch (cfErr) {
        console.warn('云函数标记已读失败，使用本地方法:', cfErr);
        await db.markConversationRead(item.conversationId, currentUserId);
      }
    } else if (item.type === 'system') {
      // 系统消息：更新数据库
      try {
        await db.db.collection('messages').doc(item.id).update({
          data: { read: true }
        });
      } catch (err) {
        console.error('更新已读状态失败:', err);
      }
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
