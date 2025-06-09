// 懒加载指令
export const lazyLoad = {
  mounted(el, binding) {
    const { value: src, modifiers } = binding;
    
    // 设置默认选项
    const options = {
      rootMargin: modifiers.eager ? '200px' : '50px',
      threshold: modifiers.immediate ? 1.0 : 0.1
    };

    // 创建观察器
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // 如果是图片元素
          if (el.tagName === 'IMG') {
            el.src = src;
            el.classList.add('lazy-loaded');
          }
          // 如果是背景图片
          else if (modifiers.background) {
            el.style.backgroundImage = `url(${src})`;
            el.classList.add('lazy-loaded');
          }
          
          // 停止观察
          observer.unobserve(el);
        }
      });
    }, options);

    // 开始观察
    observer.observe(el);
    
    // 保存观察器引用以便清理
    el._lazyObserver = observer;
  },
  
  beforeUnmount(el) {
    if (el._lazyObserver) {
      el._lazyObserver.disconnect();
      delete el._lazyObserver;
    }
  }
};

// 组件懒加载混入
export const lazyComponentMixin = {
  data() {
    return {
      isVisible: false,
      observer: null
    };
  },
  
  mounted() {
    this.createObserver();
  },
  
  beforeUnmount() {
    if (this.observer) {
      this.observer.disconnect();
    }
  },
  
  methods: {
    createObserver() {
      if ('IntersectionObserver' in window) {
        this.observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                this.isVisible = true;
                this.$emit('visible');
                this.observer.unobserve(entry.target);
              }
            });
          },
          {
            rootMargin: '100px',
            threshold: 0.1
          }
        );

        this.observer.observe(this.$el);
      } else {
        // 兼容性处理
        this.isVisible = true;
      }
    }
  }
};

// 防抖函数
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// 节流函数
export const throttle = (func, limit) => {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// 预加载资源
export const preloadResource = (url, type = 'image') => {
  return new Promise((resolve, reject) => {
    if (type === 'image') {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    } else if (type === 'script') {
      const script = document.createElement('script');
      script.onload = resolve;
      script.onerror = reject;
      script.src = url;
      document.head.appendChild(script);
    } else if (type === 'style') {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.onload = resolve;
      link.onerror = reject;
      link.href = url;
      document.head.appendChild(link);
    }
  });
};

// 批量预加载图片
export const preloadImages = (urls) => {
  return Promise.all(urls.map(url => preloadResource(url, 'image')));
};

// 检查元素是否在视口中
export const isInViewport = (element) => {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
};

// 懒加载管理器类
export class LazyLoadManager {
  constructor(options = {}) {
    this.options = {
      rootMargin: '50px',
      threshold: 0.1,
      enablePreload: true,
      preloadCount: 3,
      ...options
    };
    
    this.observer = null;
    this.elements = new Map();
    this.preloadQueue = [];
    
    this.init();
  }
  
  init() {
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        this.handleIntersection.bind(this),
        this.options
      );
    }
  }
  
  handleIntersection(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const element = entry.target;
        const config = this.elements.get(element);
        
        if (config && config.callback) {
          config.callback(element);
        }
        
        this.unobserve(element);
        
        // 预加载下一批内容
        if (this.options.enablePreload) {
          this.preloadNext();
        }
      }
    });
  }
  
  observe(element, callback) {
    if (this.observer) {
      this.elements.set(element, { callback });
      this.observer.observe(element);
    } else {
      // 兼容处理
      callback(element);
    }
  }
  
  unobserve(element) {
    if (this.observer) {
      this.observer.unobserve(element);
    }
    this.elements.delete(element);
  }
  
  preloadNext() {
    const toPreload = this.preloadQueue.splice(0, this.options.preloadCount);
    toPreload.forEach(item => {
      if (item.type === 'image') {
        preloadResource(item.url, 'image');
      }
    });
  }
  
  addToPreloadQueue(url, type = 'image') {
    this.preloadQueue.push({ url, type });
  }
  
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
    this.elements.clear();
    this.preloadQueue = [];
  }
}

export default {
  lazyLoad,
  lazyComponentMixin,
  debounce,
  throttle,
  preloadResource,
  preloadImages,
  isInViewport,
  LazyLoadManager
};
