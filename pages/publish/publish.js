const app = getApp();
const db = require('../../utils/db.js');

Page({
  data: {
    form: {
      title: '',
      content: '',
      category: 'daily',
      catId: '',
      catName: ''
    },
    photos: [],
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

  onLoad() {
    this.loadMyCats();
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

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`form.${field}`]: e.detail.value });
  },

  setCategory(e) {
    this.setData({ 'form.category': e.currentTarget.dataset.cat });
  },

  selectCat(e) {
    const { id, name } = e.currentTarget.dataset;
    this.setData({
      'form.catId': id || '',
      'form.catName': name || ''
    });
  },

  toggleTopic(e) {
    const index = e.currentTarget.dataset.index;
    const key = `topicOptions[${index}].checked`;
    this.setData({ [key]: !this.data.topicOptions[index].checked });
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
      photos: this.data.photos,
      topicOptions: this.data.topicOptions,
      time: Date.now()
    };
    wx.setStorageSync('postDraft', draft);
    wx.showToast({ title: '已保存草稿', icon: 'success' });
  },

  async onSubmit() {
    const { form, photos, topicOptions } = this.data;

    // 校验
    if (photos.length === 0) {
      wx.showToast({ title: '请至少添加一张照片', icon: 'none' });
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
            // 上传照片
            let photoUrls = [];
            for (let i = 0; i < photos.length; i++) {
              wx.showLoading({ title: `上传图片 ${i + 1}/${photos.length}`, mask: true });
              const fileID = await db.uploadImage(photos[i], `posts/${Date.now()}-${i}.jpg`);
              if (fileID) photoUrls.push(fileID);
            }

            if (photoUrls.length === 0) {
              wx.hideLoading();
              wx.showToast({ title: '图片上传失败', icon: 'none' });
              return;
            }

            const userInfo = app.globalData.userInfo || {};

            // 创建动态（包含 userId 用于后续查询过滤）
            const postId = await db.addPost({
              title: form.title.trim(),
              content: form.content.trim(),
              images: photoUrls,
              category: form.category,
              catId: form.catId,
              catName: form.catName,
              topics: topics,
              userId: userInfo._id || '',
              userName: userInfo.name || '匿名',
              userAvatar: userInfo.avatar || '',
              imgRatio: 100 // 默认1:1，实际可以根据第一张图计算
            });

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
