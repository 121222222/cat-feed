const app = getApp();
const db = require('../../utils/db.js');

Page({
  data: {
    post: {},
    comments: [],
    commentText: '',
    currentIndex: 0,
    isOwner: false,
    swiperHeight: 375
  },

  onLoad(options) {
    if (options.id) {
      this.loadPost(options.id);
      this.loadComments(options.id);
    }
  },

  async loadPost(postId) {
    wx.showLoading({ title: '加载中...' });
    try {
      const post = await db.getPostById(postId);
      if (post) {
        // 转换图片链接
        let images = post.images || [];
        if (images.length > 0) {
          const tempUrls = await db.getImageUrls(images);
          images = tempUrls;
        }
        
        this.setData({
          post: { ...post, id: post._id, images },
          isOwner: false // TODO: 判断是否是自己发布的
        });
      }
    } catch (err) {
      console.error('加载动态失败:', err);
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
    wx.hideLoading();
  },

  async loadComments(postId) {
    try {
      const comments = await db.getComments(postId);
      this.setData({ comments });
    } catch (err) {
      console.error('加载评论失败:', err);
    }
  },

  onImageLoad(e) {
    const { width, height } = e.detail;
    const windowWidth = wx.getSystemInfoSync().windowWidth;
    const swiperHeight = Math.min(windowWidth * height / width, 500);
    if (swiperHeight > this.data.swiperHeight) {
      this.setData({ swiperHeight });
    }
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

  async sendComment() {
    const { commentText, post } = this.data;
    if (!commentText.trim()) {
      wx.showToast({ title: '请输入评论内容', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '发送中...' });
    try {
      const userInfo = app.globalData.userInfo || {};
      const commentData = {
        postId: post.id,
        content: commentText.trim(),
        userName: userInfo.name || '匿名',
        userAvatar: userInfo.avatar || '',
        userId: userInfo._id || ''
      };

      const commentId = await db.addComment(commentData);
      if (commentId) {
        // 更新评论列表
        const newComment = {
          _id: commentId,
          ...commentData,
          time: '刚刚'
        };
        const comments = [newComment, ...this.data.comments];
        
        this.setData({
          comments,
          commentText: '',
          'post.comments': (post.comments || 0) + 1
        });
        
        wx.showToast({ title: '评论成功', icon: 'success' });
      } else {
        wx.showToast({ title: '评论失败', icon: 'none' });
      }
    } catch (err) {
      console.error('评论失败:', err);
      wx.showToast({ title: '评论失败', icon: 'none' });
    }
    wx.hideLoading();
  },

  onShareAppMessage() {
    return {
      title: this.data.post.title,
      path: `/pages/post-detail/post-detail?id=${this.data.post.id}`
    };
  }
});
