import { useState, useEffect } from "react";
import { Modal, Form, Input, Select, DatePicker, Button, message } from "antd";
import { api } from "../api/api";

export default function CreateIssueModal({ visible, onClose, statusId, projectId, token, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible) form.resetFields();
  }, [visible, form]);

  const handleSubmit = async (values) => {
    if (!statusId) {
      message.error("Status is not selected!");
      return;
    }
    if (!projectId) {
      message.error("Project ID not found!");
      return;
    }

    setLoading(true);
    try {
        
      const payload = {
        title: values.title,
        description: values.description,
        priority: values.priority || "DEFAULT",
        due_date: values.due_date ? values.due_date.format("YYYY-MM-DD") : null,
        status_id: statusId,
        project_id: projectId
      };

      console.log("Submitting issue:", payload);

      await api.post("/issue/create-issue", payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      message.success("Issue created successfully!");
      form.resetFields();
      onClose();

      if (onSuccess) onSuccess(); 
    } catch (error) {
      console.error(error);
      message.error(error.response?.data?.message || "Failed to create issue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Create Issue"
      open={visible}
      onCancel={onClose}
      footer={null}
      destroyOnClose={false} 
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item label="Title" name="title" rules={[{ required: true, message: "Please input title" }]}>
          <Input placeholder="Issue title" />
        </Form.Item>
        <Form.Item label="Description" name="description">
          <Input.TextArea placeholder="Issue description" rows={4} />
        </Form.Item>
        <Form.Item label="Priority" name="priority" initialValue="DEFAULT">
          <Select>
            <Select.Option value="DEFAULT">Default</Select.Option>
            <Select.Option value="MEDIUM">Medium</Select.Option>
            <Select.Option value="HIGH">High</Select.Option>
            <Select.Option value="URGENT">Urgent</Select.Option>
            <Select.Option value="CRITICAL">Critical</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item label="Due Date" name="due_date">
          <DatePicker style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            Create Issue
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
}
