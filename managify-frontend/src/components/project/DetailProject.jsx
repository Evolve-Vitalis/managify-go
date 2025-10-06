import { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DeleteOutlined } from "@ant-design/icons";
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
} from "antd";
import {
    ArrowLeftOutlined,
    PlusOutlined,
    TeamOutlined,
    UserOutlined,
    FolderOutlined,
    TagsOutlined,
    UserAddOutlined
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
    const [issueForm] = Form.useForm();
    const [addingIssue, setAddingIssue] = useState(false);

    const [fetchedStatuses, setFetchedStatuses] = useState({});

    useEffect(() => {
        const fetchProject = async () => {
            try {
                const response = await api.get(`/project/projects/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const projectData = response.data.data;
                setProject(projectData);
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
                toast.error("Actiov is not verified")
                message.error(err.response?.data?.message || "Failed to move issue");
            }
        } else {
            console.log("Status unchanged — no backend call made.");
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
            await api.post(`/project/${id}/invite`, { receiver_email: values.email }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            message.success("Invitation sent successfully!");
            setInviteModalVisible(false);
            inviteForm.resetFields();
        } catch (error) {
            message.error(error.response?.data?.message || "Failed to send invitation");
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
            console.error("❌ Issue creation failed:", err);
            message.error(err.response?.data?.message || "Failed to create issue");
        } finally {
            setAddingIssue(false);
        }
    };



    if (loading) return <div className="flex justify-center items-center h-screen"><Spin size="large" /></div>;
    if (!project) return <div className="text-center mt-10"><Text>Project not found</Text></div>;

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6">
                    <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} className="mb-4">Back</Button>
                    <Card className="shadow-sm">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-3">
                                    <FolderOutlined className="text-2xl text-blue-600" />
                                    <Title level={2} className="m-0">{project.project.name}</Title>
                                    <Tag color={project.project.status === 'active' ? 'green' : 'default'}>
                                        {project.project.status === 'active' ? 'Active' : 'Inactive'}
                                    </Tag>
                                    <Button type="text" icon={<DeleteOutlined />} danger onClick={handleDeleteProject} />
                                </div>
                                <Paragraph className="text-gray-600 mb-4">{project.project.description}</Paragraph>
                                <Space size="large">
                                    <div>
                                        <Text className="text-gray-500">Category:</Text>
                                        <Text strong className="ml-2">{project.project.category}</Text>
                                    </div>
                                    {project.tags && project.tags.length > 0 && (
                                        <div>
                                            <TagsOutlined className="text-gray-500 mr-2" />
                                            {project.tags.map((tag, idx) => (
                                                <Tag key={idx} color="blue">{tag}</Tag>
                                            ))}
                                        </div>
                                    )}
                                </Space>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Status Columns with Drag & Drop */}
                <Row gutter={[24]}>
                    <Col xs={24}>
                        <Card
                            title="Status Columns"
                            extra={
                                project.statutes && project.statutes.length < 4 && (
                                    <Button type="primary" icon={<PlusOutlined />} onClick={() => setStatusModalVisible(true)}>
                                        Add Status Column
                                    </Button>
                                )
                            }
                            className="shadow-sm">
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
                                        {project.statutes.map((status) => (
                                            <Card
                                                key={status.id}
                                                size="small"
                                                className="bg-gray-50 border-gray-300 w-96 flex-shrink-0"
                                                style={{ minWidth: '20rem', borderWidth: '2px' }}
                                                title={
                                                    <div className="flex items-center justify-between">
                                                        <Text strong>{status.name}</Text>
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
                                                    </div>
                                                }
                                            >
                                                <Droppable droppableId={status.id}>
                                                    {(provided, snapshot) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.droppableProps}
                                                            className={`space-y-2 min-h-[200px] p-2 rounded transition-colors ${snapshot.isDraggingOver ? 'bg-blue-50' : ''
                                                                }`}
                                                        >
                                                            <Button
                                                                type="dashed"
                                                                block
                                                                onClick={() => setIssueModal({ visible: true, statusId: status.id })}
                                                            >
                                                                + Create An Issue
                                                            </Button>

                                                            {issuesByStatus[status.id]?.length > 0 ? (
                                                                issuesByStatus[status.id].map((issue, index) => (
                                                                    <Draggable key={issue.id} draggableId={issue.id} index={index}>
                                                                        {(provided, snapshot) => (
                                                                            <div
                                                                                ref={provided.innerRef}
                                                                                {...provided.draggableProps}
                                                                                {...provided.dragHandleProps}
                                                                                className={`p-4 border rounded-lg bg-white shadow-sm flex flex-col gap-2 relative transition-shadow ${snapshot.isDragging ? 'shadow-lg rotate-2' : ''
                                                                                    }`}
                                                                                style={{
                                                                                    ...provided.draggableProps.style,
                                                                                    cursor: 'grab'
                                                                                }}
                                                                            >
                                                                                <Button
                                                                                    type="text"
                                                                                    size="small"
                                                                                    danger
                                                                                    className="absolute top-2 right-2 z-10"
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        handleDeleteIssue(issue.id, status.id);
                                                                                    }}
                                                                                >
                                                                                    X
                                                                                </Button>

                                                                                <Text strong className="text-lg pr-6">{issue.title}</Text>
                                                                                <Text type="secondary" className="text-sm">{issue.description}</Text>

                                                                                {issue.due_date && (
                                                                                    <Tag color="blue" className="text-xs w-fit">
                                                                                        Due: {new Date(issue.due_date).toLocaleDateString()}
                                                                                    </Tag>
                                                                                )}

                                                                                {issue.priority && (
                                                                                    <Tag color="red" className="text-xs w-fit">
                                                                                        Priority: {issue.priority}
                                                                                    </Tag>
                                                                                )}
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
                                        ))}

                                        {project.statutes.length < 6 && (
                                            <div className="w-96 flex-shrink-0">
                                                <Button
                                                    type="dashed"
                                                    icon={<PlusOutlined />}
                                                    className="w-full h-full min-h-[200px] border-2 border-dashed"
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
                        <CreateIssueModal visible={issueModal.visible}
                            onSubmit={(values) => handleAddIssue(values, issueModal.statusId)}
                            onClose={() => setIssueModal({ visible: false, statusId: null })} statusId={issueModal.statusId} projectId={project.project.id} token={token} onSuccess={(values) => handleAddIssue(values, issueModal.statusId)} />

                        {/* Team Members Section */}
                        <Card title={<Space><TeamOutlined /> <span>Team Members</span></Space>}
                            extra={<Button type="text" icon={<UserAddOutlined />} size="small" onClick={() => setInviteModalVisible(true)}>Invite</Button>}
                            className="shadow-sm mt-6"
                        >
                            {!project.project.teams_id || project.project.teams_id.length === 0 ? (
                                <Empty
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    description={
                                        <div className="text-center">
                                            <Text className="text-gray-500">No team members yet</Text>
                                            <div className="mt-2">
                                                <Button type="primary" icon={<UserAddOutlined />} size="small" onClick={() => setInviteModalVisible(true)}>Invite Members</Button>
                                            </div>
                                        </div>
                                    }
                                />
                            ) : (
                                <div className="space-y-3">
                                    {project.teams_id.map((memberId, idx) => (
                                        <div key={idx} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
                                            <Avatar size="large" icon={<UserOutlined />} className="bg-blue-600" />
                                            <div className="flex-1">
                                                <Text strong className="block">Team Member {idx + 1}</Text>
                                                <Text className="text-sm text-gray-500">member@example.com</Text>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>

                        {/* Invite Modal */}
                        <Modal title="Invite Team Member" open={inviteModalVisible} onCancel={() => setInviteModalVisible(false)} okText="Invite" confirmLoading={inviting} onOk={() => inviteForm.submit()}>
                            <Form form={inviteForm} onFinish={handleInviteMember} layout="vertical">
                                <Form.Item label="Member Email" name="email" rules={[{ required: true, message: "Please input member email" }]}>
                                    <Input placeholder="example@mail.com" />
                                </Form.Item>
                            </Form>
                        </Modal>
                    </Col>
                </Row>
            </div>
        </div>
    );
}