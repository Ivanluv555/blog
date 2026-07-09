+++
date = '2026-07-09T21:36:38+08:00'
draft = false
title = '数学公式测试'
description = '测试Blowfish主题的KaTeX短代码'
tags = ['数学', '测试']
categories = ['技术']
+++

{{< katex >}}

## 数学公式支持

使用Blowfish主题的KaTeX短代码来渲染数学公式！

### 行内公式

当 \\(a \ne 0\\) 时，方程 \\(ax^2 + bx + c = 0\\) 有两个解。

爱因斯坦质能方程：\\(E = mc^2\\)

勾股定理：\\(a^2 + b^2 = c^2\\)

圆的面积：\\(S = \pi r^2\\)

### 独立公式块

二次方程的求根公式：

$$
x = \frac{-b \pm \sqrt{b^2-4ac}}{2a}
$$

欧拉公式（数学中最美的公式）：

$$
e^{i\pi} + 1 = 0
$$

高斯积分：

$$
\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
$$

### 矩阵运算

$$
\begin{bmatrix}
a & b \\
c & d
\end{bmatrix}
\begin{bmatrix}
x \\
y
\end{bmatrix}
=
\begin{bmatrix}
ax + by \\
cx + dy
\end{bmatrix}
$$

### 求和与积分

自然数求和：

$$
\sum_{i=1}^{n} i = \frac{n(n+1)}{2}
$$

定积分：

$$
\int_0^1 x^2 dx = \left[\frac{x^3}{3}\right]_0^1 = \frac{1}{3}
$$

### 复杂公式

麦克斯韦方程组：

$$
\begin{aligned}
\nabla \cdot \mathbf{E} &= \frac{\rho}{\epsilon_0} \\\\
\nabla \cdot \mathbf{B} &= 0 \\\\
\nabla \times \mathbf{E} &= -\frac{\partial \mathbf{B}}{\partial t} \\\\
\nabla \times \mathbf{B} &= \mu_0\mathbf{J} + \mu_0\epsilon_0\frac{\partial \mathbf{E}}{\partial t}
\end{aligned}
$$

傅里叶变换：

$$
F(\omega) = \int_{-\infty}^{\infty} f(t) e^{-i\omega t} dt
$$

薛定谔方程：

$$
i\hbar\frac{\partial}{\partial t}\Psi(\mathbf{r},t) = \hat{H}\Psi(\mathbf{r},t)
$$

---

**注意**：这个页面使用了 `{{< katex >}}` 短代码来启用数学公式渲染！
