import React, { useEffect, useState } from 'react';
import { Card, Avatar, Typography, Divider, Tag, Space, Spin, Alert, Button } from 'antd';
import { UserOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { api } from '../api/api';
import { decodeJWT } from '../jwt/Decoder';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

export default function Profile() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    console.log(user)

    useEffect(() => {
        const fetchUser = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('No token found');
                setLoading(false);
                return;
            }

            const decoded = decodeJWT();
            const userId = decoded?.id;
            if (!userId) {
                setError('Invalid token');
                setLoading(false);
                return;
            }

            try {
                const res = await api.get(`/users/${userId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUser(res.data.data.user);
            } catch (err) {
                setError(err.response?.data || err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, []);

    if (loading) return <Spin tip="Loading..." style={{ display: 'block', margin: '50px auto' }} />;
    if (error) return <Alert type="error" message="Error" description={error} style={{ margin: '20px' }} />;

    return (
        <div className="flex flex-col items-center mt-12 px-4 space-y-6">
            <Button
                type="default"
                icon={<ArrowLeftOutlined />}
                className="self-start mb-4"
                onClick={() => navigate(-1)}
            >
                Back
            </Button>

            <Card className="w-full max-w-md text-center shadow-lg rounded-xl border-0 p-8">
                <Avatar
                    size={100}
                    className="bg-blue-600 mx-auto mb-4 shadow-md"
                    icon={<UserOutlined />}
                />
                <Title level={3} className="mb-1">{user.full_name || user.name || 'User'}</Title>
                <Text type="secondary" className="block mb-6">password: ************</Text>

                <Divider className="my-6" />

                <div className="flex flex-col space-y-3 text-left">
                    <Text><strong>Email:</strong> {user.email || 'N/A'}</Text>
                   
                </div>

                <Divider className="my-6" />

                <Text type="secondary" className="text-sm">
                    If you want to change any information about yourself, send an email to <a href="mailto:doguhannilt@gmail.com" className="text-blue-600 underline">doguhannilt@gmail.com</a>.
                </Text>
            </Card>
        </div>
    );
}
