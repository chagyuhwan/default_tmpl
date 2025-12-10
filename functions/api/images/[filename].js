// R2에서 이미지 제공
export async function onRequestGet(context) {
  const { params, env, request } = context;
  const fileName = params.filename;
  
  try {
    const object = await env.IMAGES_BUCKET.get(fileName);
    
    if (!object) {
      return new Response('File not found', { status: 404 });
    }
    
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);
    headers.set('Cache-Control', 'public, max-age=31536000');
    headers.set('Access-Control-Allow-Origin', '*');
    
    // Content-Type이 없으면 기본값 설정
    if (!headers.get('Content-Type')) {
      const ext = fileName.split('.').pop().toLowerCase();
      const contentTypeMap = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp'
      };
      headers.set('Content-Type', contentTypeMap[ext] || 'application/octet-stream');
    }
    
    return new Response(object.body, { headers });
  } catch (error) {
    console.error('Error fetching image:', error);
    return new Response('Error fetching file', { status: 500 });
  }
}






