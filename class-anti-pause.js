// ==UserScript==
// @name         超星自动点击视频区域
// @namespace    http://tampermonkey.net/
// @version      6.0
// @description  自动点击视频画面区域启动播放，支持深层iframe
// @match        *://*.chaoxing.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 屏蔽失焦/切屏（与之前相同，略）
    function removeEvents(target, types) {
        if (!target || !target.addEventListener) return;
        types.forEach(type => {
            target.addEventListener(type, (e) => {
                e.stopPropagation();
                e.stopImmediatePropagation();
            }, true);
        });
    }
    const blockList = ['blur', 'mouseout', 'mouseleave', 'visibilitychange', 'mousemove', 'mouseover'];
    removeEvents(window, blockList);
    removeEvents(document, blockList);
    removeEvents(document.body, blockList);
    const container = document.querySelector('.course_main, .video-container, iframe');
    if (container) removeEvents(container, blockList);
    console.log('✅ 已屏蔽失焦/切屏检测');

    // 测验检测（简写，完整版可自行添加）
    function isQuiz() {
        const active = document.querySelector('.posCatalog_active');
        if (active) {
            const title = active.querySelector('.chapterName, .catalog_name');
            if (title && /(测验|测试|考试|单元测试)/i.test(title.textContent)) return true;
        }
        return false;
    }

    // 完成检测
    function isFinished() {
        const active = document.querySelector('.posCatalog_active');
        if (active && active.querySelector('.prevHoverTips')?.textContent.includes('已完成')) return true;
        return false;
    }

    // 递归查找所有iframe（获取最内层包含视频的文档）
    function getDeepestIframeDocument(iframe) {
        let doc = iframe.contentDocument;
        if (!doc) return null;
        const innerIframe = doc.querySelector('iframe');
        if (innerIframe && innerIframe.contentDocument) {
            return getDeepestIframeDocument(innerIframe);
        }
        return doc;
    }

    // 点击视频区域的核心函数
    function clickVideoArea() {
        // 找到最内层的视频文档
        const outerIframe = document.querySelector('.course_main iframe');
        if (!outerIframe) return false;

        let videoDoc = outerIframe.contentDocument;
        if (!videoDoc) return false;

        // 尝试深入嵌套iframe
        const innerIframe = videoDoc.querySelector('iframe');
        if (innerIframe && innerIframe.contentDocument) {
            videoDoc = innerIframe.contentDocument;
        }

        // 等待一小段时间确保播放器完全加载
        setTimeout(() => {
            // 1. 尝试点击播放按钮
            const playBtn = videoDoc.querySelector('button.vjs-big-play-button, .vjs-big-play-button, .vjs-play-control');
            if (playBtn && playBtn.offsetParent !== null) {
                playBtn.click();
                console.log('🖱️ 点击播放按钮成功');
                return true;
            }

            // 2. 尝试点击视频容器区域（如 .vjs-bgmark, .vjs-tech, video 本身）
            const clickTargets = [
                videoDoc.querySelector('.vjs-bgmark'),  // 你图中显示的元素
                videoDoc.querySelector('.vjs-tech'),
                videoDoc.querySelector('video'),
                videoDoc.querySelector('.video-js')
            ].filter(el => el && el.offsetParent !== null);

            for (let target of clickTargets) {
                target.click();
                console.log(`🖱️ 点击视频区域: ${target.tagName}.${target.className}`);
                return true;
            }

            console.warn('❌ 未找到可点击的视频元素');
            return false;
        }, 2000); // 延迟2秒，等待播放器初始化
    }

    const processed = new WeakSet();
    function tryAutoPlay() {
        if (isQuiz()) {
            console.log('📌 测验章节，跳过自动播放');
            return;
        }
        if (isFinished()) return;

        const iframe = document.querySelector('.course_main iframe');
        if (!iframe) return;

        if (processed.has(iframe)) return;

        if (iframe.contentDocument && iframe.contentDocument.readyState === 'complete') {
            clickVideoArea();
            processed.add(iframe);
        } else {
            iframe.addEventListener('load', () => tryAutoPlay(), { once: true });
        }
    }

    // 自动跳转
    let timer = null;
    function autoNext() {
        if (isQuiz()) {
            console.log('⚠️ 测验章节，暂停自动跳转');
            return;
        }
        if (isFinished()) {
            const nextBtn = document.querySelector('#prevNextFocusNext');
            if (nextBtn && window.getComputedStyle(nextBtn).display !== 'none') {
                console.log('⏩ 点击下一节');
                nextBtn.click();
            } else {
                console.log('🏁 课程结束');
                if (timer) clearInterval(timer);
            }
        } else {
            tryAutoPlay();
        }
    }

    timer = setInterval(autoNext, 8000);
    console.log('🚀 脚本已启动，将自动点击视频区域');
})();
