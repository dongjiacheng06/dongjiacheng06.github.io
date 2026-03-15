/**
 * 主要JavaScript功能模块
 * 包含导航、动画、用户交互等功能
 */

class WebsiteCore {
    constructor() {
        this.init();
    }

    init() {
        this.initNavigation();
        this.initScrollAnimations();
        this.initRippleEffects();
        this.initPageTransitions();
        this.initPhotoGallery();
    }

    // 导航功能
    initNavigation() {
        const sections = document.querySelectorAll('section');
        const navLinks = document.querySelectorAll('.nav-links a');
        const navToggle = document.querySelector('.nav-toggle');

        // 滚动导航高亮
        window.addEventListener('scroll', this.throttle(() => {
            let current = '';
            sections.forEach(section => {
                const sectionTop = section.offsetTop;
                if (pageYOffset >= sectionTop - 60) {
                    current = section.getAttribute('id');
                }
            });

            navLinks.forEach(link => {
                link.classList.remove('active');
                // 只在当前页面是主页且存在对应section时才添加active类
                if (current && link.getAttribute('href') === `#${current}` && 
                    (window.location.pathname === '/' || window.location.pathname.includes('index.html'))) {
                    link.classList.add('active');
                }
            });
        }, 100));

        // 移动端导航切换
        if (navToggle) {
            navToggle.addEventListener('click', () => {
                // 在桌面端不响应点击事件
                if (window.innerWidth > 768) {
                    return;
                }
                
                const navLinks = document.querySelector('.nav-links');
                navLinks.classList.toggle('active');
                navToggle.classList.toggle('active');
            });
        }

        // 点击导航链接时自动关闭移动端菜单
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    const navLinksEl = document.querySelector('.nav-links');
                    const navToggleEl = document.querySelector('.nav-toggle');
                    navLinksEl.classList.remove('active');
                    navToggleEl.classList.remove('active');
                }
            });
        });
    }

    // 滚动触发动画
    initScrollAnimations() {
        const animateElements = document.querySelectorAll('.scroll-animate');
        
        if (!animateElements.length) return;

        const observerOptions = {
            root: null,
            rootMargin: '0px 0px -50px 0px',
            threshold: 0.1
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate');
                }
            });
        }, observerOptions);

        animateElements.forEach(element => {
            observer.observe(element);
        });
    }

    // 波纹效果
    initRippleEffects() {
        const createRipple = (event) => {
            const button = event.currentTarget;
            const circle = document.createElement('span');
            const diameter = Math.max(button.offsetWidth, button.offsetHeight);
            const radius = diameter / 2;
            
            circle.style.width = circle.style.height = `${diameter}px`;
            circle.style.left = `${event.clientX - button.getBoundingClientRect().left - radius}px`;
            circle.style.top = `${event.clientY - button.getBoundingClientRect().top - radius}px`;
            circle.classList.add('ripple');
            
            const ripple = button.getElementsByClassName('ripple')[0];
            if (ripple) {
                ripple.remove();
            }
            
            button.appendChild(circle);
        };
        
        // 为所有按钮和链接添加波纹效果
        document.querySelectorAll('.nav-links a, .nav-toggle, .read-more, .back-to-blog, .social-links a, .blog-card')
            .forEach(button => {
                button.addEventListener('click', createRipple);
            });
    }

    // 页面转换动画
    initPageTransitions() {
        // 博客页面加载动画
        setTimeout(() => {
            const blogGrid = document.querySelector('.blog-grid');
            if (blogGrid) {
                blogGrid.classList.add('loaded');
            }
        }, 100);
    }

    // 节流函数
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        }
    }

    // 防抖函数
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // 动态加载内容
    async loadContent(url, container) {
        try {
            container.classList.add('loading');
            const response = await fetch(url);
            if (!response.ok) throw new Error('Network response was not ok');
            const html = await response.text();
            container.innerHTML = html;
            container.classList.remove('loading');
            container.classList.add('content-fade-in');
        } catch (error) {
            console.error('Error loading content:', error);
            container.innerHTML = '<div class="error-state"><div class="error-state__icon">⚠️</div><div class="error-state__title">加载失败</div><div class="error-state__message">无法加载内容，请稍后重试。</div></div>';
            container.classList.remove('loading');
        }
    }

    // 显示成功通知
    showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification notification--${type}`;
        notification.textContent = message;
        
        // 添加样式
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '6px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            zIndex: '10000',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease'
        });
        
        document.body.appendChild(notification);
        
        // 动画入场
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 10);
        
        // 自动移除
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
    }

    // 摄影画廊功能
    initPhotoGallery() {
        const photoItems = document.querySelectorAll('.photo-item');
        const photoModal = document.getElementById('photoModal');
        const modalImage = document.querySelector('.photo-modal-image');
        const closeBtn = document.querySelector('.photo-modal-close');
        const prevBtn = document.querySelector('.photo-prev');
        const nextBtn = document.querySelector('.photo-next');

        if (!photoItems.length || !photoModal) return;

        let currentPhotoIndex = 0;
        const photos = Array.from(photoItems).map(item => ({
            src: item.dataset.photo,
            alt: item.querySelector('img').alt
        }));

        // 打开模态框
        const openModal = (index) => {
            currentPhotoIndex = index;
            modalImage.src = photos[index].src;
            modalImage.alt = photos[index].alt;
            photoModal.classList.add('show');
            document.body.style.overflow = 'hidden';
            
            // 更新导航按钮状态
            updateNavButtons();
            
            // 预加载相邻图片
            preloadAdjacentImages(index);
        };

        // 关闭模态框
        const closeModal = () => {
            photoModal.classList.remove('show');
            document.body.style.overflow = '';
        };

        // 显示上一张照片
        const showPrevPhoto = () => {
            if (currentPhotoIndex > 0) {
                openModal(currentPhotoIndex - 1);
            }
        };

        // 显示下一张照片
        const showNextPhoto = () => {
            if (currentPhotoIndex < photos.length - 1) {
                openModal(currentPhotoIndex + 1);
            }
        };

        // 更新导航按钮状态
        const updateNavButtons = () => {
            prevBtn.disabled = currentPhotoIndex === 0;
            nextBtn.disabled = currentPhotoIndex === photos.length - 1;
        };

        // 预加载相邻图片
        const preloadAdjacentImages = (index) => {
            // 预加载前一张
            if (index > 0) {
                const prevImg = new Image();
                prevImg.src = photos[index - 1].src;
            }
            // 预加载后一张
            if (index < photos.length - 1) {
                const nextImg = new Image();
                nextImg.src = photos[index + 1].src;
            }
        };

        // 事件监听器
        photoItems.forEach((item, index) => {
            item.addEventListener('click', () => openModal(index));
        });

        closeBtn.addEventListener('click', closeModal);
        prevBtn.addEventListener('click', showPrevPhoto);
        nextBtn.addEventListener('click', showNextPhoto);

        // 点击模态框背景关闭
        photoModal.addEventListener('click', (e) => {
            if (e.target === photoModal) {
                closeModal();
            }
        });

        // 键盘导航
        document.addEventListener('keydown', (e) => {
            if (!photoModal.classList.contains('show')) return;
            
            switch(e.key) {
                case 'Escape':
                    closeModal();
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    showPrevPhoto();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    showNextPhoto();
                    break;
            }
        });

        // 触摸滑动支持（移动设备）
        let startX = 0;
        let startY = 0;
        
        modalImage.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        });

        modalImage.addEventListener('touchend', (e) => {
            if (!startX || !startY) return;

            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;
            const diffX = startX - endX;
            const diffY = startY - endY;

            // 确保水平滑动距离大于垂直滑动距离
            if (Math.abs(diffX) > Math.abs(diffY)) {
                if (Math.abs(diffX) > 50) { // 最小滑动距离
                    if (diffX > 0) {
                        showNextPhoto(); // 向左滑显示下一张
                    } else {
                        showPrevPhoto(); // 向右滑显示上一张
                    }
                }
            }

            startX = 0;
            startY = 0;
        });
    }
}

// 性能优化相关功能
class PerformanceOptimizer {
    constructor() {
        this.init();
    }

    init() {
        this.lazyLoadImages();
        this.prefetchLinks();
        this.optimizeAnimations();
        this.addProgressBar();
        this.addBackToTop();
        this.addScrollIndicator();
    }

    // 图片懒加载
    lazyLoadImages() {
        const images = document.querySelectorAll('img[loading="lazy"]');
        
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.classList.add('loaded');
                        imageObserver.unobserve(img);
                    }
                });
            });

            images.forEach(img => {
                img.addEventListener('load', () => {
                    img.classList.add('loaded');
                });
                imageObserver.observe(img);
            });
        }
    }

    // 预加载重要链接
    prefetchLinks() {
        const importantLinks = document.querySelectorAll('a[href$=".html"]');
        importantLinks.forEach(link => {
            link.addEventListener('mouseenter', () => {
                const href = link.getAttribute('href');
                if (href && !document.querySelector(`link[href="${href}"]`)) {
                    const prefetchLink = document.createElement('link');
                    prefetchLink.rel = 'prefetch';
                    prefetchLink.href = href;
                    document.head.appendChild(prefetchLink);
                }
            });
        });
    }

    // 优化动画性能
    optimizeAnimations() {
        // 检查用户是否偏好减少动画
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            document.documentElement.style.setProperty('--transition-fast', '0.01ms');
            document.documentElement.style.setProperty('--transition-base', '0.01ms');
            document.documentElement.style.setProperty('--transition-slow', '0.01ms');
        }
    }

    // 添加页面加载进度条
    addProgressBar() {
        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';
        progressBar.innerHTML = '<div class="progress-bar__fill"></div>';
        document.body.appendChild(progressBar);

        const progressFill = progressBar.querySelector('.progress-bar__fill');
        
        window.addEventListener('load', () => {
            progressFill.style.width = '100%';
            setTimeout(() => {
                progressBar.style.opacity = '0';
                setTimeout(() => progressBar.remove(), 300);
            }, 500);
        });
    }

    // 添加返回顶部按钮
    addBackToTop() {
        const backToTop = document.createElement('button');
        backToTop.className = 'back-to-top';
        backToTop.innerHTML = '<i class="fas fa-arrow-up"></i>';
        backToTop.setAttribute('aria-label', '返回顶部');
        document.body.appendChild(backToTop);

        window.addEventListener('scroll', this.throttle(() => {
            if (window.scrollY > 300) {
                backToTop.classList.add('visible');
            } else {
                backToTop.classList.remove('visible');
            }
        }, 100));

        backToTop.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // 添加滚动指示器
    addScrollIndicator() {
        const scrollIndicator = document.createElement('div');
        scrollIndicator.className = 'scroll-indicator';
        scrollIndicator.innerHTML = '<div class="scroll-indicator__progress"></div>';
        document.body.appendChild(scrollIndicator);

        const progress = scrollIndicator.querySelector('.scroll-indicator__progress');
        
        window.addEventListener('scroll', this.throttle(() => {
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const scrollPercent = (scrollTop / docHeight) * 100;
            progress.style.width = `${Math.min(scrollPercent, 100)}%`;
        }, 10));
    }
}

// Service Worker 注册
class ServiceWorkerManager {
    constructor() {
        this.registerServiceWorker();
    }

    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('Service Worker registered successfully:', registration);
                
                // 监听更新
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    if (newWorker) {
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                // 显示更新通知
                                this.showUpdateNotification();
                            }
                        });
                    }
                });
            } catch (error) {
                console.log('Service Worker registration failed:', error);
            }
        }
    }

    showUpdateNotification() {
        // 可以在这里显示一个更新通知
        console.log('New version available! Please refresh the page.');
    }
}

// PWA安装提示
class PWAInstaller {
    constructor() {
        this.deferredPrompt = null;
        this.initInstallPrompt();
    }

    initInstallPrompt() {
        window.addEventListener('beforeinstallprompt', (e) => {
            // 阻止默认的安装提示
            e.preventDefault();
            this.deferredPrompt = e;
            
            // 显示自定义安装按钮（如果需要）
            this.showInstallButton();
        });

        window.addEventListener('appinstalled', () => {
            console.log('PWA was installed');
            this.deferredPrompt = null;
        });
    }

    showInstallButton() {
        // 可以在这里显示安装按钮
        console.log('PWA can be installed');
    }

    async installApp() {
        if (!this.deferredPrompt) {
            return false;
        }

        this.deferredPrompt.prompt();
        const { outcome } = await this.deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);
        
        this.deferredPrompt = null;
        return outcome === 'accepted';
    }
}

// 用户体验增强类
class UXEnhancer {
    constructor() {
        this.init();
    }

    init() {
        this.addPageLoader();
        this.enhanceNavigation();
        this.addKeyboardNavigation();
        this.optimizeTouch();
    }

    // 添加页面加载动画
    addPageLoader() {
        const loader = document.createElement('div');
        loader.className = 'page-loader';
        loader.innerHTML = '<div class="loader"></div>';
        document.body.appendChild(loader);

        window.addEventListener('load', () => {
            setTimeout(() => {
                loader.classList.add('hidden');
                setTimeout(() => loader.remove(), 500);
            }, 500);
        });
    }

    // 增强导航体验
    enhanceNavigation() {
        // 为导航链接添加活跃指示器
        const navLinks = document.querySelectorAll('.nav-links a');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                if (link.getAttribute('href').startsWith('#')) {
                    e.preventDefault();
                    const targetId = link.getAttribute('href').substring(1);
                    const targetElement = document.getElementById(targetId);
                    if (targetElement) {
                        targetElement.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }
                }
            });
        });
    }

    // 添加键盘导航支持
    addKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            // ESC 键关闭移动端菜单
            if (e.key === 'Escape') {
                const navLinks = document.querySelector('.nav-links');
                const navToggle = document.querySelector('.nav-toggle');
                if (navLinks && navLinks.classList.contains('active')) {
                    navLinks.classList.remove('active');
                    navToggle.classList.remove('active');
                }
            }
        });
    }

    // 优化触摸体验
    optimizeTouch() {
        // 为触摸设备添加触摸反馈
        if ('ontouchstart' in window) {
            document.body.classList.add('touch-device');
            
            // 移除悬停效果（触摸设备不需要）
            const style = document.createElement('style');
            style.textContent = `
                .touch-device .card:hover,
                .touch-device .blog-card:hover,
                .touch-device .hobby-card:hover {
                    transform: none;
                }
            `;
            document.head.appendChild(style);
        }
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    new WebsiteCore();
    new PerformanceOptimizer();
    new ServiceWorkerManager();
    new PWAInstaller();
    new UXEnhancer();
});

// 导出模块（如果需要）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { WebsiteCore, PerformanceOptimizer };
}
