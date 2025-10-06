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
    Progress
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
    EditOutlined,
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


    useEffect(() => {
        const fetchProject = async () => {
            try {

                console.log("Detail Project Token" + token)
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
                setIssuesByStatus(initialIssues);
            } catch (error) {
                message.error(error.response?.data?.message || "Failed to load project");
            } finally {
                setLoading(false);
            }
        };
        fetchProject();
    }, [id, token]);

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
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6">
                    <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} className="mb-4">Back</Button>

                    {/* Project Header Card */}
                    <Card className="shadow-md border-l-4 border-l-blue-500">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-3">
                                    <Avatar
                                        size={56}
                                        icon={<FolderOutlined />}
                                        className="bg-gradient-to-br from-blue-500 to-blue-600"
                                    />
                                    <div>
                                        <div className="flex items-center space-x-3">
                                            <Title level={2} className="m-0">{project.project.name}</Title>
                                            <Tag
                                                icon={project.project.status === 'active' ? <ThunderboltOutlined /> : <ClockCircleOutlined />}
                                                color={project.project.status === 'active' ? 'success' : 'default'}
                                            >
                                                {project.project.status === 'active' ? 'Active' : 'Inactive'}
                                            </Tag>
                                        </div>
                                        <Paragraph className="text-gray-600 mb-0 mt-1">{project.project.description}</Paragraph>
                                    </div>
                                </div>

                                <Space size="large" className="mt-4">
                                    <div className="flex items-center space-x-2">
                                        <TagsOutlined style={{ color: '#1890ff' }} />
                                        <Text className="text-gray-500">Category:</Text>
                                        <Text strong className="uppercase">{project.project.category}</Text>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <StarOutlined style={{ color: '#faad14' }} />
                                        <Text className="text-gray-500">Tags:</Text>
                                        {project.project.tags && project.project.tags.length > 0 ? (
                                            project.project.tags.map((tag, index) => (
                                                <Tag key={index} color="blue">{tag}</Tag>
                                            ))
                                        ) : (
                                            <Tag color="default">N/A</Tag>
                                        )}
                                    </div>
                                </Space>
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
                    </Card>

                    {/* Stats Row */}
                    <Row gutter={[16, 16]} className="mt-4">
                        <Col xs={24} sm={8}>
                            <Card className="shadow-sm text-center hover:shadow-md transition-shadow">
                                <Space direction="vertical" size="small">
                                    <FileTextOutlined style={{ fontSize: 32, color: '#1890ff' }} />
                                    <Text className="text-gray-500">Total Issues</Text>
                                    <Title level={3} className="m-0">{totalIssues}</Title>
                                </Space>
                            </Card>
                        </Col>
                        <Col xs={24} sm={8}>
                            <Card className="shadow-sm text-center hover:shadow-md transition-shadow">
                                <Space direction="vertical" size="small">
                                    <TeamOutlined style={{ fontSize: 32, color: '#52c41a' }} />
                                    <Text className="text-gray-500">Team Members</Text>
                                    <Title level={3} className="m-0">{totalMembers}</Title>
                                </Space>
                            </Card>
                        </Col>
                        <Col xs={24} sm={8}>
                            <Card className="shadow-sm text-center hover:shadow-md transition-shadow">
                                <Space direction="vertical" size="small">
                                    <RocketOutlined style={{ fontSize: 32, color: '#722ed1' }} />
                                    <Text className="text-gray-500">Status Columns</Text>
                                    <Title level={3} className="m-0">{totalStatuses}</Title>
                                </Space>
                            </Card>
                        </Col>
                    </Row>
                </div>

                <Row gutter={[24]}>
                    <Col xs={24}>
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
                            className="shadow-sm"
                        >
                            {!project.statutes || project.statutes.length === 0 ? (
                                <Empty
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    description={
                                        <div className="text-center">
                                            <Text className="text-gray-500 block mb-2">No status columns yet</Text>
                                            <Text className="text-sm text-gray-400">
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
                                                    className="bg-gradient-to-b from-gray-50 to-white border-2 border-gray-300 w-96 flex-shrink-0 hover:shadow-lg transition-all"
                                                    style={{ minWidth: '20rem' }}
                                                    title={
                                                        <div className="flex items-center justify-between">
                                                            <Space>
                                                                <Text strong className="text-base">{status.name}</Text>
                                                                <Badge
                                                                    count={issueCount}
                                                                    style={{ backgroundColor: '#1890ff' }}
                                                                />
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
                                                                className={`space-y-2 min-h-[200px] p-2 rounded-lg transition-colors ${snapshot.isDraggingOver ? 'bg-blue-50 border-2 border-dashed border-blue-300' : ''
                                                                    }`}
                                                            >
                                                                <Button
                                                                    type="dashed"
                                                                    block
                                                                    icon={<PlusOutlined />}
                                                                    className="border-blue-300 text-blue-600 hover:border-blue-500 hover:text-blue-700"
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
                                                                                    className={`p-4 border-2 rounded-lg bg-white shadow-sm flex flex-col gap-2 relative transition-all hover:border-blue-300 ${snapshot.isDragging ? 'shadow-2xl rotate-2 border-blue-400' : ''
                                                                                        }`}
                                                                                    style={{
                                                                                        ...provided.draggableProps.style,
                                                                                        cursor: 'grab'
                                                                                    }}
                                                                                >
                                                                                    <div className="flex items-start justify-between">
                                                                                        <Tooltip title="Drag to move">
                                                                                            <DragOutlined className="text-gray-400 mt-1" />
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
                                                                                        <Text strong className="text-base flex-1">{issue.title}</Text>
                                                                                    </div>

                                                                                    <Text type="secondary" className="text-sm pl-6">{issue.description}</Text>

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
                                                    className="w-full h-full min-h-[200px] border-2 border-dashed hover:border-blue-400 hover:text-blue-600"
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

                        {/* Status Modal */}
                        <Modal title="Create Status Column" open={statusModalVisible} onCancel={() => setStatusModalVisible(false)} okText="Create" confirmLoading={addingStatus} onOk={() => statusForm.submit()}>
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

                        {/* Team Members Section */}
                        <Card
                            title={
                                <Space>
                                    <TeamOutlined style={{ color: '#52c41a' }} />
                                    <span>Team Members</span>
                                    <Badge count={totalMembers} style={{ backgroundColor: '#52c41a' }} />
                                </Space>
                            }
                            extra={
                                <Button
                                    type="primary"
                                    icon={<UserAddOutlined />}
                                    onClick={() => setInviteModalVisible(true)}
                                >
                                    Invite Member
                                </Button>
                            }
                            className="shadow-sm mt-6"
                        >
                            {Array.isArray(member) && member.length > 0 ? (
                                <div className="space-y-3">
                                    {member.map((m, idx) => (
                                        <div
                                            key={m.id || idx}
                                            className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-blue-200"
                                        >
                                            <Avatar
                                                size="large"
                                                icon={<UserOutlined />}
                                                className="bg-gradient-to-br from-blue-500 to-blue-600"
                                            />
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-2">
                                                    <Text strong className="block">
                                                        {m.full_name}
                                                    </Text>
                                                    <Tag color="blue" className="text-xs">Member</Tag>
                                                </div>
                                                <Text className="text-sm text-gray-500">
                                                    {m.email}
                                                </Text>
                                            </div>
                                            {/* Silme butonu */}
                                            <Button
                                                type="text"
                                                icon={<CloseOutlined />}
                                                danger
                                                onClick={() => handleRemoveMember(m.id)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <Empty
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    description={
                                        <div className="text-center">
                                            <Text className="text-gray-500">No team members yet</Text>
                                            <div className="mt-2">
                                                <Button
                                                    type="primary"
                                                    icon={<UserAddOutlined />}
                                                    onClick={() => setInviteModalVisible(true)}
                                                >
                                                    Invite Members
                                                </Button>
                                            </div>
                                        </div>
                                    }
                                />
                            )}
                        </Card>

                        {/* Invite Modal */}
                        <Modal title="Invite Team Member" open={inviteModalVisible} onCancel={() => setInviteModalVisible(false)} okText="Invite" confirmLoading={inviting} onOk={() => inviteForm.submit()}>
                            <Form form={inviteForm} onFinish={handleInviteMember} layout="vertical">
                                <Form.Item label="Member Email" name="email" rules={[{ required: true, message: "Please input member email" }]}>
                                    <Input placeholder="example@mail.com" prefix={<UserOutlined />} />
                                </Form.Item>
                            </Form>
                        </Modal>
                    </Col>
                </Row>
            </div>
        </div>
    );
}