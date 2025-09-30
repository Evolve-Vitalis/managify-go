import { useContext, useState } from "react";
import { Form, Input, Button, message, Select } from "antd";
import { useNavigate } from "react-router-dom";
import { CREATE_PROJECT, VERSION } from "../../constants/urls";
import { api } from "../api/api";
import { AuthContext } from "../../content/AuthContent";
import { toast } from 'react-hot-toast';

import createProjectBg from "../../assets/create-project.jpg"

const { TextArea } = Input;
const { Option } = Select;

export default function CreateProject() {
    const [loading, setLoading] = useState(false);
    const { token } = useContext(AuthContext);
    const navigate = useNavigate();

    const onFinish = async (values) => {
        setLoading(true);

        const projectData = {
            name: values.name,
            description: values.description,
            category: values.category,
            tags: values.tags || [],
            status: values.status || "active",
        };

        try {
            console.log(VERSION + CREATE_PROJECT)
            const response = await api.post(CREATE_PROJECT, projectData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            message.success("Project created successfully!");
            toast.success("Navigating to dashboard...");
            navigate("/dashboard");
        } catch (error) {
            toast.error("Failed to create project");
            message.error(error.response?.data?.message || "Failed to create project!");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex justify-center py-12  h-[910px] bg-contain bg-center bg-no-repeat" style={{ backgroundImage: `url(${createProjectBg})` }}>
            <div className="w-[600px] p-6 border border-gray-300 rounded-lg shadow-md bg-white">
                <h2 className="text-center text-2xl font-semibold mb-5">Create New Project</h2>
                <Form layout="vertical" name="createProject" onFinish={onFinish}>
                    <Form.Item
                        label="Project Name"
                        name="name"
                        rules={[{ required: true, message: "Please input project name!" }]}
                    >
                        <Input placeholder="Enter project name" className="!rounded-md !border-gray-300" />
                    </Form.Item>

                    <Form.Item
                        label="Description"
                        name="description"
                        rules={[{ required: true, message: "Please input project description!" }]}
                    >
                        <TextArea
                            rows={4}
                            placeholder="Enter project description"
                            className="!rounded-md !border-gray-300"
                        />
                    </Form.Item>

                    <Form.Item
                        label="Category"
                        name="category"
                        rules={[{ required: true, message: "Please select a category!" }]}
                    >
                        <Select placeholder="Select category" className="!rounded-md">
                            <Option value="web">Web Development</Option>
                            <Option value="mobile">Mobile Development</Option>
                            <Option value="desktop">Desktop Application</Option>
                            <Option value="data">Data Science</Option>
                            <Option value="ai">AI/ML</Option>
                            <Option value="other">Other</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        label="Tags"
                        name="tags"
                    >
                        <Select
                            mode="tags"
                            placeholder="Add tags (press enter to add)"
                            className="!rounded-md"
                        >
                        </Select>
                    </Form.Item>

                    <Form.Item
                        label="Status"
                        name="status"
                        initialValue="active"
                    >
                        <Select placeholder="Select status" className="!rounded-md">
                            <Option value="active">Active</Option>
                            <Option value="archived">Archived</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                            block
                            className="!bg-blue-600 !hover:bg-blue-700 !text-white !font-semibold !rounded-md"
                        >
                            Create Project
                        </Button>
                    </Form.Item>
                </Form>
            </div>
        </div>
    );
}