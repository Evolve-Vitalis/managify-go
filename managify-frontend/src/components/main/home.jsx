
import {
    Layout,
    Button,
    Typography,
    Row,
    Col,
    Card,
    Space
} from 'antd';
import { RightOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { features } from '../../constants/homepage_features';
import Stats from './stats';
import MainHeader from './header';
import MainFooter from './footer';

const { Header, Content } = Layout;
const { Title, Text, Paragraph } = Typography;

export default function ManagifyLandingPage() {
    return (
        <Layout className="min-h-screen bg-white">
            {/* Header */}
            <MainHeader />

            <Content>
                {/* Hero Section */}
                <div className="bg-gray-50 py-20">
                    <div className="max-w-7xl mx-auto px-6">
                        <Row gutter={[48, 48]} align="middle">
                            <Col xs={24} lg={12}>
                                <div className="text-center lg:text-left">
                                    <Title level={1} className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                                        Manage Your Projects
                                        <span className="text-blue-600"> Smartly </span>
                                    </Title>
                                    <Paragraph className="text-xl text-gray-600 mb-8">
                                        With Managify, organize your team, track your tasks, and
                                        deliver your projects on time. Discover the power of modern project management.
                                    </Paragraph>
                                    <Space size="middle" className="flex-wrap justify-center lg:justify-start">
                                        <Link to="/register">
                                            <Button type="primary" size="large" className="h-12 px-8">
                                                Get Started for Free
                                            </Button>
                                        </Link>
                                        <Link to="/login">
                                            <Button size="large" className="h-12 px-8">
                                                Login
                                            </Button>
                                        </Link>
                                    </Space>
                                </div>
                            </Col>
                        </Row>
                    </div>
                </div>

                {/* Features */}
                <div className="py-20">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="text-center mb-16">
                            <Title level={2} className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                                Why Managify?
                            </Title>
                            <Paragraph className="text-xl text-gray-600 max-w-3xl mx-auto">
                                All the tools you need for modern project management in one platform
                            </Paragraph>
                        </div>

                        <Row gutter={[24, 24]}>
                            {features.map((feature, index) => (
                                <Col xs={24} sm={12} lg={8} key={index}>
                                    <Card className="h-full text-center hover:shadow-lg transition-shadow border-gray-200">
                                        <div className="mb-4">{feature.icon}</div>
                                        <Title level={4} className="mb-3">{feature.title}</Title>
                                        <Paragraph className="text-gray-600">{feature.description}</Paragraph>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    </div>
                </div>

                {/* Stats */}
                <Stats />

                {/* CTA Section */}
                <div className="py-20">
                    <div className="max-w-4xl mx-auto text-center px-6">
                        <Title level={2} className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
                            Ready to Manage Your Projects?
                        </Title>
                        <Paragraph className="text-xl text-gray-600 mb-8">
                            Create a free account and start working more efficiently with your team
                        </Paragraph>
                        <Link to="/register">
                            <Button type="primary" size="large" className="h-12 px-8">
                                Get Started Now
                                <RightOutlined />
                            </Button>
                        </Link>
                    </div>
                </div>
            </Content>
            <MainFooter />
        </Layout>
    );
}
