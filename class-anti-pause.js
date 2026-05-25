// 只移除指定类型的事件监听器，而不破坏其他事件
//在需要使用的网页按f12后，在控制台里复制如下代码
function removeSpecificEvents(target, eventTypes) {
    if (!target || !target.addEventListener) return;
    
    // 获取目标对象上的所有事件监听器（仅限 Chrome 开发者工具环境，普通网页无法获取）
    // 由于我们不能直接获取，改用另一种策略：拦截并阻止这些事件的传播/默认行为
    
    // 策略：在捕获阶段阻止这些事件，使它们无法到达页面原生的监听器
    eventTypes.forEach(type => {
        target.addEventListener(type, (e) => {
            e.stopPropagation();
            e.stopImmediatePropagation(); // 阻止同一元素上的其他监听器
        }, true); // 使用捕获阶段，优先级最高
    });
    console.log(`✅ 已阻止 ${eventTypes.join(', ')} 事件传递`);
}

// 对 window 和 document 阻止失焦/切屏事件
const blockEvents = ['blur', 'mouseout', 'mouseleave', 'visibilitychange', 'mousemove', 'mouseover'];
removeSpecificEvents(window, blockEvents);
removeSpecificEvents(document, blockEvents);

// 对于 body 或特定容器，也可以同样处理（但不替换 body）
removeSpecificEvents(document.body, blockEvents);

// 额外：如果想确保视频区域不会被检测到鼠标移出，只针对视频容器做阻止即可
const videoContainer = document.querySelector('.course_main, .video-container, iframe');
if (videoContainer) {
    removeSpecificEvents(videoContainer, blockEvents);
}

console.log('🎯 已只移除失焦/切屏类事件，click 功能不受影响');
