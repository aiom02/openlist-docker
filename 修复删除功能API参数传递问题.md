# 修复删除功能API参数传递问题

## 问题描述

### 错误信息
```json
{
  "code": 400,
  "message": "strconv.Atoi: parsing \"\": invalid syntax",
  "data": null
}
```

### 问题表现
- 删除视频/音频收藏文件夹失败
- 删除视频/音频收藏项失败
- HTTP 状态码 200，但业务状态码 400

### 问题原因
后端和前端的参数传递方式不匹配：

**后端代码**（期望查询参数）：
```go
func DeleteAudioFavoriteFolder(c *gin.Context) {
    idStr := c.Query("id")  // ← 从 URL 查询参数获取
    id, err := strconv.Atoi(idStr)  // ← 空字符串转换失败
    ...
}
```

**前端代码**（错误：通过 POST body 发送）：
```typescript
// 修复前
export const deleteAudioFavoriteFolder = async (id: number): Promise<void> => {
  const resp = await r.post("/audio_favorites/folder/delete", { id })  // ← 作为 body
  checkResp(resp)
}
```

### 技术细节
- 后端使用 `c.Query("id")` 期望从 URL 查询参数获取 ID
- 前端却将 ID 作为 POST body 发送
- 导致后端获取到空字符串 `""`
- `strconv.Atoi("")` 无法将空字符串转换为整数，抛出错误

## 修复方案

### 修复的文件

#### 1. `OpenList-Frontend-main/src/utils/video-favorites.ts`

**修复前**：
```typescript
export const deleteVideoFavoriteFolder = async (id: number): Promise<void> => {
  const resp = await r.post("/video_favorites/folder/delete", { id })
  checkResp(resp)
}

export const deleteVideoFavorite = async (id: number): Promise<void> => {
  const resp = await r.post("/video_favorites/delete", { id })
  checkResp(resp)
}
```

**修复后**：
```typescript
export const deleteVideoFavoriteFolder = async (id: number): Promise<void> => {
  const resp = await r.post("/video_favorites/folder/delete", {}, { params: { id } })
  checkResp(resp)
}

export const deleteVideoFavorite = async (id: number): Promise<void> => {
  const resp = await r.post("/video_favorites/delete", {}, { params: { id } })
  checkResp(resp)
}
```

#### 2. `OpenList-Frontend-main/src/utils/audio-favorites.ts`

**修复前**：
```typescript
export const deleteAudioFavoriteFolder = async (id: number): Promise<void> => {
  const resp = await r.post("/audio_favorites/folder/delete", { id })
  checkResp(resp)
}

export const deleteAudioFavorite = async (id: number): Promise<void> => {
  const resp = await r.post("/audio_favorites/delete", { id })
  checkResp(resp)
}
```

**修复后**：
```typescript
export const deleteAudioFavoriteFolder = async (id: number): Promise<void> => {
  const resp = await r.post("/audio_favorites/folder/delete", {}, { params: { id } })
  checkResp(resp)
}

export const deleteAudioFavorite = async (id: number): Promise<void> => {
  const resp = await r.post("/audio_favorites/delete", {}, { params: { id } })
  checkResp(resp)
}
```

### 关键修改点

#### 修改前的调用方式
```typescript
r.post("/api/endpoint", { id: 123 })
```
这会将参数作为 POST body 发送：
```
POST /api/endpoint
Content-Type: application/json

{"id": 123}
```

#### 修改后的调用方式
```typescript
r.post("/api/endpoint", {}, { params: { id: 123 } })
```
这会将参数作为 URL 查询参数发送：
```
POST /api/endpoint?id=123
Content-Type: application/json

{}
```

### 参数说明

`r.post()` 函数签名：
```typescript
r.post(url: string, data?: any, config?: AxiosRequestConfig)
```

- 第一个参数：URL 路径
- 第二个参数：POST body 数据（空对象 `{}`）
- 第三个参数：配置选项，包含 `params` 用于查询参数

## 影响范围

### 修复的功能
1. ✅ 删除视频收藏文件夹
2. ✅ 删除视频收藏项
3. ✅ 删除音频收藏文件夹
4. ✅ 删除音频收藏项

### API 端点
- `POST /api/video_favorites/folder/delete?id=<id>`
- `POST /api/video_favorites/delete?id=<id>`
- `POST /api/audio_favorites/folder/delete?id=<id>`
- `POST /api/audio_favorites/delete?id=<id>`

## 测试验证

### 测试步骤
1. 创建一个视频/音频收藏文件夹
2. 尝试删除该文件夹
3. 验证删除成功
4. 创建一个收藏项
5. 尝试删除该收藏项
6. 验证删除成功

### 预期结果
```json
{
  "code": 200,
  "message": "Success",
  "data": "folder deleted successfully"
}
```

### 网络请求示例

#### 正确的请求
```
POST http://localhost:5244/api/audio_favorites/folder/delete?id=123
Content-Type: application/json

{}
```

#### 响应
```json
{
  "code": 200,
  "message": "Success",
  "data": "folder deleted successfully"
}
```

## 经验总结

### 问题根源
- 后端和前端的参数传递约定不一致
- GET 请求通常使用查询参数
- POST 请求可以使用 body 或查询参数
- 需要明确 API 设计规范

### 最佳实践

#### 后端角度
```go
// 查询参数方式
func DeleteHandler(c *gin.Context) {
    id := c.Query("id")  // 用于简单参数
    ...
}

// Body 方式
type DeleteReq struct {
    ID uint `json:"id" binding:"required"`
}

func DeleteHandler(c *gin.Context) {
    var req DeleteReq
    if err := c.ShouldBindJSON(&req); err != nil {
        ...
    }
}
```

#### 前端角度
```typescript
// 查询参数方式（适合简单参数）
r.post("/api/delete", {}, { params: { id } })

// Body 方式（适合复杂数据）
r.post("/api/delete", { id, other_data })
```

### 建议
1. **统一规范**：在项目中统一 API 参数传递方式
2. **文档化**：明确记录每个 API 的参数传递方式
3. **类型定义**：使用 TypeScript 接口明确参数结构
4. **测试覆盖**：确保所有 API 都有对应的测试用例
5. **错误提示**：后端返回更明确的错误信息

## 后续优化建议

### 1. API 规范统一
建议将所有删除操作统一为 body 方式：

**后端修改**：
```go
type DeleteReq struct {
    ID uint `json:"id" binding:"required"`
}

func DeleteAudioFavoriteFolder(c *gin.Context) {
    var req DeleteReq
    if err := c.ShouldBindJSON(&req); err != nil {
        common.ErrorResp(c, err, 400)
        return
    }
    // ... 使用 req.ID
}
```

**前端保持**：
```typescript
export const deleteAudioFavoriteFolder = async (id: number): Promise<void> => {
  const resp = await r.post("/audio_favorites/folder/delete", { id })
  checkResp(resp)
}
```

### 2. 错误信息改进
```go
if idStr == "" {
    common.ErrorStrResp(c, "missing required parameter: id", 400)
    return
}
```

### 3. API 文档
使用 Swagger/OpenAPI 规范明确定义所有 API：
```yaml
/api/audio_favorites/folder/delete:
  post:
    parameters:
      - name: id
        in: query
        required: true
        schema:
          type: integer
```

## 总结

这是一个典型的前后端参数传递不匹配问题。通过统一使用查询参数传递删除 ID，修复了所有删除功能的错误。建议在后续开发中：

1. ✅ 明确 API 参数传递规范
2. ✅ 完善 API 文档
3. ✅ 加强前后端沟通
4. ✅ 增加集成测试

修复后，所有删除功能现在都能正常工作！

