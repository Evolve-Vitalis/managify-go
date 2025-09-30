import { useContext, useState } from "react";
import { Form, Input, Button, message } from "antd";
import { Link, useNavigate } from "react-router-dom";
import { LOGIN } from "../../constants/urls";
import { api } from "../api/api";
import { AuthContext } from "../../content/AuthContent";
import { toast } from 'react-hot-toast';
export default function LoginForm() {
  const [loading, setLoading] = useState(false);
  const { setToken } = useContext(AuthContext);
  const navigate = useNavigate();
  const onFinish = async (values) => {
    setLoading(true);
    const userData = {
      email: values.email,
      password: values.password,
    };
    
    try {
      const response = await api.post(LOGIN, userData);
      toast.success("Navigating")
      localStorage.setItem("token", response.data.token);
      setToken(response.data.token);

      navigate("/dashboard");
    } catch (error) {
      toast.error("Failed")
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center py-12">
      <div className="w-96 p-6 border border-gray-300 rounded-lg shadow-md bg-white">
        <h2 className="text-center text-2xl font-semibold mb-5">Login</h2>
        <Form layout="vertical" name="register" onFinish={onFinish}>
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
              Login
            </Button>
          </Form.Item>
        </Form>
        <p className="text-sm opacity-50 ">
          Do you have an account?{" "}
          <Link to="/register" className="text-blue-600 hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>

  )
}