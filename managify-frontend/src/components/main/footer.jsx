import { Button, Col, Divider, Layout, Row, Typography } from "antd";
import {
    ProjectOutlined
} from '@ant-design/icons';
const { Footer } = Layout;
const { Title, Text } = Typography;

export default function MainFooter() {
    return (
        <Footer className="bg-gray-800 text-center py-8">
            <div className="max-w-7xl mx-auto px-6">
                <Row gutter={[24, 24]}>
                    <Col xs={24} sm={8}>
                        <div className="flex items-center justify-center sm:justify-start space-x-2 mb-4">
                            <ProjectOutlined className="text-xl text-white" />
                            <Text className="text-white font-semibold text-lg">Managify</Text>
                        </div>

                    </Col>
                    <Col xs={24} sm={8}>
                        <Title level={5} className="text-white mb-4">Product</Title>
                        <div className="space-y-2">
                            <div><Button type="text" className="text-gray-400 p-0">Pricing</Button></div>
                            <div><Button type="text" className="text-gray-400 p-0">API</Button></div>
                        </div>
                    </Col>
                    <Col xs={24} sm={8}>
                        <Title level={5} className="text-white mb-4">Support</Title>
                        <div className="space-y-2">
                            <div><Button type="text" className="text-gray-400 p-0">Contact</Button></div>
                            <div><Button type="text" className="text-gray-400 p-0">Privacy</Button></div>
                        </div>
                    </Col>
                </Row>
                <Divider className="border-gray-700" />
                <Text className="text-gray-400">
                    © 2025 Managify. All rights reserved.
                </Text>
            </div>
        </Footer>
    )
}