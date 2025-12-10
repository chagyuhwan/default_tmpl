// 회사 정보 조회 및 수정 API
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

// GET: 회사 정보 조회
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
    // KV에서 회사 정보 가져오기
    const companyData = await env.AUTH_KV.get('company_info');
    
    // 기본값 설정
    const defaultData = {
      companyName: '새빛 인테리어',
      representative: '윤인호',
      email: 'erum1022@naver.com',
      phone: '02-2602-0434',
      mobile: '010-4477-0472',
      address: '서울시 구로구 개봉동 341-4 201호',
      kakaoMessage: ''
    };
    
    const companyInfo = companyData ? JSON.parse(companyData) : defaultData;
    
    return new Response(JSON.stringify({ 
      success: true, 
      data: companyInfo 
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      success: false, 
      message: '회사 정보를 가져오는 중 오류가 발생했습니다.' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// POST: 회사 정보 수정
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
    
    // 회사 정보 저장
    await env.AUTH_KV.put('company_info', JSON.stringify(body));
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: '회사 정보가 수정되었습니다.' 
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      success: false, 
      message: '회사 정보 수정 중 오류가 발생했습니다.' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}






