// utils/comments.ts
import { promises as fs } from 'fs';

const commentsFilePath = './data/comments.json';

interface Comment {
    id: string;
    nickname: string;
    content: string;
    createdAt: string;
    ipAddress: string;
}

// 댓글 추가
export async function addComment(comment: Comment): Promise<void> {
    try {
        const data = await fs.readFile(commentsFilePath, 'utf-8');
        const json = JSON.parse(data);
        json.comments.push(comment);
        await fs.writeFile(commentsFilePath, JSON.stringify(json, null, 2), 'utf-8');
    } catch (error) {
        console.error('Error adding comment:', error);
        await fs.writeFile(commentsFilePath, JSON.stringify({ comments: [comment] }, null, 2), 'utf-8');
    }
}

// 댓글 가져오기
export async function getComments(): Promise<Comment[]> {
    try {
        const data = await fs.readFile(commentsFilePath, 'utf-8');
        return JSON.parse(data).comments || [];
    } catch (error) {
        console.error('Error reading comments:', error);
        return [];
    }
}

// 댓글 삭제
export async function deleteComment(commentId: string): Promise<void> {
    try {
        const data = await fs.readFile(commentsFilePath, 'utf-8');
        const json = JSON.parse(data);
        const updatedComments = json.comments.filter((comment: Comment) => comment.id !== commentId);
        await fs.writeFile(commentsFilePath, JSON.stringify({ comments: updatedComments }, null, 2), 'utf-8');
    } catch (error) {
        console.error('Error deleting comment:', error);
    }
}