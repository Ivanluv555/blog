// Moving Letters 动画脚本

// ml1 - 带线条展开
function animateML1(selector) {
  anime.timeline({loop: false})
    .add({
      targets: selector + ' .line',
      scaleX: [0,1],
      opacity: [0.5,1],
      easing: "easeInOutExpo",
      duration: 900
    })
    .add({
      targets: selector + ' .letter',
      opacity: [0,1],
      translateX: [40,0],
      translateZ: 0,
      scaleX: [0.3, 1],
      easing: "easeOutExpo",
      duration: 800,
      offset: '-=600',
      delay: (el, i) => 150 + 25 * i
    });
}

// ml2 - 渐显效果
function animateML2(selector) {
  anime.timeline({loop: false})
    .add({
      targets: selector + ' .letter',
      scale: [0, 1],
      duration: 1500,
      elasticity: 600,
      delay: (el, i) => 45 * (i+1)
    });
}

// ml3 - 旋转进入
function animateML3(selector) {
  anime.timeline({loop: false})
    .add({
      targets: selector + ' .letter',
      opacity: [0,1],
      easing: "easeInOutQuad",
      duration: 2250,
      delay: (el, i) => 150 * (i+1)
    });
}

// ml6 - 推入效果
function animateML6(selector) {
  anime.timeline({loop: false})
    .add({
      targets: selector + ' .letter',
      translateY: ["1.1em", 0],
      translateZ: 0,
      duration: 750,
      delay: (el, i) => 50 * i
    });
}

// ml7 - 剪切效果
function animateML7(selector) {
  anime.timeline({loop: false})
    .add({
      targets: selector + ' .letter',
      translateY: ["1.1em", 0],
      translateX: ["0.55em", 0],
      translateZ: 0,
      rotateZ: [180, 0],
      duration: 750,
      easing: "easeOutExpo",
      delay: (el, i) => 50 * i
    });
}

// ml9 - 变形效果
function animateML9(selector) {
  anime.timeline({loop: false})
    .add({
      targets: selector + ' .letter',
      scale: [0, 1],
      duration: 1500,
      elasticity: 600,
      delay: (el, i) => 45 * (i+1)
    });
}

// ml11 - 带顶部线条
function animateML11(selector) {
  anime.timeline({loop: false})
    .add({
      targets: selector + ' .line',
      scaleY: [0,1],
      opacity: [0.5,1],
      easing: "easeOutExpo",
      duration: 700
    })
    .add({
      targets: selector + ' .letter',
      opacity: [0,1],
      translateX: [40,0],
      translateZ: 0,
      scaleX: [0.3, 1],
      easing: "easeOutExpo",
      duration: 800,
      delay: (el, i) => 150 + 25 * i
    });
}

// ml16 - 波浪效果
function animateML16(selector) {
  anime.timeline({loop: false})
    .add({
      targets: selector + ' .letter',
      translateY: [-100,0],
      easing: "easeOutExpo",
      duration: 1400,
      delay: (el, i) => 30 * i
    });
}

// 辅助函数：将文本拆分为字母
function wrapLetters(selector) {
  const element = document.querySelector(selector);
  if (!element) return;

  const textWrapper = element.querySelector('.text-wrapper');
  if (!textWrapper) return;

  textWrapper.innerHTML = textWrapper.textContent.replace(/\S/g, "<span class='letter'>$&</span>");
}

// 自动初始化所有 moving-letters 动画
document.addEventListener('DOMContentLoaded', function() {
  // 检测并初始化各种效果
  if (document.querySelector('.ml1')) {
    wrapLetters('.ml1');
    animateML1('.ml1');
  }

  if (document.querySelector('.ml2')) {
    wrapLetters('.ml2');
    animateML2('.ml2');
  }

  if (document.querySelector('.ml3')) {
    wrapLetters('.ml3');
    animateML3('.ml3');
  }

  if (document.querySelector('.ml6')) {
    wrapLetters('.ml6');
    animateML6('.ml6');
  }

  if (document.querySelector('.ml7')) {
    wrapLetters('.ml7');
    animateML7('.ml7');
  }

  if (document.querySelector('.ml9')) {
    wrapLetters('.ml9');
    animateML9('.ml9');
  }

  if (document.querySelector('.ml11')) {
    wrapLetters('.ml11');
    animateML11('.ml11');
  }

  if (document.querySelector('.ml16')) {
    wrapLetters('.ml16');
    animateML16('.ml16');
  }
});
