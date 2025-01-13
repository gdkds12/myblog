// app/api/comments/route.ts
import { addComment, getComments, deleteComment } from '../../../utils/comments';
import { NextResponse, NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
    try {
        const comments = await getComments();
        return NextResponse.json(comments);
    } catch (err) {
        return NextResponse.json({ message: "댓글을 가져오는 데 실패했습니다." }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        await addComment(body);
        return NextResponse.json({ message: "댓글이 작성되었습니다." });
    } catch (error) {
        return NextResponse.json({ message: "댓글 작성에 실패했습니다." }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const searchParams = new URL(req.url).searchParams;
    const commentId = searchParams.get('id') || "";
    try {
        await deleteComment(commentId);
        return NextResponse.json({ message: "댓글이 삭제되었습니다." });
    } catch (error) {
        return NextResponse.json({ message: "댓글 삭제에 실패했습니다." }, { status: 500 });
    }
}