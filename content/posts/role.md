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
    @Id
    @GeneratedValue(generator = "snowflake")
    @Column(name = "user_id")
    private Long userId;
    
    @Column(name = "username")
    private String username;
    
    @Column(name = "password_hash")
    private String passwordHash;
    
    @Column(name = "role")
    private String role;  // 新增
    
    // ... getters and setters
}
```

### 第二步：创建角色枚举

```java
package org.ivan.artshow.common.auth;

public enum UserRole {
    USER("USER", "普通用户"),
    INSTRUCTOR("INSTRUCTOR", "讲师"),
    ADMIN("ADMIN", "管理员");

    private final String code;
    private final String description;

    UserRole(String code, String description) {
        this.code = code;
        this.description = description;
    }

    public String getCode() {
        return code;
    }

    public String getDescription() {
        return description;
    }

    public static UserRole fromCode(String code) {
        for (UserRole role : values()) {
            if (role.code.equals(code)) {
                return role;
            }
        }
        throw new IllegalArgumentException("Invalid role code: " + code);
    }
}
```

### 第三步：创建自定义注解

#### 1. @Public注解（公开接口）

```java
package org.ivan.artshow.common.auth;

import java.lang.annotation.*;

@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface Public {
    String value() default "";
}
```

#### 2. @RequireRole注解（角色权限）

```java
package org.ivan.artshow.common.auth;

import java.lang.annotation.*;

@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface RequireRole {
    UserRole[] value();
    String description() default "";
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
```

#### 改造后支持角色

```java
public static String createToken(Long userId, String role) {
    var builder = Jwts.builder()
            .setSubject(String.valueOf(userId))
            .setIssuedAt(new Date())
            .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION))
            .signWith(getKey(), SignatureAlgorithm.HS256);

    if (role != null && !role.isEmpty()) {
        builder.claim("role", role);  // 添加角色信息
    }

    return builder.compact();
}

// 解析token获取所有Claims
public static Claims parseClaims(String token) {
    try {
        return Jwts.parserBuilder()
                .setSigningKey(getKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    } catch (Exception e) {
        throw new BizException(ResultCodes.NOTLOGIN);
    }
}
```

### 第五步：增强UserContext

```java
package org.ivan.artshow.common.auth;

public class UserContext {
    private static final ThreadLocal<Long> userIdHolder = new ThreadLocal<>();
    private static final ThreadLocal<String> roleHolder = new ThreadLocal<>();

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
    public static boolean hasAnyRole(UserRole... roles) {
        String currentRole = roleHolder.get();
        if (currentRole == null) {
            return false;
        }
        for (UserRole role : roles) {
            if (currentRole.equals(role.getCode())) {
                return true;
            }
        }
        return false;
    }

    public static void remove() {
        userIdHolder.remove();
        roleHolder.remove();
    }
}
```

### 第六步：增强拦截器

这是整个RBAC系统的核心！

```java
package org.ivan.artshow.common.auth;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.ivan.artshow.common.core.resultcode.ResultCodes;
import org.ivan.artshow.common.exception.BizException;
import org.ivan.artshow.common.utils.JwtUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

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
                log.debug("Method {} is marked as @Public, skipping authentication", 
                    handlerMethod.getMethod().getName());
                return true;
            }

            // 检查类级别的@Public
            publicAnnotation = handlerMethod.getBeanType().getAnnotation(Public.class);
            if (publicAnnotation != null) {
                log.debug("Controller {} is marked as @Public, skipping authentication", 
                    handlerMethod.getBeanType().getSimpleName());
                return true;
            }
        }

        // 3. 获取Token
        String token = request.getHeader("Authorization");

        if (!StringUtils.hasLength(token)) {
            log.warn("Request {} missing Authorization header", requestURI);
            throw new BizException(ResultCodes.NOTLOGIN);
        }

        // 4. 处理"Bearer "前缀
        if (token.startsWith("Bearer ")) {
            token = token.substring(7);
        }

        // 5. 验证token并提取信息
        try {
            io.jsonwebtoken.Claims claims = JwtUtils.parseClaims(token);
            Long userId = Long.parseLong(claims.getSubject());
            String role = claims.get("role", String.class);

            log.debug("Token validated, user ID: {}, role: {}", userId, role);

            // 6. 存入上下文
            UserContext.setUserId(userId);
            if (role != null) {
                UserContext.setRole(role);
            }

            // 7. 检查角色权限
            if (handler instanceof HandlerMethod) {
                HandlerMethod handlerMethod = (HandlerMethod) handler;

                // 检查方法级别的@RequireRole
                RequireRole requireRole = handlerMethod.getMethodAnnotation(RequireRole.class);
                if (requireRole == null) {
                    // 检查类级别的@RequireRole
                    requireRole = handlerMethod.getBeanType().getAnnotation(RequireRole.class);
                }

                // 如果有@RequireRole，检查用户是否拥有所需角色
                if (requireRole != null) {
                    UserRole[] requiredRoles = requireRole.value();
                    boolean hasRequiredRole = UserContext.hasAnyRole(requiredRoles);

                    if (!hasRequiredRole) {
                        log.warn("User {} with role {} lacks required role for {}", 
                            userId, role, requestURI);
                        throw new BizException(ResultCodes.FORBIDDEN);
                    }

                    log.debug("User has required role, access granted");
                }
            }

            return true;
        } catch (BizException e) {
            log.error("Token validation or permission check failed: {}", e.getMessage());
            throw e;
        }
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, 
                                Object handler, Exception ex) throws Exception {
        UserContext.remove();
        log.debug("UserContext cleanup completed");
    }
}
```

### 第七步：在Controller中使用

#### 1. 用户模块示例

```java
@RestController
@RequestMapping("/user")
public class UserController {

    // 公开接口 - 注册
    @Public("用户注册")
    @PostMapping
    public Result<User> register(@RequestBody UserDTO user) {
        User newUser = userService.addUser(user);
        return Result.success(newUser);
    }

    // 公开接口 - 登录
    @Public("用户登录")
    @PostMapping("/login")
    public Result<String> login(@RequestBody UserDTO userDTO) {
        String token = userService.login(userDTO.getUserName(), userDTO.getPassword());
        return Result.success(token);
    }

    // 需要登录 - 查询用户
    @GetMapping
    public Result<User> getUser(@RequestParam Long userId) {
        User user = userService.queryUser(userId);
        return Result.success(user);
    }

    // 仅管理员 - 查询所有用户
    @RequireRole(UserRole.ADMIN)
    @GetMapping("/list")
    public Result<List<User>> listUsers() {
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
    // 所有方法都不需要鉴权
    
    @GetMapping("/list")
    public Result<List<Artcategory>> list() { ... }
    
    @GetMapping
    public Result<Artcategory> get(@RequestParam Long id) { ... }
}
```

### 第八步：更新登录逻辑

```java
@Service
public class UserService implements IUserService {

    @Override
    public String login(String username, String password) {
        User user = userRepository.findByUserName(username);
        if (user == null) {
            throw new BizException(ResultCodes.NOTFOUND);
        }
        if (!user.getPassword().equals(password)) {
            throw new BizException(ResultCodes.ERROR);
        }
        
        // 生成包含角色的JWT token
        return JwtUtils.createToken(user.getUserId(), user.getRole());
    }

    @Override
    public User addUser(UserDTO user) {
        User newUser = new User();
        BeanUtils.copyProperties(user, newUser);
        
        // 新注册用户默认角色为USER
        if (newUser.getRole() == null || newUser.getRole().isEmpty()) {
            newUser.setRole("USER");
        }
        
        return userRepository.save(newUser);
    }
}
```

### 第九步：业务层权限验证

有些权限需要在Service层额外验证：

```java
@Service
public class PostService {

    public void deletePost(Long postId) {
        Post post = postRepository.findById(postId)
            .orElseThrow(() -> new BizException(ResultCodes.NOTFOUND));
        
        Long currentUserId = UserContext.getUserId();
        String currentRole = UserContext.getRole();
        
        // 只有管理员或作者本人可以删除
        boolean isAdmin = "ADMIN".equals(currentRole);
        boolean isAuthor = post.getUserId().equals(currentUserId);
        
        if (!isAdmin && !isAuthor) {
            throw new BizException(ResultCodes.FORBIDDEN);
        }
        
        postRepository.deleteById(postId);
    }
}
```

## 测试验证

### 1. 创建测试账号

```sql
-- 普通用户
INSERT INTO user (username, password_hash, nickname, role, created_at)
VALUES ('testuser', '123456', '测试用户', 'USER', NOW());

-- 讲师
INSERT INTO user (username, password_hash, nickname, role, created_at)
VALUES ('instructor', 'instructor123', '测试讲师', 'INSTRUCTOR', NOW());

-- 管理员
INSERT INTO user (username, password_hash, nickname, role, created_at)
VALUES ('admin', 'admin123', '系统管理员', 'ADMIN', NOW());
```

### 2. 测试流程

```bash
# 1. 普通用户登录
curl -X POST http://localhost:8888/user/login \
  -H "Content-Type: application/json" \
  -d '{"userName":"testuser","password":"123456"}'

# 响应: {"code":200,"data":"eyJhbGc..."}

# 2. 使用token访问需要登录的接口
USER_TOKEN="eyJhbGc..."

curl -H "Authorization: Bearer $USER_TOKEN" \
  http://localhost:8888/user?userId=1001

# 3. 测试权限不足（应返回403）
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

## 常见问题

### Q1: 如何升级用户角色？

```sql
-- 提升为讲师
UPDATE user SET role = 'INSTRUCTOR' WHERE user_id = 1001;

-- 提升为管理员
UPDATE user SET role = 'ADMIN' WHERE user_id = 1001;
```

或者创建管理接口：

```java
@RequireRole(UserRole.ADMIN)
@PutMapping("/user/{userId}/role")
public Result<Void> updateUserRole(@PathVariable Long userId, @RequestParam String role) {
    // 验证角色是否有效
    UserRole.fromCode(role);
    userService.updateUserRole(userId, role);
    return Result.success();
}
```

### Q2: 密码安全怎么办？

⚠️ 当前示例使用明文密码，**生产环境必须使用BCrypt**：

```java
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@Service
public class UserService {
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    public User register(UserDTO dto) {
        User user = new User();
        // 加密密码
        user.setPasswordHash(encoder.encode(dto.getPassword()));
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
// 在WebConfig中配置拦截路径
registry.addInterceptor(authInterceptor)
    .addPathPatterns("/api/**")  // 只拦截api路径
    .excludePathPatterns("/api/public/**");  // 排除公开路径
```

## 对比Spring Security

### 代码量对比

- **自定义方案**：约500行核心代码
- **Spring Security**：配置代码相当，但需理解更多概念

### 功能对比

| 功能        | 自定义方案 | Spring Security |
| --------- | ----- | --------------- |
| JWT认证     | ✅     | ✅               |
| 角色控制      | ✅     | ✅               |
| 方法级权限     | ✅     | ✅               |
| CSRF防护    | ❌     | ✅               |
| Session管理 | ❌     | ✅               |
| OAuth2    | ❌     | ✅               |
| 记住我       | ❌     | ✅               |

### 何时迁移到Spring Security？

如果需要以下功能，建议迁移：
- OAuth2/OIDC集成
- LDAP认证
- 复杂的权限表达式
- 完善的安全审计

## 源码地址

[Artshow](https://github.com/ivanhorn/artshow)

## 总结

通过自定义注解和拦截器，我们实现了一个轻量级但完整的RBAC系统：

**三种角色**：USER、INSTRUCTOR、ADMIN  
**灵活注解**：@Public、@RequireRole  
**JWT集成**：token包含角色信息  
**方法级控制**：细粒度权限管理  
**易于测试**：Swagger UI完美支持  

对于中小型项目，这套方案足够应对大部分权限控制需求。如果未来需要更复杂的安全特性，可以平滑迁移到Spring Security。

## 参考资料

- [Spring MVC拦截器官方文档](https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-config/interceptors.html)
- [JWT官方网站](https://jwt.io/)
- [RBAC权限模型详解](https://en.wikipedia.org/wiki/Role-based_access_control)


