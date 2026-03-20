Page({
  data: {
    chatName: '',
    inputText: '',
    messages: [
      { text: '你好，我看到你发布的喂养需求了', isMine: false },
      { text: '你好！是的，我出差需要人帮忙喂猫', isMine: true },
      { text: '我有3年养猫经验，可以帮你', isMine: false },
      { text: '太好了！橘座很亲人的，不用担心', isMine: true },
      { text: '好的，我明天下午3点过去喂猫~', isMine: false }
    ]
  },

  onLoad(options) {
    const name = options.name || '对方';
    this.setData({ chatName: name });
    wx.setNavigationBarTitle({ title: name });
  },

  onInput(e) {
    this.setData({ inputText: e.detail.value });
  },

  onSend() {
    if (!this.data.inputText.trim()) return;
    const messages = [...this.data.messages, { text: this.data.inputText, isMine: true }];
    this.setData({ messages, inputText: '' });

    // 模拟回复
    setTimeout(() => {
      const replies = ['好的~', '收到！', '没问题', '我知道啦 😊', '放心交给我吧！'];
      const reply = replies[Math.floor(Math.random() * replies.length)];
      this.setData({
        messages: [...this.data.messages, { text: reply, isMine: false }]
      });
    }, 1000);
  }
});
