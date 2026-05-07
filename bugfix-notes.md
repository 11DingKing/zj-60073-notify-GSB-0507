# Bug 修复说明

## Bug 1：免打扰时段未生效，站内信和邮件仍然立即发送

### 定位

- `src/services/messageService.ts` → `MessageService.processMessage()`
- `src/services/preferenceService.ts` → `PreferenceService.checkCanSend()`
- `src/services/preferenceService.ts` → `PreferenceService.isInQuietTime()`

### 根因

`preferenceService` 中已有完整的免打扰判断逻辑：`isInQuietTime()` 根据当前时间与 `quietStart`/`quietEnd` 计算是否处于免打扰时段，`checkCanSend()` 综合判断用户是否禁用渠道及是否免打扰。但 `messageService.processMessage()` 在发送消息前**从未调用**这些方法。消息创建后直接进入发送流程，对 IN_APP、EMAIL、WEBSOCKET 等所有渠道一律立即发送，完全绕过了用户偏好检查。

### 修复方式

1. `messageService.ts`：在 `processMessage()` 中、实际发送之前新增偏好检查。根据 `message.channel.type` 映射 `notificationType`（IN_APP→`in_app`、EMAIL→`email`、SMS→`sms`、WEBSOCKET→`websocket`），调用 `preferenceService.checkCanSend()`：
   - 免打扰时段 → 将消息状态回退为 `PENDING`，用 `setTimeout` 延迟到免打扰结束后重新调用 `processMessage()`
   - 用户禁用渠道 → 直接标记为 `FAILED`
2. `preferenceService.ts`：`checkCanSend()` 返回值新增 `quietEnd?: string` 字段，传递免打扰结束时间给调用方，避免二次查询数据库
3. `messageService.ts`：新增 `calculateQuietDelay(quietEnd)` 私有方法，根据 `quietEnd` 和当前时间计算延迟毫秒数，正确处理跨午夜场景（如 22:00-08:00）

---

## Bug 2：模板变量带点号路径（如 `{{user.name}}`）无法识别

### 定位

- `src/services/templateService.ts` → `TemplateService.renderTemplate()`
- `src/services/templateService.ts` → `TemplateService.extractVariables()`

### 根因

两个方法中的正则表达式均为 `/\{\{(\w+)\}\}/g`，其中 `\w+` 只匹配字母、数字、下划线，**不匹配点号 `.`**。因此 `{{user.name}}` 不会被正则捕获，原样保留在输出中。此外，即使正则能捕获点号路径，原代码也只做 `variables[key]` 的单层属性查找，无法解析嵌套对象。

### 修复方式

1. 正则从 `/\{\{(\w+)\}\}/g` 改为 `/\{\{([\w.]+)\}\}/g`，`[\w.]+` 同时匹配字母、数字、下划线和点号
2. 新增 `resolvePath(obj, path)` 私有方法，通过 `path.split('.').reduce()` 逐层访问嵌套属性
3. `renderTemplate()` 中用 `resolvePath(variables, key)` 替代原来的 `variables[key]`
4. `extractVariables()` 同步更新正则，确保变量提取也能识别点号路径

---

## Bug 3：WebSocket 多 tab 推送问题

### 定位

- `src/lib/websocket.ts` → `WebSocketManager.handleConnection()`

### 根因

原代码的连接管理**并非**单例覆盖。`WebSocketManager` 已经使用 `Map<string, Set<WebSocket>>` 按 userId 维护多连接集合，`sendToUser()` 也正确遍历 Set 中所有 WebSocket 连接发送消息。从代码逻辑上看，同一用户多个 tab 的连接都应能收到推送。

实际发现的问题是：`ws.on('error')` 回调中调用了 `handleDisconnect(ws, userId)`，会立即从 Set 中移除该连接。而 WebSocket 的 error 事件之后通常会自动触发 close 事件，close 回调中也会调用 `handleDisconnect`。如果 error 不是致命的（如短暂的发送缓冲区满），提前移除连接会导致该 tab 后续收不到消息；close 事件可能不会立即到来，造成连接被误删。这不是功能性缺陷，而是异常隔离不够健壮。

### 修复方式

移除 `ws.on('error')` 回调中的 `handleDisconnect` 调用，只保留日志输出。连接的清理统一由 `ws.on('close')` 回调负责——close 事件是连接真正关闭的可靠信号，error 后必然会触发 close。避免因非致命 error 导致连接被过早移除，增强异常隔离，防止一个 socket 出错时误删影响同 userId 下的其他连接。
