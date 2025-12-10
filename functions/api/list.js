// 인증 확인 함수
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
  
  return { authenticated: true, username };
}

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
    // KV에서 이미지 목록 가져오기
    const imageList = JSON.parse(await env.AUTH_KV.get('gallery_images') || '[]');
    
    return new Response(JSON.stringify({ 
      success: true, 
      images: imageList,
      user: {
        username: auth.username
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      success: false, 
      message: '이미지 목록을 가져오는 중 오류가 발생했습니다.' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

