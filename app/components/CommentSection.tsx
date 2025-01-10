"use client";

import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import CryptoJS from 'crypto-js';

interface Comment {
    id: string;
    nickname: string;
    content: string;
    passwordHash: string;
    createdAt: string;
}

const CommentSection: React.FC<{ slug: string }> = ({ slug }) => {
    const [nickname, setNickname] = useState('');
    const [commentText, setCommentText] = useState('');
    const [password, setPassword] = useState('');
    const [comments, setComments] = useState<Comment[]>([]);
    const [deletePassword, setDeletePassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [showDeletePasswordInput, setShowDeletePasswordInput] = useState<string | null>(null);
    const MASTER_PASSWORD = "9999";


    useEffect(() => {
        const storedComments = localStorage.getItem(`comments-${slug}`);
        if (storedComments) {
            setComments(JSON.parse(storedComments));
        }
    }, [slug]);

    useEffect(() => {
        if (comments.length > 0) {
            localStorage.setItem(`comments-${slug}`, JSON.stringify(comments));
        }
    }, [comments, slug]);


    const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNickname(e.target.value);
    };

    const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setCommentText(e.target.value);
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPassword(e.target.value);
    };
    const handleCancelDelete = (commentId: string) => {
        setShowDeletePasswordInput(null);
    };


    const handleDeletePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDeletePassword(e.target.value);
    };
    const handleShowDeletePassword = (commentId: string) => {
        setShowDeletePasswordInput(commentId);
    };

    const addComment = () => {
        if (!nickname.trim()) {
            setError('닉네임을 입력해주세요.');
            return;
        }

        if (!commentText.trim()) {
            setError('댓글 내용을 입력해주세요.');
            return;
        }

        if (!password.trim()) {
            setError('비밀번호를 입력해주세요.');
            return;
        }

        const passwordHash = CryptoJS.SHA256(password).toString();
        const newComment: Comment = {
            id: uuidv4(),
            nickname,
            content: commentText,
            passwordHash,
            createdAt: new Date().toISOString(),
        };

        setComments((prevComments) => [...prevComments, newComment]);
        setCommentText('');
        setPassword('');
        setError(null);
    };
    const deleteComment = (commentId: string) => {
        const commentToDelete = comments.find((comment) => comment.id === commentId);
        if (commentToDelete) {
            const enteredPasswordHash = CryptoJS.SHA256(deletePassword).toString();
            const masterPasswordHash = CryptoJS.SHA256(MASTER_PASSWORD).toString();
            if (enteredPasswordHash === commentToDelete.passwordHash || enteredPasswordHash === masterPasswordHash) {
                setComments((prevComments) => prevComments.filter((comment) => comment.id !== commentId));
                setDeletePassword('');
                setShowDeletePasswordInput(null);
                setError(null);
            } else {
                setError('비밀번호가 일치하지 않습니다.');
            }
        }
    };

    return (
        <div className="mt-8">
            <h3 className="text-xl font-semibold mb-4">댓글</h3>
            {error && <p className="text-red-500 mb-2">{error}</p>}
            <div className="mb-4 p-4 border rounded border-gray-300 dark:border-gray-700">
              <div className="flex mb-2">
                <input
                    type="text"
                    placeholder="닉네임"
                    value={nickname}
                    onChange={handleNicknameChange}
                     className="border p-2 mr-2 rounded text-black dark:text-white dark:bg-transparent focus:outline-none"
                />
                <input
                    type="password"
                    placeholder="비밀번호"
                    value={password}
                    onChange={handlePasswordChange}
                     className="border p-2 mr-2 rounded text-black dark:text-white dark:bg-transparent focus:outline-none"
                />
             </div>
                <textarea
                    placeholder="댓글을 입력하세요"
                    value={commentText}
                    onChange={handleCommentChange}
                    className="border p-2 rounded w-full text-black dark:text-white dark:bg-transparent focus:outline-none mt-2"
                      style={{paddingTop: '10px'}}
                />
                <button onClick={addComment} className="mt-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">댓글 작성</button>
            </div>

            {comments.map((comment) => (
                <div key={comment.id} className="border-b py-4 relative">
                    <div className="flex items-center mb-2">
                        <span className="font-semibold mr-2">{comment.nickname}</span>
                        <span className="text-gray-500 text-sm">
                            {new Date(comment.createdAt).toLocaleString()}
                        </span>
                    </div>
                    <p>{comment.content}</p>
                <div className="absolute top-0 right-0">
                  <button onClick={() => handleShowDeletePassword(comment.id)} className="text-red-500 hover:text-red-700 cursor-pointer">
                       삭제
                   </button>
                   {showDeletePasswordInput === comment.id  && (
                    <div>
                        <input
                            type="password"
                            placeholder="삭제 비밀번호"
                            value={deletePassword}
                            onChange={handleDeletePasswordChange}
                             className="border p-1 mr-2 rounded text-black dark:text-white dark:bg-transparent focus:outline-none"
                        />
                         <button onClick={() => deleteComment(comment.id)} className="text-red-500 hover:text-red-700 cursor-pointer">
                         완료
                         </button>
                       <button onClick={() => handleCancelDelete(comment.id)} className="text-gray-500 hover:text-gray-700 cursor-pointer">취소</button>
                    </div>
                  )}

                    </div>
                </div>
            ))}
            {comments.length === 0 && <p>아직 댓글이 없습니다.</p>}
        </div>
    );
};

export default CommentSection;