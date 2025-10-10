import React, { useEffect, useState } from 'react';
import { 
    Card, 
    Avatar, 
    Typography, 
    Divider, 
    Tag, 
    Space, 
    Spin, 
    Alert, 
    Button,
    ConfigProvider,
    theme 
} from 'antd';
import { UserOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { api } from '../api/api';
import { decodeJWT } from '../jwt/Decoder';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../content/ThemeContent'; // Import useTheme

const { Title, Text } = Typography;

export default function Profile() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const { isDarkMode, toggleTheme } = useTheme(); // Use context

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
        <ConfigProvider
            theme={{
                algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
                token: {
                    colorBgBase: isDarkMode ? "#1a1a1a" : "#f9fafb",
                    colorTextBase: isDarkMode ? "#f0f0f0" : "#000000",
                    colorBorder: isDarkMode ? "#333333" : "#d9d9d9",
                    colorBgContainer: isDarkMode ? "#1f1f1f" : "#ffffff",
                    colorPrimary: "#1677ff",
                },
            }}
        >
            <div className={isDarkMode ? "dark" : ""}>
                <div className={`flex flex-col items-center px-4 space-y-6 min-h-screen transition-colors ${isDarkMode ? 'bg-[#0d0d0d] text-gray-200' : 'bg-gray-50 text-gray-800'}`}>
                    <Button
                        type="default"
                        icon={<ArrowLeftOutlined />}
                        className={`self-start mb-4 ${isDarkMode ? 'border-gray-600 mt-10 text-gray-200 hover:border-gray-500' : ''}`}
                        onClick={() => navigate(-1)}
                    >
                        Back
                    </Button>

                    <Card 
                        className={`w-full max-w-md text-center shadow-lg rounded-xl border-0 p-8 transition-colors ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}
                    >
                        <Avatar
                            size={100}
                            className="bg-blue-600 mx-auto mb-4 shadow-md"
                            icon={<UserOutlined />}
                        />
                        <Title level={3} className={`mb-1 ${isDarkMode ? 'text-white' : ''}`}>
                            {user.full_name || user.name || 'User'}
                        </Title>
                        <Text type="secondary" className={`block mb-6 ${isDarkMode ? 'text-gray-400' : ''}`}>
                            password: ************
                        </Text>

                        <Divider className={`my-6 ${isDarkMode ? 'border-gray-600' : ''}`} />

                        <div className="flex flex-col space-y-3 text-left">
                            <Text className={isDarkMode ? 'text-gray-200' : ''}>
                                <strong className={isDarkMode ? 'text-gray-200' : ''}>Email:</strong> {user.email || 'N/A'}
                            </Text>
                        </div>

                        <Divider className={`my-6 ${isDarkMode ? 'border-gray-600' : ''}`} />

                        <Text type="secondary" className={`text-sm ${isDarkMode ? 'text-gray-400' : ''}`}>
                            If you want to change any information about yourself, send an email to{' '}
                            <a 
                                href="mailto:doguhannilt@gmail.com" 
                                className={`underline ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'}`}
                            >
                                doguhannilt@gmail.com
                            </a>.
                        </Text>
                    </Card>
                </div>
            </div>
        </ConfigProvider>
    );
}