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
    currentUserInfo: null,
    inputBottom: 0  // 输入框底部距离
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
        
        // 标记已读（使用云函数确保权限）
        try {
          await wx.cloud.callFunction({
            name: 'chatService',
            data: {
              action: 'markRead',
              data: {
                conversationId: conversation._id,
                userId: currentUserId
              }
            }
          });
        } catch (cfErr) {
          console.warn('云函数标记已读失败，使用本地方法:', cfErr);
          await db.markConversationRead(conversation._id, currentUserId);
        }
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

  // 从云数据库加载消息（通过云函数绕过权限限制）
  async loadCloudMessages() {
    const { conversationId, currentUserId } = this.data;
    if (!conversationId) {
      console.log('loadCloudMessages: conversationId 为空');
      return;
    }
    
    console.log('开始加载消息, conversationId:', conversationId, 'userId:', currentUserId);
    
    try {
      // 优先使用云函数获取消息（解决权限问题）
      let cloudMessages = [];
      let useCloudFunction = false;
      
      try {
        console.log('尝试调用云函数 chatService...');
        const res = await wx.cloud.callFunction({
          name: 'chatService',
          data: {
            action: 'getChatMessages',
            data: {
              conversationId: conversationId,
              userId: currentUserId
            }
          }
        });
        console.log('云函数返回:', res);
        
        if (res.result && res.result.success) {
          cloudMessages = res.result.data || [];
          useCloudFunction = true;
          console.log('云函数获取消息成功，数量:', cloudMessages.length);
        } else {
          console.warn('云函数返回失败:', res.result);
          // 云函数失败，降级使用本地方法
          cloudMessages = await db.getChatMessages(conversationId);
          console.log('降级使用本地方法，获取消息数量:', cloudMessages.length);
        }
      } catch (cfErr) {
        console.warn('云函数调用失败，使用本地方法:', cfErr.message || cfErr);
        cloudMessages = await db.getChatMessages(conversationId);
        console.log('本地方法获取消息数量:', cloudMessages.length);
      }
      
      console.log('获取到的原始消息:', cloudMessages);
      
      // 转换消息格式
      const messages = cloudMessages.map(msg => ({
        id: msg._id,
        text: msg.content,
        isMine: msg.fromUserId === currentUserId,
        time: this.formatTime(msg.createTime),
        createTime: msg.createTime ? new Date(msg.createTime).getTime() : 0
      }));
      
      console.log('转换后的消息:', messages);
      
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

  // 输入框获得焦点，键盘弹起
  onInputFocus(e) {
    const keyboardHeight = e.detail.height || 0;
    this.setData({ inputBottom: keyboardHeight });
    // 滚动到底部
    setTimeout(() => this.scrollToBottom(), 100);
  },

  // 输入框失去焦点，键盘收起
  onInputBlur() {
    this.setData({ inputBottom: 0 });
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
