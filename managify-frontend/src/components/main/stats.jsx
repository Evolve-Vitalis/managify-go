import { Col, Row, Typography } from "antd";
const { Title, Text, Paragraph } = Typography;

export default function Stats() {
    return (
        <div className="bg-blue-600 py-16">
            <div className="max-w-7xl mx-auto px-6">
                <Row gutter={[24, 24]} className="text-center">
                    <Col xs={24} sm={6}>
                        <div className="text-white">
                            <Title level={2} className="text-white mb-2">100+</Title>
                            <Text className="text-blue-100 text-lg">Active Projects</Text>
                        </div>
                    </Col>
                    <Col xs={24} sm={6}>
                        <div className="text-white">
                            <Title level={2} className="text-white mb-2">200+</Title>
                            <Text className="text-blue-100 text-lg">Happy Users</Text>
                        </div>
                    </Col>
                    <Col xs={24} sm={6}>
                        <div className="text-white">
                            <Title level={2} className="text-white mb-2">1500+</Title>
                            <Text className="text-blue-100 text-lg">Completed Tasks</Text>
                        </div>
                    </Col>
                    <Col xs={24} sm={6}>
                        <div className="text-white">
                            <Title level={2} className="text-white mb-2">92%</Title>
                            <Text className="text-blue-100 text-lg">Customer Satisfaction</Text>
                        </div>
                    </Col>
                </Row>
            </div>
        </div>
    )
}