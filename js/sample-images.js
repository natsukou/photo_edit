// 示例图片数据库

const SampleImages = {
  data: {
    '人像摄影': {
      '日系小清新': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=800&fit=crop',
      '复古港风': 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&h=800&fit=crop',
      '电影感': 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&h=800&fit=crop',
      '胶片风': 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&h=800&fit=crop'
    },
    '风光摄影': {
      '日系小清新': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
      '电影感': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
      'INS风': 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&h=600&fit=crop'
    },
    '建筑摄影': {
      '高级感': 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800&h=600&fit=crop',
      '极简主义': 'https://images.unsplash.com/photo-1449157291145-7efd050a4d0e?w=800&h=600&fit=crop'
    },
    '宠物摄影': {
      '日系小清新': 'https://images.unsplash.com/photo-1415369629372-26f2fe60c467?w=600&h=800&fit=crop',
      '温暖治愈': 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=600&h=800&fit=crop'
    },
    '美食摄影': {
      'INS风': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=600&fit=crop',
      '高级感': 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=600&fit=crop'
    },
    '街拍摄影': {
      '复古港风': 'https://images.unsplash.com/photo-1515091943-9d5c4e7e4c0a?w=600&h=800&fit=crop',
      '纪实风格': 'https://images.unsplash.com/photo-1445510491599-c391e8046a68?w=600&h=800&fit=crop'
    },
    '产品摄影': {
      '高级感': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=600&fit=crop',
      '极简主义': 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=600&fit=crop'
    },
    '静物摄影': {
      '莫兰迪色': 'https://images.unsplash.com/photo-1513519245088-0e12902e35ca?w=800&h=600&fit=crop',
      '高级感': 'https://images.unsplash.com/photo-1481349518771-20055b2a7b24?w=800&h=600&fit=crop'
    },
    '花卉摄影': {
      '日系小清新': 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=600&h=800&fit=crop',
      '莫兰迪色': 'https://images.unsplash.com/photo-1487070183336-b863922373d4?w=600&h=800&fit=crop'
    },
    '夜景摄影': {
      '电影感': 'https://images.unsplash.com/photo-1514539079130-25950c84af65?w=800&h=600&fit=crop',
      '赛博朋克': 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=800&h=600&fit=crop'
    }
  },
  
  getSampleImage(category, style) {
    if (this.data[category] && this.data[category][style]) {
      return this.data[category][style];
    }
    
    if (this.data[category]) {
      const firstStyle = Object.keys(this.data[category])[0];
      return this.data[category][firstStyle];
    }
    
    return `https://via.placeholder.com/600x800/1a1a1a/f5f1e8?text=${encodeURIComponent(category)}`;
  }
};
