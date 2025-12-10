let selectedFiles = [];

// 페이지 로드 시 인증 확인 및 이미지 목록 로드
document.addEventListener('DOMContentLoaded', async () => {
    // 인증 확인 및 사용자 정보 로드
    const userInfo = await checkAuth();
    if (!userInfo) {
        window.location.href = '/admin/login.html';
        return;
    }
    
    // 사용자 정보 표시
    displayUserInfo(userInfo);
    
    // 계정 정보 로드
    loadAccountInfo();
    
    // 회사 정보 로드
    loadCompanyInfo();
    
    // 이미지 목록 로드
    loadImages();
    
    // 업로드 영역 이벤트
    setupUploadArea();
});

// 인증 확인 및 사용자 정보 가져오기
async function checkAuth() {
    try {
        const response = await fetch('/api/list');
        if (!response.ok) {
            return null;
        }
        const data = await response.json();
        return data.user || null;
    } catch (error) {
        return null;
    }
}

// 사용자 정보 표시
function displayUserInfo(userInfo) {
    const userInfoEl = document.getElementById('userInfo');
    if (userInfo && userInfo.username) {
        const firstLetter = userInfo.username.charAt(0).toUpperCase();
        userInfoEl.innerHTML = `
            <div class="user-icon">${firstLetter}</div>
            <span class="user-name">${userInfo.username}님</span>
        `;
    } else {
        userInfoEl.innerHTML = '<span class="user-name">사용자 정보 없음</span>';
    }
}

// 업로드 영역 설정
function setupUploadArea() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const uploadBtn = document.getElementById('uploadBtn');
    
    // 클릭 이벤트
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });
    
    // 파일 선택 이벤트
    fileInput.addEventListener('change', (e) => {
        selectedFiles = Array.from(e.target.files);
        if (selectedFiles.length > 0) {
            uploadBtn.classList.add('show');
        }
    });
    
    // 드래그 앤 드롭
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        
        selectedFiles = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
        if (selectedFiles.length > 0) {
            uploadBtn.classList.add('show');
        }
    });
}

// 이미지 최적화 함수
async function optimizeImage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const img = new Image();
            
            img.onload = () => {
                // 최적화 설정
                const maxWidth = 1920; // 최대 너비
                const maxHeight = 1920; // 최대 높이
                const quality = 0.85; // JPEG 품질 (0.85 = 85%)
                
                // 캔버스 생성
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                
                // 비율 유지하면서 리사이즈
                if (width > maxWidth || height > maxHeight) {
                    if (width > height) {
                        if (width > maxWidth) {
                            height = (height * maxWidth) / width;
                            width = maxWidth;
                        }
                    } else {
                        if (height > maxHeight) {
                            width = (width * maxHeight) / height;
                            height = maxHeight;
                        }
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                
                // 이미지 그리기
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                // JPEG로 변환 (품질 최적화)
                canvas.toBlob((blob) => {
                    if (!blob) {
                        reject(new Error('이미지 최적화 실패'));
                        return;
                    }
                    
                    // 원본 파일명 유지 (확장자는 jpg로 변경)
                    const fileName = file.name.replace(/\.[^/.]+$/, '') + '.jpg';
                    const optimizedFile = new File([blob], fileName, {
                        type: 'image/jpeg',
                        lastModified: Date.now()
                    });
                    
                    resolve(optimizedFile);
                }, 'image/jpeg', quality);
            };
            
            img.onerror = () => {
                reject(new Error('이미지 로드 실패'));
            };
            
            img.src = e.target.result;
        };
        
        reader.onerror = () => {
            reject(new Error('파일 읽기 실패'));
        };
        
        reader.readAsDataURL(file);
    });
}

// 파일 업로드
async function uploadFiles() {
    if (selectedFiles.length === 0) {
        showMessage('업로드할 파일을 선택해주세요.', 'error');
        return;
    }
    
    const uploadBtn = document.getElementById('uploadBtn');
    uploadBtn.disabled = true;
    uploadBtn.textContent = '최적화 및 업로드 중...';
    
    try {
        let successCount = 0;
        let failCount = 0;
        
        for (const file of selectedFiles) {
            try {
                // 이미지 최적화
                const optimizedFile = await optimizeImage(file);
                
                // 원본 파일 크기와 최적화된 파일 크기 비교
                const originalSize = (file.size / 1024 / 1024).toFixed(2);
                const optimizedSize = (optimizedFile.size / 1024 / 1024).toFixed(2);
                const reduction = ((1 - optimizedFile.size / file.size) * 100).toFixed(1);
                
                console.log(`${file.name}: ${originalSize}MB → ${optimizedSize}MB (${reduction}% 감소)`);
                
                // 최적화된 파일 업로드
                const formData = new FormData();
                formData.append('file', optimizedFile);
                
                const response = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData,
                });
                
                const data = await response.json();
                
                if (data.success) {
                    successCount++;
                } else {
                    failCount++;
                    showMessage(`업로드 실패: ${data.message}`, 'error');
                }
            } catch (error) {
                failCount++;
                console.error('이미지 최적화/업로드 오류:', error);
                showMessage(`${file.name} 처리 실패: ${error.message}`, 'error');
            }
        }
        
        if (successCount > 0) {
            showMessage(`${successCount}개 이미지가 성공적으로 업로드되었습니다.`, 'success');
        }
        
        selectedFiles = [];
        document.getElementById('fileInput').value = '';
        uploadBtn.classList.remove('show');
        uploadBtn.disabled = false;
        uploadBtn.textContent = '업로드';
        
        // 이미지 목록 새로고침
        loadImages();
    } catch (error) {
        showMessage('업로드 중 오류가 발생했습니다.', 'error');
    } finally {
        uploadBtn.disabled = false;
        uploadBtn.textContent = '업로드';
    }
}

// 이미지 목록 로드
async function loadImages() {
    const container = document.getElementById('imagesContainer');
    container.innerHTML = '<div class="loading">로딩 중...</div>';
    
    try {
        const response = await fetch('/api/list');
        const data = await response.json();
        
        if (!data.success) {
            container.innerHTML = '<div class="loading">이미지를 불러올 수 없습니다.</div>';
            return;
        }
        
        if (data.images.length === 0) {
            container.innerHTML = '<div class="loading">업로드된 이미지가 없습니다.</div>';
            return;
        }
        
        container.innerHTML = '<div class="images-grid"></div>';
        const grid = container.querySelector('.images-grid');
        
        data.images.forEach(image => {
            const item = document.createElement('div');
            item.className = 'image-item';
            item.innerHTML = `
                <button class="delete-btn" onclick="deleteImage('${image.name}')">×</button>
                <img src="/api/images/${image.name}" alt="${image.originalName}" onerror="this.src='/images/placeholder.jpg'">
                <div class="image-info">
                    <div class="image-name">${image.originalName}</div>
                    <div class="image-date">${new Date(image.uploadedAt).toLocaleDateString('ko-KR')}</div>
                </div>
            `;
            grid.appendChild(item);
        });
    } catch (error) {
        container.innerHTML = '<div class="loading">이미지를 불러오는 중 오류가 발생했습니다.</div>';
    }
}

// 이미지 삭제
async function deleteImage(fileName) {
    if (!confirm('이 이미지를 삭제하시겠습니까?')) {
        return;
    }
    
    try {
        const response = await fetch('/api/delete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ fileName }),
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMessage('이미지가 삭제되었습니다.', 'success');
            loadImages();
        } else {
            showMessage(`삭제 실패: ${data.message}`, 'error');
        }
    } catch (error) {
        showMessage('삭제 중 오류가 발생했습니다.', 'error');
    }
}

// 메시지 표시
function showMessage(message, type) {
    const messageEl = document.getElementById('message');
    messageEl.textContent = message;
    messageEl.className = `message ${type} show`;
    
    setTimeout(() => {
        messageEl.classList.remove('show');
    }, 3000);
}

// 계정 정보 로드
async function loadAccountInfo() {
    try {
        const response = await fetch('/api/account');
        const data = await response.json();
        
        if (data.success && data.data) {
            document.getElementById('currentUsername').value = data.data.username || '';
            // 폼 초기화
            document.getElementById('newUsername').value = '';
            document.getElementById('currentPassword').value = '';
            document.getElementById('newPassword').value = '';
            document.getElementById('newPasswordConfirm').value = '';
        }
    } catch (error) {
        console.error('계정 정보 로드 실패:', error);
    }
}

// 계정 정보 저장
async function saveAccountInfo() {
    const newUsername = document.getElementById('newUsername').value.trim();
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const newPasswordConfirm = document.getElementById('newPasswordConfirm').value;
    
    // 유효성 검사
    if (!currentPassword) {
        showMessage('현재 비밀번호를 입력해주세요.', 'error');
        return;
    }
    
    if (newPassword && newPassword !== newPasswordConfirm) {
        showMessage('새 비밀번호가 일치하지 않습니다.', 'error');
        return;
    }
    
    if (newPassword && newPassword.length < 4) {
        showMessage('비밀번호는 최소 4자 이상이어야 합니다.', 'error');
        return;
    }
    
    const accountData = {
        currentPassword: currentPassword,
        newPassword: newPassword || undefined,
        newUsername: newUsername || undefined
    };
    
    try {
        const response = await fetch('/api/account', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(accountData),
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMessage(data.message || '계정 정보가 변경되었습니다.', 'success');
            
            // 아이디가 변경된 경우 재로그인 필요
            if (data.requireRelogin) {
                setTimeout(() => {
                    logout();
                }, 2000);
            } else {
                // 폼 초기화
                loadAccountInfo();
            }
        } else {
            showMessage(`변경 실패: ${data.message}`, 'error');
        }
    } catch (error) {
        showMessage('계정 정보 변경 중 오류가 발생했습니다.', 'error');
    }
}

// 회사 정보 로드
async function loadCompanyInfo() {
    try {
        const response = await fetch('/api/company');
        const data = await response.json();
        
        if (data.success && data.data) {
            document.getElementById('companyName').value = data.data.companyName || '';
            document.getElementById('representative').value = data.data.representative || '';
            document.getElementById('email').value = data.data.email || '';
            document.getElementById('phone').value = data.data.phone || '';
            document.getElementById('mobile').value = data.data.mobile || '';
            document.getElementById('address').value = data.data.address || '';
        }
    } catch (error) {
        console.error('회사 정보 로드 실패:', error);
    }
}

// 회사 정보 저장
async function saveCompanyInfo() {
    const companyData = {
        companyName: document.getElementById('companyName').value,
        representative: document.getElementById('representative').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        mobile: document.getElementById('mobile').value,
        address: document.getElementById('address').value
    };
    
    try {
        const response = await fetch('/api/company', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(companyData),
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMessage('회사 정보가 수정되었습니다.', 'success');
        } else {
            showMessage(`수정 실패: ${data.message}`, 'error');
        }
    } catch (error) {
        showMessage('회사 정보 수정 중 오류가 발생했습니다.', 'error');
    }
}

// 로그아웃
function logout() {
    // 쿠키 삭제
    document.cookie = 'admin_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    window.location.href = '/admin/login.html';
}

