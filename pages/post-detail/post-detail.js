const app = getApp();
const db = require('../../utils/db.js');

Page({
  data: {
    post: {},
    comments: [],
    commentText: '',
    currentIndex: 0,
    isOwner: false
  },

  onLoad(options) {
    if (options.id) {
      this.loadPost(options.id);
    }
  },

  async loadPost(postId) {
    wx.showLoading({ title: '加载中...' });
    try {
      const post = await db.getPostById(postId);
      if (post) {
        this.setData({
          post: { ...post, id: post._id },
          isOwner: false // TODO: 判断是否是自己发布的
        });
      }
    } catch (err) {
      console.error('加载动态失败:', err);
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
    wx.hideLoading();
  },

  previewImage(e) {
    const url = e.currentTarget.dataset.url;
    wx.previewImage({
      current: url,
      urls: this.data.post.images || []
    });
  },

  async onLike() {
    const post = this.data.post;
    const newLiked = !post.liked;
    
    this.setData({
      'post.liked': newLiked,
      'post.likes': newLiked ? (post.likes || 0) + 1 : (post.likes || 1) - 1
    });

    try {
      await db.togglePostLike(post.id, newLiked);
    } catch (err) {
      console.error('点赞失败:', err);
    }
  },

  onShare() {
    wx.showToast({ title: '分享功能开发中', icon: 'none' });
  },

  onCommentInput(e) {
    this.setData({ commentText: e.detail.value });
  },

  sendComment() {
    if (!this.data.commentText.trim()) {
      wx.showToast({ title: '请输入评论内容', icon: 'none' });
      return;
    }
    wx.showToast({ title: '评论功能开发中', icon: 'none' });
  },

  onShareAppMessage() {
    return {
      title: this.data.post.title,
      path: `/pages/post-detail/post-detail?id=${this.data.post.id}`
    };
  }
});
