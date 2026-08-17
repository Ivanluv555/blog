---
title: Spring Boot实战 - 手写角色访问
date: 2026-07-13T17:40:00+08:00
draft: false
tags:
  - SpringBoot
  - RBAC
  - JWT
  - 权限控制
  - 安全
categories:
  - 技术
description: 从零开始在Spring Boot项目中实现完整的RBAC权限控制系统，包括JWT、自定义注解、拦截器等核心组件
series:
  - Spring
---

## 问题

在开发艺术展示平台（Artshow）时，这里需要实现一个灵活的权限控制系统，支持普通用户、讲师和管理员三种角色。经过权衡，这里选择了**自定义注解 + 拦截器**的方案，而非Spring Security。

本文将详细介绍如何从零开始实现一个完整的RBAC系统，涵盖数据库设计、JWT改造、自定义注解、拦截器增强等所有环节。

## 开箱即用的Spring Security与手写

下面是两种主流方案的对比：

### Spring Security

**优点：**
- 企业级标准，功能完整
- 成熟稳定，社区支持好
- 提供完整的安全框架

**缺点：**
- 学习曲线陡峭
- 配置复杂，概念较多
- 对于简单需求略显笨重

### 手写方案

**优点：**
- 轻量级，代码简单易懂
- 完全可控，易于定制
- 学习成本低

**缺点：**
- 需要手动实现各个组件
- 缺少一些高级特性

**最终选择：** 自定义方案。因为需求相对简单

## 系统设计

### 角色定义

这里定义了三种角色：

| 角色 | 代码 | 权限 |
|------|------|------|
| 普通用户 | `USER` | 浏览、购买、发帖、评论、点赞 |
| 讲师 | `INSTRUCTOR` | USER权限 + 创建和管理课程/商品 |
| 管理员 | `ADMIN` | 所有权限 + 用户管理、系统管理 |

### 注解设计

```java
@Public              // 公开接口，无需登录
@RequireRole(ADMIN)  // 需要特定角色
// 无注解             // 需要登录，不限角色
```

### 架构图

```
请求 → OPTIONS检查 → @Public检查 → JWT验证 → 角色检查 → Controller
                ↓           ↓          ↓           ↓
              放行        放行     提取userId   检查@RequireRole
                                  和role
```

## 实现步骤

### 第一步：数据库准备

#### 1. 添加role字段

```sql
ALTER TABLE `user`
ADD COLUMN `role` VARCHAR(20) NOT NULL DEFAULT 'USER'
COMMENT '用户角色: USER-普通用户, INSTRUCTOR-讲师, ADMIN-管理员'
AFTER `bio`;

-- 添加索引提高查询性能
ALTER TABLE `user`
ADD INDEX `idx_role` (`role`);

-- 为现有用户设置默认角色
UPDATE `user` SET `role` = 'USER' WHERE `role` IS NULL OR `role` = '';
```

#### 2. 更新User实体

```java
@Entity
@Table(name = "user")
public class User {
    // ...existing fields...
    
    @Column(name = "role")
    private String role;  // 新增
    
    // ...getters and setters...
}
```

### 第二步：创建角色枚举

```java
public enum UserRole {
    USER("USER", "普通用户"),
    INSTRUCTOR("INSTRUCTOR", "讲师"),
    ADMIN("ADMIN", "管理员");

    private final String code;
    // ...构造函数和方法...
}
```

### 第三步：创建自定义注解

#### 1. @Public注解（公开接口）

```java
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
public @interface Public {
    String value() default "";
}
```

#### 2. @RequireRole注解（角色权限）

```java
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
public @interface RequireRole {
    UserRole[] value();
}
```

### 第四步：扩展JWT工具类

#### 原有的JwtUtils

```java
public static String createToken(Long userId) {
    return Jwts.builder()
            .setSubject(String.valueOf(userId))
            .setIssuedAt(new Date())
            .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION))
            .signWith(getKey(), SignatureAlgorithm.HS256)
            .compact();
}
```改造JWT支持角色

```java
// 生成token时添加role
public static String createToken(Long userId, String role) {
    var builder = Jwts.builder()
            .setSubject(String.valueOf(userId))
            // ...时间设置...
            .signWith(getKey(), SignatureAlgorithm.HS256);

    if (role != null && !role.isEmpty()) {
        builder.claim("role", role);  // 关键：添加角色信息
    }
    return builder.compact();
}

// 解析token获取Claims（包含role）
public static Claims parseClaims(String token) {
    return Jwts.parserBuilder()
            .setSigningKey(getKey())
            .build()
            .parseClaimsJws(token)
            .getBody();rivate static final ThreadLocal<String> roleHolder = new ThreadLocal<>();

    public static void setUserId(Long userId) {
        userIdHolder.set(userId);
    }

    public static Long getUserId() {
        return userIdHolder.get();
    }

    public static void setRole(String role) {
        roleHolder.set(role);
    }

    public static String getRole() {
        return roleHolder.get();
    }

    // 检查是否拥有指定角色
    public static boolean hasRole(UserRole role) {
        String currentRole = roleHolder.get();
        return currentRole != null && currentRole.equals(role.getCode());
    }

    // 检查是否拥有任一角色
 ublic class UserContext {
    private static final ThreadLocal<Long> userIdHolder = new ThreadLocal<>();
    private static final ThreadLocal<String> roleHolder = new ThreadLocal<>();

    public static void setUserId(Long userId) { userIdHolder.set(userId); }
    public static Long getUserId() { return userIdHolder.get(); }
    
    public static void setRole(String role) { roleHolder.set(role); }
    public static String getRole() { return roleHolder.get(); }

    // 检查是否拥有任一指定角色
    public static boolean hasAnyRole(UserRole... roles) {
        String currentRole = roleHolder.get();
        if (currentRole == null) return false;
        for (UserRole role : roles) {
            if (currentRole.equals(role.getCode())) return true;ringframework.web.servlet.HandlerInterceptor;

@Component
public class AuthInterceptor implements HandlerInterceptor {

    private static final Logger log = LoggerFactory.getLogger(AuthInterceptor.class);

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {

        String requestURI = request.getRequestURI();
        String method = request.getMethod();

        log.debug("Intercepting request: {} {}", method, requestURI);

        // 1. 跳过OPTIONS预检请求
        if ("OPTIONS".equalsIgnoreCase(method)) {
            log.debug("Skipping OPTIONS preflight request");
            return true;
        }

        // 2. 检查@Public注解
        if (handler instanceof HandlerMethod) {
            HandlerMethod handlerMethod = (HandlerMethod) handler;

            // 检查方法级别的@Public
            Public publicAnnotation = handlerMethod.getMethodAnnotation(Public.class);
            if (publicAnnotation != null) {
@Component
public class AuthInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, 
                             Object handler) throws Exception {
        // 1. 跳过OPTIONS预检请求
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }

        // 2. 检查@Public注解（方法级和类级）
        if (handler instanceof HandlerMethod handlerMethod) {
            if (handlerMethod.getMethodAnnotation(Public.class) != null ||
                handlerMethod.getBeanType().getAnnotation(Public.class) != null) {
                return true;
            }
        }

        // 3. 获取并验证Token
        String token = request.getHeader("Authorization");
        if (!StringUtils.hasLength(token)) {
            throw new BizException(ResultCodes.NOTLOGIN);
        }
        if (token.startsWith("Bearer ")) {
            token = token.substring(7);
        }

        // 4. 解析token，提取userId和role
        Claims claims = JwtUtils.parseClaims(token);
        Long userId = Long.parseLong(claims.getSubject());
        String role = claims.get("role", String.class);

        // 5. 存入ThreadLocal上下文
        UserContext.setUserId(userId);
        UserContext.setRole(role);

        // 6. 检查@RequireRole权限
        if (handler instanceof HandlerMethod handlerMethod) {
            RequireRole requireRole = handlerMethod.getMethodAnnotation(RequireRole.class);
            if (requireRole == null) {
                requireRole = handlerMethod.getBeanType().getAnnotation(RequireRole.class);
            }

            if (requireRole != null) {
                if (!UserContext.hasAnyRole(requireRole.value())) {
                    throw new BizException(ResultCodes.FORBIDDEN);
                }
            }
        }

        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, 
                                Object handler, Exception ex) {
        UserContext.remove();  // 清理ThreadLocal
        return Result.success(userService.findAllUsers());
    }

    // 仅管理员 - 删除用户
    @RequireRole(UserRole.ADMIN)
    @DeleteMapping
    public void deleteUser(@RequestParam Long userId) {
        userService.deleteUser(userId);
    }
}
```

#### 2. 课程模块示例

```java
@RestController
@RequestMapping("/course")
public class CourseController {

    // 公开 - 课程列表
    @Public("课程列表")
    @GetMapping("/list")
    public Result<List<Course>> listCourses() {
        return Result.success(courseService.findAllCourses());
    }

    // 公开 - 课程详情
    @Public("课程详情")
    @GetMapping
    public Result<Course> getCourse(@RequestParam Long courseId) {
        Course course = courseService.queryCourse(courseId);
        return Result.success(course);
    }

    // 讲师或管理员 - 创建课程
    @RequireRole({UserRole.INSTRUCTOR, UserRole.ADMIN})
    @PostMapping
    public Result<Course> createCourse(@RequestBody CourseDTO course) {
        Course newCourse = courseService.addCourse(course);
        return Result.success(newCourse);
    }

    // 讲师或管理员 - 更新课程
    @RequireRole({UserRole.INSTRUCTOR, UserRole.ADMIN})
    @PutMapping
    public Result<Course> updateCourse(@RequestBody CourseDTO course) {
        Course updated = courseService.updateCourse(course);
        return Result.success(updated);
    }

    // 仅管理员 - 删除课程
    @RequireRole(UserRole.ADMIN)
    @DeleteMapping
    public void deleteCourse(@RequestParam Long courseId) {
        courseService.deleteCourse(courseId);
    }
}
```

#### 3. 整个Controller标记为公开

```java
// 分类模块全部公开
@Public
@RestController
@RequestMapping("/artcategory")
public class ArtcategoryController {
    /典型使用示例

```java
@RestController
@RequestMapping("/user")
public class UserController {
    // 公开接口 - 无需登录
    @Public
    @PostMapping("/login")
    public Result<String> login(@RequestBody UserDTO dto) {
        return Result.success(userService.login(dto.getUserName(), dto.getPassword()));
    }

    // 需要登录 - 不限角色
    @GetMapping
    public Result<User> getUser(@RequestParam Long userId) {
        return Result.success(userService.queryUser(userId));
    }

    // 仅管理员
    @RequireRole(UserRole.ADMIN)
    @DeleteMapping
    public void deleteUser(@RequestParam Long userId) {
        userService.deleteUser(userId);
    }
}
```

```java
@RestController
@RequestMapping("/course")
public class CourseController {
    // 公开接口
    @Public
    @GetMapping("/list")
    public Result<List<Course>> listCourses() {
        return Result.success(courseService.findAllCourses());
    }

    // 讲师或管理员
    @RequireRole({UserRole.INSTRUCTOR, UserRole.ADMIN})
    @PostMapping
    public Result<Course> createCourse(@RequestBody CourseDTO course) {
        return Result.success(courseService.addCourse(course));
    }
}
```

```java
// 整个Controller标记为公开
@Public
@RestController
@RequestMapping("/category")
public class CategoryController {
    // 所有方法都无需鉴权
curl -H "Authorization: Bearer $USER_TOKEN" \
  -X POST http://localhost:8888/course \
  -H "Content-Type: application/json" \
  -d '{"title":"测试课程",...}'

# 响应: {"code":403,"msg":"Insufficient permissions"}

# 4. 管理员登录测试
curl -X POST http://localhost:8888/user/login \
  -H "Content-Type: application/json" \
  -d '{"userName":"admin","password":"admin123"}'

ADMIN_TOKEN="eyJhbGc..."

# 5. 管理员可以访问所有接口
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:8888/user/list

# 响应: {"code":200,"data":[...]}
```

### 3. Swagger UI测试

访问 `http://localhost:8888/doc.html`：

1. 点击右上角 **Authorize** 按钮
2. 粘贴JWT token
3. 测试不同权限的接口
4. 观察403响应

## 权限矩阵

| 操作 | 游客 | USER | INSTRUCTOR | ADMIN |
|------|------|------|------------|-------|
| 浏览课程/商品 | ✅ | ✅ | ✅ | ✅ |
| 注册/登录 | ✅ | ✅ | ✅ | ✅ |
| 发帖/评论 | ❌ | ✅ | ✅ | ✅ |
| 购买课程 | ❌ | ✅ | ✅ | ✅ |
| 创建课程 | ❌ | ❌ | ✅ | ✅ |
| 删除课程 | ❌ | ❌ | ❌ | ✅ |
| 用户管理 | ❌ | ❌ | ❌ | ✅ |

## 常见问题{
    public String login(String username, String password) {
        User user = userRepository.findByUserName(username);
        // ...密码验证...
        
        // 关键：生成包含角色的JWT token
        return JwtUtils.createToken(user.getUserId(), user.getRole());
    }

    public User register(UserDTO dto) {
        User user = new User();
        BeanUtils.copyProperties(dto, user);
        user.setRole("USER");  // 默认角色
        return userRepository.save(u
⚠️ 当前示例使用明文密码，**生产环境必须使用BCrypt**：

    public void deletePost(Long postId) {
        Post post = postRepository.findById(postId).orElseThrow(...);
        
        // 只有管理员或作者本人可以删除
        boolean isAdmin = "ADMIN".equals(UserContext.getRole());
        boolean isAuthor = post.getUserId().equals(UserContext.getUserId()
        return userRepository.save(user);
    }

    public String login(String username, String password) {
        User user = userRepository.findByUserName(username);
        // 验证密码
        if (!encoder.matches(password, user.getPasswordHash())) {
            throw new BizException(ResultCodes.ERROR);
        }
        return JwtUtils.createToken(user.getUserId(), user.getRole());
    }
}
```

### Q3: Token过期怎么办？

当前token有效期24小时，可以实现refresh token机制：

```java
@PostMapping("/user/refresh-token")
public Result<String> refreshToken(@RequestBody String refreshToken) {
    // 验证refresh token
    Long userId = validateRefreshToken(refreshToken);
    User user = userRepository.findById(userId).orElseThrow(...);
    
    // 生成新的access token
    String newToken = JwtUtils.createToken(userId, user.getRole());
    return Result.success(newToken);
}
```

### Q4: 性能如何优化？

1. **Token缓存**：使用Redis缓存解析后的token信息
2. **角色缓存**：将用户角色信息缓存到Redis
3. **拦截器优化**：只对需要鉴权的路径执行拦截

```java
// d '{"userName":"testuser","password":"123456"}'
# 响应: {"code":200,"data":"eyJhbGc..."}

# 2. 使用token访问
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8888/user?userId=1001

# 3. 测试权限不足（返回403）
curl -H "Authorization: Bearer $USER_TOKEN" \
  -X POST http://localhost:8888/course \
  -d '{"title":"测试课程"}'

# 4. 管理员可访问所有接口
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:8888/user/list
- 完善的安全审计

## 源码地址

[Artshow](https://github.com/ivanhorn/artshow)

## 总结

@Service
public class UserService {
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    public User register(UserDTO dto) {
        User user = new User();
        user.setPasswordHash(encoder.encode(dto.getPassword()));  // 加密
        return userRepository.save(user);
    }

    public String login(String username, String password) {
        User user = userRepository.findByUserName(username);
        if (!encoder.matches(password, user.getPasswordHash())) {  // 验证
Long userId = validateRefreshToken(refreshToken);
    User user = userRepository.findById(userId).orElseThrow(...);
    return Result.success(JwtUtils.createToken(userId, user.getRole())