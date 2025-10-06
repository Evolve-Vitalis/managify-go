import { useEffect } from "react";
import { Modal, Form, Input, Select, DatePicker, Button, message } from "antd";

export default function CreateIssueModal({ visible, onClose, statusId, onSubmit }) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible) form.resetFields();
  }, [visible, form]);

  const handleSubmit = () => {
    if (!statusId) {
      message.error("Status is not selected!");
      return;
    }
    const values = form.getFieldsValue();
    onSubmit(values); // veriyi parent'a gönder
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title="Create Issue"
      open={visible}
      onCancel={onClose}
      footer={null}
      destroyOnClose={true} // artık modal kapandığında form temizlenir
    >
      <Form form={form} layout="vertical">
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
          <Button type="primary" onClick={handleSubmit} block>
            Create Issue
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
}
