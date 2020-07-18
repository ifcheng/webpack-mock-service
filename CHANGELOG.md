## 3.0.0

**BREAKING CHANGES**
- `MockOptions`移除`main`选项，现在不再需要提供入口文件，程序会自动导入mock文件夹下符合条件的文件
- `include`修改为`includeApis`，`exclude`修改为`excludeApis`

## 2.0.0

**BREAKING CHANGES**
- 不再支持`MockRoute`数据结构

**feature**
- 新增`mockRequest`辅助函数，方便获取类型提示

## 1.1.0

- 路由文件支持新的数据结构
- 路由配置对象新增`status`选项，快捷设置HTTP响应状态码
- MockRoute接口中`response`改为可选项
- `setupRouter`方法添加异常捕获