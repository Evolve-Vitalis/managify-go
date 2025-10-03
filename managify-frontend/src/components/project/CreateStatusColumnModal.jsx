import { useState } from "react";
import { Card, Input, Button, Form, message, Modal } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { api } from "../api/api";

export default function CreateStatusColumnModal({ projectId, token, onSuccess }) {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form] = Form.useForm();

  const openModal = () => setVisible(true);
  const closeModal = () => {
    form.resetFields();
    setVisible(false);
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const payload = {
        name: values.name,
        project_id: projectId,
      };

      const response = await api.post("/status", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      message.success("Status column created successfully!");
      closeModal();

      // Callback to parent to refresh statuses
      if (onSuccess) onSuccess(response.data.data);

    } catch (error) {
      console.error(error);
      message.error(error.response?.data?.message || "Failed to create status column");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={openModal}
        className="w-full"
      >
        Create First Status Column
      </Button>

      <Modal
        title="Create Status Column"
        open={visible}
        onCancel={closeModal}
        footer={null}
        destroyOnClose
      >
        <Card className="shadow-sm">
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item
              label="Column Name"
              name="name"
              rules={[{ required: true, message: "Please enter a name for this status column" }]}
            >
              <Input placeholder="e.g., To Do, In Progress, Done" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} block>
                Create
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Modal>
    </>
  );
}
