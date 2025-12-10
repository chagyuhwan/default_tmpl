export async function onRequestPost(context) {
  const { request, env } = context;
  
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
    const formData = await request.formData();
    const file = formData.get('file');
    
    if (!file) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: '파일이 없습니다.' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 파일명 생성 (타임스탬프 + 원본 파일명)
    const timestamp = Date.now();
    const originalName = file.name;
    const ext = originalName.split('.').pop();
    const fileName = `gallery_${timestamp}.${ext}`;
    
    // R2에 파일 업로드
    const arrayBuffer = await file.arrayBuffer();
    await env.IMAGES_BUCKET.put(fileName, arrayBuffer, {
      httpMetadata: {
        contentType: file.type,
      },
    });
    
    // 이미지 목록에 추가 (KV에 저장)
    const imageList = JSON.parse(await env.AUTH_KV.get('gallery_images') || '[]');
    imageList.push({
      name: fileName,
      originalName: originalName,
      uploadedAt: new Date().toISOString(),
      url: `/api/images/${fileName}`
    });
    await env.AUTH_KV.put('gallery_images', JSON.stringify(imageList));
    
    return new Response(JSON.stringify({ 
      success: true, 
      fileName,
      url: `/api/images/${fileName}`
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      success: false, 
      message: '파일 업로드 중 오류가 발생했습니다.',
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

