// 캐러셀 자동 슬라이드
document.addEventListener('DOMContentLoaded', function() {
    const carousel = document.querySelector('.carousel-container');
    if (carousel) {
        const slides = carousel.querySelectorAll('.carousel-slide');
        let currentSlide = 0;

        function showSlide(index) {
            slides.forEach((slide, i) => {
                slide.classList.remove('active');
                if (i === index) {
                    slide.classList.add('active');
                }
            });
        }

        function nextSlide() {
            currentSlide = (currentSlide + 1) % slides.length;
            showSlide(currentSlide);
        }

        // 자동 슬라이드 (5초마다)
        if (slides.length > 1) {
            setInterval(nextSlide, 5000);
        }
    }

    // 서브메뉴 토글 (모바일)
    const hasSubmenu = document.querySelectorAll('.has-submenu');
    hasSubmenu.forEach(item => {
        const link = item.querySelector('a');
        link.addEventListener('click', function(e) {
            if (window.innerWidth <= 768) {
                e.preventDefault();
                const submenu = item.querySelector('.submenu');
                if (submenu.style.display === 'block') {
                    submenu.style.display = 'none';
                } else {
                    submenu.style.display = 'block';
                }
            }
        });
    });

    // 스크롤 애니메이션
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
                // 애니메이션이 이미 실행되도록 트리거
                if (entry.target.classList.contains('animate-on-scroll')) {
                    // 애니메이션 클래스가 있으면 애니메이션 실행
                    if (entry.target.classList.contains('fade-in-up')) {
                        entry.target.style.animation = 'fadeInUp 0.8s ease-out forwards';
                    } else if (entry.target.classList.contains('slide-in-left')) {
                        entry.target.style.animation = 'slideInLeft 0.8s ease-out forwards';
                    } else if (entry.target.classList.contains('slide-in-right')) {
                        entry.target.style.animation = 'slideInRight 0.8s ease-out forwards';
                    } else if (entry.target.classList.contains('scale-in')) {
                        entry.target.style.animation = 'scaleIn 0.6s ease-out forwards';
                    } else {
                        // 기본 스크롤 애니메이션
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                    }
                    observer.unobserve(entry.target); // 한 번만 실행
                }
            }
        });
    }, observerOptions);

    // 스크롤 애니메이션 대상 요소들
    const animateElements = document.querySelectorAll('.animate-on-scroll');
    animateElements.forEach(el => {
        observer.observe(el);
    });

    // 이미지 갤러리 순차 애니메이션
    const galleryObserver = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const galleryItems = entry.target.querySelectorAll('.gallery-image-item');
                galleryItems.forEach((item, index) => {
                    setTimeout(() => {
                        item.classList.add('animated');
                    }, index * 150); // 각 이미지를 0.15초 간격으로 순차적으로 나타나게
                });
                galleryObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.2,
        rootMargin: '0px 0px -100px 0px'
    });

    const gallerySection = document.querySelector('.image-gallery-section');
    if (gallerySection) {
        galleryObserver.observe(gallerySection);
    }

    // 헤더 스크롤 효과 (맨 위에 있을 때 배경 없이, 스크롤하면 배경 나타남)
    const header = document.querySelector('header');
    if (header) {
        // 초기 상태: scrolled 클래스 제거 (배경 투명)
        header.classList.remove('scrolled');
        
        // 히어로 섹션 높이 확인
        const heroSection = document.querySelector('.hero-image-section');
        const heroHeight = heroSection ? heroSection.offsetHeight : 400;
        
        // 초기 스크롤 위치 확인
        function updateHeaderBackground() {
            const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
            // 히어로 섹션을 벗어나면 배경 표시
            if (currentScroll > heroHeight - 100) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        }

        // 페이지 로드 시 초기 상태 설정
        updateHeaderBackground();

        // 스크롤 이벤트
        window.addEventListener('scroll', function() {
            updateHeaderBackground();
        }, { passive: true });
        
        // 리사이즈 이벤트 (히어로 섹션 높이 변경 대응)
        window.addEventListener('resize', function() {
            updateHeaderBackground();
        }, { passive: true });
    }

    // 페이지 로드 시 페이드인 애니메이션
    const introSection = document.querySelector('.intro-section');
    if (introSection) {
        introSection.classList.add('fade-in');
    }

    // 스무스 스크롤 (내부 링크 클릭 시)
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // 숫자 카운트업 애니메이션
    function animateCounter(element, shouldRepeat = false) {
        const targetValue = parseInt(element.getAttribute('data-target'));
        const countElement = element.querySelector('.count');
        
        if (!countElement || isNaN(targetValue)) return;
        
        // 초기값을 확실히 0으로 설정
        countElement.textContent = '0';
        
        const duration = 2000; // 2초
        const steps = 100; // 더 부드러운 애니메이션을 위해 스텝 증가
        const increment = targetValue / steps;
        let current = 0;
        let step = 0;
        
        const timer = setInterval(() => {
            step++;
            current += increment;
            
            if (current >= targetValue) {
                current = targetValue;
                clearInterval(timer);
                
                // 3초 후 다시 카운트업 시작 (반복 옵션이 켜져 있을 때)
                if (shouldRepeat) {
                    setTimeout(() => {
                        animateCounter(element, true);
                    }, 3000); // 3초 대기
                }
            }
            
            // 숫자 포맷팅
            const displayValue = Math.floor(current);
            
            // 천 단위 구분자 추가 (1000 이상인 경우)
            if (targetValue >= 1000) {
                countElement.textContent = displayValue.toLocaleString('ko-KR');
            } else {
                countElement.textContent = displayValue;
            }
        }, duration / steps);
    }

    // 통계 섹션 스크롤 애니메이션
    const statisticsObserver = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const statItem = entry.target;
                const statValue = statItem.querySelector('.stat-value');
                
                if (statValue && !statValue.classList.contains('counted')) {
                    statValue.classList.add('counted');
                    
                    // 약간의 지연 후 카운트업 시작 (시각적 효과)
                    // true를 전달하여 5초마다 반복되도록 설정
                    setTimeout(() => {
                        animateCounter(statValue, true);
                    }, 300);
                }
                
                // 반복 애니메이션이므로 unobserve하지 않음
            }
        });
    }, {
        threshold: 0.3, // 30% 보이면 시작
        rootMargin: '0px 0px -100px 0px' // 100px 전에 시작
    });

    // 통계 항목들 관찰 시작
    const statItems = document.querySelectorAll('.statistics-section .stat-item');
    statItems.forEach(item => {
        statisticsObserver.observe(item);
        // 스크롤 애니메이션도 적용
        observer.observe(item);
    });
});

