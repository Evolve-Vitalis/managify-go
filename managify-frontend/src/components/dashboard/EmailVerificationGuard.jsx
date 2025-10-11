import React, { useState } from 'react';
import { Alert, Button, Modal, message } from 'antd';
import { MailOutlined, WarningOutlined } from '@ant-design/icons';
import { api } from '../api/api';

export default function EmailVerificationGuard({ token, userData, isDarkMode }) {
  const [isResending, setIsResending] = useState(false);

  const handleResendEmail = async () => {
    setIsResending(true);
    try {
      console.log("token inside resend email" + token)
      await api.get('/users/verify-email', {
        params: { token }
      });
      console.log("given token" + token)
      message.success('Verification email sent! Please check your inbox.');
    } catch (error) {
      message.error('Failed to send verification email. Please try again.');
      console.error(error);
    } finally {
      setIsResending(false);
    }
  };

  if (userData?.isVerified) {
    return null; // Verified users see nothing
  }

  return (
    <div className="mb-6">
      <Alert
        message="Email Verification Required"
        description={
          <div>
            <p className="mb-3">
              Your email address <strong>{userData?.email}</strong> is not verified yet.
              Please verify your email to access all features including creating projects and editing your profile.
            </p>
            <p className=' text-sm'>After registering, you’ll receive an email to verify your account. If you haven’t received it yet, please log out and log back in — we’ll send the verification email again!</p>
          </div>
        }
        type="warning"
        showIcon
        icon={<WarningOutlined />}
        closable={false}
      />
    </div>
  );
}