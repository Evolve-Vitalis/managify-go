// src/components/dashboard/DashboardStats.jsx
import { Row, Col, Card, Statistic } from "antd";
import {
  ProjectOutlined,
  IssuesCloseOutlined,
  CheckCircleOutlined,
  TeamOutlined,
} from "@ant-design/icons";

export default function DashboardStats({ userData, totalIssues, completedIssues, totalTeamMembers }) {
  // Kullanıcının planına göre proje limiti
  const projectLimit =
    userData?.subscription?.plan_type === "BASIC"
      ? 3
      : userData?.subscription?.plan_type === "PREMIUM"
      ? 10
      : "∞";

  return (
    <Row gutter={[24, 24]} className="mb-8">
      {/* Total Projects */}
      <Col xs={24} sm={12} lg={6}>
        <Card className="text-center hover:shadow-md transition-shadow">
          <Statistic
            title="Total Projects"
            value={userData?.project_size || 0}
            prefix={<ProjectOutlined className="text-blue-600" />}
            suffix={`/ ${projectLimit}`}
          />
        </Card>
      </Col>

      {/* Total Tasks */}
      <Col xs={24} sm={12} lg={6}>
        <Card className="text-center hover:shadow-md transition-shadow">
          <Statistic
            title="Total Tasks"
            value={totalIssues}
            prefix={<IssuesCloseOutlined className="text-green-600" />}
          />
        </Card>
      </Col>

      {/* Completed */}
      <Col xs={24} sm={12} lg={6}>
        <Card className="text-center hover:shadow-md transition-shadow">
          <Statistic
            title="Completed"
            value={completedIssues}
            prefix={<CheckCircleOutlined className="text-green-600" />}
            suffix={`/ ${totalIssues}`}
          />
        </Card>
      </Col>

      {/* Team Members */}
      <Col xs={24} sm={12} lg={6}>
        <Card className="text-center hover:shadow-md transition-shadow">
          <Statistic
            title="Team Members"
            value={totalTeamMembers}
            prefix={<TeamOutlined className="text-purple-600" />}
          />
        </Card>
      </Col>
    </Row>
  );
}
