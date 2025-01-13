"use client";

import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import CryptoJS from 'crypto-js';

interface Comment {
    id: string;
    nickname: string;
    content: string;
    createdAt: string;
    ipAddress: string;
}

const CommentSection: React.FC<{ slug: string }> = ({ slug }) => {
    const [commentText, setCommentText] = useState('');
    const [comments, setComments] = useState<Comment[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState<string | null>(null);
    const [adminMode, setAdminMode] = useState(false);
    const [ipClickCount, setIpClickCount] = useState(0);

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

    const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setCommentText(e.target.value);
    };


    const handleCancelDelete = (commentId: string) => {
        setShowDeleteConfirmation(null);
    };


    const handleShowDeleteConfirmation = (commentId: string) => {
        setShowDeleteConfirmation(commentId);
    };

    const addComment = async () => {
        if (!commentText.trim()) {
            setError('댓글 내용을 입력해주세요.');
            return;
        }


        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            const ipAddress = data.ip;
            const newComment: Comment = {
                id: uuidv4(),
                nickname: ipAddress,
                content: commentText,
                createdAt: new Date().toISOString(),
                ipAddress
            };

            setComments((prevComments) => [...prevComments, newComment]);
            setCommentText('');
            setError(null);
        } catch (error) {
            console.error("Failed to get IP address:", error);
            setError('댓글을 작성하는데 실패했습니다.');
        }
    };
    const handleIpClick = (commentIp: string) => {
        setIpClickCount(prevCount => prevCount + 1);
        if (ipClickCount >= 4) {
            setAdminMode(true);
        }

    }


    const deleteComment = (commentId: string) => {
        if (adminMode) {
                setComments((prevComments) => prevComments.filter((comment) => comment.id !== commentId));
                 setShowDeleteConfirmation(null);
                setError(null);
                 setAdminMode(false)
                 setIpClickCount(0);
            }
    };


    return (
        <div className="mt-8 px-4 sm:px-0">
            <h3 className="text-xl font-semibold mb-4">댓글</h3>
            {error && <p className="text-red-500 mb-2">{error}</p>}
            <div className="mb-4 p-4 border rounded border-gray-300 dark:border-gray-700">
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
                    <div className="flex flex-col sm:flex-row items-start sm:items-center mb-2">
                        <span
                             className="font-semibold mr-0 sm:mr-2 mb-1 sm:mb-0 cursor-pointer"
                             onClick={() => handleIpClick(comment.ipAddress)}
                         >
                          {comment.nickname}
                        </span>
                         <span className="text-gray-500 text-sm">
                            {new Date(comment.createdAt).toLocaleString()}
                        </span>
                    </div>
                    <p className="mt-1">{comment.content}</p>
                <div className="absolute top-0 right-0">
                  {adminMode && (
                  <>
                   <button onClick={() => handleShowDeleteConfirmation(comment.id)} className="text-red-500 hover:text-red-700 cursor-pointer">
                       삭제
                   </button>
                    {showDeleteConfirmation === comment.id  && (
                       <div className="flex flex-col mt-1">
                           <div className="flex">
                               <button onClick={() => deleteComment(comment.id)} className="text-red-500 hover:text-red-700 cursor-pointer mr-2">
                                   삭제 확인
                                </button>
                               <button onClick={() => handleCancelDelete(comment.id)} className="text-gray-500 hover:text-gray-700 cursor-pointer">취소</button>
                             </div>

                       </div>
                   )}
                  </>
                     )}


                    </div>
                </div>
            ))}
            {comments.length === 0 && <p>아직 댓글이 없습니다.</p>}
        </div>
    );
};

export default CommentSection;