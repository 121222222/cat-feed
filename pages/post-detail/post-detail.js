const app = getApp();
const db = require('../../utils/db.js');

Page({
  data: {
    post: {},
    comments: [],
    commentText: '',
    currentIndex: 0,
    isOwner: false,
    swiperHeight: 375,
    showActionSheet: false
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
        
        // 转换视频链接
        let videoUrl = '';
        let videoCover = '';
        if (post.mediaType === 'video' && post.video) {
          const videoUrls = await db.getImageUrls([post.video]);
          videoUrl = videoUrls[0] || '';
          
          if (post.videoCover) {
            const coverUrls = await db.getImageUrls([post.videoCover]);
            videoCover = coverUrls[0] || '';
          }
        }
        
        // 格式化视频时长
        let videoDurationText = '';
        if (post.videoDuration) {
          const minutes = Math.floor(post.videoDuration / 60);
          const seconds = post.videoDuration % 60;
          videoDurationText = minutes > 0 ? 
            `${minutes}:${seconds.toString().padStart(2, '0')}` : 
            `0:${seconds.toString().padStart(2, '0')}`;
        }
        
        // 判断是否是自己发布的
        const userInfo = app.globalData.userInfo || {};
        const isOwner = userInfo._id && post.userId && userInfo._id === post.userId;
        
        this.setData({
          post: { 
            ...post, 
            id: post._id, 
            images,
            videoUrl,
            videoCover,
            videoDurationText
          },
          isOwner: isOwner
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
  },

  // 显示更多菜单
  showMoreMenu() {
    this.setData({ showActionSheet: true });
  },

  // 隐藏更多菜单
  hideMoreMenu() {
    this.setData({ showActionSheet: false });
  },

  // 保存图片
  onSaveImage() {
    this.hideMoreMenu();
    const images = this.data.post.images || [];
    if (images.length === 0) {
      wx.showToast({ title: '暂无图片可保存', icon: 'none' });
      return;
    }

    // 如果只有一张图片，直接保存；多张图片让用户选择
    if (images.length === 1) {
      this.saveImageToAlbum(images[0]);
    } else {
      wx.showActionSheet({
        itemList: images.map((_, i) => `保存第${i + 1}张图片`).concat(['保存全部图片']),
        success: (res) => {
          if (res.tapIndex === images.length) {
            // 保存全部
            images.forEach((img, index) => {
              setTimeout(() => {
                this.saveImageToAlbum(img);
              }, index * 500);
            });
          } else {
            this.saveImageToAlbum(images[res.tapIndex]);
          }
        }
      });
    }
  },

  // 保存图片到相册
  saveImageToAlbum(imageUrl) {
    wx.showLoading({ title: '保存中...' });
    wx.downloadFile({
      url: imageUrl,
      success: (res) => {
        if (res.statusCode === 200) {
          wx.saveImageToPhotosAlbum({
            filePath: res.tempFilePath,
            success: () => {
              wx.hideLoading();
              wx.showToast({ title: '已保存到相册', icon: 'success' });
            },
            fail: (err) => {
              wx.hideLoading();
              if (err.errMsg.indexOf('auth deny') >= 0) {
                wx.showModal({
                  title: '提示',
                  content: '需要您授权保存图片到相册',
                  confirmText: '去授权',
                  success: (res) => {
                    if (res.confirm) {
                      wx.openSetting();
                    }
                  }
                });
              } else {
                wx.showToast({ title: '保存失败', icon: 'none' });
              }
            }
          });
        }
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({ title: '下载失败', icon: 'none' });
      }
    });
  },

  // 编辑帖子
  onEditPost() {
    this.hideMoreMenu();
    const post = this.data.post;
    // 跳转到编辑页面
    wx.navigateTo({
      url: `/pages/publish/publish?editId=${post.id}`
    });
  },

  // 设置可见权限
  onSetVisibility() {
    this.hideMoreMenu();
    const post = this.data.post;
    const currentVisibility = post.visibility || 'public';
    
    wx.showActionSheet({
      itemList: ['🌍 公开 - 所有人可见', '🔒 仅自己可见'],
      success: async (res) => {
        const newVisibility = res.tapIndex === 0 ? 'public' : 'private';
        if (newVisibility === currentVisibility) {
          wx.showToast({ title: '权限未改变', icon: 'none' });
          return;
        }

        wx.showLoading({ title: '设置中...' });
        try {
          const success = await db.updatePost(post.id, { visibility: newVisibility });
          if (success) {
            this.setData({ 'post.visibility': newVisibility });
            wx.showToast({ 
              title: newVisibility === 'private' ? '已设为仅自己可见' : '已设为公开', 
              icon: 'success' 
            });
          } else {
            wx.showToast({ title: '设置失败', icon: 'none' });
          }
        } catch (err) {
          console.error('设置权限失败:', err);
          wx.showToast({ title: '设置失败', icon: 'none' });
        }
        wx.hideLoading();
      }
    });
  },

  // 删除帖子
  onDeletePost() {
    this.hideMoreMenu();
    wx.showModal({
      title: '确认删除',
      content: '删除后不可恢复，确定要删除这条动态吗？',
      confirmColor: '#FF6B6B',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '删除中...' });
          try {
            const success = await db.deletePost(this.data.post.id);
            if (success) {
              wx.showToast({ title: '已删除', icon: 'success' });
              setTimeout(() => {
                wx.navigateBack();
              }, 1500);
            } else {
              wx.showToast({ title: '删除失败', icon: 'none' });
            }
          } catch (err) {
            console.error('删除失败:', err);
            wx.showToast({ title: '删除失败', icon: 'none' });
          }
          wx.hideLoading();
        }
      }
    });
  },

  // 举报帖子
  onReportPost() {
    this.hideMoreMenu();
    wx.showActionSheet({
      itemList: ['内容不实', '涉及违规', '骚扰/辱骂', '其他原因'],
      success: (res) => {
        wx.showToast({ title: '举报已提交', icon: 'success' });
      }
    });
  }
});
