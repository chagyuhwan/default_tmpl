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
    const { fileName } = await request.json();
    
    if (!fileName) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: '파일명이 필요합니다.' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // R2에서 파일 삭제
    await env.IMAGES_BUCKET.delete(fileName);
    
    // KV에서 이미지 목록에서 제거
    const imageList = JSON.parse(await env.AUTH_KV.get('gallery_images') || '[]');
    const filteredList = imageList.filter(img => img.name !== fileName);
    await env.AUTH_KV.put('gallery_images', JSON.stringify(filteredList));
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: '파일이 삭제되었습니다.' 
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      success: false, 
      message: '파일 삭제 중 오류가 발생했습니다.' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

