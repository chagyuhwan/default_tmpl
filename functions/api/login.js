export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    const { username, password } = await request.json();
    
    // KV에서 저장된 계정 정보 가져오기
    const accountData = await env.AUTH_KV.get('admin_account');
    const defaultUsername = env.ADMIN_USERNAME || 'admin';
    const defaultPassword = env.ADMIN_PASSWORD || 'admin123';
    
    let adminUsername, adminPassword;
    if (accountData) {
      const account = JSON.parse(accountData);
      adminUsername = account.username || defaultUsername;
      adminPassword = account.password || defaultPassword;
    } else {
      adminUsername = defaultUsername;
      adminPassword = defaultPassword;
    }
    
    // 인증 확인
    if (username === adminUsername && password === adminPassword) {
      // 세션 토큰 생성 (간단한 JWT 대신 간단한 토큰 사용)
      const token = btoa(`${username}:${Date.now()}`);
      
      // KV에 토큰 저장 (1시간 유효)
      await env.AUTH_KV.put(`token:${token}`, username, { expirationTtl: 3600 });
      
      return new Response(JSON.stringify({ 
        success: true, 
        token 
      }), {
        headers: { 
          'Content-Type': 'application/json',
          'Set-Cookie': `admin_token=${token}; HttpOnly; Secure; SameSite=Strict; Max-Age=3600; Path=/`
        }
      });
    } else {
      return new Response(JSON.stringify({ 
        success: false, 
        message: '아이디 또는 비밀번호가 올바르지 않습니다.' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({ 
      success: false, 
      message: '로그인 처리 중 오류가 발생했습니다.' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

