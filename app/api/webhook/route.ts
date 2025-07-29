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
          // 1. Git pull with authentication (GitHub Token 사용)
          console.log('📥 Pulling latest changes...');
          const gitUrl = `https://${process.env.GITHUB_TOKEN}@github.com/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}.git`;
          
          await execAsync('cd /home/ubuntu/myblog && git fetch origin main');
          await execAsync('cd /home/ubuntu/myblog && git reset --hard origin/main');
          
          // 2. Docker 컨테이너 재빌드 및 재시작
          console.log('🐳 Rebuilding Docker containers...');
          await execAsync('cd /home/ubuntu/myblog && docker-compose down');
          await execAsync('cd /home/ubuntu/myblog && docker-compose up --build -d');
          
          // 3. 잠시 대기 (컨테이너 시작 대기)
          await new Promise(resolve => setTimeout(resolve, 10000));
          
          // 4. 캐시 무효화
          console.log('🗑️ Clearing cache...');
          const revalidateResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/revalidate?secret=${process.env.REVALIDATE_SECRET}`, {
            method: 'POST',
          });
          
          if (revalidateResponse.ok) {
            console.log('✅ Cache invalidated successfully');
          } else {
            console.log('⚠️ Cache invalidation failed, but deployment succeeded');
          }

          return NextResponse.json({
            success: true,
            message: 'Deployment completed successfully',
            timestamp: new Date().toISOString(),
            changes: payload.commits.length
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
