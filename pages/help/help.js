Page({
  data: {
    faqs: [
      {
        id: 1,
        question: '如何发布喂养需求？',
        answer: '进入「喂养服务」页面，选择「我要找人喂猫」，点击「发布喂养需求」，按要求填写猫咪信息、喂养时间等即可。',
        expanded: false
      },
      {
        id: 2,
        question: '如何接单帮人喂猫？',
        answer: '进入「喂养服务」页面，选择「我要上门喂猫」，浏览可接单需求列表，选择合适的需求点击「申请喂养」。需求方确认后您将收到通知。',
        expanded: false
      },
      {
        id: 3,
        question: '服务期间需要做什么？',
        answer: '到达猫咪所在宿舍后需要打卡签到，按照需求方要求完成喂食、换水、铲屎等服务，并拍照上传服务记录。',
        expanded: false
      },
      {
        id: 4,
        question: '如何保障服务安全？',
        answer: '平台仅限本公司员工使用，所有用户需完成实名认证。服务过程中有照片记录和打卡记录，服务完成后双方可互相评价。',
        expanded: false
      },
      {
        id: 5,
        question: '报酬如何结算？',
        answer: '报酬由双方自行协商，平台不参与抽成。可以选择「自愿互助」或「固定金额」两种方式。',
        expanded: false
      },
      {
        id: 6,
        question: '如何取消需求或服务？',
        answer: '在「我的喂养需求」或「我的喂养申请」中找到对应订单，即可取消。已开始的服务需双方协商后取消。',
        expanded: false
      }
    ]
  },

  toggleFaq(e) {
    const id = e.currentTarget.dataset.id;
    const faqs = this.data.faqs.map(f => ({
      ...f,
      expanded: f.id === id ? !f.expanded : false
    }));
    this.setData({ faqs });
  }
});
