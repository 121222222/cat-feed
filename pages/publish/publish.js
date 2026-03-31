const app = getApp();
const db = require('../../utils/db.js');

Page({
  data: {
    form: {
      title: '',
      content: '',
      category: 'daily',
      catId: '',
      catName: '',
      catBreed: '',  // 猫咪品种
      visibility: 'public'  // 默认公开
    },
    mediaType: 'image',  // 'image' 或 'video'
    photos: [],
    video: {
      tempFilePath: '',
      duration: 0,
      durationText: '',
      size: 0,
      thumbTempFilePath: ''
    },
    myCats: [],
    topicOptions: [
      { name: '今日份可爱', checked: false },
      { name: '猫咪日常', checked: false },
      { name: '养猫心得', checked: false },
      { name: '猫粮测评', checked: false },
      { name: '猫咪健康', checked: false },
      { name: '新手养猫', checked: false },
      { name: '猫咪趣事', checked: false },
      { name: '晒猫狂魔', checked: false }
    ]
  },

  onLoad(options) {
    this.loadMyCats();
    
    // 如果是从草稿页面跳转过来
    if (options.fromDraft === 'true') {
      this.loadFromDraft();
    } else {
      // 检查是否有自动保存的草稿
      this.checkAutoSaveDraft();
    }
  },

  // 从草稿加载数据
  loadFromDraft() {
    const draft = wx.getStorageSync('editingDraft');
    if (!draft) return;
    
    // 恢复表单数据
    if (draft.form) {
      this.setData({ form: draft.form });
    }
    
    // 恢复媒体类型
    if (draft.mediaType) {
      this.setData({ mediaType: draft.mediaType });
    }
    
    // 恢复图片
    if (draft.photos && draft.photos.length > 0) {
      this.setData({ photos: draft.photos });
    }
    
    // 恢复视频
    if (draft.video && draft.video.tempFilePath) {
      this.setData({ video: draft.video });
    }
    
    // 恢复话题选择
    if (draft.topicOptions) {
      this.setData({ topicOptions: draft.topicOptions });
    }
    
    // 清除编辑草稿标记
    wx.removeStorageSync('editingDraft');
    
    wx.showToast({ title: '草稿已加载', icon: 'none' });
  },

  // 检查自动保存的草稿
  checkAutoSaveDraft() {
    const draft = wx.getStorageSync('postDraft');
    if (draft && draft.time) {
      const timeDiff = Date.now() - draft.time;
      // 如果草稿在7天内
      if (timeDiff < 7 * 24 * 60 * 60 * 1000) {
        wx.showModal({
          title: '发现草稿',
          content: '检测到之前保存的草稿，是否继续编辑？',
          confirmText: '继续编辑',
          cancelText: '放弃',
          confirmColor: '#FFBAA3',
          success: (res) => {
            if (res.confirm) {
              this.restoreDraft(draft);
            }
          }
        });
      }
    }
  },

  // 恢复草稿内容
  restoreDraft(draft) {
    if (draft.form) {
      this.setData({ form: draft.form });
    }
    if (draft.mediaType) {
      this.setData({ mediaType: draft.mediaType });
    }
    if (draft.photos && draft.photos.length > 0) {
      this.setData({ photos: draft.photos });
    }
    if (draft.video && draft.video.tempFilePath) {
      this.setData({ video: draft.video });
    }
    if (draft.topicOptions) {
      this.setData({ topicOptions: draft.topicOptions });
    }
    wx.showToast({ title: '草稿已恢复', icon: 'none' });
  },

  async loadMyCats() {
    try {
      const catsRaw = await db.getMyCats();
      const cats = catsRaw.map(c => ({
        ...c,
        id: c._id
      }));
      this.setData({ myCats: cats });
    } catch (err) {
      console.error('加载猫咪失败:', err);
    }
  },

  // 切换媒体类型
  switchMediaType(e) {
    const type = e.currentTarget.dataset.type;
    if (type === this.data.mediaType) return;
    
    // 检查是否有已选择的内容
    const hasContent = this.data.photos.length > 0 || 
                       this.data.livePhotos.length > 0 || 
                       this.data.video.tempFilePath;
    
    if (hasContent) {
      wx.showModal({
        title: '提示',
        content: '切换类型将清空已选择的内容，确定吗？',
        confirmColor: '#FFBAA3',
        success: (res) => {
          if (res.confirm) {
            this.setData({
              mediaType: type,
              photos: [],
              livePhotos: [],
              video: {
                tempFilePath: '',
                duration: 0,
                durationText: '',
                size: 0,
                thumbTempFilePath: ''
              }
            });
          }
        }
      });
    } else {
      this.setData({ mediaType: type });
    }
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`form.${field}`]: e.detail.value });
  },

  setCategory(e) {
    this.setData({ 'form.category': e.currentTarget.dataset.cat });
  },

  selectCat(e) {
    const { id, name, breed } = e.currentTarget.dataset;
    this.setData({
      'form.catId': id || '',
      'form.catName': name || '',
      'form.catBreed': breed || ''  // 保存猫咪品种
    });
  },

  toggleTopic(e) {
    const index = e.currentTarget.dataset.index;
    const key = `topicOptions[${index}].checked`;
    this.setData({ [key]: !this.data.topicOptions[index].checked });
  },

  // 设置可见范围
  setVisibility(e) {
    const visibility = e.currentTarget.dataset.visibility;
    this.setData({ 'form.visibility': visibility });
  },

  // 显示自定义话题输入框
  addCustomTopic() {
    this.setData({ showCustomTopic: !this.data.showCustomTopic });
  },

  // 自定义话题输入
  onCustomTopicInput(e) {
    this.setData({ customTopicValue: e.detail.value });
  },

  // 确认添加自定义话题
  confirmCustomTopic() {
    const { customTopicValue, topicOptions } = this.data;
    if (!customTopicValue.trim()) {
      wx.showToast({ title: '请输入话题名称', icon: 'none' });
      return;
    }
    // 检查是否已存在
    const exists = topicOptions.some(t => t.name === customTopicValue.trim());
    if (exists) {
      wx.showToast({ title: '该话题已存在', icon: 'none' });
      return;
    }
    // 添加新话题并选中
    const newTopic = { name: customTopicValue.trim(), checked: true };
    this.setData({
      topicOptions: [...topicOptions, newTopic],
      customTopicValue: '',
      showCustomTopic: false
    });
    wx.showToast({ title: '话题已添加', icon: 'success' });
  },

  // 选择照片
  choosePhoto() {
    const that = this;
    const remainCount = 9 - this.data.photos.length;
    if (remainCount <= 0) {
      wx.showToast({ title: '最多上传9张照片', icon: 'none' });
      return;
    }
    wx.chooseMedia({
      count: remainCount,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      sizeType: ['compressed'],
      success(res) {
        const newPhotos = res.tempFiles.map(f => f.tempFilePath);
        that.setData({
          photos: [...that.data.photos, ...newPhotos]
        });
      }
    });
  },

  // 选择视频
  chooseVideo() {
    const that = this;
    wx.chooseMedia({
      count: 1,
      mediaType: ['video'],
      sourceType: ['album', 'camera'],
      maxDuration: 60,  // 最长60秒
      camera: 'back',
      success(res) {
        const file = res.tempFiles[0];
        const duration = Math.round(file.duration);
        const minutes = Math.floor(duration / 60);
        const seconds = duration % 60;
        const durationText = minutes > 0 ? 
          `${minutes}:${seconds.toString().padStart(2, '0')}` : 
          `0:${seconds.toString().padStart(2, '0')}`;
        
        // 获取缩略图
        let thumbPath = file.thumbTempFilePath || '';
        
        that.setData({
          video: {
            tempFilePath: file.tempFilePath,
            duration: duration,
            durationText: durationText,
            size: file.size,
            thumbTempFilePath: thumbPath
          }
        });
        
        // 如果没有自动生成的缩略图，提示用户选择封面
        if (!thumbPath) {
          wx.showModal({
            title: '选择视频封面',
            content: '未能自动获取视频封面，是否手动选择一张图片作为封面？',
            confirmText: '选择封面',
            cancelText: '跳过',
            confirmColor: '#FFBAA3',
            success(modalRes) {
              if (modalRes.confirm) {
                that.chooseVideoCover();
              }
            }
          });
        }
      }
    });
  },

  // 手动选择视频封面
  chooseVideoCover() {
    const that = this;
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      sizeType: ['compressed'],
      success(res) {
        const coverPath = res.tempFiles[0].tempFilePath;
        that.setData({
          'video.thumbTempFilePath': coverPath
        });
        wx.showToast({ title: '封面已设置', icon: 'success' });
      }
    });
  },

  // 删除视频
  deleteVideo() {
    this.setData({
      video: {
        tempFilePath: '',
        duration: 0,
        durationText: '',
        size: 0,
        thumbTempFilePath: ''
      }
    });
  },

  // 预览照片
  previewPhoto(e) {
    const url = e.currentTarget.dataset.url;
    wx.previewImage({
      current: url,
      urls: this.data.photos
    });
  },

  // 删除照片
  deletePhoto(e) {
    const index = e.currentTarget.dataset.index;
    const photos = this.data.photos;
    photos.splice(index, 1);
    this.setData({ photos });
  },

  goAddCat() {
    wx.navigateTo({ url: '/pages/add-cat/add-cat' });
  },

  saveDraft() {
    // 保存草稿到本地存储
    const draft = {
      form: this.data.form,
      mediaType: this.data.mediaType,
      photos: this.data.photos,
      video: this.data.video,
      topicOptions: this.data.topicOptions,
      time: Date.now()
    };
    
    // 检查是否是编辑现有草稿
    const editingDraftIndex = wx.getStorageSync('editingDraftIndex');
    if (editingDraftIndex !== '' && editingDraftIndex !== undefined) {
      // 更新多草稿存储中的对应草稿
      const multipleDrafts = wx.getStorageSync('postDrafts') || [];
      if (editingDraftIndex < multipleDrafts.length) {
        multipleDrafts[editingDraftIndex] = draft;
        wx.setStorageSync('postDrafts', multipleDrafts);
      }
      wx.removeStorageSync('editingDraftIndex');
    } else {
      // 新草稿，保存到单草稿存储
      wx.setStorageSync('postDraft', draft);
    }
    
    wx.showToast({ title: '已保存草稿', icon: 'success' });
  },

  async onSubmit() {
    const { form, mediaType, photos, livePhotos, video, topicOptions } = this.data;

    // 校验
    if (mediaType === 'image' && photos.length === 0) {
      wx.showToast({ title: '请至少添加一张照片', icon: 'none' });
      return;
    }
    if (mediaType === 'live' && livePhotos.length === 0) {
      wx.showToast({ title: '请至少添加一张实况照片', icon: 'none' });
      return;
    }
    if (mediaType === 'video' && !video.tempFilePath) {
      wx.showToast({ title: '请添加视频', icon: 'none' });
      return;
    }
    if (!form.title.trim()) {
      wx.showToast({ title: '请输入标题', icon: 'none' });
      return;
    }

    const topics = topicOptions.filter(t => t.checked).map(t => t.name);

    wx.showModal({
      title: '确认发布',
      content: '确认发布这条动态吗？',
      confirmColor: '#FFBAA3',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '发布中...', mask: true });

          try {
            let mediaUrls = [];
            let livePhotoUrls = [];
            let videoUrl = '';
            let videoCover = '';

            if (mediaType === 'image') {
              // 上传普通照片
              for (let i = 0; i < photos.length; i++) {
                wx.showLoading({ title: `上传图片 ${i + 1}/${photos.length}`, mask: true });
                const fileID = await db.uploadImage(photos[i], `posts/${Date.now()}-${i}.jpg`);
                if (fileID) mediaUrls.push(fileID);
              }

              if (mediaUrls.length === 0) {
                wx.hideLoading();
                wx.showToast({ title: '图片上传失败', icon: 'none' });
                return;
              }
            } else if (mediaType === 'live') {
              // 上传实况照片
              for (let i = 0; i < livePhotos.length; i++) {
                wx.showLoading({ title: `上传实况照片 ${i + 1}/${livePhotos.length}`, mask: true });
                const imageID = await db.uploadImage(livePhotos[i].image, `live-photos/${Date.now()}-${i}.jpg`);
                if (imageID) {
                  livePhotoUrls.push({
                    image: imageID,
                    video: livePhotos[i].video || ''
                  });
                }
              }

              if (livePhotoUrls.length === 0) {
                wx.hideLoading();
                wx.showToast({ title: '实况照片上传失败', icon: 'none' });
                return;
              }
            } else {
              // 上传视频
              wx.showLoading({ title: '上传视频中...', mask: true });
              videoUrl = await db.uploadVideo(video.tempFilePath, `videos/${Date.now()}.mp4`);
              
              if (!videoUrl) {
                wx.hideLoading();
                wx.showToast({ title: '视频上传失败', icon: 'none' });
                return;
              }

              // 上传视频封面
              if (video.thumbTempFilePath) {
                wx.showLoading({ title: '上传封面中...', mask: true });
                videoCover = await db.uploadImage(video.thumbTempFilePath, `covers/${Date.now()}.jpg`);
              }
            }

            const userInfo = app.globalData.userInfo || {};

            // 创建动态
            const postData = {
              title: form.title.trim(),
              content: form.content.trim(),
              mediaType: mediaType,  // 'image', 'live' 或 'video'
              images: mediaType === 'image' ? mediaUrls : (mediaType === 'live' ? livePhotoUrls.map(lp => lp.image) : []),
              livePhotos: mediaType === 'live' ? livePhotoUrls : [],  // 实况照片数组
              video: mediaType === 'video' ? videoUrl : '',
              videoCover: videoCover,
              videoDuration: mediaType === 'video' ? video.duration : 0,
              category: form.category,
              catId: form.catId,
              catName: form.catName,
              catBreed: form.catBreed || '',  // 猫咪品种
              topics: topics,
              visibility: form.visibility,
              userId: userInfo._id || '',
              userName: userInfo.name || '匿名',
              userAvatar: userInfo.avatar || '',
              imgRatio: 100
            };

            const postId = await db.addPost(postData);

            wx.hideLoading();

            if (postId) {
              // 清除草稿
              wx.removeStorageSync('postDraft');
              wx.showToast({ title: '发布成功！', icon: 'success' });
              setTimeout(() => {
                wx.navigateBack();
              }, 1500);
            } else {
              wx.showToast({ title: '发布失败，请检查posts集合是否创建', icon: 'none', duration: 3000 });
            }
          } catch (err) {
            wx.hideLoading();
            console.error('发布失败:', err);
            wx.showModal({
              title: '发布失败',
              content: err.message || '请检查：1.是否已创建posts集合 2.集合权限是否正确',
              showCancel: false
            });
          }
        }
      }
    });
  }
});
