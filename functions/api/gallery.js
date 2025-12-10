// 공개 갤러리 이미지 목록 API (인증 불필요)
export async function onRequestGet(context) {
  const { env } = context;
  
  try {
    // KV에서 이미지 목록 가져오기
    const imageList = JSON.parse(await env.AUTH_KV.get('gallery_images') || '[]');
    
    return new Response(JSON.stringify({ 
      success: true, 
      images: imageList 
    }), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      success: false, 
      message: '이미지 목록을 가져오는 중 오류가 발생했습니다.' 
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}






