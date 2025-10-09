import React, { useState } from 'react';
import { Alert, Button, Modal, message } from 'antd';
import { MailOutlined, WarningOutlined } from '@ant-design/icons';
import { api } from '../api/api';

export default function EmailVerificationGuard({ token, userData, isDarkMode }) {
  const [isResending, setIsResending] = useState(false);

  const handleResendEmail = async () => {
    setIsResending(true);
    try {
      await api.get('/users/verify-email', {
        params: { token }
      });
      message.success('Verification email sent! Please check your inbox.');
      window.location.reload();
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
            <Button
              type="primary"
              icon={<MailOutlined />}
              onClick={handleResendEmail}
              loading={isResending}
            >
              Resend Verification Email
            </Button>
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