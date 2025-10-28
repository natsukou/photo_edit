# DataWorks 小时级数据同步配置

## 方案概述

每小时同步一次数据，实现准实时的数据分析能力。

## 配置步骤

### 1. 修改调度配置

**在DataWorks中编辑同步任务的调度属性**：

```json
{
  "调度周期": "小时",
  "调度频率": "每1小时",
  "生效时间": "00:00-23:59",
  "时间参数": {
    "bizdate": "$[yyyymmdd]",
    "bizhour": "$[hh24-1]"
  },
  "依赖配置": "自依赖（依赖上一次执行成功）"
}
```

### 2. 修改MySQL查询WHERE条件

**原来的T+1方式**：
```sql
WHERE DATE(created_time) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)
```

**改为小时级**：
```sql
WHERE created_time >= DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 HOUR), '%Y-%m-%d %H:00:00')
  AND created_time < DATE_FORMAT(NOW(), '%Y-%m-%d %H:00:00')
```

### 3. MaxCompute表分区调整

**从按天分区改为按小时分区**：

```sql
-- 原表结构（按天分区）
CREATE TABLE photo_records (
  ...
) PARTITIONED BY (ds STRING COMMENT '分区日期 yyyyMMdd');

-- 改为按小时分区
CREATE TABLE photo_records (
  ...
) PARTITIONED BY (
  ds STRING COMMENT '分区日期 yyyyMMdd',
  hh STRING COMMENT '分区小时 HH'
);

-- 写入数据时指定分区
partition="ds=${bizdate},hh=${bizhour}"
```

### 4. 完整同步任务配置

```json
{
  "type": "job",
  "version": "2.0",
  "steps": [
    {
      "stepType": "mysql",
      "parameter": {
        "datasource": "photo_assistant_mysql",
        "column": ["*"],
        "where": "created_time >= DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 HOUR), '%Y-%m-%d %H:00:00') AND created_time < DATE_FORMAT(NOW(), '%Y-%m-%d %H:00:00')",
        "splitPk": "id",
        "table": "photo_records"
      },
      "name": "Reader",
      "category": "reader"
    },
    {
      "stepType": "odps",
      "parameter": {
        "partition": "ds=${bizdate},hh=${bizhour}",
        "truncate": true,
        "datasource": "odps_first",
        "column": ["*"],
        "table": "photo_records"
      },
      "name": "Writer",
      "category": "writer"
    }
  ],
  "setting": {
    "speed": {
      "concurrent": 3,
      "throttle": false
    }
  },
  "order": {
    "hops": [{"from": "Reader", "to": "Writer"}]
  }
}
```

### 5. 查询SQL调整

**查询最近24小时数据**：

```sql
SELECT 
  ds,
  hh,
  COUNT(*) as photo_count
FROM photo_records
WHERE ds >= TO_CHAR(DATEADD(GETDATE(), -1, 'dd'), 'yyyymmdd')
GROUP BY ds, hh
ORDER BY ds DESC, hh DESC;
```

**查询实时趋势**：

```sql
SELECT 
  CONCAT(ds, ' ', hh, ':00') as time_point,
  COUNT(*) as photo_count,
  COUNT(DISTINCT user_id) as active_users
FROM photo_records
WHERE ds >= TO_CHAR(DATEADD(GETDATE(), -1, 'dd'), 'yyyymmdd')
GROUP BY ds, hh
ORDER BY ds DESC, hh DESC
LIMIT 24;
```

## 调度时间配置示例

**每小时整点执行**：
- 00:00, 01:00, 02:00, ..., 23:00

**配置方法**：
1. DataWorks → 数据开发 → 任务调度
2. 选择任务 → 调度配置
3. 调度周期：小时
4. Cron表达式：`0 0 * * * ?`

## 成本估算

### DataWorks费用
- 每小时执行24次/天
- 月执行次数：24 × 30 = 720次
- 离线同步费用：约￥0.5/次
- **月成本**：720 × ￥0.5 = ￥360

### MaxCompute费用
- 存储费用：与T+1相同
- 计算费用：增加约2倍（因为查询更频繁）
- **月成本**：约￥200

**总计**：约￥560/月

## 优缺点

### 优点
- ✅ 数据延迟最多1小时
- ✅ 可以监控实时趋势
- ✅ 运营活动可快速响应
- ✅ 成本可控

### 缺点
- ❌ 成本比T+1高5倍
- ❌ 对MySQL有一定压力
- ❌ 配置相对复杂

## 适用场景

**推荐使用小时级同步的场景**：
1. 运营活动期间（双11、618等）
2. 新功能上线初期
3. 需要实时监控用户反馈
4. 紧急问题排查

**建议**：
- 核心表（photo_records, page_views）用小时级
- 其他表（users, feedback）保持T+1

## 混合方案（最优）

**核心表小时级 + 辅助表T+1**：

```javascript
// 核心表：小时级同步
const coreTablesHourly = [
  'photo_records',    // 照片记录
  'page_views',       // 页面访问
  'guide_usage'       // 辅助线使用
];

// 辅助表：T+1同步
const supportTablesDaily = [
  'users',           // 用户表（变化不频繁）
  'feedback',        // 反馈表（不需要实时）
  'advice_views'     // 建议查看（可延迟）
];
```

**成本对比**：
- 全部T+1：￥100/月
- 全部小时级：￥560/月
- **混合方案**：￥280/月 ✅ 推荐

---

## 监控配置

### 设置告警

**在DataWorks配置告警规则**：

```json
{
  "告警名称": "小时级同步失败告警",
  "告警条件": "任务执行失败",
  "告警方式": "短信 + 邮件",
  "接收人": "运维人员",
  "告警级别": "紧急"
}
```

### 监控指标

```sql
-- 检查数据完整性
SELECT 
  ds,
  hh,
  COUNT(*) as record_count
FROM photo_records
WHERE ds = TO_CHAR(GETDATE(), 'yyyymmdd')
GROUP BY ds, hh
ORDER BY hh DESC;

-- 预期：每小时都有数据
```

---

## 实施建议

### Phase 1: 初期（使用T+1）
- 刚上线，数据量小
- 降低成本
- 验证系统稳定性

### Phase 2: 成长期（混合方案）
- 核心表改为小时级
- 支持运营决策
- 成本可控

### Phase 3: 成熟期（按需实时）
- 重要活动时开启实时同步
- 平时保持小时级
- 灵活调整

---

**文档版本**: 1.0  
**更新时间**: 2025-10-27
