import React, { useEffect, useState } from 'react';
import {
    Layout,
    Button,
    Typography,
    Row,
    Col,
    Card,
    Avatar,
    Statistic,
    Tag,
    List,
    Badge,
    Space,
    Dropdown,
    Divider,
    Alert,
    Spin,
    Popover,
    Menu,
    Progress,
    ConfigProvider,
    theme
} from 'antd';
import {
    ProjectOutlined,
    IssuesCloseOutlined,
    TeamOutlined,
    UserOutlined,
    SettingOutlined,
    BellOutlined,
    LogoutOutlined,
    PlusOutlined,
    CrownOutlined,
    TrophyOutlined,
    RiseOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    FireOutlined,
    EditOutlined,
    DeleteOutlined,
    UserAddOutlined,
    FileTextOutlined,
    CalendarOutlined,
    ThunderboltOutlined,
    StarOutlined,
    RocketOutlined,
    SunOutlined,
    MoonOutlined
} from '@ant-design/icons';
import { api } from '../api/api';
import { decodeJWT } from '../jwt/Decoder';
import { useNavigate } from 'react-router-dom';
import DashboardHeader from './DashboardHeader';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

export default function ManagifyDashboard() {
    const navigate = useNavigate();
    const [userData, setUserData] = useState(null);
    const [userProjects, setUserProjects] = useState([]);
    const [recentIssues, setRecentIssues] = useState([]);
    const [subscriptionData, setSubscriptionData] = useState([]);
    const [invites, setInvites] = useState([]);
    const [invitesLoading, setInvitesLoading] = useState(false);
    const [recentLogs, setRecentLogs] = useState([]);
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const saved = localStorage.getItem('theme');
        return saved === 'dark';
    });

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        const decoded = decodeJWT();
        const userId = decoded.id;

        api.get(`users/${userId}`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => {
                const data = res.data.data;
                setSubscriptionData(data.subscription);
                setUserData(data.user);
                setUserProjects(data.project || []);
                setRecentIssues(data.recentIssues || []);
            })
            .catch(err => {
                console.error(err.response?.data || err);
            });

        fetchInvites();
    }, []);

    useEffect(() => {
        let isMounted = true;

        const fetchLogs = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;

            const decoded = decodeJWT();
            const userId = decoded.id;

            try {
                const res = await api.get(`logger/${userId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!isMounted) return;

                const logs = Array.isArray(res.data?.logs) ? res.data.logs : [];
                setRecentLogs(logs);
            } catch (err) {
                console.error(err.response?.data || err);
            }
        };

        fetchLogs();

        return () => { isMounted = false; };
    }, []);

    const fetchInvites = async () => {
        setInvitesLoading(true);
        try {
            const token = localStorage.getItem('token');
            const decoded = decodeJWT();
            const userID = decoded?.id;

            if (!userID || !token) return;

            const res = await api.get(`/invite/project-invite/${userID}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setInvites(res.data.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setInvitesLoading(false);
        }
    };

    const respondInvite = async (inviteID, accept) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const action = accept ? 'accept' : 'decline';

            await api.put(`/invite/project-invite/${inviteID}/respond`, null, {
                params: { action },
                headers: { Authorization: `Bearer ${token}` }
            });

            fetchInvites();
        } catch (err) {
            console.error(err);
        }
    };

    if (!userData) return <div>Loading...</div>;

    const getPlanColor = (plan) => ({
        BASIC: 'default',
        PREMIUM: 'blue',
        PRO: 'gold'
    }[plan] || 'default');

    const handleUpgrade = () => {
        navigate("/plans", { state: { currentPlan: subscriptionData.plan_type } });
    };

    const getPlanIcon = (plan) => plan === 'PRO' ? <CrownOutlined /> : plan === 'PREMIUM' ? <TrophyOutlined /> : null;

    const handleLogout = () => {
        localStorage.removeItem("token");
        window.location.href = "/login";
    };

    const toggleTheme = () => {
        const newTheme = !isDarkMode;
        setIsDarkMode(newTheme);
        localStorage.setItem('theme', newTheme ? 'dark' : 'light');
    };

    const handleProfile = () => {
        navigate("/profile");
    };

    // Log icon mapper
    const getLogIcon = (message) => {
        const msg = message.toLowerCase();
        if (msg.includes('created')) return <PlusOutlined style={{ color: '#52c41a' }} />;
        if (msg.includes('delete')) return <DeleteOutlined style={{ color: '#ff4d4f' }} />;
        if (msg.includes('update') || msg.includes('changed')) return <EditOutlined style={{ color: '#1890ff' }} />;
        if (msg.includes('member') || msg.includes('user')) return <UserAddOutlined style={{ color: '#722ed1' }} />;
        if (msg.includes('status')) return <CheckCircleOutlined style={{ color: '#faad14' }} />;
        return <FileTextOutlined style={{ color: '#8c8c8c' }} />;
    };

    const userMenu = (
        <Menu>
            <Menu.Item key="profile" icon={<UserOutlined />} onClick={handleProfile}>Profile</Menu.Item>
            <Menu.Item key="settings" icon={<SettingOutlined />}>Settings</Menu.Item>
            <Menu.Divider />
            <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout}>
                Logout
            </Menu.Item>
        </Menu>
    );

    const firstName = (userData.full_name || userData.name || 'User').split(' ')[0];

    const inviteContent = (
        <div style={{ width: 350, maxHeight: 500, overflowY: 'auto' }}>
            {invitesLoading ? (
                <div className="flex justify-center p-4"><Spin /></div>
            ) : invites.length === 0 ? (
                <Text className="p-4 block">No notifications</Text>
            ) : (
                invites.map(invite => (
                    <div key={invite.id} className="flex flex-col mb-3 p-3 border-b rounded hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start mb-1">
                            <Text strong>{invite.sender?.full_name || 'Someone'}</Text>
                            <Tag size="small" color={
                                invite.status === 'pending' ? 'blue' :
                                    invite.status === 'accepted' ? 'green' :
                                        invite.status === 'declined' ? 'red' : 'default'
                            }>
                                {invite.status.toUpperCase()}
                            </Tag>
                        </div>
                        <Text className="text-sm mb-1">
                            invited you to project <Text strong>{invite.project?.name || 'Project'}</Text> ({invite.project?.category || 'Uncategorized'})
                        </Text>
                        <Text className="text-xs text-gray-500 mb-2">
                            Project Owner: {invite.project?.owner?.full_name || 'Unknown'}<br />
                            Received at: {new Date(invite.createdAt).toLocaleString()}
                        </Text>
                        {invite.status === 'pending' && (
                            <div className="flex gap-2">
                                <Button size="small" type="primary" onClick={() => respondInvite(invite.id, true)}>
                                    Accept
                                </Button>
                                <Button size="small" danger onClick={() => respondInvite(invite.id, false)}>
                                    Decline
                                </Button>
                            </div>
                        )}
                    </div>
                ))
            )}
        </div>
    );

    // Calculate stats
    const activeProjects = userProjects.filter(p => p.status === 'active').length;
    const totalIssues = userProjects.reduce((acc, p) => acc + (p.issues_id?.length || 0), 0);
    const totalMembers = userProjects.reduce((acc, p) => acc + (p.teams_id?.length || 0), 0);
    const projectLimitPercentage = subscriptionData.plan_type === "BASIC" ? (userData.project_size / 3) * 100 :
        subscriptionData.plan_type === "PREMIUM" ? (userData.project_size / 10) * 100 : 0;

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
        <Layout className={`min-h-screen ${isDarkMode ? 'bg-[#0d0d0d]' : 'bg-gray-50'}`}>
            {/* Header */}
            <Header className={`shadow-sm border-b px-6 flex items-center justify-between ${isDarkMode ? 'bg-[#0d0d0d] border-gray-700' : 'bg-white'}`}>
                <div className="flex items-center space-x-2">
                    <ProjectOutlined className="text-2xl text-blue-600" />
                    <Title level={3} className={`m-0 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Managify</Title>
                </div>

                <div className="flex items-center space-x-4">
                    <Button
                        icon={isDarkMode ? <SunOutlined /> : <MoonOutlined />}
                        onClick={toggleTheme}
                        className={isDarkMode ? 'border-gray-600' : 'border-gray-300'}
                        title={isDarkMode ? 'Light Mode' : 'Dark Mode'}
                    />

                    <Button
                        icon={<PlusOutlined />}
                        type="primary"
                        onClick={() => navigate("/create-project")}
                    >
                        New Project
                    </Button>

                    <Popover content={inviteContent} trigger="click" placement="bottomRight" onClick={fetchInvites}>
                        <Badge count={invites.filter(i => i.status === 'pending').length}>
                            <Button icon={<BellOutlined />} className={isDarkMode ? 'border-gray-600' : 'border-gray-300'} />
                        </Badge>
                    </Popover>

                    <Dropdown overlay={userMenu} trigger={['click']}>
                        <div className="flex items-center space-x-2 cursor-pointer">
                            <Avatar size="large" className="bg-blue-600" icon={<UserOutlined />} />
                            <div className="hidden md:block">
                                <Text strong className={isDarkMode ? 'text-white' : ''}>{userData.full_name || userData.name}</Text>
                            </div>
                        </div>
                    </Dropdown>
                </div>
            </Header>

            {/* Content */}
            <Content className={`p-6 transition-colors ${isDarkMode ? 'bg-[#0d0d0d] text-gray-200' : 'bg-gray-50 text-gray-800'}`}>
                <div className="max-w-7xl mx-auto">
                    <DashboardHeader
                        firstName={firstName}
                        userProjects={userProjects}
                        subscriptionData={subscriptionData}
                    />

                    {/* Plan Limit Alert */}
                    {subscriptionData.plan_type === 'BASIC' && userData.project_size >= 3 && (
                        <Alert
                            message="Plan Limit Approaching"
                            description={`You can create up to 3 projects on BASIC plan. You have currently created ${userData.project_size} projects.`}
                            type="warning"
                            action={<Button size="small" type="primary" onClick={handleUpgrade}>Upgrade Plan</Button>}
                            className="mb-6"
                            closable
                        />
                    )}

                    {/* Stats Cards */}
                    <Row gutter={[16, 16]} className="mb-6">
                        {[
                            { title: "Total Projects", value: userProjects.length, icon: <ProjectOutlined style={{ color: '#1890ff' }} />, color: '#1890ff' },
                            { title: "Active Projects", value: activeProjects, icon: <RocketOutlined style={{ color: '#52c41a' }} />, color: '#52c41a' },
                            { title: "Total Issues", value: totalIssues, icon: <IssuesCloseOutlined style={{ color: '#faad14' }} />, color: '#faad14' },
                            { title: "Team Members", value: totalMembers, icon: <TeamOutlined style={{ color: '#722ed1' }} />, color: '#722ed1' }
                        ].map((stat, idx) => (
                            <Col key={idx} xs={24} sm={12} lg={6}>
                                <Card className={`shadow-sm hover:shadow-md transition-shadow ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                                    <Statistic
                                        title={stat.title}
                                        value={stat.value}
                                        prefix={stat.icon}
                                        valueStyle={{ color: stat.color }}
                                    />
                                </Card>
                            </Col>
                        ))}
                    </Row>

                    <Row gutter={[24, 24]}>
                        {/* My Projects */}
                        <Col xs={24} lg={16}>
                            <Card
                                title={<Space><ProjectOutlined style={{ color: '#1890ff' }} />My Projects</Space>}
                                className="mb-6"
                                extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => navigate("/create-project")}>New Project</Button>}
                            >
                                <div className="space-y-4">
                                    {userProjects.map((p) => (
                                        <Card
                                            key={p.id}
                                            size="small"
                                            hoverable
                                            className={`border transition-all hover:shadow-md ${isDarkMode ? 'border-gray-700 hover:border-blue-400 bg-gray-800' : 'border-gray-200 hover:border-blue-300 bg-white'}`}
                                            onClick={() => navigate(`/projects/${p.id}`)}
                                        >
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center space-x-3">
                                                    <Avatar
                                                        size="large"
                                                        style={{ backgroundColor: p.status === 'active' ? '#52c41a' : p.status === 'completed' ? '#1890ff' : '#8c8c8c' }}
                                                        icon={<ProjectOutlined />}
                                                    />
                                                    <div>
                                                        <Title level={5} className="mb-1">{p.name}</Title>
                                                        <Text className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>{p.description}</Text>
                                                    </div>
                                                </div>
                                                <Tag color="blue">{p.category || "Uncategorized"}</Tag>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <Space size="large">
                                                    <div className="flex items-center space-x-2">
                                                        <IssuesCloseOutlined style={{ fontSize: 16, color: '#1890ff' }} />
                                                        <Text>{p.issues_id?.length || 0} Issues</Text>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <TeamOutlined style={{ fontSize: 16, color: '#52c41a' }} />
                                                        <Text>{p.teams_id?.length || 0} Members</Text>
                                                    </div>
                                                </Space>
                                                <div>
                                                    {p.tags?.length > 0 ? p.tags.map((tag, i) => <Tag key={i} color="default">{tag}</Tag>) : <Tag color="default">N/A</Tag>}
                                                </div>
                                            </div>

                                            <div className="flex justify-start mt-3">
                                                <Tag
                                                    icon={p.status === "active" ? <ThunderboltOutlined /> : p.status === "completed" ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
                                                    color={p.status === "active" ? "processing" : p.status === "review" ? "warning" : p.status === "completed" ? "success" : "default"}
                                                >
                                                    {p.status || "N/A"}
                                                </Tag>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </Card>
                        </Col>

                        {/* Sidebar */}
                        <Col xs={24} lg={8}>
                            {/* Recent Activity */}
                            <Card title={<Space><CalendarOutlined style={{ color: '#722ed1' }} />Recent Activity</Space>} className="mb-6">
                                <List
                                    dataSource={recentLogs}
                                    renderItem={(log) => (
                                        <List.Item className={`px-0 py-3 transition-colors rounded ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                                            <div className="w-full flex items-start space-x-3">
                                                <div className="mt-1">{getLogIcon(log.message)}</div>
                                                <div className="flex-1">
                                                    <Text className="text-sm block mb-1">{log.message}</Text>
                                                    <div className="flex items-center space-x-2">
                                                        <ClockCircleOutlined style={{ fontSize: 12, color: '#8c8c8c' }} />
                                                        <Text className="text-xs text-gray-500">{formatRelativeTime(log.timestamp)}</Text>
                                                    </div>
                                                </div>
                                            </div>
                                        </List.Item>
                                    )}
                                />
                            </Card>

                            {/* Subscription Details */}
                            <Card title={<Space><StarOutlined style={{ color: '#faad14' }} />Subscription Details</Space>}>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <Text>Plan Type</Text>
                                        <Tag color={getPlanColor(subscriptionData.plan_type)} icon={getPlanIcon(subscriptionData.plan_type)}>{subscriptionData.plan_type || "N/A"}</Tag>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <Badge status={subscriptionData.isValid ? "success" : "error"} text={subscriptionData.isValid ? "Active" : "Inactive"} />
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <Space><CalendarOutlined style={{ color: '#8c8c8c' }} /> <Text>Start</Text></Space>
                                        <Text className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>{formatDate(subscriptionData.subscription_start_date)}</Text>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <Space><CalendarOutlined style={{ color: '#8c8c8c' }} /> <Text>End</Text></Space>
                                        <Text className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>{formatDate(subscriptionData.subscription_end_date)}</Text>
                                    </div>

                                    <Divider />

                                    <div className="flex justify-between items-center mb-2">
                                        <Space><ProjectOutlined style={{ color: '#1890ff' }} /> <Text>Project Usage</Text></Space>
                                        <Text strong>{userData.project_size} / {subscriptionData.plan_type === "BASIC" ? "3" : subscriptionData.plan_type === "PREMIUM" ? "10" : "∞"}</Text>
                                    </div>

                                    {subscriptionData.plan_type !== "PRO" && (
                                        <Button type="primary" block className="mt-4" icon={<RiseOutlined />} onClick={handleUpgrade}>Upgrade Plan</Button>
                                    )}
                                </div>
                            </Card>
                        </Col>
                    </Row>
                </div>
                
            </Content>
            
        </Layout>
        </div>
    </ConfigProvider>
);

}

const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
};

const formatRelativeTime = (isoString) => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return formatDate(isoString);
};