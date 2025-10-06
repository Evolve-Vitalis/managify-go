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
    Menu
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
    RiseOutlined
} from '@ant-design/icons';
import { api } from '../api/api';
import { decodeJWT } from '../jwt/Decoder';
import { useNavigate } from 'react-router-dom';
import DashboardHeader from './DashboardHeader';
import DashboardStats from './DashboardStats';

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

    // Fetch user data
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

                setSubscriptionData(data.subscription)
                setUserData(data.user);
                setUserProjects(data.project || []);
                setRecentIssues(data.recentIssues || []);
            })
            .catch(err => {
                console.error(err.response?.data || err);
            });

        fetchInvites();
    }, []);

    // Fetch project invites
    const fetchInvites = async () => {
        setInvitesLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await api.get('/project/invites', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setInvites(res.data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setInvitesLoading(false);
        }
    };

    // Respond to invite
    const respondInvite = async (inviteID, accept) => {
        try {
            const token = localStorage.getItem('token');
            await api.put(`/project/invite/${inviteID}`, { accept }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchInvites(); // refresh list
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

    const getPriorityColor = (priority) => ({
        LOW: 'green',
        MEDIUM: 'blue',
        HIGH: 'orange',
        URGENT: 'red',
        CRITICAL: 'red'
    }[priority] || 'default');

    const getStatusColor = (status) => ({
        TODO: 'default',
        IN_PROGRESS: 'processing',
        REVIEW: 'warning',
        DONE: 'success',
        BLOCKED: 'error'
    }[status] || 'default');

    const userMenu = (
        <Menu>
            <Menu.Item key="profile" icon={<UserOutlined />}>Profile</Menu.Item>
            <Menu.Item key="settings" icon={<SettingOutlined />}>Settings</Menu.Item>
            <Menu.Divider />
            <Menu.Item key="logout" icon={<LogoutOutlined />}>Logout</Menu.Item>
        </Menu>
    );

    const totalIssues = userProjects.reduce((sum, p) => sum + (p.totalIssues || 0), 0);
    const completedIssues = userProjects.reduce((sum, p) => sum + (p.completedIssues || 0), 0);
    const totalTeamMembers = userProjects.reduce((sum, p) => sum + (p.teamSize || 0), 0);
    const firstName = (userData.full_name || userData.name || 'User').split(' ')[0];

    // Invite dropdown content
    const inviteContent = (
        <div style={{ width: 300, maxHeight: 400, overflowY: 'auto' }}>
            {invitesLoading ? (
                <div className="flex justify-center p-4"><Spin /></div>
            ) : invites.length === 0 ? (
                <Text className="p-4 block">No notifications</Text>
            ) : (
                invites.map(invite => (
                    <div key={invite._id} className="flex justify-between items-center mb-2 p-2 border-b">
                        <div>
                            <Text strong>{invite.senderName || 'Someone'}</Text> invited you to project <Text>{invite.projectName || 'Project'}</Text>
                        </div>
                        <div className="flex gap-2">
                            <Button size="small" type="primary" onClick={() => respondInvite(invite._id, true)}>Accept</Button>
                            <Button size="small" danger onClick={() => respondInvite(invite._id, false)}>Decline</Button>
                        </div>
                    </div>
                ))
            )}
        </div>
    );

    return (
        <Layout className="min-h-screen">
            <Header className="bg-white shadow-sm border-b px-6 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <ProjectOutlined className="text-2xl text-blue-600" />
                    <Title level={3} className="m-0 text-gray-800">Managify</Title>
                </div>

                <div className="flex items-center space-x-4">
                    <Button
                        icon={<PlusOutlined />}
                        type="primary"
                        onClick={() => navigate("/create-project")}
                    >
                        New Project
                    </Button>

                    <Popover
                        content={inviteContent}
                        trigger="click"
                        placement="bottomRight"
                    >
                        <Button icon={<BellOutlined />} className="border-gray-300" />
                    </Popover>

                    <Dropdown overlay={userMenu} trigger={['click']}>
                        <div className="flex items-center space-x-2 cursor-pointer">
                            <Avatar size="large" className="bg-blue-600" icon={<UserOutlined />} />
                            <div className="hidden md:block">
                                <Text strong>{userData.full_name || userData.name}</Text>
                            </div>
                        </div>
                    </Dropdown>
                </div>
            </Header>

            <Content className="p-6 bg-gray-50">
                <div className="max-w-7xl mx-auto">
                    <DashboardHeader
                        firstName={firstName}
                        userProjects={userProjects}
                        subscriptionData={subscriptionData}
                    />

                    {subscriptionData.plan_type === 'BASIC' && userData.project_size >= 3 && (
                        <Alert
                            message="Plan Limit Approaching"
                            description={`You can create up to 3 projects on BASIC plan. You have currently created ${userData.project_size} projects.`}
                            type="warning"
                            action={
                                <Button size="small" type="primary" onClick={handleUpgrade}>
                                    Upgrade Plan
                                </Button>
                            }
                            className="mb-6"
                            closable
                        />
                    )}
                    <DashboardStats
                        userData={userData}
                        totalIssues={totalIssues}
                        completedIssues={completedIssues}
                        totalTeamMembers={totalTeamMembers}
                    />

                    <Row gutter={[24, 24]}>
                        <Col xs={24} lg={16}>
                            <Card
                                title="My Projects"
                                className="mb-6"
                                extra={
                                    <Button
                                        type="primary" icon={<PlusOutlined />}
                                        onClick={() => navigate("/create-project")}>
                                        New Project
                                    </Button>
                                }
                            >
                                <div className="space-y-4">
                                    {userProjects.map((p) => (
                                        <Card
                                            key={p.id}
                                            size="small"
                                            hoverable
                                            className="border border-gray-200 hover:border-blue-300 transition-colors cursor-pointer"
                                            onClick={() => navigate(`/projects/${p.id}`)}
                                        >
                                            <div className="flex items-center justify-between mb-3">
                                                <div>
                                                    <Title level={5} className="mb-1">{p.name}</Title>
                                                    <Text className="text-gray-500">{p.description}</Text>
                                                </div>
                                                <div className="text-right">
                                                    <Text className="text-sm text-gray-500">
                                                        <Tag color="blue">{p.category || "Uncategorized"}</Tag>
                                                    </Text>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <Space>
                                                    <Badge
                                                        count={p.issues_id ? p.issues_id.length : 0}
                                                        showZero
                                                        color="blue"
                                                    >
                                                        <IssuesCloseOutlined className="text-gray-500" />
                                                    </Badge>
                                                    <Badge
                                                        count={p.teams_id ? p.teams_id.length : 0}
                                                        showZero
                                                        color="green"
                                                    >
                                                        <TeamOutlined className="text-gray-500" />
                                                    </Badge>
                                                </Space>
                                                <div>
                                                    {p.tags && p.tags.length > 0 ? (
                                                        p.tags.map((tag, i) => (
                                                            <Tag key={i} color="default">{tag}</Tag>
                                                        ))
                                                    ) : (
                                                        <Tag color="default">N/A</Tag>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex justify-start mt-2">
                                                <Tag
                                                    color={
                                                        p.status === "active"
                                                            ? "processing"
                                                            : p.status === "review"
                                                                ? "warning"
                                                                : p.status === "completed"
                                                                    ? "success"
                                                                    : "default"
                                                    }
                                                >
                                                    {p.status || "N/A"}
                                                </Tag>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </Card>
                        </Col>

                        <Col xs={24} lg={8}>
                            <Card title="Recent Tasks" className="mb-6">
                                <List
                                    dataSource={recentIssues}
                                    renderItem={(issue) => (
                                        <List.Item className="px-0">
                                            <div className="w-full">
                                                <div className="flex justify-between items-start mb-2">
                                                    <Text strong className="text-sm">{issue.title}</Text>
                                                    <Tag size="small" color={getPriorityColor(issue.priority)}>
                                                        {issue.priority}
                                                    </Tag>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <Text className="text-xs text-gray-500">{issue.project || "N/A"}</Text>
                                                    <Space size="small">
                                                        <Tag size="small" color={getStatusColor(issue.status)}>
                                                            {issue.status}
                                                        </Tag>
                                                        <Text className="text-xs text-gray-400">{issue.dueDate || "N/A"}</Text>
                                                    </Space>
                                                </div>
                                            </div>
                                        </List.Item>
                                    )}
                                />
                            </Card>

                            <Card title="Subscription Details">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <Text>Plan Type</Text>
                                        <Tag color={getPlanColor(subscriptionData.plan_type)} icon={getPlanIcon(subscriptionData.plan_type)}>
                                            {subscriptionData.plan_type || "N/A"}
                                        </Tag>
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <Text>Status</Text>
                                        <Badge
                                            status={subscriptionData.isValid ? "success" : "error"}
                                            text={subscriptionData.isValid ? "Active" : "Inactive"}
                                        />
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <Text>Start</Text>
                                        <Text className="text-gray-600">{formatDate(subscriptionData.subscription_start_date)}</Text>
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <Text>End</Text>
                                        <Text className="text-gray-600">{formatDate(subscriptionData.subscription_end_date)}</Text>
                                    </div>

                                    <Divider />

                                    <div className="flex justify-between items-center">
                                        <Text>Project Limit</Text>
                                        <Text>{userData.project_size} / {subscriptionData.plan_type === "BASIC" ? "3" : subscriptionData.plan_type === "PREMIUM" ? "10" : "∞"}</Text>
                                    </div>

                                    {subscriptionData.plan_type !== "PRO" && (
                                        <Button
                                            type="primary"
                                            block
                                            className="mt-4"
                                            icon={<RiseOutlined />}
                                            onClick={handleUpgrade}
                                        >
                                            Upgrade Plan
                                        </Button>
                                    )}
                                </div>
                            </Card>
                        </Col>
                    </Row>
                </div>
            </Content>
        </Layout>
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
