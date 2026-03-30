const db = require('../../utils/db.js');
const app = getApp();

Page({
  data: {
    chatName: '',
    targetId: '',
    targetAvatar: '',
    targetName: '',
    inputText: '',
    messages: [],
    loading: true,
    currentUserId: '',
    conversationId: '',
    currentUserInfo: null
  },

  onLoad(options) {
    // 接收目标用户信息
    const targetName = options.targetName ? decodeURIComponent(options.targetName) : (options.name || '对方');
    const targetId = options.targetId || options.id || '';
    const targetAvatar = options.targetAvatar ? decodeURIComponent(options.targetAvatar) : '';
    
    const currentUser = app.globalData.userInfo;
    const currentUserId = currentUser ? (currentUser._id || currentUser.openid || '') : '';
    
    this.setData({ 
      chatName: targetName,
      targetId: targetId,
      targetAvatar: targetAvatar,
      targetName: targetName,
      currentUserId: currentUserId,
      currentUserInfo: currentUser
    });
    
    wx.setNavigationBarTitle({ title: targetName });
    
    // 初始化会话并加载消息
    this.initConversation();
  },

  onShow() {
    // 每次显示时刷新消息
    if (this.data.conversationId) {
      this.loadCloudMessages();
    }
  },

  // 初始化会话
  async initConversation() {
    const { currentUserId, targetId, targetName, targetAvatar } = this.data;
    
    if (!currentUserId || !targetId) {
      this.setData({ loading: false });
      wx.showToast({ title: '会话信息不完整', icon: 'none' });
      return;
    }
    
    this.setData({ loading: true });
    
    try {
      // 获取或创建会话
      const conversation = await db.getOrCreateConversation(
        currentUserId, 
        targetId, 
        targetName, 
        targetAvatar
      );
      
      if (conversation) {
        this.setData({ 
          conversationId: conversation._id,
          loading: false
        });
        
        // 加载聊天记录
        await this.loadCloudMessages();
        
        // 标记已读
        await db.markConversationRead(conversation._id, currentUserId);
      } else {
        this.setData({ loading: false });
        wx.showToast({ title: '会话初始化失败', icon: 'none' });
      }
    } catch (err) {
      console.error('初始化会话失败:', err);
      this.setData({ loading: false });
      wx.showToast({ title: '网络异常', icon: 'none' });
    }
  },

  // 从云数据库加载消息
  async loadCloudMessages() {
    const { conversationId, currentUserId } = this.data;
    if (!conversationId) return;
    
    try {
      const cloudMessages = await db.getChatMessages(conversationId);
      
      // 转换消息格式
      const messages = cloudMessages.map(msg => ({
        id: msg._id,
        text: msg.content,
        isMine: msg.fromUserId === currentUserId,
        time: this.formatTime(msg.createTime),
        createTime: msg.createTime ? new Date(msg.createTime).getTime() : 0
      }));
      
      this.setData({ messages });
      
      // 滚动到底部
      setTimeout(() => this.scrollToBottom(), 100);
    } catch (err) {
      console.error('加载消息失败:', err);
    }
  },

  // 格式化时间
  formatTime(createTime) {
    if (!createTime) return '';
    const date = new Date(createTime);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  },

  onInput(e) {
    this.setData({ inputText: e.detail.value });
  },

  async onSend() {
    const text = this.data.inputText.trim();
    if (!text) return;
    
    const { currentUserId, targetId, conversationId, currentUserInfo } = this.data;
    
    if (!currentUserInfo) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }
    
    if (!conversationId) {
      wx.showToast({ title: '会话未初始化', icon: 'none' });
      return;
    }

    // 先清空输入框
    this.setData({ inputText: '' });

    // 乐观更新：先在界面显示消息
    const tempMessage = { 
      id: 'temp_' + Date.now(),
      text: text, 
      isMine: true,
      time: this.formatTime(new Date()),
      createTime: new Date().getTime(),
      sending: true  // 发送中状态
    };
    
    const messages = [...this.data.messages, tempMessage];
    this.setData({ messages });
    this.scrollToBottom();

    try {
      // 发送消息到云数据库
      const msgId = await db.sendChatMessage(
        conversationId,
        currentUserId,
        targetId,
        text,
        currentUserInfo
      );
      
      if (msgId) {
        // 更新消息状态
        const updatedMessages = this.data.messages.map(m => {
          if (m.id === tempMessage.id) {
            return { ...m, id: msgId, sending: false };
          }
          return m;
        });
        this.setData({ messages: updatedMessages });
      } else {
        // 发送失败，标记消息
        const updatedMessages = this.data.messages.map(m => {
          if (m.id === tempMessage.id) {
            return { ...m, sending: false, failed: true };
          }
          return m;
        });
        this.setData({ messages: updatedMessages });
        wx.showToast({ title: '发送失败', icon: 'none' });
      }
    } catch (err) {
      console.error('发送消息失败:', err);
      // 标记发送失败
      const updatedMessages = this.data.messages.map(m => {
        if (m.id === tempMessage.id) {
          return { ...m, sending: false, failed: true };
        }
        return m;
      });
      this.setData({ messages: updatedMessages });
      wx.showToast({ title: '发送失败', icon: 'none' });
    }
  },

  scrollToBottom() {
    wx.pageScrollTo({
      scrollTop: 99999,
      duration: 300
    });
  },

  // 下拉刷新加载更多消息
  async onPullDownRefresh() {
    await this.loadCloudMessages();
    wx.stopPullDownRefresh();
  }
});
