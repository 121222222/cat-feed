const db = require('../../utils/db.js');

Page({
  data: {
    allNeeds: [],
    needs: [],
    timeFilter: '',
    dormFilter: '',
    countFilter: '',
    rewardFilter: '',
    showDropdown: false,
    activeFilter: '',
    filterOptions: [],
    currentFilterValue: '',
    // 筛选选项配置
    timeOptions: ['今天', '三天内', '一周内', '一个月内'],
    dormOptions: ['A栋', 'B栋', 'C栋', 'D栋'],
    countOptions: ['1只', '2只', '3只及以上'],
    rewardOptions: ['自愿', '30元/天以内', '30-50元/天', '50-80元/天', '80元/天以上']
  },

  async onLoad() {
    wx.showLoading({ title: '加载中...' });
    const pendingNeeds = await db.getPendingNeeds();
    wx.hideLoading();
    const mapped = pendingNeeds.map(n => ({ ...n, id: n._id }));
    this.setData({ allNeeds: mapped, needs: mapped });
  },

  showFilter(e) {
    const type = e.currentTarget.dataset.type;
    const { activeFilter } = this.data;

    // 点击同一个筛选项则关闭
    if (activeFilter === type && this.data.showDropdown) {
      this.setData({ showDropdown: false, activeFilter: '' });
      return;
    }

    let filterOptions = [];
    let currentFilterValue = '';
    if (type === 'time') {
      filterOptions = this.data.timeOptions;
      currentFilterValue = this.data.timeFilter;
    } else if (type === 'dorm') {
      filterOptions = this.data.dormOptions;
      currentFilterValue = this.data.dormFilter;
    } else if (type === 'count') {
      filterOptions = this.data.countOptions;
      currentFilterValue = this.data.countFilter;
    } else if (type === 'reward') {
      filterOptions = this.data.rewardOptions;
      currentFilterValue = this.data.rewardFilter;
    }

    this.setData({
      showDropdown: true,
      activeFilter: type,
      filterOptions,
      currentFilterValue
    });
  },

  hideFilter() {
    this.setData({ showDropdown: false, activeFilter: '' });
  },

  onFilterSelect(e) {
    const value = e.currentTarget.dataset.value;
    const { activeFilter } = this.data;

    const updates = {
      showDropdown: false,
      activeFilter: ''
    };

    if (activeFilter === 'time') {
      updates.timeFilter = value;
    } else if (activeFilter === 'dorm') {
      updates.dormFilter = value;
    } else if (activeFilter === 'count') {
      updates.countFilter = value;
    } else if (activeFilter === 'reward') {
      updates.rewardFilter = value;
    }

    this.setData(updates);
    this.applyFilters();
  },

  applyFilters() {
    const { allNeeds, timeFilter, dormFilter, countFilter, rewardFilter } = this.data;
    let filtered = allNeeds;

    // 时间筛选
    if (timeFilter) {
      const now = new Date();
      let maxDate = new Date();
      if (timeFilter === '今天') {
        maxDate.setDate(now.getDate() + 1);
      } else if (timeFilter === '三天内') {
        maxDate.setDate(now.getDate() + 3);
      } else if (timeFilter === '一周内') {
        maxDate.setDate(now.getDate() + 7);
      } else if (timeFilter === '一个月内') {
        maxDate.setMonth(now.getMonth() + 1);
      }
      filtered = filtered.filter(n => {
        const start = new Date(n.startDate);
        return start <= maxDate;
      });
    }

    // 宿舍区筛选
    if (dormFilter) {
      filtered = filtered.filter(n => n.dormitory && n.dormitory.indexOf(dormFilter) !== -1);
    }

    // 猫咪数量筛选
    if (countFilter) {
      if (countFilter === '1只') {
        filtered = filtered.filter(n => n.catCount === 1);
      } else if (countFilter === '2只') {
        filtered = filtered.filter(n => n.catCount === 2);
      } else if (countFilter === '3只及以上') {
        filtered = filtered.filter(n => n.catCount >= 3);
      }
    }

    // 费用筛选
    if (rewardFilter) {
      filtered = filtered.filter(n => {
        if (rewardFilter === '自愿') {
          return n.reward === '自愿' || n.reward === '自愿打赏';
        }
        // 提取数字部分
        const match = n.reward.match(/(\d+)/);
        if (!match) return rewardFilter === '自愿';
        const amount = parseInt(match[1]);
        if (rewardFilter === '30元/天以内') return amount < 30;
        if (rewardFilter === '30-50元/天') return amount >= 30 && amount <= 50;
        if (rewardFilter === '50-80元/天') return amount > 50 && amount <= 80;
        if (rewardFilter === '80元/天以上') return amount > 80;
        return true;
      });
    }

    this.setData({ needs: filtered });
  },

  goDetail(e) {
    wx.navigateTo({ url: `/pages/need-detail/need-detail?id=${e.currentTarget.dataset.id}` });
  },

  onApply(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/apply-feed/apply-feed?id=${id}` });
  }
});
