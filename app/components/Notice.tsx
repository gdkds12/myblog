// components/Notice.tsx
import React from 'react';
import { InformationCircleIcon, ExclamationTriangleIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';

type NoticeType = 'notice' | 'info' | 'warning' | 'success' | 'error';

interface NoticeProps {
  type: NoticeType;
  children: React.ReactNode;
}

const Notice: React.FC<NoticeProps> = ({ type, children }) => {
  const getNoticeStyle = (type: NoticeType) => {
    switch(type) {
      case 'info':
        return {
          bgColor: 'bg-blue-100 dark:bg-blue-900',
          borderColor: 'border-blue-500',
          textColor: 'text-blue-700 dark:text-blue-200',
          Icon: InformationCircleIcon
        };
      case 'warning':
        return {
          bgColor: 'bg-yellow-100 dark:bg-yellow-900',
          borderColor: 'border-yellow-500',
          textColor: 'text-yellow-700 dark:text-yellow-200',
          Icon: ExclamationTriangleIcon
        };
      case 'success':
        return {
          bgColor: 'bg-green-100 dark:bg-green-900',
          borderColor: 'border-green-500',
          textColor: 'text-green-700 dark:text-green-200',
          Icon: CheckCircleIcon
        };
      case 'error':
        return {
          bgColor: 'bg-red-100 dark:bg-red-900',
          borderColor: 'border-red-500',
          textColor: 'text-red-700 dark:text-red-200',
          Icon: XCircleIcon
        };
      default:
        return {
          bgColor: 'bg-gray-100 dark:bg-gray-800',
          borderColor: 'border-gray-500',
          textColor: 'text-gray-700 dark:text-gray-200',
          Icon: InformationCircleIcon
        };
    }
  };

  const style = getNoticeStyle(type);

  return (
    <div className={`p-4 my-4 rounded-lg border ${style.bgColor} ${style.borderColor} ${style.textColor}`}>
      <div className="flex items-center">
        <style.Icon className="h-6 w-6 mr-2" />
        <div>{children}</div>
      </div>
    </div>
  );
};

export default Notice;
