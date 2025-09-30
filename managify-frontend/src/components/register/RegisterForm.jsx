import { useContext, useState } from "react";
import { Form, Input, Button, message } from "antd"; 
import { Link, useNavigate } from "react-router-dom"; 
import { REGISTER } from "../../constants/urls"; 
import { api } from "../api/api";
import { AuthContext } from "../../content/AuthContent";
import { toast } from 'react-hot-toast';
export default function RegisterForm() {
  const [loading, setLoading] = useState(false);
  const { setToken } = useContext(AuthContext);
  const navigate = useNavigate();
  const onFinish = async (values) => {
    setLoading(true);

    const userData = {
      full_name: values.username,
      email: values.email,
      project_size: 0,
      password: values.password,
      is_admin: false,
    };

    try {
      const response = await api.post(REGISTER, userData);
     
      message.success("User registered successfully!");
      toast.success("Navigating...")
      localStorage.setItem("token", response.data.token);
      setToken(response.data.token); 

      navigate("/dashboard"); 
    } catch (error) {
      toast.error("Failed")
      message.error("Failed to register user!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center py-12">
      <div className="w-96 p-6 border border-gray-300 rounded-lg shadow-md bg-white">
        <h2 className="text-center text-2xl font-semibold mb-5">Register</h2>
        <Form layout="vertical" name="register" onFinish={onFinish}>
          <Form.Item
            label="Username"
            name="username"
            rules={[{ required: true, message: "Please input your username!" }]}
          >
            <Input placeholder="Enter your username" className="!rounded-md !border-gray-300" />
          </Form.Item>
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Please input your email!" },
              { type: "email", message: "Please enter a valid email!" }
            ]}
          >
            <Input placeholder="Enter your email" className="!rounded-md !border-gray-300" />
          </Form.Item>
          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: "Please input your password!" }]}
          >
            <Input.Password placeholder="Enter your password" className="!rounded-md !border-gray-300" />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              className="!bg-blue-600 !hover:bg-blue-700 !text-white !font-semibold !rounded-md"
            >
              Register
            </Button>
          </Form.Item>
        </Form>
        <p className="text-sm opacity-50">
          Do you have an account?{" "}
          <Link to="/login" className="text-blue-600 hover:underline">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}
