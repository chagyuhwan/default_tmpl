// 계정 정보 변경 API (비밀번호, 아이디)
async function verifyAuth(request, env) {
  const cookies = request.headers.get('Cookie') || '';
  const tokenMatch = cookies.match(/admin_token=([^;]+)/);
  const token = tokenMatch ? tokenMatch[1] : null;
  
  if (!token) {
    return { authenticated: false };
  }
  
  const username = await env.AUTH_KV.get(`token:${token}`);
  
  if (!username) {
    return { authenticated: false };
  }
  
  return { authenticated: true, username, token };
}

// GET: 계정 정보 조회
export async function onRequestGet(context) {
  const { request, env } = context;
  
  // 인증 확인
  const auth = await verifyAuth(request, env);
  if (!auth.authenticated) {
    return new Response(JSON.stringify({ 
      success: false, 
      message: '인증이 필요합니다.' 
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  try {
    // KV에서 계정 정보 가져오기
    const accountData = await env.AUTH_KV.get('admin_account');
    
    // 기본값 설정 (환경 변수 또는 기본값)
    const defaultUsername = env.ADMIN_USERNAME || 'admin';
    const defaultPassword = env.ADMIN_PASSWORD || 'admin123';
    
    let accountInfo;
    if (accountData) {
      accountInfo = JSON.parse(accountData);
    } else {
      accountInfo = {
        username: defaultUsername,
        // 비밀번호는 반환하지 않음 (보안)
      };
    }
    
    return new Response(JSON.stringify({ 
      success: true, 
      data: {
        username: accountInfo.username || defaultUsername
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      success: false, 
      message: '계정 정보를 가져오는 중 오류가 발생했습니다.' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// POST: 계정 정보 변경 (비밀번호, 아이디)
export async function onRequestPost(context) {
  const { request, env } = context;
  
  // 인증 확인
  const auth = await verifyAuth(request, env);
  if (!auth.authenticated) {
    return new Response(JSON.stringify({ 
      success: false, 
      message: '인증이 필요합니다.' 
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  try {
    const body = await request.json();
    const { currentPassword, newPassword, newUsername } = body;
    
    // 현재 비밀번호 확인
    const accountData = await env.AUTH_KV.get('admin_account');
    const defaultUsername = env.ADMIN_USERNAME || 'admin';
    const defaultPassword = env.ADMIN_PASSWORD || 'admin123';
    
    let currentAccount;
    if (accountData) {
      currentAccount = JSON.parse(accountData);
    } else {
      currentAccount = {
        username: defaultUsername,
        password: defaultPassword
      };
    }
    
    // 현재 비밀번호 확인
    if (currentPassword && currentAccount.password !== currentPassword) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: '현재 비밀번호가 일치하지 않습니다.' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 계정 정보 업데이트
    const updatedAccount = {
      username: newUsername || currentAccount.username || defaultUsername,
      password: newPassword || currentAccount.password || defaultPassword
    };
    
    // KV에 저장
    await env.AUTH_KV.put('admin_account', JSON.stringify(updatedAccount));
    
    // 아이디가 변경된 경우, 기존 토큰을 무효화하고 새 토큰 발급
    if (newUsername && newUsername !== currentAccount.username) {
      // 기존 토큰 삭제
      await env.AUTH_KV.delete(`token:${auth.token}`);
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: '계정 정보가 변경되었습니다. 다시 로그인해주세요.',
        requireRelogin: true
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: '계정 정보가 변경되었습니다.' 
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      success: false, 
      message: '계정 정보 변경 중 오류가 발생했습니다.' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}






