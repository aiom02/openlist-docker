# 后台播放功能实现

## ✅ 已实现的功能

### 1. 后台播放支持

使用 **Media Session API** 实现后台播放功能，支持：
- ✅ 切换到其他应用时继续播放
- ✅ 锁屏后继续播放
- ✅ 系统通知栏显示播放控制
- ✅ 锁屏界面显示播放控制
- ✅ 蓝牙耳机/车载系统控制

### 2. 控制按钮

**位置**: 播放器顶部，睡眠定时按钮旁边

**样式**:
- 📱 后台播放
- 启用时：绿色高亮
- 禁用时：普通样式

**功能**:
- 点击切换后台播放开关
- 状态保存到 localStorage
- 显示提示消息

## 🎯 Media Session API 功能

### 支持的操作

1. **播放/暂停** (Play/Pause)
   - 通知栏控制
   - 锁屏控制
   - 蓝牙设备控制

2. **上一曲/下一曲** (Previous/Next Track)
   - 切换播放列表中的歌曲
   - 支持所有播放模式（列表、随机、单曲）

3. **快进/快退** (Seek Forward/Backward)
   - 使用设置的快进快退秒数
   - 默认3秒，可自定义

### 显示的元数据

**通知栏/锁屏显示**:
- 🎵 歌曲标题
- 👤 艺术家名称
- 🖼️ 专辑封面（如果有）

## 🔧 技术实现

### 1. 状态管理

```typescript
const [backgroundPlayEnabled, setBackgroundPlayEnabled] = createSignal(
  localStorage.getItem("background-play-enabled") === "true"
)
```

**持久化**: 状态保存到 localStorage，刷新页面后保持

### 2. Media Session 更新

```typescript
const updateMediaSession = () => {
  if (!backgroundPlayEnabled() || !('mediaSession' in navigator)) return
  
  const currentItem = playlistState.items[playlistState.currentIndex]
  
  navigator.mediaSession.metadata = new MediaMetadata({
    title: currentItem.name,
    artist: currentItem.artist || 'Unknown',
    artwork: currentItem.cover ? [
      { src: currentItem.cover, sizes: '512x512', type: 'image/png' }
    ] : []
  })
  
  // 设置控制处理器
  navigator.mediaSession.setActionHandler('play', () => ap.play())
  navigator.mediaSession.setActionHandler('pause', () => ap.pause())
  navigator.mediaSession.setActionHandler('previoustrack', playPrevious)
  navigator.mediaSession.setActionHandler('nexttrack', playNext)
  navigator.mediaSession.setActionHandler('seekbackward', ...)
  navigator.mediaSession.setActionHandler('seekforward', ...)
}
```

### 3. 响应式同步

**监听播放状态变化**:
```typescript
createEffect(() => {
  if (backgroundPlayEnabled() && playlistState.currentIndex >= 0) {
    updateMediaSession()
  }
})
```

**监听播放/暂停**:
```typescript
createEffect(() => {
  if (backgroundPlayEnabled() && 'mediaSession' in navigator) {
    navigator.mediaSession.playbackState = playlistState.isPlaying ? 'playing' : 'paused'
  }
})
```

### 4. 切换功能

```typescript
const toggleBackgroundPlay = () => {
  const newValue = !backgroundPlayEnabled()
  setBackgroundPlayEnabled(newValue)
  localStorage.setItem("background-play-enabled", newValue.toString())
  
  if (newValue) {
    notify.success("后台播放已启用")
    updateMediaSession()
  } else {
    notify.success("后台播放已禁用")
    clearMediaSession()
  }
}
```

## 📱 使用场景

### 手机浏览器

1. **切换应用**
   - 用户切换到其他应用
   - 音乐继续播放
   - 通知栏显示播放控制

2. **锁屏**
   - 用户锁定屏幕
   - 音乐继续播放
   - 锁屏界面显示播放控制

3. **通知栏控制**
   - 播放/暂停
   - 上一曲/下一曲
   - 查看歌曲信息

### 桌面浏览器

1. **切换标签页**
   - 切换到其他标签页
   - 音乐继续播放

2. **最小化窗口**
   - 最小化浏览器
   - 音乐继续播放

### 外部设备

1. **蓝牙耳机**
   - 耳机按钮控制播放/暂停
   - 耳机按钮切换歌曲

2. **车载系统**
   - 方向盘按钮控制
   - 车载屏幕显示歌曲信息

## 🎨 UI 设计

### 按钮状态

**禁用状态**:
```
📱 后台播放
```
- 普通样式
- 灰色文字

**启用状态**:
```
📱 后台播放
```
- 绿色高亮
- 成功色主题

### 按钮位置

```
[❤️ 添加到收藏] [🏷️ 添加标记]

[⏮️] [⏸️] [⏭️] [⏩] [⏪] [⚙️]

[🔀 列表循环] [⏰ 睡眠定时] [📱 后台播放] ← 新增
```

## 🌐 浏览器兼容性

### 支持的浏览器

- ✅ Chrome/Edge (Android, Desktop)
- ✅ Safari (iOS 13.4+, macOS)
- ✅ Firefox (Android, Desktop)
- ✅ Opera (Android, Desktop)

### 不支持的浏览器

- ❌ IE 11
- ❌ 旧版 Safari (iOS < 13.4)

### 降级处理

```typescript
if (!('mediaSession' in navigator)) {
  // Media Session API 不可用
  // 功能自动禁用，不影响正常播放
  return
}
```

## 📊 功能对比

### 启用后台播放

| 场景 | 未启用 | 已启用 |
|------|--------|--------|
| 切换应用 | ❌ 暂停 | ✅ 继续播放 |
| 锁屏 | ❌ 暂停 | ✅ 继续播放 |
| 通知栏控制 | ❌ 无 | ✅ 有 |
| 锁屏控制 | ❌ 无 | ✅ 有 |
| 蓝牙控制 | ❌ 无 | ✅ 有 |
| 显示封面 | ❌ 无 | ✅ 有 |

## 🔍 调试信息

### 检查支持

```javascript
console.log('Media Session支持:', 'mediaSession' in navigator)
```

### 查看当前状态

```javascript
console.log('播放状态:', navigator.mediaSession.playbackState)
console.log('元数据:', navigator.mediaSession.metadata)
```

## ⚡ 性能优化

1. **条件更新**: 只在启用时更新 Media Session
2. **状态缓存**: 使用 localStorage 缓存设置
3. **响应式更新**: 只在必要时更新元数据
4. **清理资源**: 禁用时清除所有处理器

## 🎵 完整功能列表

### 播放器功能

- ✅ 播放/暂停
- ✅ 上一曲/下一曲
- ✅ 快进/快退
- ✅ 进度条拖动
- ✅ 音量控制
- ✅ 播放模式切换
- ✅ 睡眠定时
- ✅ 后台播放 ← **新增**

### 播放列表功能

- ✅ 添加歌曲
- ✅ 删除歌曲
- ✅ 批量删除
- ✅ 拖拽排序
- ✅ 清空列表
- ✅ 双向同步

### 收藏和标记

- ✅ 添加到收藏
- ✅ 添加标记
- ✅ 管理文件夹

所有功能已完成！🎉
