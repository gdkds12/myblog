// app/api/webhook/route.ts - GitHub 웹훅 수신 및 자동 배포
import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import crypto from 'crypto';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-hub-signature-256');
    const githubEvent = request.headers.get('x-github-event');

    // GitHub 웹훅 시크릿 검증
    const secret = process.env.WEBHOOK_SECRET;
    
    if (!secret) {
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    // 서명 검증
    const expectedSignature = 'sha256=' + crypto
      .createHmac('sha256', secret)
      .update(body, 'utf8')
      .digest('hex');

    console.log('🔍 Signature verification:');
    console.log('- Received:', signature);
    console.log('- Expected:', expectedSignature);

    if (signature !== expectedSignature) {
      console.log('❌ Signature mismatch');
      return NextResponse.json({ 
        error: 'Invalid signature',
        debug: {
          received: signature,
          expected: expectedSignature,
          bodyLength: body.length
        }
      }, { status: 401 });
    }

    console.log('✅ Signature verified successfully');

    const payload = JSON.parse(body);

    console.log('📦 Received payload:', JSON.stringify(payload, null, 2));

    // push 이벤트이고 main 브랜치인 경우만 처리
    if (githubEvent === 'push' && payload.ref === 'refs/heads/main') {
      console.log('🔄 GitHub push detected, starting deployment...');

      // content/posts 폴더의 변경사항이 있는지 확인
      // payload.commits가 배열인지 먼저 확인
      const commits = Array.isArray(payload.commits) ? payload.commits : [];
      console.log('📝 Found commits:', commits.length);

      const hasContentChanges = commits.some((commit: any) => {
        const added = Array.isArray(commit.added) ? commit.added : [];
        const modified = Array.isArray(commit.modified) ? commit.modified : [];
        const removed = Array.isArray(commit.removed) ? commit.removed : [];
        
        return [...added, ...modified, ...removed].some((file: string) => 
          file.startsWith('content/posts/')
        );
      });

      if (hasContentChanges) {
        console.log('📝 Content changes detected, updating...');
        
        try {
          // 배포 스크립트 실행 (Docker 컨테이너 내부 경로)
          console.log('🚀 Executing deployment script...');
          const { stdout, stderr } = await execAsync('/app/deploy.sh');
          
          console.log('✅ Deployment script stdout:', stdout);
          if (stderr) {
            console.error('⚠️ Deployment script stderr:', stderr);
          }

          // 캐시 무효화는 deploy.sh가 끝난 후 별도로 호출될 수 있음
          // 또는 스크립트 내에서 처리 가능
          console.log('✅ Deployment initiated successfully via script.');

          return NextResponse.json({
            success: true,
            message: 'Deployment script executed successfully',
            timestamp: new Date().toISOString(),
            details: stdout
          });

        } catch (error) {
          console.error('❌ Deployment failed:', error);
          return NextResponse.json({
            success: false,
            error: 'Deployment failed',
            details: error instanceof Error ? error.message : 'Unknown error'
          }, { status: 500 });
        }
      } else {
        console.log('ℹ️ No content changes, skipping deployment');
        return NextResponse.json({
          success: true,
          message: 'No content changes detected',
          skipped: true
        });
      }
    }

    return NextResponse.json({ success: true, message: 'Webhook received' });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({
      error: 'Webhook processing failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
