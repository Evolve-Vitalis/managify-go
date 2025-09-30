import { Button, Layout, Typography } from "antd";
import { Link } from "react-router-dom";
import {
    ProjectOutlined,

} from '@ant-design/icons';
const { Header } = Layout;
const { Title } = Typography;
export default function MainHeader() {
    return (
        <Header className="bg-white shadow-sm border-b px-6">
            <div className="flex items-center justify-between max-w-7xl mx-auto">
                <div className="flex items-center space-x-2">
                    <ProjectOutlined className="text-2xl text-blue-600" />
                    <Title level={3} className="m-0 text-gray-800">Managify</Title>
                </div>

                <div className="hidden md:flex items-center space-x-6">
                    <Button type="text" className="text-gray-600">Pricing</Button>
                    <Button type="text" className="text-gray-600">About Us</Button>
                    <Link to="/login">
                        <Button type="primary">Login</Button>
                    </Link>
                </div>
            </div>
        </Header>
    )
}