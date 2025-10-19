import { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CloseOutlined, DeleteOutlined } from "@ant-design/icons";
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

import {
    Spin,
    message,
    Card,
    Tag,
    Button,
    Typography,
    Row,
    Col,
    Avatar,
    Space,
    Empty,
    Modal,
    Form,
    Input,
    Badge,
    Tooltip,
    Progress,
    ConfigProvider,
    theme
} from "antd";
import {
    ArrowLeftOutlined,
    PlusOutlined,
    TeamOutlined,
    UserOutlined,
    FolderOutlined,
    TagsOutlined,
    UserAddOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    FireOutlined,
    CalendarOutlined,
    FileTextOutlined,
    DragOutlined,
    StarOutlined,
    RocketOutlined,
    ThunderboltOutlined,
    FlagOutlined
} from "@ant-design/icons";
import { AuthContext } from "../../content/AuthContent";
import { api } from "../api/api";
import { toast } from 'react-hot-toast';
import CreateIssueModal from "./CreateIssueModal";
import { useTheme } from "../../content/ThemeContent";

const { Title, Text, Paragraph } = Typography;

export default function ProjectDetail() {

    const { id } = useParams();
    const navigate = useNavigate();
    const { token } = useContext(AuthContext);

    const [loading, setLoading] = useState(true);
    const [project, setProject] = useState(null);
    const [issuesByStatus, setIssuesByStatus] = useState({});

    const [statusModalVisible, setStatusModalVisible] = useState(false);
    const [statusForm] = Form.useForm();
    const [addingStatus, setAddingStatus] = useState(false);

    const [inviteModalVisible, setInviteModalVisible] = useState(false);
    const [inviteForm] = Form.useForm();
    const [inviting, setInviting] = useState(false);

    const [issueModal, setIssueModal] = useState({ visible: false, statusId: null });

    const [addingIssue, setAddingIssue] = useState(false);

    const [fetchedStatuses, setFetchedStatuses] = useState({});

    const [member, setMember] = useState({});

    const [onDue, setOnDue] = useState([]);

    const { isDarkMode, toggleTheme } = useTheme();

    // Fetch oncoming issues
    useEffect(() => {
        const fetchOnDueIssues = async () => {
            try {
                const response = await api.get(`/issue/due-today/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setOnDue(response.data.data);
            } catch (error) {
                console.error("Failed to fetch oncoming issues:", error);
            }
        };
        fetchOnDueIssues();
    }, [id, token]);

    // Fetch project details
    useEffect(() => {
        const fetchProject = async () => {
            try {
                const response = await api.get(`/project/projects/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const projectData = response.data.data;

                setProject(projectData);
                setMember(projectData.members);
                const initialIssues = {};
                projectData.statutes.forEach(status => {
                    initialIssues[status.id] = [];
                });

            } catch (error) {
                message.error(error.response?.data?.message || "Failed to load project");
            } finally {
                setLoading(false);
            }
        };
        fetchProject();
    }, [id, token]);

    // Fetch issues for each status
    useEffect(() => {
        if (!project?.statutes) return;

        project.statutes.forEach(status => {
            const statusIdStr = String(status.id);
            if (!fetchedStatuses[statusIdStr]) {
                api.get(`/issue/get/${status.id}`, { headers: { Authorization: `Bearer ${token}` } })
                    .then(res => {
                        setIssuesByStatus(prev => ({
                            ...prev,
                            [statusIdStr]: res.data.data.map(i => ({ ...i, id: String(i.id) }))
                        }));

                        setFetchedStatuses(prev => ({ ...prev, [statusIdStr]: true }));
                    })
                    .catch(err => {
                        console.error(`Failed to fetch issues for status ${status.id}:`, err);
                    });
            }
        });
    }, [project?.statutes, token]);

    const handleRemoveMember = async (memberId) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            await api.delete(`project/projects/member/${memberId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setMember(prev => prev.filter(m => m.id !== memberId));
        } catch (err) {
            console.error(err.response?.data || err.message);
        }
    };

    const handleDragEnd = async (result) => {
        const { source, destination, draggableId } = result;

        if (!destination) {
            return;
        }

        const sourceId = source.droppableId;
        const destId = destination.droppableId;

        if (sourceId === destId && source.index === destination.index) {
            return;
        }

        const oldIssues = { ...issuesByStatus };

        const newIssues = { ...issuesByStatus };
        const sourceIssues = Array.from(newIssues[sourceId]);
        const destIssues = sourceId === destId ? sourceIssues : Array.from(newIssues[destId]);

        const [movedIssue] = sourceIssues.splice(source.index, 1);
        if (!movedIssue) {
            return;
        }

        if (sourceId === destId) {
            sourceIssues.splice(destination.index, 0, movedIssue);
            newIssues[sourceId] = sourceIssues;
        } else {
            destIssues.splice(destination.index, 0, movedIssue);
            newIssues[sourceId] = sourceIssues;
            newIssues[destId] = destIssues;
        }

        setIssuesByStatus(newIssues);

        if (sourceId !== destId) {
            try {
                const res = await api.put(
                    `/issue/update-status/${draggableId}/${destId}`,
                    {},
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );
                setFetchedStatuses({});

                toast.success("Action is verified");
                message.success("Issue moved successfully");
            } catch (err) {
                setIssuesByStatus(oldIssues);
                toast.error("Action is not verified");
                message.error(err.response?.data?.message || "Failed to move issue");
            }
        }
    };

    const handleDeleteProject = async () => {
        if (window.confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
            try {
                await api.delete(`/project/delete-project/${project.project.id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                message.success("Project deleted successfully!");
                navigate("/dashboard");
            } catch (err) {
                message.error(err.response?.data?.message || "Failed to delete project");
            }
        }
    };

    const handleDeleteIssue = async (issueId, statusId) => {
        try {
            await api.delete(`/issue/delete-issue/${issueId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setIssuesByStatus(prev => ({
                ...prev,
                [statusId]: (prev[statusId] || []).filter(issue => issue.id !== issueId)
            }));

            message.success("Issue deleted successfully!");
        } catch (err) {
            message.error(err.response?.data?.message || "Failed to delete issue");
        }
    };

    const handleAddStatus = async (values) => {
        setAddingStatus(true);
        try {
            const response = await api.post(`/status/create-status`, {
                project_id: id,
                name: values.name
            }, { headers: { Authorization: `Bearer ${token}` } });

            setProject(prev => ({
                ...prev,
                statutes: [...(prev.statutes || []), response.data.data]
            }));

            setIssuesByStatus(prev => ({
                ...prev,
                [response.data.data.id]: []
            }));

            message.success("Status column created!");
            setStatusModalVisible(false);
            statusForm.resetFields();
        } catch (error) {
            message.error(error.response?.data?.message || "Failed to create status");
        } finally {
            setAddingStatus(false);
        }
    };

    const handleInviteMember = async (values) => {
        setInviting(true);
        try {
            await api.post(`/invite/project-invite`, {
                email: values.email,
                project_id: project.project.id
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            message.success("Invitation sent successfully!");
            toast.success("Invitation sent successfully!");
            setInviteModalVisible(false);
            inviteForm.resetFields();
        } catch (error) {
            message.error(error.response?.data?.message || "Failed to send invitation");
            toast.error("Invitation is failed");
        } finally {
            setInviting(false);
        }
    };

    const handleAddIssue = async (values, statusId) => {
        setAddingIssue(true);
        try {
            const payload = {
                ...values,
                status_id: statusId,
                project_id: project.project.id,
                due_date: values.due_date ? values.due_date.format("YYYY-MM-DD") : null
            };

            const res = await api.post("/issue/create-issue", payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const newIssue = { ...res.data.data, id: String(res.data.data.id) };
            const statusIdStr = String(statusId);

            setIssuesByStatus(prev => ({
                ...prev,
                [statusIdStr]: [...(prev[statusIdStr] || []), newIssue]
            }));

            message.success("Issue created successfully!");
            toast.success("Issue is created");

        } catch (err) {
            message.error(err.response?.data?.message || "Failed to create issue");
        } finally {
            setAddingIssue(false);
        }
    };

    const getPriorityIcon = (priority) => {
        const p = priority?.toLowerCase();
        if (p === 'urgent' || p === 'critical') return <FireOutlined style={{ color: '#ff4d4f' }} />;
        if (p === 'high') return <FlagOutlined style={{ color: '#ff7a45' }} />;
        if (p === 'medium') return <ClockCircleOutlined style={{ color: '#faad14' }} />;
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
    };

    const getPriorityColor = (priority) => {
        const p = priority?.toLowerCase();
        if (p === 'urgent' || p === 'critical') return 'red';
        if (p === 'high') return 'orange';
        if (p === 'medium') return 'gold';
        return 'green';
    };

    if (loading) return <div className="flex justify-center items-center h-screen"><Spin size="large" /></div>;
    if (!project) return <div className="text-center mt-10"><Text>Project not found</Text></div>;

    // Calculate project stats
    const totalIssues = Object.values(issuesByStatus).reduce((acc, issues) => acc + issues.length, 0);
    const totalMembers = Array.isArray(member) ? member.length : 0;
    const totalStatuses = project.statutes?.length || 0;

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
            <div className={`min-h-screen p-6 transition-colors ${isDarkMode ? 'bg-[#0d0d0d] text-gray-200' : 'bg-gray-50 text-gray-800'}`}>
                <div className="max-w-7xl mx-auto">
                    <Button
                        icon={<ArrowLeftOutlined />}
                        onClick={() => navigate(-1)}
                        className={`mb-6 ${isDarkMode ? 'border-gray-600 text-gray-200' : ''}`}
                    >
                        Back
                    </Button>

                    {/* Project Header */}
                    <div className={`p-8 rounded-xl mb-8 ${isDarkMode ? 'bg-gray-800/50' : 'bg-white'} shadow-sm`}>
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex items-start space-x-4 flex-1">
                                <Avatar
                                    size={64}
                                    icon={<FolderOutlined />}
                                    className="bg-gradient-to-br from-blue-500 to-blue-600"
                                />
                                <div className="flex-1">
                                    <div className="flex items-center space-x-3 mb-2">
                                        <Title level={2} className={`m-0 ${isDarkMode ? 'text-white' : ''}`}>
                                            {project.project.name}
                                        </Title>
                                        <Tag
                                            icon={project.project.status === 'active' ? <ThunderboltOutlined /> : <ClockCircleOutlined />}
                                            color={project.project.status === 'active' ? 'success' : 'default'}
                                        >
                                            {project.project.status === 'active' ? 'Active' : 'Inactive'}
                                        </Tag>
                                    </div>
                                    <Paragraph className={`mb-0 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                        {project.project.description}
                                    </Paragraph>
                                </div>
                            </div>

                            <Tooltip title="Delete Project">
                                <Button
                                    type="text"
                                    icon={<DeleteOutlined />}
                                    danger
                                    size="large"
                                    onClick={handleDeleteProject}
                                />
                            </Tooltip>
                        </div>

                        <div className="flex flex-wrap gap-6">
                            <div className="flex items-center space-x-2">
                                <TagsOutlined style={{ color: '#1890ff' }} />
                                <Text className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Category:</Text>
                                <Text strong className="uppercase">{project.project.category}</Text>
                            </div>
                            <div className="flex items-center space-x-2">
                                <StarOutlined style={{ color: '#faad14' }} />
                                <Text className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Tags:</Text>
                                {project.project.tags && project.project.tags.length > 0 ? (
                                    project.project.tags.map((tag, index) => (
                                        <Tag key={index} color="blue">{tag}</Tag>
                                    ))
                                ) : (
                                    <Tag color="default">N/A</Tag>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-800/50' : 'bg-white'} shadow-sm`}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <Text className={`block mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                        Total Issues
                                    </Text>
                                    <Title level={2} className={`m-0 ${isDarkMode ? 'text-white' : ''}`}>
                                        {totalIssues}
                                    </Title>
                                </div>
                                <FileTextOutlined className="text-4xl text-blue-500 opacity-50" />
                            </div>
                        </div>

                        <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-800/50' : 'bg-white'} shadow-sm`}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <Text className={`block mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                        Team Members
                                    </Text>
                                    <Title level={2} className={`m-0 ${isDarkMode ? 'text-white' : ''}`}>
                                        {totalMembers}
                                    </Title>
                                </div>
                                <TeamOutlined className="text-4xl text-green-500 opacity-50" />
                            </div>
                        </div>

                        <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-800/50' : 'bg-white'} shadow-sm`}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <Text className={`block mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                        Status Columns
                                    </Text>
                                    <Title level={2} className={`m-0 ${isDarkMode ? 'text-white' : ''}`}>
                                        {totalStatuses}
                                    </Title>
                                </div>
                                <RocketOutlined className="text-4xl text-purple-500 opacity-50" />
                            </div>
                        </div>
                    </div>

                    {/* Status Columns Section */}
                    <Card
                        title={
                            <Space>
                                <RocketOutlined style={{ color: '#1890ff' }} />
                                <span>Status Columns</span>
                                <Badge count={totalStatuses} style={{ backgroundColor: '#52c41a' }} />
                            </Space>
                        }
                        extra={
                            project.statutes && project.statutes.length < 6 && (
                                <Button type="primary" icon={<PlusOutlined />} onClick={() => setStatusModalVisible(true)}>
                                    Add Status Column
                                </Button>
                            )
                        }
                        className={`shadow-sm mb-8 ${isDarkMode ? 'bg-gray-800' : ''}`}
                    >
                        {!project.statutes || project.statutes.length === 0 ? (
                            <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description={
                                    <div className="text-center">
                                        <Text className={isDarkMode ? 'text-gray-300' : 'text-gray-500'}>No status columns yet</Text>
                                        <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`}>
                                            Create status columns like "To Do", "In Progress", "Done" to organize your issues
                                        </Text>
                                    </div>
                                }
                            >
                                <Button type="primary" icon={<PlusOutlined />} size="large" onClick={() => setStatusModalVisible(true)}>
                                    Create First Status Column
                                </Button>
                            </Empty>
                        ) : (
                            <DragDropContext onDragEnd={handleDragEnd}>
                                <div className="flex flex-wrap gap-4 pb-4">
                                    {project.statutes.map((status) => {
                                        const issueCount = issuesByStatus[status.id]?.length || 0;
                                        return (
                                            <Card
                                                key={status.id}
                                                size="small"
                                                className={`border-2 w-96 flex-shrink-0 hover:shadow-lg transition-all ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gradient-to-b from-gray-50 to-white border-gray-300'}`}
                                                style={{ minWidth: '20rem' }}
                                                title={
                                                    <div className="flex items-center justify-between">
                                                        <Space>
                                                            <Text strong className={`text-base ${isDarkMode ? 'text-white' : ''}`}>{status.name}</Text>
                                                            <Badge count={issueCount} style={{ backgroundColor: '#1890ff' }} />
                                                        </Space>
                                                        <Tooltip title="Delete Status">
                                                            <Button
                                                                type="text"
                                                                icon={<DeleteOutlined />}
                                                                danger
                                                                onClick={async () => {
                                                                    try {
                                                                        await api.delete(`/status/delete-status/${status.id}/${project.project.id}`, {
                                                                            headers: { Authorization: `Bearer ${token}` }
                                                                        });
                                                                        message.success("Status column deleted!");
                                                                        setProject(prev => ({
                                                                            ...prev,
                                                                            statutes: prev.statutes.filter(s => s.id !== status.id)
                                                                        }));
                                                                    } catch (error) {
                                                                        message.error(error.response?.data?.message || "Failed to delete status");
                                                                    }
                                                                }}
                                                            />
                                                        </Tooltip>
                                                    </div>
                                                }
                                            >
                                                <Droppable droppableId={status.id}>
                                                    {(provided, snapshot) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.droppableProps}
                                                            className={`space-y-2 min-h-[200px] p-2 rounded-lg transition-colors ${snapshot.isDraggingOver ? (isDarkMode ? 'bg-blue-900 border-2 border-dashed border-blue-500' : 'bg-blue-50 border-2 border-dashed border-blue-300') : ''}`}
                                                        >
                                                            <Button
                                                                type="dashed"
                                                                block
                                                                icon={<PlusOutlined />}
                                                                className={`border-blue-300 text-blue-600 hover:border-blue-500 hover:text-blue-700 ${isDarkMode ? 'border-blue-500 text-blue-300 hover:border-blue-400 hover:text-blue-200' : ''}`}
                                                                onClick={() => setIssueModal({ visible: true, statusId: status.id })}
                                                            >
                                                                Create An Issue
                                                            </Button>

                                                            {issuesByStatus[status.id]?.length > 0 ? (
                                                                issuesByStatus[status.id].map((issue, index) => (
                                                                    <Draggable key={issue.id} draggableId={issue.id} index={index}>
                                                                        {(provided, snapshot) => (
                                                                            <div
                                                                                ref={provided.innerRef}
                                                                                {...provided.draggableProps}
                                                                                {...provided.dragHandleProps}
                                                                                className={`p-4 border-2 rounded-lg shadow-sm flex flex-col gap-2 relative transition-all hover:border-blue-300 ${snapshot.isDragging ? 'shadow-2xl rotate-2 border-blue-400' : ''} ${isDarkMode ? 'bg-gray-600 border-gray-500 hover:border-blue-400' : 'bg-white'}`}
                                                                                style={{
                                                                                    ...provided.draggableProps.style,
                                                                                    cursor: 'grab'
                                                                                }}
                                                                            >
                                                                                <div className="flex items-start justify-between">
                                                                                    <Tooltip title="Drag to move">
                                                                                        <DragOutlined className={`mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`} />
                                                                                    </Tooltip>
                                                                                    <Tooltip title="Delete Issue">
                                                                                        <Button
                                                                                            type="text"
                                                                                            size="small"
                                                                                            danger
                                                                                            icon={<DeleteOutlined />}
                                                                                            onClick={(e) => {
                                                                                                e.stopPropagation();
                                                                                                handleDeleteIssue(issue.id, status.id);
                                                                                            }}
                                                                                        />
                                                                                    </Tooltip>
                                                                                </div>

                                                                                <div className="flex items-start space-x-2">
                                                                                    <FileTextOutlined style={{ color: '#1890ff', marginTop: 4 }} />
                                                                                    <Text strong className={`text-base flex-1 ${isDarkMode ? 'text-white' : ''}`}>{issue.title}</Text>
                                                                                </div>

                                                                                <Text type="secondary" className={`text-sm pl-6 ${isDarkMode ? 'text-gray-300' : ''}`}>{issue.description}</Text>

                                                                                <div className="flex items-center gap-2 mt-2">
                                                                                    {issue.due_date && (
                                                                                        <Tag icon={<CalendarOutlined />} color="blue" className="text-xs">
                                                                                            {new Date(issue.due_date).toLocaleDateString()}
                                                                                        </Tag>
                                                                                    )}

                                                                                    {issue.priority && (
                                                                                        <Tag
                                                                                            icon={getPriorityIcon(issue.priority)}
                                                                                            color={getPriorityColor(issue.priority)}
                                                                                            className="text-xs"
                                                                                        >
                                                                                            {issue.priority}
                                                                                        </Tag>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </Draggable>
                                                                ))
                                                            ) : (
                                                                <Empty
                                                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                                                    description="No issues yet"
                                                                    className="py-8"
                                                                />
                                                            )}
                                                            {provided.placeholder}
                                                        </div>
                                                    )}
                                                </Droppable>
                                            </Card>
                                        );
                                    })}

                                    {project.statutes.length < 6 && (
                                        <div className="w-96 flex-shrink-0">
                                            <Button
                                                type="dashed"
                                                icon={<PlusOutlined />}
                                                className={`w-full h-full min-h-[200px] border-2 border-dashed hover:border-blue-400 hover:text-blue-600 ${isDarkMode ? 'border-gray-600 hover:border-blue-500 hover:text-blue-300' : ''}`}
                                                onClick={() => setStatusModalVisible(true)}
                                            >
                                                Add New Status Column
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </DragDropContext>
                        )}
                    </Card>

                    {/* Team Members & Oncoming Issues */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Team Members */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-2">
                                    <TeamOutlined className="text-2xl text-green-500" />
                                    <Title level={4} className={`m-0 ${isDarkMode ? 'text-white' : ''}`}>
                                        Team Members
                                    </Title>
                                    <Badge count={totalMembers} style={{ backgroundColor: '#52c41a' }} />
                                </div>
                                <Button
                                    type="primary"
                                    icon={<UserAddOutlined />}
                                    onClick={() => setInviteModalVisible(true)}
                                >
                                    Invite
                                </Button>
                            </div>

                            <div className="space-y-3">
                                {Array.isArray(member) && member.length > 0 ? (
                                    member.map((m, idx) => (
                                        <div
                                            key={m.id || idx}
                                            className={`flex items-center space-x-3 p-4 rounded-xl transition-all ${isDarkMode ? 'bg-gray-800/50 hover:bg-gray-800' : 'bg-white hover:bg-gray-50'} shadow-sm`}
                                        >
                                            <Avatar
                                                size={48}
                                                icon={<UserOutlined />}
                                                className="bg-gradient-to-br from-blue-500 to-blue-600"
                                            />
                                            <div className="flex-1">
                                                <Text strong className={`block ${isDarkMode ? 'text-white' : ''}`}>
                                                    {m.full_name}
                                                </Text>
                                                <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                    {m.email}
                                                </Text>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className={`p-8 rounded-xl text-center ${isDarkMode ? 'bg-gray-800/50' : 'bg-white'} shadow-sm`}>
                                        <Empty
                                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                                            description={<Text className={isDarkMode ? 'text-gray-400' : ''}>No team members yet</Text>}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Oncoming Issues */}
                        <div>
                            <div className="flex items-center space-x-2 mb-4">
                                <ClockCircleOutlined className="text-2xl text-orange-500" />
                                <Title level={4} className={`m-0 ${isDarkMode ? 'text-white' : ''}`}>
                                    Oncoming Issues
                                </Title>
                                <Badge count={onDue.length} style={{ backgroundColor: '#fa8c16' }} />
                            </div>

                            <div className="space-y-3">
                                {onDue.length > 0 ? (
                                    onDue.map((issue) => (
                                        <div
                                            key={issue.id}
                                            className={`p-4 rounded-xl transition-all ${isDarkMode ? 'bg-gray-800/50 hover:bg-gray-800' : 'bg-white hover:bg-gray-50'} shadow-sm`}
                                        >
                                            <Text strong className={`block mb-2 ${isDarkMode ? 'text-white' : ''}`}>
                                                {issue.title}
                                            </Text>
                                            <Paragraph className={`text-sm mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                {issue.description || "No description"}
                                            </Paragraph>
                                            {issue.due_date && (
                                                <Tag icon={<CalendarOutlined />} color="blue">
                                                    {new Date(issue.due_date).toLocaleDateString()}
                                                </Tag>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className={`p-8 rounded-xl text-center ${isDarkMode ? 'bg-gray-800/50' : 'bg-white'} shadow-sm`}>
                                        <Empty
                                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                                            description={<Text className={isDarkMode ? 'text-gray-400' : ''}>No upcoming issues in the next 3 days</Text>}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Status Modal */}
                    <Modal
                        title="Create Status Column"
                        open={statusModalVisible}
                        onCancel={() => setStatusModalVisible(false)}
                        okText="Create"
                        confirmLoading={addingStatus}
                        onOk={() => statusForm.submit()}
                        className={isDarkMode ? 'dark-modal' : ''}
                    >
                        <Form form={statusForm} onFinish={handleAddStatus} layout="vertical">
                            <Form.Item label="Status Name" name="name" rules={[{ required: true, message: "Please input the status name" }]}>
                                <Input placeholder="e.g. To Do" />
                            </Form.Item>
                        </Form>
                    </Modal>

                    {/* Create Issue Modal */}
                    <CreateIssueModal
                        visible={issueModal.visible}
                        onSubmit={(values) => handleAddIssue(values, issueModal.statusId)}
                        onClose={() => setIssueModal({ visible: false, statusId: null })}
                        statusId={issueModal.statusId}
                        projectId={project.project.id}
                        token={token}
                        onSuccess={(values) => handleAddIssue(values, issueModal.statusId)}
                    />

                    {/* Invite Modal */}
                    <Modal
                        title="Invite Team Member"
                        open={inviteModalVisible}
                        onCancel={() => setInviteModalVisible(false)}
                        okText="Invite"
                        confirmLoading={inviting}
                        onOk={() => inviteForm.submit()}
                        className={isDarkMode ? 'dark-modal' : ''}
                    >
                        <Form form={inviteForm} onFinish={handleInviteMember} layout="vertical">
                            <Form.Item label="Member Email" name="email" rules={[{ required: true, message: "Please input member email" }]}>
                                <Input placeholder="example@mail.com" prefix={<UserOutlined />} />
                            </Form.Item>
                        </Form>
                    </Modal>
                </div>
            </div>
        </div>
    </ConfigProvider>
);
}